from __future__ import annotations

"""
Prompt Version Registry

Manages versioned prompt templates for the analysis pipeline.
Prompts are stored as text files, versioned in directories (v1/, v2/, etc.),
and loaded at runtime. This enables A/B testing different prompt strategies
and tracking which version produced which results.
"""

from pathlib import Path
from functools import lru_cache
import json

PROMPTS_DIR = Path(__file__).parent


def list_versions() -> list[str]:
    """List all available prompt versions."""
    return sorted(
        d.name for d in PROMPTS_DIR.iterdir()
        if d.is_dir() and d.name.startswith("v")
    )


def get_meta(version: str = "v1") -> dict:
    """Get metadata for a prompt version."""
    meta_path = PROMPTS_DIR / version / "meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Prompt version '{version}' not found")
    with open(meta_path) as f:
        return json.load(f)


@lru_cache(maxsize=32)
def load_prompt(name: str, version: str = "v1") -> str:
    """
    Load a prompt template by name and version.

    Args:
        name: Prompt name (e.g., "analysis", "price_read", "system")
        version: Version directory (e.g., "v1", "v2")

    Returns:
        Raw template string with {placeholders} for .format() calls
    """
    prompt_path = PROMPTS_DIR / version / f"{name}.txt"
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"Prompt '{name}' not found in version '{version}'. "
            f"Available versions: {list_versions()}"
        )
    return prompt_path.read_text().strip()


def render_prompt(name: str, version: str = "v1", **kwargs) -> str:
    """
    Load and render a prompt template with variables.

    Args:
        name: Prompt name
        version: Version directory
        **kwargs: Template variables to substitute

    Returns:
        Rendered prompt string
    """
    template = load_prompt(name, version)
    return template.format(**kwargs) if kwargs else template
