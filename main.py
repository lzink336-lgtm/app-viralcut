"""FastAPI server that orchestrates the ViralCut processing pipeline."""

from __future__ import annotations

import importlib.util
import json
import logging
import os
from contextlib import asynccontextmanager
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Final


logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")

logger = logging.getLogger(__name__)


def _module_available(name: str) -> bool:
    """Return ``True`` if ``name`` can be imported."""

    return importlib.util.find_spec(name) is not None


def _resolve_listen_port(default: int = 8000) -> int:
    """Return the port the API should listen on, honoring the ``PORT`` env var."""

    raw_port = os.environ.get("PORT")
    if raw_port is None:
        return default

    try:
        port = int(raw_port)
    except ValueError:
        logger.warning("Ignoring invalid PORT=%s; falling back to %s", raw_port, default)
        return default

    if not (0 < port < 65536):
        logger.warning("Ignoring out-of-range PORT=%s; falling back to %s", raw_port, default)
        return default

    return port

SERVER_PORT: Final[int] = _resolve_listen_port()


_HAS_FASTAPI = _module_available("fastapi")
_HAS_PYDANTIC = _module_available("pydantic")


if _HAS_FASTAPI and _HAS_PYDANTIC:
    from fastapi import FastAPI, HTTPException
    from pydantic import AnyHttpUrl, BaseModel, Field

    from viralcut import PipelineError, PipelineResult, process_video_to_clips
    from viralcut.ngrok import maybe_start_ngrok, stop_ngrok
    from viralcut.pipeline import run_in_thread

    @asynccontextmanager
    async def _lifespan(_: FastAPI):
        """Manage ngrok lifecycle while the FastAPI app is running."""

        tunnel_url = maybe_start_ngrok(SERVER_PORT)
        if tunnel_url:
            print("Servidor e túnel ngrok iniciados com sucesso")
            print(tunnel_url)
            print("ngrok ativo")
            logger.info("ngrok tunnel available at %s", tunnel_url)
        else:
            print("Servidor iniciado com sucesso")

        try:
            yield
        finally:
            stop_ngrok()

    app = FastAPI(title="ViralCut API", lifespan=_lifespan)

    class ClipRequest(BaseModel):
        """Parameters accepted by the clip generation endpoint."""

        video_url: AnyHttpUrl = Field(..., description="Full YouTube video URL")
        clip_length: int = Field(60, ge=15, le=120, description="Target length (seconds) for each clip")
        max_clips: int = Field(3, ge=1, le=10, description="Maximum number of clips to generate")
        step: int = Field(5, ge=1, le=30, description="Step used when scanning for candidates")

    class ClipMetadata(BaseModel):
        """Metadata returned for each generated clip file."""

        start: float
        end: float
        score: float
        transcript: str
        file_path: str

    class ClipResponse(BaseModel):
        """Response structure returning generated clips and bookkeeping info."""

        video_id: str
        source_video: str
        output_directory: str
        clips: list[ClipMetadata]

    @app.get("/", summary="Health check")
    async def read_root() -> dict[str, str]:
        """Return a simple message indicating the API is running."""

        return {"message": "ViralCut FastAPI backend is up and running"}

    @app.post("/clips", response_model=ClipResponse, summary="Generate viral-ready clips")
    async def create_clips(payload: ClipRequest) -> ClipResponse:
        """Run the ViralCut processing pipeline for ``payload.video_url``."""

        try:
            result = await _run_pipeline(payload)
        except PipelineError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:  # pragma: no cover - defensive programming
            raise HTTPException(status_code=500, detail="Unexpected error while generating clips") from exc

        return _serialize_result(result)

    async def _run_pipeline(payload: ClipRequest) -> PipelineResult:
        return await run_in_thread(
            process_video_to_clips,
            str(payload.video_url),
            clip_length=float(payload.clip_length),
            max_clips=payload.max_clips,
            step=float(payload.step),
        )

    def _serialize_result(result: PipelineResult) -> ClipResponse:
        clips = [
            ClipMetadata(
                start=clip.start,
                end=clip.end,
                score=clip.score,
                transcript=clip.transcript,
                file_path=str(clip.path),
            )
            for clip in result.clips
        ]

        return ClipResponse(
            video_id=result.video_id,
            source_video=str(result.source_video),
            output_directory=str(result.output_dir),
            clips=clips,
        )

    def main() -> None:
        """Start the development server, enabling ngrok when available."""

        if os.environ.get("ENABLE_NGROK") is None and _module_available("pyngrok"):
            os.environ["ENABLE_NGROK"] = "1"
            logger.info(
                "ENABLE_NGROK not set; automatically enabling because pyngrok is installed."
            )

        import uvicorn

        uvicorn.run("main:app", host="0.0.0.0", port=SERVER_PORT, reload=True)

else:
    app = None  # type: ignore[assignment]

    _MISSING = [
        name
        for name, available in (
            ("fastapi", _HAS_FASTAPI),
            ("pydantic", _HAS_PYDANTIC),
        )
        if not available
    ]

    _GUIDANCE = (
        "Instale as dependências Python necessárias executando:\n"
        "  pip install -r requirements.txt\n"
        "Isso fornece FastAPI, Pydantic e os demais pacotes obrigatórios."
    )

    class _FallbackHandler(BaseHTTPRequestHandler):
        """Serve uma resposta JSON simples explicando a falta de dependências."""

        server_version = "ViralCutFallback/1.0"
        sys_version = ""

        def _json_response(self) -> None:
            payload = {
                "status": "dependencies-missing",
                "missing": _MISSING,
                "message": _GUIDANCE,
            }

            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format: str, *args: object) -> None:  # noqa: A003 - match signature
            return  # Silence default stdout logging.

        def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
            self._json_response()

        def do_POST(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
            self._json_response()

    def _print_fallback_banner() -> None:
        print("Dependências ausentes: " + ", ".join(_MISSING))
        print(_GUIDANCE)
        print(
            "Iniciando um servidor HTTP simples apenas para exibir esta mensagem até que as "
            "bibliotecas necessárias sejam instaladas."
        )

    def main() -> None:
        _print_fallback_banner()
        print(f"Servidor placeholder escutando em http://0.0.0.0:{SERVER_PORT}/")
        server = ThreadingHTTPServer(("0.0.0.0", SERVER_PORT), _FallbackHandler)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
