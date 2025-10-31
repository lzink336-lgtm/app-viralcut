"""Utilities for exposing the local API through an ngrok tunnel."""

from __future__ import annotations

import logging
import os
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - used only for static analysis
    from pyngrok.ngrok import NgrokTunnel

logger = logging.getLogger(__name__)

_tunnel: Optional["NgrokTunnel"] = None


def _ngrok_enabled() -> bool:
    """Return ``True`` when the operator requested an ngrok tunnel."""

    return os.environ.get("ENABLE_NGROK", "").lower() in {"1", "true", "yes"}


def maybe_start_ngrok(port: int) -> Optional[str]:
    """Start an ngrok tunnel to the given ``port`` when opt-in requirements are met."""

    global _tunnel

    if _tunnel is not None:
        return _tunnel.public_url

    if not _ngrok_enabled():
        return None

    try:
        from pyngrok import ngrok
    except ModuleNotFoundError:  # pragma: no cover - optional dependency
        message = (
            "pyngrok is not installed. Execute 'pip install pyngrok' to enable automatic tunnelling."
        )
        print(message)
        logger.error(message)
        return None

    auth_token = os.environ.get("NGROK_AUTHTOKEN")
    if auth_token:
        try:
            ngrok.set_auth_token(auth_token)
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.error("Failed to set NGROK_AUTHTOKEN: %s", exc)

    address = f"http://127.0.0.1:{port}"

    try:
        _tunnel = ngrok.connect(address)
    except Exception as exc:  # pragma: no cover - ngrok failures are rare and environment-specific
        logger.error("Unable to start ngrok tunnel: %s", exc)
        return None

    logger.info("ngrok tunnel %s -> %s", _tunnel.public_url, address)
    return _tunnel.public_url


def stop_ngrok() -> None:
    """Stop any previously created ngrok tunnel."""

    global _tunnel

    if _tunnel is None:
        return

    try:
        from pyngrok import ngrok
    except ModuleNotFoundError:  # pragma: no cover - optional dependency
        _tunnel = None
        return

    try:
        ngrok.disconnect(_tunnel.public_url)
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.warning("Failed to close ngrok tunnel cleanly: %s", exc)
    finally:
        _tunnel = None
