"""The approved component catalog: the only UI the agent may draw."""

from __future__ import annotations

import json
import pathlib
from typing import Any

from a2ui.processor import CatalogConfig
from a2ui.utils import RendererState

from .schemas import CATALOG_ID

PROTOCOL_VERSION = "1.0"
CATALOG_PATH = pathlib.Path(__file__).resolve().parent / "tutor_catalog.json"
CATALOG_JSON: dict[str, Any] = json.loads(CATALOG_PATH.read_text("utf-8"))

#: What the renderer holds and every outbound message is validated against.
CATALOG_CONFIG = CatalogConfig.from_path(str(CATALOG_PATH), protocol_version=PROTOCOL_VERSION)
CATALOG = CATALOG_CONFIG.transformed_catalog

#: Component names the agent may use. Anything else is rejected.
COMPONENT_NAMES: list[str] = list(CATALOG_JSON["components"])


def new_renderer_state() -> RendererState:
    """An empty mirror of the web renderer; applying a message validates it."""
    return RendererState([CATALOG])


__all__ = [
    "CATALOG",
    "CATALOG_CONFIG",
    "CATALOG_ID",
    "CATALOG_JSON",
    "COMPONENT_NAMES",
    "PROTOCOL_VERSION",
    "new_renderer_state",
]
