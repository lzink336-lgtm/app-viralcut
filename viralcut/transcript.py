"""Transcript fetching helpers using the YouTube Transcript API."""

from __future__ import annotations

from typing import Iterable, Sequence

from .models import TranscriptSegment


class TranscriptError(RuntimeError):
    """Raised when a transcript cannot be retrieved for a video."""


def fetch_transcript(video_id: str, languages: Sequence[str] | None = None) -> list[TranscriptSegment]:
    """Retrieve the transcript for ``video_id`` as a list of segments."""

    try:
        from youtube_transcript_api import (  # type: ignore[import]
            NoTranscriptFound,
            TranscriptsDisabled,
            YouTubeTranscriptApi,
        )
    except ModuleNotFoundError as exc:  # pragma: no cover - environment guard
        raise TranscriptError(
            "The 'youtube-transcript-api' package is required to fetch transcripts."
            " Install it with 'pip install youtube-transcript-api'."
        ) from exc

    language_preferences: Iterable[str] = languages or (
        "pt-BR",
        "pt",
        "en",
    )

    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=list(language_preferences))
    except (NoTranscriptFound, TranscriptsDisabled) as exc:  # pragma: no cover - passthrough
        raise TranscriptError("Transcript not available for this video") from exc

    return [
        TranscriptSegment(start=entry["start"], duration=entry["duration"], text=entry["text"].strip())
        for entry in transcript
        if entry.get("text")
    ]


__all__ = ["TranscriptError", "fetch_transcript"]
