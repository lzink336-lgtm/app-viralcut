"""Core data models used by the ViralCut processing pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class TranscriptSegment:
    """A single chunk of transcript text with timing metadata."""

    start: float
    duration: float
    text: str

    @property
    def end(self) -> float:
        """Return the end timestamp for the segment."""

        return self.start + self.duration


@dataclass(slots=True)
class ClipCandidate:
    """Represents a scored clip candidate based on transcript density."""

    start: float
    end: float
    text: str
    score: float


@dataclass(slots=True)
class ClipFile:
    """Metadata about a generated clip file."""

    start: float
    end: float
    score: float
    transcript: str
    path: Path


@dataclass(slots=True)
class PipelineResult:
    """Aggregate information returned by the processing pipeline."""

    video_id: str
    source_video: Path
    clips: list[ClipFile]
    output_dir: Path


__all__ = [
    "TranscriptSegment",
    "ClipCandidate",
    "ClipFile",
    "PipelineResult",
]
