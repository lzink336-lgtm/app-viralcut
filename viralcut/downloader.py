"""Utilities for downloading YouTube videos with audio using ``yt-dlp``."""

from __future__ import annotations

from pathlib import Path
from typing import Any


class DownloadError(RuntimeError):
    """Raised when a video cannot be downloaded."""


def download_video(video_url: str, output_dir: Path) -> Path:
    """Download the best available MP4 for ``video_url``.

    Parameters
    ----------
    video_url:
        The YouTube video URL to download.
    output_dir:
        Directory where the resulting video file should be placed.

    Returns
    -------
    Path
        Path to the downloaded video file.
    """

    try:
        import yt_dlp
    except ModuleNotFoundError as exc:  # pragma: no cover - environment guard
        raise DownloadError(
            "The 'yt-dlp' package is required to download videos. Install it with 'pip install yt-dlp'."
        ) from exc

    output_dir.mkdir(parents=True, exist_ok=True)

    ydl_opts: dict[str, Any] = {
        "format": "bv*+ba/best",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "outtmpl": str(output_dir / "%(id)s.%(ext)s"),
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
    except yt_dlp.utils.DownloadError as exc:  # pragma: no cover - passthrough
        raise DownloadError(str(exc)) from exc

    filename = ydl.prepare_filename(info)
    path = Path(filename).with_suffix(".mp4")
    if not path.exists():
        # ``prepare_filename`` may include extension already if conversion not needed
        path = Path(filename)

    if not path.exists():
        raise DownloadError("Video download did not produce an MP4 file")

    return path


__all__ = ["DownloadError", "download_video"]
