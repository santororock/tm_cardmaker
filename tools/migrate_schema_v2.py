"""
One-time migration script: assets.json schema v1 → v2
Run from the project root:  python tools/migrate_schema_v2.py

Adds to every blockList sprite:
  id, filename, kind, sets, usage, group, sortOrder, locked, color,
  tags (search keywords), deprecated, replacedBy, aliases,
  description, author, notes

Adds top-level keys:
  schemaVersion: 2
  sets: [ { id, name, description, locked, official, color } ]

Existing fields and their values are PRESERVED exactly.
New fields are appended after existing fields for readability.
"""

import json
import os
import sys
import shutil

# Resolve paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ASSETS_PATH = os.path.join(PROJECT_ROOT, "assets.json")
BACKUP_PATH = ASSETS_PATH + ".v1.bak"


# ---------------------------------------------------------------------------
# Kind inference: putUnder → semantic kind string
# ---------------------------------------------------------------------------
KIND_MAP = {
    "blocks/templates":      "template",
    "blocks/globalparameters": "global-parameter",
    "blocks/misc":           "misc",
    "blocks/parties":        "party",
    "blocks/productionboxes": "production-box",
    "blocks/requisites":     "requirement",
    "blocks/resources":      "resource",
    "blocks/tags":           "tag",
    "blocks/tiles":          "tile",
    "blocks/VPs":            "vp",
    "blocks/expansions":     "expansion-icon",
}


def infer_kind(put_under: str) -> str:
    return KIND_MAP.get(put_under, "misc")


# ---------------------------------------------------------------------------
# ID generation: unique, dot-separated, lowercase
# ---------------------------------------------------------------------------
def generate_id(put_under: str, src: str) -> str:
    """
    Produces an id like  category.stem  (all lowercase).

    Strategy:
      - category = putUnder with 'blocks/' stripped, lowercased
      - stem     = src with leading 'category__' or 'category_' stripped, lowercased
      - If src doesn't share a prefix with the category, use the full src as stem.
    """
    category = put_under.replace("blocks/", "").lower()
    src_lower = src.lower()

    prefix_double = category + "__"
    prefix_single = category + "_"

    if src_lower.startswith(prefix_double):
        stem = src[len(prefix_double):]
    elif src_lower.startswith(prefix_single):
        stem = src[len(prefix_single):]
    else:
        stem = src

    return f"{category}.{stem.lower()}"


def ensure_unique_id(base_id: str, seen: set) -> str:
    candidate = base_id
    counter = 2
    while candidate in seen:
        candidate = f"{base_id}_{counter}"
        counter += 1
    return candidate


# ---------------------------------------------------------------------------
# Top-level sets array (all current sprites → "core")
# ---------------------------------------------------------------------------
SETS = [
    {
        "id": "core",
        "name": "Core Game",
        "description": "Base Terraforming Mars content. Always enabled.",
        "locked": True,
        "official": True,
        "color": "#4a7c59"
    },
    {
        "id": "corporate-era",
        "name": "Corporate Era",
        "description": "Corporate Era expansion",
        "locked": False,
        "official": True,
        "color": "#6b8e23"
    },
    {
        "id": "prelude",
        "name": "Prelude",
        "description": "Prelude expansion",
        "locked": False,
        "official": True,
        "color": "#c4872f"
    },
    {
        "id": "venus-next",
        "name": "Venus Next",
        "description": "Venus Next expansion",
        "locked": False,
        "official": True,
        "color": "#9b4db8"
    },
    {
        "id": "colonies",
        "name": "Colonies",
        "description": "Colonies expansion",
        "locked": False,
        "official": True,
        "color": "#2e86ab"
    },
    {
        "id": "turmoil",
        "name": "Turmoil",
        "description": "Turmoil expansion",
        "locked": False,
        "official": True,
        "color": "#c44536"
    },
    {
        "id": "promo",
        "name": "Promo",
        "description": "Promo cards",
        "locked": False,
        "official": True,
        "color": "#f4a261"
    },
    {
        "id": "cosmic-horror",
        "name": "Cosmic Horror",
        "description": "Fan-made expansion",
        "locked": False,
        "official": False,
        "color": "#6b2d6b"
    },
]


# ---------------------------------------------------------------------------
# Main migration
# ---------------------------------------------------------------------------
def migrate(dry_run: bool = False):
    print(f"Reading {ASSETS_PATH}")
    with open(ASSETS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("schemaVersion", 1) >= 2:
        print("assets.json already at schema v2 or higher — nothing to do.")
        sys.exit(0)

    # Back up original
    shutil.copy2(ASSETS_PATH, BACKUP_PATH)
    print(f"Backup written to {BACKUP_PATH}")

    seen_ids: set = set()

    for sprite in data["blockList"]:
        put_under = sprite.get("putUnder", "")
        src = sprite.get("src", "")

        # --- core derivations ---
        kind = infer_kind(put_under)
        base_id = generate_id(put_under, src)
        sprite_id = ensure_unique_id(base_id, seen_ids)
        seen_ids.add(sprite_id)
        filename = f"{src}.png"

        # debug sprite always accessible, never filtered
        if src == "debug_sprite_sheet":
            usage = ["debug"]
        else:
            usage = ["card-editor"]

        # --- build migrated sprite preserving ALL existing fields first ---
        migrated: dict = {}
        for k, v in sprite.items():
            migrated[k] = v

        # --- append new v2 fields ---
        migrated["id"]          = sprite_id
        migrated["filename"]    = filename
        migrated["kind"]        = kind
        migrated["sets"]        = ["core"]
        migrated["usage"]       = usage
        migrated["group"]       = ""
        migrated["sortOrder"]   = 0
        migrated["locked"]      = False
        migrated["color"]       = ""
        migrated["tags"]        = []
        migrated["deprecated"]  = False
        migrated["replacedBy"]  = ""
        migrated["aliases"]     = []
        migrated["description"] = sprite.get("text", "")
        migrated["author"]      = ""
        migrated["notes"]       = ""

        # Replace in-place
        sprite.clear()
        sprite.update(migrated)

    # Build new top-level structure (preserve blockDefaults)
    output = {
        "schemaVersion": 2,
        "sets": SETS,
        "blockList": data["blockList"],
        "blockDefaults": data.get("blockDefaults", {}),
    }

    if dry_run:
        print("--- DRY RUN: output would be ---")
        print(json.dumps(output, indent=2, ensure_ascii=False)[:4000], "...")
        return

    with open(ASSETS_PATH, "w", encoding="utf-8", newline="\n") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Migration complete: {len(data['blockList'])} sprites updated to schema v2.")
    print("Unique IDs generated:")
    for sid in sorted(seen_ids):
        print(f"  {sid}")


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    migrate(dry_run=dry)
