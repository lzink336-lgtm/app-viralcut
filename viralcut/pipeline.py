"""High level orchestration to build viral-ready shorts from a YouTube URL."""

from __future__ import annotations

import asyncio
import logging
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, urlparse

from .clipping import ClipGenerationError, render_clips
from .downloader import DownloadError, download_video
from .models import ClipCandidate, PipelineResult, TranscriptSegment
from .transcript import TranscriptError, fetch_transcript

LOGGER = logging.getLogger(__name__)


class PipelineError(RuntimeError):
    """Raised when the processing pipeline cannot complete successfully."""


@dataclass(slots=True)
class _ClipScoringConfig:
    clip_length: float
    step: float
    max_clips: int


def _extract_video_id(video_url: str) -> str:
    parsed = urlparse(video_url)
    if parsed.netloc.endswith("youtu.be"):
        video_id = parsed.path.strip("/")
        if video_id:
            return video_id
    if parsed.path.startswith("/shorts/"):
        return parsed.path.split("/shorts/")[-1].split("/")[0]
    if parsed.path.startswith("/embed/"):
        return parsed.path.split("/embed/")[-1].split("/")[0]

    query = parse_qs(parsed.query)
    if "v" in query:
        return query["v"][0]

    # Fallback to last path component
    candidate = parsed.path.rsplit("/", 1)[-1]
    if candidate:
        return candidate

    raise PipelineError("Unable to extract YouTube video identifier from URL")


def _score_clip(text: str, duration: float) -> float:
    if not text.strip():
        return 0.0

    word_count = len(text.split())
    punctuation_bonus = text.count("!") * 3 + text.count("?") * 2
    emphasis_bonus = sum(1 for token in text.split() if token.isupper() and len(token) > 1)
    density_score = word_count / max(duration, 1.0)
    return density_score * 10 + punctuation_bonus + emphasis_bonus


def _build_candidates(
    segments: list[TranscriptSegment],
    config: _ClipScoringConfig,
) -> list[ClipCandidate]:
    if not segments:
        raise PipelineError("Transcript returned no textual segments")

    total_duration = max(segment.end for segment in segments)
    if total_duration <= 0:
        raise PipelineError("Transcript duration is invalid")

    step = config.step
    clip_length = config.clip_length
    starts: Iterable[float] = [i for i in frange(0, max(total_duration - clip_length, 0) + step, step)]

    candidates: list[ClipCandidate] = []
    for window_start in starts:
        window_end = min(window_start + clip_length, total_duration)
        overlapped = [
            segment
            for segment in segments
            if segment.start < window_end and segment.end > window_start
        ]
        if not overlapped:
            continue

        combined_text = " ".join(segment.text for segment in overlapped).strip()
        if not combined_text:
            continue

        score = _score_clip(combined_text, window_end - window_start)
        if score <= 0:
            continue

        candidates.append(
            ClipCandidate(
                start=window_start,
                end=window_end,
                text=combined_text,
                score=score,
            )
        )

    return candidates


def frange(start: float, stop: float, step: float) -> Iterable[float]:
    """Generate floating point ranges similar to ``range``."""

    current = start
    epsilon = step / 10
    while current <= stop + epsilon:
        yield round(current, 2)
        current += step


def _select_top_clips(candidates: list[ClipCandidate], limit: int) -> list[ClipCandidate]:
    if not candidates:
        raise PipelineError("Unable to identify interesting moments from transcript")

    ordered = sorted(candidates, key=lambda candidate: candidate.score, reverse=True)
    selected: list[ClipCandidate] = []

    for candidate in ordered:
        if any(_overlaps(candidate, existing) for existing in selected):
            continue
        selected.append(candidate)
        if len(selected) >= limit:
            break

    if not selected:
        raise PipelineError("Transcript did not contain any high scoring segments")

    return sorted(selected, key=lambda candidate: candidate.start)


def _overlaps(first: ClipCandidate, second: ClipCandidate) -> bool:
    return not (first.end <= second.start or second.end <= first.start)


def process_video_to_clips(
    video_url: str,
    *,
    clip_length: float = 60.0,
    max_clips: int = 3,
    step: float = 5.0,
    working_dir: Path | None = None,
) -> PipelineResult:
    """Run the entire pipeline, returning generated clip metadata."""

    if clip_length <= 0 or math.isinf(clip_length):
        raise PipelineError("Clip length must be a positive finite value")
    if max_clips <= 0:
        raise PipelineError("max_clips must be greater than zero")
    if step <= 0:
        raise PipelineError("step must be greater than zero")

    video_id = _extract_video_id(video_url)
    working_directory = working_dir or Path("output") / video_id
    downloads_dir = working_directory / "downloads"
    clips_dir = working_directory / "clips"

    LOGGER.info("Downloading YouTube video %s", video_id)
    try:
        source_video = download_video(video_url, downloads_dir)
    except DownloadError as exc:
        raise PipelineError(str(exc)) from exc

    LOGGER.info("Fetching transcript for %s", video_id)
    try:
        transcript_segments = fetch_transcript(video_id)
    except TranscriptError as exc:
        raise PipelineError(str(exc)) from exc

    config = _ClipScoringConfig(clip_length=clip_length, step=step, max_clips=max_clips)
    candidates = _build_candidates(transcript_segments, config)
    top_candidates = _select_top_clips(candidates, max_clips)

    LOGGER.info("Rendering %d clips for %s", len(top_candidates), video_id)
    try:
        clips = render_clips(source_video, top_candidates, clips_dir)
    except ClipGenerationError as exc:
        raise PipelineError(str(exc)) from exc

    return PipelineResult(
        video_id=video_id,
        source_video=source_video,
        clips=clips,
        output_dir=clips_dir,
    )


async def run_in_thread(function, *args, **kwargs):
    """Execute a synchronous function in a worker thread."""

    return await asyncio.to_thread(function, *args, **kwargs)


__all__ = [
    "PipelineError",
    "PipelineResult",
    "frange",
    "process_video_to_clips",
    "run_in_thread",
]
