"""Helpers that trim MP4 videos into smaller clips using ``ffmpeg``."""

from __future__ import annotations

import subprocess
from pathlib import Path

from .models import ClipCandidate, ClipFile


class ClipGenerationError(RuntimeError):
    """Raised when ``ffmpeg`` fails to render a clip."""


def render_clips(
    source: Path,
    candidates: list[ClipCandidate],
    output_dir: Path,
) -> list[ClipFile]:
    """Render ``candidates`` from ``source`` video into ``output_dir``.

    Parameters
    ----------
    source:
        Path to the downloaded YouTube video.
    candidates:
        Clip candidates already sorted in the desired delivery order.
    output_dir:
        Directory that will receive the generated MP4 files.
    """

    output_dir.mkdir(parents=True, exist_ok=True)

    rendered: list[ClipFile] = []
    for index, candidate in enumerate(candidates, start=1):
        filename = output_dir / f"clip_{index:02d}.mp4"
        duration = max(candidate.end - candidate.start, 0.1)
        command = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{candidate.start:.2f}",
            "-i",
            str(source),
            "-t",
            f"{duration:.2f}",
            "-c",
            "copy",
            str(filename),
        ]

        try:
            subprocess.run(command, check=True, capture_output=True)
        except FileNotFoundError as exc:  # pragma: no cover - environment guard
            raise ClipGenerationError(
                "ffmpeg is required to render clips. Please install it and ensure it is on your PATH."
            ) from exc
        except subprocess.CalledProcessError as exc:  # pragma: no cover - passthrough
            raise ClipGenerationError(exc.stderr.decode().strip() or "ffmpeg failed") from exc

        rendered.append(
            ClipFile(
                start=candidate.start,
                end=candidate.end,
                score=candidate.score,
                transcript=candidate.text,
                path=filename,
            )
        )

    return rendered


__all__ = ["ClipGenerationError", "render_clips"]
