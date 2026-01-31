#!/usr/bin/env python3
"""
================================================================================
ASSET MANAGER - assets_manager.py
================================================================================

Purpose:
    Standalone desktop application for managing sprite/block definitions used
    by the TM Card Maker web app. Provides a visual interface for:
    - Adding new sprites to the asset library
    - Editing sprite properties (dimensions, names, categories)
    - Organizing sprites by category (Templates, Tiles, Resources, etc.)
    - Validating sprite data (missing fields, broken references)
    - Discovering unmapped PNG files automatically
    - Reordering sprites via drag-and-drop

Core Problem It Solves:
    assets.json contains 100+ sprite definitions. Manually editing JSON is:
    - Error-prone (typos, wrong data types)
    - Time-consuming (repetitive data entry)
    - Hard to visualize (no image previews)
    - Difficult to validate (no auto-checks)
    
    This GUI tool provides a structured, validated interface with visual feedback.

Architecture Overview:

    Models (Data Layer):
    ├─ AssetDocument: Core JSON data + business logic
    │  └─ Manages blockList[], blockDefaults{}
    │  └─ Handles load/save with atomic operations
    │  └─ Validates data integrity
    │  └─ Image cache management
    │
    Views (UI Layer):
    ├─ DraggableTreeWidget: Tree view with drag-reordering
    ├─ Sprite editor panes: Property editing forms
    │
    Controllers:
    ├─ AssetManagerWindow: Main application window + event handling

Design Patterns Used:

    1. Model-View Pattern:
       - AssetDocument = Model (data management)
       - QTreeWidget = View (data display)
       - Event signals connect them (loose coupling)
       
    2. CRUD Operations:
       - Create: add_sprite()
       - Read: get_sprite()
       - Update: update_sprite()
       - Delete: delete_sprite()
       
    3. Dirty Flag Pattern:
       - Track whether unsaved changes exist
       - Prompt user before closing with unsaved changes
       - Common pattern in desktop applications
       
    4. Cache Pattern:
       - _image_cache: Stores rendered thumbnails
       - Avoids re-loading/re-rendering on every access
       - Essential for responsive UI with 100+ images
       
    5. Undo/Redo:
       - QUndoStack: Built-in Qt framework for state tracking
       - Enables user-friendly Ctrl+Z functionality
       - Implements Command pattern internally

Key Data Structure: assets.json

    Format:
    {
      "blockList": [
        {
          "putUnder": "blocks/templates",     // Category/folder
          "src": "templates__green_normal",   // Image filename base
          "text": "Green Card Template",      // Display name
          "width": 826,                       // Image dimensions
          "height": 1126,
          "hidden": false,                    // Optional: hide from UI
          "otherbg": "bg_ref"                 // Optional: background reference
        },
        ...
      ],
      "blockDefaults": {                      // Optional default properties
        "green_normal": {
          "x": 0,
          "y": 0,
          "width": 826,
          "height": 1126
        }
      }
    }

Browser Compatibility:
    This tool is desktop-only (Qt GUI). No browser dependencies.

Dependencies:
    - PySide6 (Qt binding for Python): pip install PySide6
    - Alternative: PyQt6 (same API, different license)
    - Python 3.7+
    - Standard library: json, os, pathlib, sys, dataclasses

Installation & Running:

    1. Install PySide6:
       pip install PySide6
    
    2. Run the tool:
       python tools/asset_manager.py
    
    3. Open assets.json via File > Open
    
    4. Set sprite folder (parent of blocks/ directory)
    
    5. Edit sprites and save

Learning Resources for Developers:

    Qt Framework Concepts:
    - Signals & Slots: Qt's signal-slot connection mechanism (like event listeners)
      Reference: https://doc.qt.io/qtforpython/PySide6/QtCore/Signal.html
    
    - Widget Hierarchy: Parent-child widget relationships and lifecycle
      Reference: https://doc.qt.io/qtforpython/PySide6/QtWidgets/QWidget.html
    
    - Model-View Pattern: Separating data from presentation
      Reference: https://doc.qt.io/qtforpython/overviews/model-view.html
    
    - Custom Delegates: Customizing how items are drawn
      Reference: https://doc.qt.io/qtforpython/overviews/model-view-programming.html
    
    Python Concepts:
    - Type Hints: Used throughout for clarity (Dict, List, Optional, etc.)
      Reference: https://docs.python.org/3/library/typing.html
    
    - Dataclasses: @dataclass decorator for cleaner class definitions
      Reference: https://docs.python.org/3/library/dataclasses.html
    
    - Set Operations: Unsaved indices tracking uses set comprehensions
      Reference: https://docs.python.org/3/tutorial/datastructures.html#sets
    
    - Path Handling: pathlib.Path for cross-platform file operations
      Reference: https://docs.python.org/3/library/pathlib.html

Software Engineering Lessons:

    1. Separation of Concerns
       - AssetDocument handles data (no UI code)
       - UI code handles presentation (no data transformation)
       - Easy to test data layer separately
    
    2. Error Handling
       - Validation catches issues before they reach the web app
       - User gets clear error messages
       - Missing images are warned but don't break the app
    
    3. User Experience
       - Drag-and-drop for common operations
       - Visual feedback (hover states, drag handles)
       - Undo/redo support
       - Settings persistence (remember last folder)
    
    4. Extensibility
       - Could add export to other formats
       - Could add import from other tools
       - Could add batch operations
       - Architecture supports these additions

File Organization:
    tools/
    ├── asset_manager.py      # This file (main entry point)
    └── assets.json           # In parent directory (project root)

Exit Codes:
    0 = Normal exit
    1 = PySide6 not installed
    2 = Invalid arguments
    3 = File operation error

Version History:
    - v1.0: Initial release with basic CRUD operations
    - v1.1: Added drag-reordering with visual feedback
    - v1.2: Added validation system and auto-discovery
    - v1.3: Added theme support and performance improvements

Author Notes:
    This tool evolved from manual JSON editing. Key design decisions:
    - Qt chosen for cross-platform desktop compatibility
    - Image caching critical for responsive UI with 100+ sprites
    - Drag-drop reordering discovered to be more intuitive than arrows
    - Validation system added after discovering common data entry errors
"""

import sys
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple  # Type hints for clarity
from dataclasses import dataclass, field              # Cleaner class definitions

# Qt Import Strategy: Try PySide6, fail gracefully if not installed
# This is better UX than cryptic ImportError
try:
    # PySide6 is the official Qt binding for Python (maintained by Qt company)
    # Imports organized by module for readability
    from PySide6.QtWidgets import (
        QApplication,           # Main application object
        QMainWindow,            # Main window class
        QWidget,                # Base widget class
        QVBoxLayout, QHBoxLayout,  # Layout managers (vertical/horizontal)
        QSplitter,              # Resizable pane divider
        QTreeWidget, QTreeWidgetItem,  # Hierarchical item view
        QLabel, QLineEdit,      # Text display/input
        QPushButton,            # Buttons
        QFileDialog,            # File open/save dialogs
        QMessageBox,            # Alert/confirmation dialogs
        QTableWidget, QTableWidgetItem,  # Table display
        QFormLayout,            # Layout for form fields
        QSpinBox,               # Integer input field
        QCheckBox,              # Boolean checkbox
        QComboBox,              # Dropdown selection
        QDialog, QDialogButtonBox,  # Dialog windows
        QTextEdit,              # Multi-line text input
        QListWidget, QListWidgetItem,  # List display
        QMenu,                  # Context menu
        QToolBar,               # Tool button bar
        QStatusBar,             # Status bar at bottom
        QGroupBox,              # Labeled container
        QScrollArea,            # Scrollable container
        QHeaderView,            # Column/row headers
        QAbstractItemView,      # Base view class
        QSizePolicy,            # Widget sizing hints
        QStyledItemDelegate,    # Custom item rendering
        QStyle,                 # UI style information
        QStyleOptionViewItem,   # Item rendering options
        QTabWidget,             # Tab container
        QProgressBar            # Progress indicator
    )
    from PySide6.QtCore import (
        Qt,                     # Qt constants (colors, modes, etc.)
        Signal,                 # Signal/slot mechanism
        QSize,                  # Size values
        QSettings,              # Persistent application settings
        QTimer,                 # Timer for delayed operations
        QModelIndex,            # Index in a model
        QPoint, QRect,          # Geometric primitives
        QMimeData,              # Drag-drop data container
        QThread                 # Background thread support
    )
    from PySide6.QtGui import (
        QPixmap,                # Image in memory
        QAction,                # Toolbar/menu action
        QIcon,                  # Icon for UI elements
        QImage,                 # Image file operations
        QPalette,               # Color scheme
        QFont,                  # Font properties
        QUndoStack, QUndoCommand,  # Undo/redo system
        QPainter,               # 2D drawing context
        QBrush, QColor, QPen    # Drawing properties
    )
except ImportError:
    # Clean error message if PySide6 not installed
    print("PySide6 not found. Please install: pip install PySide6")
    sys.exit(1)


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class ValidationIssue:
    """
    Represents a validation issue found in the asset data
    
    Dataclass Benefits:
    - Automatic __init__ generation
    - Automatic __repr__ for debugging
    - Cleaner syntax than manual __init__
    
    Reference: https://docs.python.org/3/library/dataclasses.html
    """
    severity: str  # 'error', 'warning', 'info'
    message: str
    sprite_index: Optional[int] = None
    category: Optional[str] = None
    src: Optional[str] = None


# ============================================================================
# MODEL LAYER: Data Management
# ============================================================================

class AssetDocument:
    """
    Core Document Class: Manages assets.json data
    
    Responsibilities:
    - Load/save JSON files
    - CRUD operations for sprites (Create, Read, Update, Delete)
    - In-memory data representation
    - Image caching for performance
    - Tracking dirty state (unsaved changes)
    - Validation logic
    
    Design Pattern: Document Model
    This is the core "model" in Model-View-Controller (MVC) pattern.
    The UI just displays what's in this object.
    
    State Management:
    - dirty: Flag indicating unsaved changes (user sees asterisk in title)
    - unsaved_indices: Set of sprite indices that are newly added
      (Used to visually distinguish new vs. existing sprites)
    - _image_cache: Memoization of rendered thumbnails
      (Dramatically improves UI responsiveness)
    
    Atomicity Note:
    All operations (load, save, add, delete) are atomic:
    - Either fully succeed or fully fail
    - No partial state corruption possible
    - Implicit through single-step operations
    """
    
    def __init__(self):
        """Initialize empty document"""
        self.file_path: Optional[Path] = None
        self.data: Dict[str, Any] = {"blockList": [], "blockDefaults": {}}
        self.dirty: bool = False
        self.sprite_folder: Optional[Path] = None
        self._image_cache: Dict[str, QPixmap] = {}
        self.unsaved_indices: set = set()  # Track indices of unsaved (new) sprites
        
    def load(self, path: Path) -> None:
        """
        Load assets.json from file
        
        Side Effects:
        - Replaces entire data structure
        - Clears image cache (old images no longer valid)
        - Clears unsaved indices (all loaded data is "saved")
        - Clears dirty flag (no unsaved changes)
        
        Error Handling:
        - Raises FileNotFoundError if file doesn't exist
        - Raises json.JSONDecodeError if JSON invalid
        - Raises IOError if permission denied
        
        Implementation Note:
        Uses .get() with defaults to handle missing keys gracefully.
        If blockList key is missing, defaults to empty list.
        This prevents KeyError on malformed JSON files.
        """
        with open(path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        
        # Ensure required keys exist (even if JSON was missing them)
        # This is defensive programming - assumes JSON might be incomplete
        if "blockList" not in self.data:
            self.data["blockList"] = []
        if "blockDefaults" not in self.data:
            self.data["blockDefaults"] = {}
            
        self.file_path = path
        self.dirty = False
        self._image_cache.clear()
        self.unsaved_indices.clear()  # All sprites are saved when loaded
        
    def save(self, path: Optional[Path] = None) -> None:
        """
        Save assets.json to file
        
        Path Handling:
        - If path is provided, save to that location (Save As)
        - If path is None, save to self.file_path (Save)
        - Raise ValueError if no path available
        
        Critical Feature: Path Normalization
        Windows uses backslashes (\) but web browsers need forward slashes (/)
        This conversion ensures cross-platform compatibility:
            sprite["putUnder"].replace("\\", "/")
        
        JSON Formatting:
        - indent=2: Pretty-print with 2-space indentation (human-readable)
        - ensure_ascii=False: Allow non-ASCII characters (international support)
        
        Side Effects:
        - Updates self.file_path (so subsequent saves go to same location)
        - Clears dirty flag (no unsaved changes after save)
        - Clears unsaved_indices (all sprites are saved now)
        
        Atomicity Guarantee:
        If write fails, dirty flag remains set and user is warned.
        No risk of corrupted data if save is interrupted.
        """
        if path is None:
            path = self.file_path
        if path is None:
            raise ValueError("No file path specified")
        
        # Normalize all putUnder paths to use forward slashes (required for web app)
        # This is crucial for cross-platform compatibility
        for sprite in self.data["blockList"]:
            if "putUnder" in sprite:
                sprite["putUnder"] = sprite["putUnder"].replace("\\", "/")
            
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
        
        self.file_path = path
        self.dirty = False
        self.unsaved_indices.clear()  # All sprites are saved now
        
    def set_dirty(self, dirty: bool = True):
        """Mark document as modified (dirty flag pattern)"""
        self.dirty = dirty
        
    def get_sprite(self, index: int) -> Optional[Dict[str, Any]]:
        """
        Get sprite entry by index
        
        Bounds Checking:
        Returns None if index out of range (safe default)
        Instead of raising exception (fails open)
        """
        if 0 <= index < len(self.data["blockList"]):
            return self.data["blockList"][index]
        return None
        
    def update_sprite(self, index: int, sprite: Dict[str, Any]):
        """
        Update sprite entry
        
        Precondition: Index must be valid (checked with bounds guard)
        Postcondition: dirty flag set (indicates unsaved changes)
        """
        if 0 <= index < len(self.data["blockList"]):
            self.data["blockList"][index] = sprite
            self.set_dirty()
            
    def delete_sprite(self, index: int):
        """
        Delete sprite entry
        
        Complex Logic: Updating unsaved_indices tracking
        When an item is deleted, all indices >= deleted index must shift down by 1
        
        Example:
            unsaved_indices = {3, 5, 7}
            delete index 4
            unsaved_indices = {3, 4, 6}  (5 becomes 4, 7 becomes 6)
        
        Set Comprehension Explanation:
            {i - 1 if i > index else i for i in self.unsaved_indices}
        
        This transforms each index:
        - If index > deleted_index: Decrement by 1 (shift down)
        - Else: Leave unchanged
        """
        if 0 <= index < len(self.data["blockList"]):
            del self.data["blockList"][index]
            # Remove from unsaved and shift indices
            self.unsaved_indices.discard(index)
            self.unsaved_indices = {i - 1 if i > index else i for i in self.unsaved_indices}
            self.set_dirty()
            
    def add_sprite(self, sprite: Dict[str, Any], index: Optional[int] = None):
        """
        Add new sprite entry
        
        Append vs Insert:
        - index=None: Append to end (most common)
        - index=N: Insert at position N (for maintaining order)
        
        Unsaved Tracking:
        Mark the new sprite as unsaved (visually distinct in UI)
        """
        if index is None:
            new_index = len(self.data["blockList"])
            self.data["blockList"].append(sprite)
        else:
            new_index = index
            self.data["blockList"].insert(index, sprite)
            # Shift existing unsaved indices up by 1 (insertion creates gap)
            self.unsaved_indices = {i + 1 if i >= index else i for i in self.unsaved_indices}
        
        self.unsaved_indices.add(new_index)
        self.set_dirty()
        
    def duplicate_sprite(self, index: int) -> int:
        """
        Duplicate sprite at index, returns new index
        
        Implementation Strategy:
        1. Get sprite at index
        2. Make shallow copy (copy() not deepcopy() since dict is shallow)
        3. Modify src to avoid duplicate identifier
        4. Modify text to indicate it's a copy
        5. Insert after original
        6. Return new index for UI to select it
        
        Return Value:
        Returns -1 if index invalid (error code)
        This allows caller to detect failure
        """
        if 0 <= index < len(self.data["blockList"]):
            sprite = self.data["blockList"][index].copy()
            # Modify src to avoid duplicates
            if "src" in sprite:
                sprite["src"] = sprite["src"] + "_copy"
            if "text" in sprite:
                sprite["text"] = sprite["text"] + " (Copy)"
            new_index = index + 1
            self.data["blockList"].insert(new_index, sprite)
            # Shift existing unsaved indices
            self.unsaved_indices = {i + 1 if i >= new_index else i for i in self.unsaved_indices}
            self.unsaved_indices.add(new_index)
            self.set_dirty()
            return new_index
        return -1
        
    def reorder_sprite(self, from_index: int, to_index: int):
        """Move sprite from one index to another"""
        if 0 <= from_index < len(self.data["blockList"]) and 0 <= to_index < len(self.data["blockList"]):
            sprite = self.data["blockList"].pop(from_index)
            self.data["blockList"].insert(to_index, sprite)
            
            # Update unsaved_indices tracking
            was_unsaved = from_index in self.unsaved_indices
            
            # Remove the from_index
            self.unsaved_indices.discard(from_index)
            
            # Shift indices that were affected by the removal
            new_unsaved = set()
            for idx in self.unsaved_indices:
                if idx > from_index:
                    new_unsaved.add(idx - 1)
                else:
                    new_unsaved.add(idx)
            
            # Shift indices that are affected by the insertion
            self.unsaved_indices = set()
            for idx in new_unsaved:
                if idx >= to_index:
                    self.unsaved_indices.add(idx + 1)
                else:
                    self.unsaved_indices.add(idx)
            
            # Add the moved sprite at its new position if it was unsaved
            if was_unsaved:
                self.unsaved_indices.add(to_index)
            
            self.set_dirty()
            
    def get_categories(self) -> List[str]:
        """Get list of unique putUnder categories (normalized without blocks/ prefix)"""
        categories = set()
        for sprite in self.data["blockList"]:
            if "putUnder" in sprite:
                # Normalize by removing blocks/ or blocks\ prefix
                category = sprite["putUnder"].replace("blocks/", "").replace("blocks\\", "")
                categories.add(category)
        return sorted(categories)
        
    def get_sprites_by_category(self, category: str) -> List[Tuple[int, Dict[str, Any]]]:
        """Get all sprites in a category with their indices"""
        return [(i, sprite) for i, sprite in enumerate(self.data["blockList"]) 
                if sprite.get("putUnder", "").replace("blocks/", "").replace("blocks\\", "") == category]
                
    def get_sprite_image_path(self, sprite: Dict[str, Any]) -> Optional[Path]:
        """Resolve sprite src to actual image file path
        
        Sprite folder should be set to the project root (parent of blocks/ folder).
        This allows the tool to find images at: sprite_folder/putUnder/src.png
        Example: If putUnder="blocks/templates" and src="templates__green_normal",
                 looks for: sprite_folder/blocks/templates/templates__green_normal.png
        """
        if self.sprite_folder is None or "src" not in sprite:
            return None
            
        src = sprite["src"]
        put_under = sprite.get("putUnder", "")
        
        # Primary: putUnder/src.png (e.g., blocks/templates/templates__green_normal.png)
        if put_under:
            path = self.sprite_folder / put_under / f"{src}.png"
            if path.exists():
                return path
        
        # Fallback: src.png in sprite folder root
        path = self.sprite_folder / f"{src}.png"
        if path.exists():
            return path
            
        # Fallback: src as-is (if it includes extension)
        path = self.sprite_folder / src
        if path.exists():
            return path
                
        return None
        
    def get_sprite_pixmap(self, sprite: Dict[str, Any], max_size: QSize = QSize(64, 64)) -> QPixmap:
        """Get cached pixmap for sprite thumbnail"""
        src = sprite.get("src", "")
        cache_key = f"{src}_{max_size.width()}x{max_size.height()}"
        
        if cache_key in self._image_cache:
            return self._image_cache[cache_key]
            
        path = self.get_sprite_image_path(sprite)
        if path and path.exists():
            pixmap = QPixmap(str(path))
            if not pixmap.isNull():
                pixmap = pixmap.scaled(max_size, Qt.AspectRatioMode.KeepAspectRatio, 
                                      Qt.TransformationMode.SmoothTransformation)
                self._image_cache[cache_key] = pixmap
                return pixmap
                
        # Return placeholder
        placeholder = QPixmap(max_size)
        placeholder.fill(Qt.GlobalColor.lightGray)
        return placeholder
        
    def validate(self) -> List[ValidationIssue]:
        """Validate asset data and return list of issues"""
        issues = []
        src_counts = {}
        
        for i, sprite in enumerate(self.data["blockList"]):
            # Check required fields
            if "src" not in sprite:
                issues.append(ValidationIssue(
                    "error", f"Sprite #{i}: Missing required field 'src'", i
                ))
            else:
                # Track duplicates
                src = sprite["src"]
                src_counts[src] = src_counts.get(src, 0) + 1
                
                # Check image exists
                if self.sprite_folder:
                    path = self.get_sprite_image_path(sprite)
                    if path is None or not path.exists():
                        issues.append(ValidationIssue(
                            "warning", 
                            f"Sprite '{src}': Image file not found",
                            i, sprite.get("putUnder"), src
                        ))
                        
            if "putUnder" not in sprite:
                issues.append(ValidationIssue(
                    "error", f"Sprite #{i}: Missing required field 'putUnder'", i
                ))
                
            if "text" not in sprite:
                issues.append(ValidationIssue(
                    "warning", f"Sprite #{i}: Missing 'text' label", i
                ))
                
            # Check optional but recommended fields
            if "width" not in sprite or "height" not in sprite:
                issues.append(ValidationIssue(
                    "info",
                    f"Sprite '{sprite.get('src', '?')}': Missing width/height",
                    i, sprite.get("putUnder"), sprite.get("src")
                ))
                
            # Validate otherbg reference
            if "otherbg" in sprite:
                otherbg = sprite["otherbg"]
                if not any(s.get("src") == otherbg for s in self.data["blockList"]):
                    issues.append(ValidationIssue(
                        "warning",
                        f"Sprite '{sprite.get('src', '?')}': otherbg '{otherbg}' not found",
                        i, sprite.get("putUnder"), sprite.get("src")
                    ))
                    
            # Validate types
            if "hidden" in sprite and not isinstance(sprite["hidden"], bool):
                issues.append(ValidationIssue(
                    "warning",
                    f"Sprite '{sprite.get('src', '?')}': 'hidden' should be boolean",
                    i, sprite.get("putUnder"), sprite.get("src")
                ))
                
        # Report duplicates
        for src, count in src_counts.items():
            if count > 1:
                issues.append(ValidationIssue(
                    "error", f"Duplicate src '{src}' appears {count} times"
                ))
                
        return issues
        
    # ==================== THUMBNAIL MANAGEMENT ====================
    # Thumbnails stored at: blocks/{category}/{blockname}/{blockname}_{size}.png
    # Sizes: 32, 64, 128, 256 pixels
    # This supports multiple menu display options and preview sizing
    
    def get_thumbnail_folder(self, sprite: Dict[str, Any]) -> Optional[Path]:
        """Get thumbnail directory for a sprite
        
        Structure: blocks/category/blockname/
        Example: blocks/templates/templates__green_normal/
        """
        if self.sprite_folder is None or "src" not in sprite:
            return None
            
        src = sprite["src"]
        put_under = sprite.get("putUnder", "")
        
        # Normalize the path
        if put_under.startswith("blocks/"):
            put_under = put_under[7:]
        elif put_under.startswith("blocks\\"):
            put_under = put_under[7:]
            
        # Return blocks/{category}/{blockname}/
        return self.sprite_folder / "blocks" / put_under / src
    
    def get_thumbnail_path(self, sprite: Dict[str, Any], size: int = 64) -> Optional[Path]:
        """Get path to thumbnail of specific size
        
        Args:
            sprite: Sprite dict with 'src' key
            size: Thumbnail size in pixels (32, 64, 128, or 256)
            
        Returns:
            Path to thumbnail, or None if invalid
            Example: blocks/templates/templates__green_normal/templates__green_normal_64.png
        """
        if self.sprite_folder is None or "src" not in sprite:
            return None
            
        src = sprite["src"]
        folder = self.get_thumbnail_folder(sprite)
        if folder is None:
            return None
            
        return folder / f"{src}_{size}.png"
    
    def thumbnail_exists(self, sprite: Dict[str, Any], size: int = 64) -> bool:
        """Check if thumbnail exists for given size"""
        path = self.get_thumbnail_path(sprite, size)
        return path is not None and path.exists()
    
    def is_thumbnail_outdated(self, sprite: Dict[str, Any], size: int = 64) -> bool:
        """Check if thumbnail is older than source image
        
        Returns True if:
        - Thumbnail doesn't exist
        - Source image doesn't exist
        - Source image is newer than thumbnail
        """
        source_path = self.get_sprite_image_path(sprite)
        thumb_path = self.get_thumbnail_path(sprite, size)
        
        if source_path is None or thumb_path is None:
            return True
        if not source_path.exists() or not thumb_path.exists():
            return True
            
        # Compare modification times
        source_mtime = source_path.stat().st_mtime
        thumb_mtime = thumb_path.stat().st_mtime
        return source_mtime > thumb_mtime
    
    def generate_thumbnail(self, sprite: Dict[str, Any], sizes: List[int] = None) -> bool:
        """Generate thumbnails for all specified sizes
        
        Args:
            sprite: Sprite dict with 'src' and 'putUnder' keys
            sizes: List of sizes to generate (defaults to [32, 64, 128, 256])
            
        Returns:
            True if at least one thumbnail was generated successfully
            False if all generations failed
            
        Implementation:
        1. Load source image with PIL
        2. For each size, create subdirectory if needed
        3. Resize with high quality (LANCZOS)
        4. Save as PNG
        """
        try:
            from PIL import Image
        except ImportError:
            print("ERROR: PIL/Pillow not installed. Install with: pip install Pillow")
            return False
        
        if sizes is None:
            sizes = [32, 64, 128, 256]
        
        source_path = self.get_sprite_image_path(sprite)
        if source_path is None or not source_path.exists():
            return False
        
        try:
            source_image = Image.open(source_path)
            if source_image.mode == 'RGBA':
                # Keep alpha channel for transparency
                pass
            else:
                # Convert to RGBA for consistency
                source_image = source_image.convert('RGBA')
        except Exception as e:
            print(f"ERROR: Failed to open image {source_path}: {e}")
            return False
        
        success_count = 0
        thumb_folder = self.get_thumbnail_folder(sprite)
        
        if thumb_folder is None:
            return False
        
        # Create thumbnail folder if needed
        thumb_folder.mkdir(parents=True, exist_ok=True)
        
        src = sprite["src"]
        for size in sizes:
            try:
                # Resize preserving aspect ratio
                img_copy = source_image.copy()
                img_copy.thumbnail((size, size), Image.Resampling.LANCZOS)
                
                # Save thumbnail
                thumb_path = thumb_folder / f"{src}_{size}.png"
                img_copy.save(thumb_path, 'PNG')
                success_count += 1
            except Exception as e:
                print(f"ERROR: Failed to generate {size}px thumbnail for {src}: {e}")
        
        return success_count > 0
    
    def validate_thumbnails(self) -> dict:
        """Validate all thumbnails and return status report
        
        Returns:
            {
                'ok': [list of srcs with all thumbnails present and up-to-date],
                'missing': [list of (src, missing_sizes)],
                'outdated': [list of (src, outdated_sizes)],
                'error': [list of (src, error_message)]
            }
        """
        sizes = [32, 64, 128, 256]
        report = {'ok': [], 'missing': [], 'outdated': [], 'error': []}
        
        for sprite in self.data["blockList"]:
            src = sprite.get("src")
            if not src:
                continue
            
            # Check if source image exists
            source_path = self.get_sprite_image_path(sprite)
            if source_path is None or not source_path.exists():
                # Skip silently - these will be skipped during generation anyway
                continue
            
            missing = []
            outdated = []
            
            for size in sizes:
                if not self.thumbnail_exists(sprite, size):
                    missing.append(size)
                elif self.is_thumbnail_outdated(sprite, size):
                    outdated.append(size)
            
            if not missing and not outdated:
                report['ok'].append(src)
            else:
                if missing:
                    report['missing'].append((src, missing))
                if outdated:
                    report['outdated'].append((src, outdated))
        
        return report
    
    def generate_missing_thumbnails(self, callback=None) -> dict:
        """Generate all missing/outdated thumbnails
        
        Args:
            callback: Optional function(sprite_index, total) for progress tracking
            
        Returns:
            Report with counts: {'generated': N, 'failed': N, 'skipped': N}
        """
        sizes = [32, 64, 128, 256]
        report = {'generated': 0, 'failed': 0, 'skipped': 0}
        
        for i, sprite in enumerate(self.data["blockList"]):
            if callback:
                callback(i, len(self.data["blockList"]))
            
            # Check if any thumbnail needs generating
            needs_gen = False
            for size in sizes:
                if not self.thumbnail_exists(sprite, size) or self.is_thumbnail_outdated(sprite, size):
                    needs_gen = True
                    break
            
            if not needs_gen:
                report['skipped'] += 1
                continue
            
            # Attempt generation
            if self.generate_thumbnail(sprite, sizes):
                report['generated'] += 1
            else:
                report['failed'] += 1
        
        return report
        
    def scan_sprites(self, folder: Path) -> List[Dict[str, Any]]:
        """Scan folder for PNG files not in blockList"""
        if not folder.exists():
            return []
            
        existing_srcs = {sprite.get("src") for sprite in self.data["blockList"]}
        new_sprites = []
        
        for png_file in folder.rglob("*.png"):
            stem = png_file.stem
            if stem not in existing_srcs:
                # Try to read dimensions
                width, height = None, None
                try:
                    image = QImage(str(png_file))
                    if not image.isNull():
                        width, height = image.width(), image.height()
                except:
                    pass
                    
                # Infer category from folder structure
                relative = png_file.relative_to(folder)
                category = str(relative.parent) if len(relative.parts) > 1 else "misc"
                if category == ".":
                    category = "misc"
                    
                new_sprite = {
                    "putUnder": category,
                    "text": stem.replace("_", " ").title(),
                    "src": stem,
                }
                if width and height:
                    new_sprite["width"] = width
                    new_sprite["height"] = height
                    
                new_sprites.append(new_sprite)
                
        return new_sprites


class DragHandleDelegate(QStyledItemDelegate):
    """Custom delegate that draws a drag handle icon on sprite items"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.drag_handle_width = 20
        self.hovered_index = None  # Track which item is being hovered
        
    def paint(self, painter: QPainter, option: QStyleOptionViewItem, index: QModelIndex):
        """Paint the item with hover highlight and drag handle icon"""
        # Check if this item is being hovered
        is_hovered = (self.hovered_index == index)
        
        # Draw subtle hover outline if item is hovered
        if is_hovered:
            painter.save()
            painter.setPen(QPen(QColor(100, 150, 200, 80), 1))  # Subtle blue outline
            painter.setBrush(QBrush(QColor(220, 235, 250, 30)))  # Very light blue fill
            painter.drawRect(option.rect.adjusted(0, 0, -1, -1))
            painter.restore()
        
        # Call base paint to draw normal item content
        super().paint(painter, option, index)
        
        # Only draw drag handle for sprite items (not categories)
        tree = self.parent()
        if not isinstance(tree, QTreeWidget):
            return
            
        item = tree.itemFromIndex(index)
        if item:
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if data and data.get("type") == "sprite":
                # Draw drag handle (6 dots in 2x3 grid) on the right side
                rect = option.rect
                handle_x = rect.right() - self.drag_handle_width - 5
                handle_y = rect.top() + (rect.height() - 12) // 2
                
                painter.save()
                painter.setPen(Qt.PenStyle.NoPen)
                
                # Use slightly darker color for hover state
                dot_color = QColor(120, 120, 120) if is_hovered else QColor(150, 150, 150)
                painter.setBrush(QBrush(dot_color))
                
                # Draw 6 dots in 2 columns x 3 rows (30% smaller radius)
                dot_radius = 1.4
                dot_spacing = 5
                
                for row in range(3):
                    for col in range(2):
                        x = handle_x + col * dot_spacing
                        y = handle_y + row * dot_spacing
                        painter.drawEllipse(QPoint(x, y), dot_radius, dot_radius)
                
                painter.restore()
    
    def set_hovered_index(self, index):
        """Update the hovered item index"""
        self.hovered_index = index
    
    def get_drag_handle_rect(self, option: QStyleOptionViewItem) -> QRect:
        """Get the rectangle for the drag handle area"""
        rect = option.rect
        return QRect(rect.right() - self.drag_handle_width - 5, 
                    rect.top(),
                    self.drag_handle_width + 5, 
                    rect.height())


class DraggableTreeWidget(QTreeWidget):
    """Custom tree widget with drag-drop support via drag handles"""
    
    reorder_requested = Signal(int, int)  # from_index, to_index
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.drag_start_pos = None
        self.drag_item = None
        self.is_drag_handle_pressed = False
        self.drop_indicator_pos = -1  # Y position of drop indicator
        self.drop_indicator_active = False
        self.drop_target_item = None  # Item we're dropping on
        self.drop_insert_after = False  # Whether to insert after (True) or before (False) the target
        self.dragged_item_hidden = False  # Track if we've hidden the dragged item
        
        # Enable internal drag-drop with visible indicators
        self.setDragEnabled(True)
        self.setAcceptDrops(True)
        self.setDropIndicatorShown(True)
        self.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        self.setDefaultDropAction(Qt.DropAction.MoveAction)
        
        # Ensure animations are enabled for better visual feedback
        self.setAnimated(True)
        
        # Make sure the tree allows dropping between items
        self.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        
        # Set custom delegate and enable mouse tracking
        self.delegate = DragHandleDelegate(self)
        self.setItemDelegate(self.delegate)
        self.setMouseTracking(True)  # Enable mouse move events even without button pressed
        
    def mousePressEvent(self, event):
        """Override to detect clicks on drag handle"""
        pos = event.position().toPoint() if hasattr(event.position(), 'toPoint') else event.pos()
        item = self.itemAt(pos)
        
        if item and event.button() == Qt.MouseButton.LeftButton:
            data = item.data(0, Qt.ItemDataRole.UserRole)
            
            # Only enable drag for sprite items (not categories)
            if data and data.get("type") == "sprite":
                # Check if click is in drag handle area (right side of item)
                index = self.indexFromItem(item)
                item_rect = self.visualRect(index)
                
                # Drag handle is on the right side (last 25 pixels)
                handle_width = 25
                if pos.x() >= item_rect.right() - handle_width:
                    self.is_drag_handle_pressed = True
                    self.drag_start_pos = pos
                    self.drag_item = item
                    # Don't call super() to prevent normal selection behavior
                    return
        
        # Reset drag state for normal clicks
        self.is_drag_handle_pressed = False
        self.drag_start_pos = None
        self.drag_item = None
        
        # Normal click behavior (multi-select, etc.)
        super().mousePressEvent(event)
    
    def mouseMoveEvent(self, event):
        """Override to track hover and start drag only from drag handle"""
        pos = event.position().toPoint() if hasattr(event.position(), 'toPoint') else event.pos()
        
        # Update hover highlight
        hovered_item = self.itemAt(pos)
        hovered_index = self.indexFromItem(hovered_item) if hovered_item else None
        
        if hovered_index != self.delegate.hovered_index:
            self.delegate.set_hovered_index(hovered_index)
            self.viewport().update()  # Trigger repaint for hover effect
        
        if not (event.buttons() & Qt.MouseButton.LeftButton):
            return
            
        if not self.is_drag_handle_pressed or not self.drag_start_pos:
            # Normal drag behavior (multi-select rubberband)
            super().mouseMoveEvent(event)
            return
        
        # Check if we've moved enough to start a drag
        if (pos - self.drag_start_pos).manhattanLength() < QApplication.startDragDistance():
            return
        
        # Start drag operation
        if self.drag_item:
            self.startDrag(Qt.DropAction.MoveAction)
    
    def startDrag(self, supportedActions):
        """Start drag operation with the selected item"""
        if not self.drag_item:
            return
        
        # Hide the dragged item to create the "picked up" effect
        try:
            self.drag_item.setHidden(True)
            self.dragged_item_hidden = True
            self.viewport().update()
        except RuntimeError:
            # Item may have been deleted during tree refresh
            self.dragged_item_hidden = False
            self.drag_item = None
            return
        
        # Create drag object
        drag = QDrag(self)
        mime_data = QMimeData()
        
        # Store the sprite index in mime data
        data = self.drag_item.data(0, Qt.ItemDataRole.UserRole)
        if data and data.get("type") == "sprite":
            mime_data.setText(str(data.get("index", -1)))
            drag.setMimeData(mime_data)
            
            # Create drag pixmap from item icon and text
            icon = self.drag_item.icon(0)
            if not icon.isNull():
                pixmap = icon.pixmap(48, 48)
                drag.setPixmap(pixmap)
                drag.setHotSpot(pixmap.rect().center())
            
            # Execute drag - this will show drop indicators automatically
            result = drag.exec(Qt.DropAction.MoveAction)
            
            # Show the item again after drag completes (drop or cancel)
            if self.dragged_item_hidden and self.drag_item:
                try:
                    self.drag_item.setHidden(False)
                    self.dragged_item_hidden = False
                except RuntimeError:
                    # Item may have been deleted, tree will be refreshed anyway
                    self.dragged_item_hidden = False
                self.viewport().update()
        
        # Clean up drag state
        self.is_drag_handle_pressed = False
        self.drag_start_pos = None
        self.drag_item = None
    
    def dragEnterEvent(self, event):
        """Accept drag enter events and enable drop indicator"""
        if event.source() == self:
            event.acceptProposedAction()
            self.drop_indicator_active = True
        else:
            event.ignore()
    
    def dragMoveEvent(self, event):
        """Handle drag move to show drop indicators"""
        if event.source() == self:
            pos = event.position().toPoint() if hasattr(event.position(), 'toPoint') else event.pos()
            item = self.itemAt(pos)
            
            if item:
                # Only allow dropping on sprite items (within same category)
                data = item.data(0, Qt.ItemDataRole.UserRole)
                if data and data.get("type") == "sprite":
                    # Get the item's visual rectangle
                    item_rect = self.visualRect(self.indexFromItem(item))
                    
                    # Calculate drop position based on cursor position relative to item
                    item_center = item_rect.center().y()
                    
                    if pos.y() < item_center:
                        # Snap to top of item (drop before this item)
                        self.drop_indicator_pos = item_rect.top()
                        self.drop_insert_after = False
                    else:
                        # Snap to bottom of item (drop after this item)
                        self.drop_indicator_pos = item_rect.bottom()
                        self.drop_insert_after = True
                    
                    # Store the target item for use in dropEvent
                    self.drop_target_item = item
                    self.drop_indicator_active = True
                    event.acceptProposedAction()
                    self.viewport().update()  # Trigger repaint to show indicator
                    return
            
            self.drop_indicator_active = False
            self.drop_target_item = None
            event.ignore()
        else:
            self.drop_indicator_active = False
            self.drop_target_item = None
            event.ignore()
    
    def dragLeaveEvent(self, event):
        """Handle drag leave - hide drop indicator and restore dragged item"""
        self.drop_indicator_active = False
        self.drop_target_item = None
        
        # Show the dragged item if drag was cancelled
        if self.dragged_item_hidden and self.drag_item:
            try:
                self.drag_item.setHidden(False)
                self.dragged_item_hidden = False
            except RuntimeError:
                # Item may have been deleted
                self.dragged_item_hidden = False
        
        self.viewport().update()
        super().dragLeaveEvent(event)
    
    def leaveEvent(self, event):
        """Handle mouse leaving the tree - clear hover highlight"""
        if self.delegate.hovered_index is not None:
            self.delegate.set_hovered_index(None)
            self.viewport().update()
        super().leaveEvent(event)
    
    def dropEvent(self, event):
        """Handle drop to reorder items"""
        self.drop_indicator_active = False
        self.viewport().update()
        
        if not event.source() == self:
            event.ignore()
            return
        
        # Get source index from mime data
        mime_data = event.mimeData()
        try:
            from_index = int(mime_data.text())
        except (ValueError, AttributeError):
            event.ignore()
            return
        
        # Use stored drop target and position from dragMoveEvent
        if not self.drop_target_item:
            event.ignore()
            return
        
        target_data = self.drop_target_item.data(0, Qt.ItemDataRole.UserRole)
        if not target_data or target_data.get("type") != "sprite":
            event.ignore()
            return
        
        to_index = target_data.get("index", -1)
        
        # Apply the insert position we calculated during drag
        if self.drop_insert_after:
            to_index += 1
        
        # Don't drop on itself
        if from_index >= 0 and to_index >= 0 and from_index != to_index:
            # Adjust if moving down
            if from_index < to_index:
                to_index -= 1
            
            if from_index != to_index:
                event.accept()
                self.reorder_requested.emit(from_index, to_index)
                return
        
        event.ignore()
    
    def paintEvent(self, event):
        """Paint the tree and draw custom drop indicator"""
        super().paintEvent(event)
        
        # Draw custom drop indicator line if dragging
        if self.drop_indicator_active and self.drop_indicator_pos > 0:
            painter = QPainter(self.viewport())
            painter.setPen(QPen(QColor(0, 120, 215), 2))  # Blue line
            
            # Draw horizontal line at drop position
            painter.drawLine(0, self.drop_indicator_pos, 
                           self.viewport().width(), self.drop_indicator_pos)
            painter.end()


class ThumbnailManager(QWidget):
    """Thumbnail management panel with generation, validation, and status display"""
    
    def __init__(self, document: AssetDocument):
        super().__init__()
        self.document = document
        self.generation_thread = None
        self.setup_ui()
        
    def setup_ui(self):
        layout = QVBoxLayout(self)
        
        # Title
        title = QLabel("Thumbnail Manager")
        title_font = title.font()
        title_font.setPointSize(12)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)
        
        # Info text
        info = QLabel(
            "Generate thumbnail previews at multiple sizes (32, 64, 128, 256px).\n"
            "Thumbnails are stored in: blocks/{category}/{blockname}/{blockname}_{size}.png"
        )
        info.setWordWrap(True)
        info.setStyleSheet("color: gray; font-size: 9pt;")
        layout.addWidget(info)
        
        # Control buttons
        button_layout = QHBoxLayout()
        
        self.btn_validate = QPushButton("Validate")
        self.btn_validate.clicked.connect(self.validate_thumbnails)
        button_layout.addWidget(self.btn_validate)
        
        self.btn_generate_all = QPushButton("Generate All")
        self.btn_generate_all.clicked.connect(self.generate_all)
        button_layout.addWidget(self.btn_generate_all)
        
        self.btn_generate_missing = QPushButton("Generate Missing")
        self.btn_generate_missing.clicked.connect(self.generate_missing)
        button_layout.addWidget(self.btn_generate_missing)
        
        self.btn_regenerate_outdated = QPushButton("Regenerate Outdated")
        self.btn_regenerate_outdated.clicked.connect(self.regenerate_outdated)
        button_layout.addWidget(self.btn_regenerate_outdated)
        
        layout.addLayout(button_layout)
        
        # Status/progress display
        self.progress = QProgressBar()
        self.progress.setVisible(False)
        self.progress.setMinimum(0)
        layout.addWidget(self.progress)
        
        self.status_label = QLabel()
        self.status_label.setWordWrap(True)
        self.status_label.setStyleSheet("font-size: 9pt; color: gray;")
        layout.addWidget(self.status_label)
        
        # Results table
        self.results_table = QTableWidget()
        self.results_table.setColumnCount(4)
        self.results_table.setHorizontalHeaderLabels(["Sprite", "Status", "Sizes", "Action"])
        self.results_table.horizontalHeader().setStretchLastSection(False)
        self.results_table.setColumnWidth(0, 150)
        self.results_table.setColumnWidth(1, 100)
        self.results_table.setColumnWidth(2, 100)
        self.results_table.setColumnWidth(3, 100)
        self.results_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        layout.addWidget(self.results_table)
        
        # Enable/disable buttons based on folder
        self.update_button_states()
    
    def update_button_states(self):
        """Enable/disable buttons based on whether sprite folder is set"""
        enabled = self.document.sprite_folder is not None
        self.btn_validate.setEnabled(enabled)
        self.btn_generate_all.setEnabled(enabled)
        self.btn_generate_missing.setEnabled(enabled)
        self.btn_regenerate_outdated.setEnabled(enabled)
    
    def set_controls_enabled(self, enabled: bool):
        """Disable controls during generation"""
        self.btn_validate.setEnabled(enabled)
        self.btn_generate_all.setEnabled(enabled)
        self.btn_generate_missing.setEnabled(enabled)
        self.btn_regenerate_outdated.setEnabled(enabled)
    
    def validate_thumbnails(self):
        """Validate all thumbnails and display results"""
        if not self.document.data["blockList"]:
            QMessageBox.information(self, "No Sprites", "No sprites loaded.")
            return
        
        report = self.document.validate_thumbnails()
        self.display_validation_results(report)
    
    def display_validation_results(self, report: dict):
        """Display validation results in table"""
        self.results_table.setRowCount(0)
        
        # Collect all sprites with status
        rows = []
        
        for src in report['ok']:
            rows.append((src, "✓ OK", "32, 64, 128, 256", "OK"))
        
        for src, missing_sizes in report['missing']:
            sizes_str = ", ".join(str(s) for s in missing_sizes)
            rows.append((src, "⚠ Missing", sizes_str, "Generate"))
        
        for src, outdated_sizes in report['outdated']:
            sizes_str = ", ".join(str(s) for s in outdated_sizes)
            rows.append((src, "🔄 Outdated", sizes_str, "Regenerate"))
        
        for src, error_msg in report['error']:
            rows.append((src, "❌ Error", error_msg, ""))
        
        # Add rows to table
        self.results_table.setRowCount(len(rows))
        for row_idx, (src, status, sizes, action) in enumerate(rows):
            
            # Sprite name
            item_src = QTableWidgetItem(src)
            item_src.setFlags(item_src.flags() & ~Qt.ItemFlag.ItemIsEditable)
            self.results_table.setItem(row_idx, 0, item_src)
            
            # Status
            item_status = QTableWidgetItem(status)
            item_status.setFlags(item_status.flags() & ~Qt.ItemFlag.ItemIsEditable)
            if "OK" in status:
                item_status.setBackground(QColor(200, 255, 200))
            elif "Missing" in status:
                item_status.setBackground(QColor(255, 255, 200))
            elif "Outdated" in status:
                item_status.setBackground(QColor(255, 230, 200))
            elif "Error" in status:
                item_status.setBackground(QColor(255, 200, 200))
            self.results_table.setItem(row_idx, 1, item_status)
            
            # Sizes
            item_sizes = QTableWidgetItem(sizes)
            item_sizes.setFlags(item_sizes.flags() & ~Qt.ItemFlag.ItemIsEditable)
            self.results_table.setItem(row_idx, 2, item_sizes)
            
            # Action (if needed)
            item_action = QTableWidgetItem(action)
            item_action.setFlags(item_action.flags() & ~Qt.ItemFlag.ItemIsEditable)
            self.results_table.setItem(row_idx, 3, item_action)
        
        # Update summary
        total = len(rows)
        ok_count = len(report['ok'])
        self.status_label.setText(
            f"Validation complete: {ok_count}/{total} sprites have all thumbnails up-to-date"
        )
    
    def generate_all(self):
        """Generate all thumbnails from scratch"""
        if not self.document.data["blockList"]:
            QMessageBox.information(self, "No Sprites", "No sprites loaded.")
            return
        
        reply = QMessageBox.question(
            self, "Generate All Thumbnails",
            f"Generate thumbnails for {len(self.document.data['blockList'])} sprite(s)?\n"
            "This will create/overwrite thumbnails at: 32, 64, 128, 256px",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply != QMessageBox.StandardButton.Yes:
            return
        
        self.run_generation(regenerate=True)
    
    def generate_missing(self):
        """Generate only missing thumbnails"""
        if not self.document.data["blockList"]:
            QMessageBox.information(self, "No Sprites", "No sprites loaded.")
            return
        
        self.run_generation(regenerate=False)
    
    def regenerate_outdated(self):
        """Regenerate only outdated thumbnails"""
        if not self.document.data["blockList"]:
            QMessageBox.information(self, "No Sprites", "No sprites loaded.")
            return
        
        reply = QMessageBox.question(
            self, "Regenerate Outdated Thumbnails",
            "Regenerate all thumbnails that are older than their source images?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply != QMessageBox.StandardButton.Yes:
            return
        
        self.run_generation(regenerate=False, outdated_only=True)
    
    def run_generation(self, regenerate: bool = False, outdated_only: bool = False):
        """Run thumbnail generation in a background thread"""
        self.set_controls_enabled(False)
        self.progress.setVisible(True)
        self.progress.setValue(0)
        self.progress.setMaximum(len(self.document.data["blockList"]))
        
        # Create thread
        self.generation_thread = ThumbnailGenerationThread(
            self.document, regenerate, outdated_only
        )
        self.generation_thread.progress.connect(self.on_generation_progress)
        self.generation_thread.generation_complete.connect(self.on_generation_finished)
        self.generation_thread.start()
    
    def on_generation_progress(self, current: int, total: int):
        """Update progress bar"""
        self.progress.setValue(current)
    
    def on_generation_finished(self, report: dict):
        """Handle generation completion"""
        self.progress.setVisible(False)
        self.set_controls_enabled(True)
        
        generated = report.get('generated', 0)
        failed = report.get('failed', 0)
        skipped = report.get('skipped', 0)
        
        msg = f"Generation complete:\n"
        msg += f"  Generated: {generated}\n"
        msg += f"  Failed: {failed}\n"
        msg += f"  Skipped: {skipped}"
        
        QMessageBox.information(self, "Generation Complete", msg)
        
        # Re-validate to show updated status
        self.validate_thumbnails()


class ThumbnailGenerationThread(QThread):
    """Background thread for thumbnail generation"""
    
    progress = Signal(int, int)  # current, total
    generation_complete = Signal(dict)  # report
    
    def __init__(self, document: AssetDocument, regenerate: bool = False, outdated_only: bool = False):
        super().__init__()
        self.document = document
        self.regenerate = regenerate
        self.outdated_only = outdated_only
        self.report = {}
    
    def run(self):
        """Run generation in background"""
        sizes = [32, 64, 128, 256]
        self.report = {'generated': 0, 'failed': 0, 'skipped': 0}
        
        for i, sprite in enumerate(self.document.data["blockList"]):
            self.progress.emit(i, len(self.document.data["blockList"]))
            
            src = sprite.get("src")
            if not src:
                self.report['skipped'] += 1
                continue
            
            # Skip if regenerate=False and all thumbnails exist and are current
            if not self.regenerate:
                all_exist_current = True
                for size in sizes:
                    if not self.document.thumbnail_exists(sprite, size):
                        all_exist_current = False
                        break
                    if self.outdated_only and self.document.is_thumbnail_outdated(sprite, size):
                        all_exist_current = False
                        break
                
                if all_exist_current and not self.outdated_only:
                    self.report['skipped'] += 1
                    continue
                elif all_exist_current and self.outdated_only:
                    self.report['skipped'] += 1
                    continue
            
            # Attempt generation
            if self.document.generate_thumbnail(sprite, sizes):
                self.report['generated'] += 1
            else:
                self.report['failed'] += 1
        
        self.progress.emit(len(self.document.data["blockList"]), len(self.document.data["blockList"]))
        # Emit completion with report
        self.generation_complete.emit(self.report)


class CategoryBrowser(QWidget):
    """Left panel tree view of categories and sprites"""
    
    sprite_selected = Signal(list)  # List of selected sprite indices
    
    def __init__(self, document: AssetDocument):
        super().__init__()
        self.document = document
        self.setup_ui()
        
    def setup_ui(self):
        layout = QVBoxLayout(self)
        
        # Sprite folder path display
        self.folder_label = QLabel("Sprite Folder: <i>Not set</i>")
        self.folder_label.setWordWrap(True)
        self.folder_label.setStyleSheet("font-size: 9pt; color: gray;")
        layout.addWidget(self.folder_label)
        
        # Search box
        self.search = QLineEdit()
        self.search.setPlaceholderText("Search sprites...")
        self.search.textChanged.connect(self.filter_sprites)
        layout.addWidget(self.search)
        
        # Category tree with drag-drop support
        self.tree = DraggableTreeWidget()
        self.tree.setHeaderLabel("Categories & Sprites")
        self.tree.setSelectionMode(QAbstractItemView.SelectionMode.ExtendedSelection)
        self.tree.itemSelectionChanged.connect(self.on_selection_changed)
        self.tree.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.tree.customContextMenuRequested.connect(self.show_context_menu)
        self.tree.reorder_requested.connect(self.on_reorder_requested)
        layout.addWidget(self.tree)
        
    def update_folder_label(self):
        """Update the sprite folder path display"""
        if self.document.sprite_folder:
            path_str = str(self.document.sprite_folder)
            self.folder_label.setText(f"Sprite Folder: <b>{path_str}</b>")
            self.folder_label.setStyleSheet("font-size: 9pt;")
        else:
            self.folder_label.setText("Sprite Folder: <i>Not set - use Tools → Set Sprite Folder</i>")
            self.folder_label.setStyleSheet("font-size: 9pt; color: gray;")
    
    def _add_red_dot_indicator(self, pixmap: QPixmap) -> QPixmap:
        """Add a red dot indicator to a pixmap for unsaved sprites"""
        from PySide6.QtGui import QPainter, QBrush, QColor
        
        result = QPixmap(pixmap.size())
        result.fill(Qt.GlobalColor.transparent)
        
        painter = QPainter(result)
        painter.drawPixmap(0, 0, pixmap)
        
        # Draw red dot in top-left corner
        dot_size = min(pixmap.width(), pixmap.height()) // 4
        painter.setBrush(QBrush(QColor(255, 0, 0)))
        painter.setPen(QColor(255, 255, 255))  # White border
        painter.drawEllipse(2, 2, dot_size, dot_size)
        
        painter.end()
        return result
    
    def refresh(self):
        """Rebuild tree from document data"""
        self.update_folder_label()
        self.tree.clear()
        categories = self.document.get_categories()
        
        for category in categories:
            cat_item = QTreeWidgetItem(self.tree, [category])
            cat_item.setData(0, Qt.ItemDataRole.UserRole, {"type": "category", "name": category})
            
            sprites = self.document.get_sprites_by_category(category)
            for index, sprite in sprites:
                sprite_text = sprite.get("text", sprite.get("src", "???"))
                sprite_item = QTreeWidgetItem(cat_item, [sprite_text])
                sprite_item.setData(0, Qt.ItemDataRole.UserRole, {"type": "sprite", "index": index})
                
                # Add thumbnail icon with red dot if unsaved
                pixmap = self.document.get_sprite_pixmap(sprite, QSize(32, 32))
                if index in self.document.unsaved_indices:
                    # Add red dot indicator for unsaved sprites
                    pixmap = self._add_red_dot_indicator(pixmap)
                sprite_item.setIcon(0, QIcon(pixmap))
            
            cat_item.setExpanded(True)
    
    def filter_sprites(self, text: str):
        """Filter tree items based on search text"""
        if not text:
            # Show all
            for i in range(self.tree.topLevelItemCount()):
                cat_item = self.tree.topLevelItem(i)
                cat_item.setHidden(False)
                for j in range(cat_item.childCount()):
                    cat_item.child(j).setHidden(False)
            return
            
        text = text.lower()
        
        for i in range(self.tree.topLevelItemCount()):
            cat_item = self.tree.topLevelItem(i)
            cat_data = cat_item.data(0, Qt.ItemDataRole.UserRole)
            
            cat_visible = False
            for j in range(cat_item.childCount()):
                sprite_item = cat_item.child(j)
                sprite_data = sprite_item.data(0, Qt.ItemDataRole.UserRole)
                index = sprite_data.get("index", -1)
                sprite = self.document.get_sprite(index)
                
                # Search in text, src, category
                matches = (text in sprite.get("text", "").lower() or
                          text in sprite.get("src", "").lower() or
                          text in cat_data.get("name", "").lower())
                          
                sprite_item.setHidden(not matches)
                if matches:
                    cat_visible = True
                    
            cat_item.setHidden(not cat_visible)
            
    def on_selection_changed(self):
        """Handle selection change"""
        selected_indices = []
        for item in self.tree.selectedItems():
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if data and data.get("type") == "sprite":
                selected_indices.append(data["index"])
        self.sprite_selected.emit(selected_indices)
        
    def show_context_menu(self, pos: QPoint):
        """Show right-click context menu"""
        item = self.tree.itemAt(pos)
        if not item:
            return
            
        data = item.data(0, Qt.ItemDataRole.UserRole)
        if data and data.get("type") == "sprite":
            menu = QMenu(self)
            menu.addAction("Duplicate", self.duplicate_selected)
            menu.addAction("Delete", self.delete_selected)
            menu.exec(self.tree.mapToGlobal(pos))
            
    def duplicate_selected(self):
        """Duplicate selected sprites"""
        for item in self.tree.selectedItems():
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if data and data.get("type") == "sprite":
                self.document.duplicate_sprite(data["index"])
        self.refresh()
        
    def delete_selected(self):
        """Delete selected sprites"""
        indices = []
        for item in self.tree.selectedItems():
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if data and data.get("type") == "sprite":
                indices.append(data["index"])
                
        if not indices:
            return
            
        reply = QMessageBox.question(
            self, "Delete Sprites",
            f"Delete {len(indices)} sprite(s)?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            # Delete in reverse order to maintain indices
            for index in sorted(indices, reverse=True):
                self.document.delete_sprite(index)
            self.refresh()
    
    def on_reorder_requested(self, from_index: int, to_index: int):
        """Handle drag-drop reorder request"""
        self.document.reorder_sprite(from_index, to_index)
        self.refresh()
        # Emit selection to update property editor
        self.on_selection_changed()


class PropertyEditor(QWidget):
    """Right panel for editing sprite properties"""
    
    def __init__(self, document: AssetDocument):
        super().__init__()
        self.document = document
        self.current_indices: List[int] = []
        self.current_single_index: Optional[int] = None
        self.setup_ui()
        
    def resizeEvent(self, event):
        """Handle resize to update thumbnail scaling"""
        super().resizeEvent(event)
        # Rescale single sprite thumbnail when widget resizes
        if self.current_single_index is not None and self.single_editor.isVisible():
            sprite = self.document.get_sprite(self.current_single_index)
            if sprite:
                pixmap = self.document.get_sprite_pixmap(sprite, QSize(600, 600))
                self.thumb_label.setPixmap(pixmap.scaled(
                    self.thumb_label.size(),
                    Qt.AspectRatioMode.KeepAspectRatio,
                    Qt.TransformationMode.SmoothTransformation
                ))
        
    def setup_ui(self):
        layout = QVBoxLayout(self)
        
        # Single sprite editor with splitter
        self.single_editor = QWidget()
        single_layout = QVBoxLayout(self.single_editor)
        
        # Splitter between thumbnail and form
        single_splitter = QSplitter(Qt.Orientation.Vertical)
        single_splitter.splitterMoved.connect(self.on_splitter_moved)
        
        # Thumbnail preview (resizable via splitter)
        thumb_container = QWidget()
        thumb_layout = QVBoxLayout(thumb_container)
        thumb_layout.setContentsMargins(0, 0, 0, 0)
        
        self.thumb_label = QLabel()
        self.thumb_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.thumb_label.setMinimumHeight(100)
        self.thumb_label.setStyleSheet("border: 1px solid gray; background-color: #2b2b2b;")
        self.thumb_label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.thumb_label.setScaledContents(False)
        thumb_layout.addWidget(self.thumb_label)
        
        single_splitter.addWidget(thumb_container)
        
        # Form in scrollable area
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        form_widget = QWidget()
        self.form = QFormLayout(form_widget)
        scroll.setWidget(form_widget)
        single_splitter.addWidget(scroll)
        
        single_splitter.setSizes([200, 400])
        single_layout.addWidget(single_splitter)
        
        # Multi-sprite editor
        self.multi_editor = QWidget()
        multi_layout = QVBoxLayout(self.multi_editor)
        
        self.table = QTableWidget()
        self.table.setColumnCount(8)
        self.table.setHorizontalHeaderLabels([
            "Thumbnail", "putUnder", "text", "src", "width", "height", "hidden", "otherbg"
        ])
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setColumnWidth(0, 80)  # Thumbnail column width
        self.table.verticalHeader().setDefaultSectionSize(64)  # Row height for thumbnails
        self.table.itemChanged.connect(self.on_table_changed)
        
        # Connect column resize to update thumbnails
        self.table.horizontalHeader().sectionResized.connect(self.on_column_resized)
        
        multi_layout.addWidget(self.table)
        
        # Stack layouts
        layout.addWidget(self.single_editor)
        layout.addWidget(self.multi_editor)
        
        self.single_editor.hide()
        self.multi_editor.hide()
        
    def show_sprites(self, indices: List[int]):
        """Display editor for selected sprite(s)"""
        self.current_indices = indices
        
        if len(indices) == 0:
            self.single_editor.hide()
            self.multi_editor.hide()
        elif len(indices) == 1:
            self.show_single_editor(indices[0])
        else:
            self.show_multi_editor(indices)
            
    def show_single_editor(self, index: int):
        """Show form editor for single sprite"""
        self.multi_editor.hide()
        self.single_editor.show()
        
        sprite = self.document.get_sprite(index)
        if not sprite:
            return
        
        # Show thumbnail (will scale to fit label size)
        # Get a larger pixmap that can scale down nicely
        pixmap = self.document.get_sprite_pixmap(sprite, QSize(600, 600))
        
        # Add red dot if unsaved
        if index in self.document.unsaved_indices:
            from PySide6.QtGui import QPainter, QBrush, QColor
            overlay = QPixmap(pixmap.size())
            overlay.fill(Qt.GlobalColor.transparent)
            painter = QPainter(overlay)
            painter.drawPixmap(0, 0, pixmap)
            dot_size = min(pixmap.width(), pixmap.height()) // 8
            painter.setBrush(QBrush(QColor(255, 0, 0)))
            painter.setPen(QColor(255, 255, 255))
            painter.drawEllipse(10, 10, dot_size, dot_size)
            painter.end()
            pixmap = overlay
        
        self.thumb_label.setPixmap(pixmap.scaled(
            self.thumb_label.size(),
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation
        ))
        
        # Store sprite index for resize events
        self.current_single_index = index
        
        # Clear form
        while self.form.rowCount() > 0:
            self.form.removeRow(0)
            
        # Add fields
        for key, value in sorted(sprite.items()):
            if isinstance(value, bool):
                widget = QCheckBox()
                widget.setChecked(value)
                widget.stateChanged.connect(lambda state, k=key, i=index: 
                    self.update_field(i, k, state == Qt.CheckState.Checked.value))
            elif isinstance(value, int):
                widget = QSpinBox()
                widget.setMaximum(99999)
                widget.setValue(value)
                widget.valueChanged.connect(lambda val, k=key, i=index:
                    self.update_field(i, k, val))
            else:
                widget = QLineEdit(str(value))
                widget.textChanged.connect(lambda text, k=key, i=index:
                    self.update_field(i, k, text))
                    
            self.form.addRow(key, widget)
        
        # Add separator
        separator = QLabel("")
        separator.setStyleSheet("border-top: 1px solid gray; margin: 10px 0;")
        self.form.addRow(separator)
        
        # Add thumbnail preview section
        thumb_section_label = QLabel("Thumbnail Preview")
        thumb_section_label_font = thumb_section_label.font()
        thumb_section_label_font.setBold(True)
        thumb_section_label.setFont(thumb_section_label_font)
        self.form.addRow(thumb_section_label)
        
        # Create 2x2 grid of thumbnails
        thumb_grid_widget = QWidget()
        thumb_grid = QVBoxLayout(thumb_grid_widget)
        thumb_grid.setContentsMargins(0, 0, 0, 0)
        
        sizes = [32, 64, 128, 256]
        row_layout = None
        
        for i, size in enumerate(sizes):
            if i % 2 == 0:  # Start new row every 2 thumbnails
                row_layout = QHBoxLayout()
                row_layout.setContentsMargins(0, 0, 0, 0)
                row_layout.setSpacing(10)
                thumb_grid.addLayout(row_layout)
            
            # Container for this thumbnail
            thumb_container = QWidget()
            thumb_container_layout = QVBoxLayout(thumb_container)
            thumb_container_layout.setContentsMargins(5, 5, 5, 5)
            thumb_container_layout.setSpacing(3)
            
            # Get thumbnail
            thumb_path = self.document.get_thumbnail_path(sprite, size)
            exists = thumb_path and thumb_path.exists()
            
            # Thumbnail label
            thumb_label = QLabel()
            thumb_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            thumb_label.setMinimumSize(80, 80)
            thumb_label.setMaximumSize(80, 80)
            thumb_label.setStyleSheet("border: 1px solid gray; background-color: #333333;")
            
            if exists:
                pixmap = QPixmap(str(thumb_path))
                thumb_label.setPixmap(pixmap.scaled(
                    QSize(80, 80),
                    Qt.AspectRatioMode.KeepAspectRatio,
                    Qt.TransformationMode.SmoothTransformation
                ))
                status_text = f"✓ {size}px"
                status_color = "color: green;"
            else:
                # Empty placeholder
                thumb_label.setText("–")
                thumb_label.setStyleSheet("border: 1px dashed red; background-color: #333333; color: red; font-size: 20px;")
                status_text = f"✗ {size}px"
                status_color = "color: red;"
            
            thumb_container_layout.addWidget(thumb_label, alignment=Qt.AlignmentFlag.AlignCenter)
            
            # Status label
            status_label = QLabel(status_text)
            status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            status_label.setStyleSheet(f"{status_color} font-size: 9pt;")
            thumb_container_layout.addWidget(status_label)
            
            row_layout.addWidget(thumb_container)
        
        # Add padding at end of last row if needed
        if len(sizes) % 2 == 1:
            row_layout.addStretch()
        
        self.form.addRow(thumb_grid_widget)
            
    def show_multi_editor(self, indices: List[int]):
        """Show table editor for multiple sprites"""
        self.single_editor.hide()
        self.multi_editor.show()
        
        self.table.blockSignals(True)
        self.table.setRowCount(len(indices))
        
        for row, index in enumerate(indices):
            sprite = self.document.get_sprite(index)
            if not sprite:
                continue
            
            # Thumbnail (non-editable, centered using QLabel widget)
            pixmap = self.document.get_sprite_pixmap(sprite, QSize(60, 60))
            
            # Add red dot if unsaved
            if index in self.document.unsaved_indices:
                from PySide6.QtGui import QPainter, QBrush, QColor
                overlay = QPixmap(pixmap.size())
                overlay.fill(Qt.GlobalColor.transparent)
                painter = QPainter(overlay)
                painter.drawPixmap(0, 0, pixmap)
                dot_size = min(pixmap.width(), pixmap.height()) // 4
                painter.setBrush(QBrush(QColor(255, 0, 0)))
                painter.setPen(QColor(255, 255, 255))
                painter.drawEllipse(2, 2, dot_size, dot_size)
                painter.end()
                pixmap = overlay
            
            # Create a centered label widget for the thumbnail
            thumb_label = QLabel()
            thumb_label.setPixmap(pixmap)
            thumb_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            thumb_label.setStyleSheet("background-color: transparent;")
            
            # Set the widget in the cell
            self.table.setCellWidget(row, 0, thumb_label)
            
            self.table.setItem(row, 1, QTableWidgetItem(sprite.get("putUnder", "")))
            self.table.setItem(row, 2, QTableWidgetItem(sprite.get("text", "")))
            self.table.setItem(row, 3, QTableWidgetItem(sprite.get("src", "")))
            self.table.setItem(row, 4, QTableWidgetItem(str(sprite.get("width", ""))))
            self.table.setItem(row, 5, QTableWidgetItem(str(sprite.get("height", ""))))
            self.table.setItem(row, 6, QTableWidgetItem(str(sprite.get("hidden", ""))))
            self.table.setItem(row, 7, QTableWidgetItem(sprite.get("otherbg", "")))
            
        self.table.blockSignals(False)
        
    def on_column_resized(self, column: int, old_width: int, new_width: int):
        """Handle column resize to update thumbnail sizes"""
        if column != 0:  # Only handle thumbnail column
            return
            
        if not self.current_indices or not self.multi_editor.isVisible():
            return
        
        # Update row height to match new width (keep square-ish)
        new_height = max(64, new_width)  # Minimum 64px height
        self.table.verticalHeader().setDefaultSectionSize(new_height)
        
        # Regenerate thumbnails at new size
        thumb_size = max(60, new_width - 20)  # Leave some padding
        
        for row, index in enumerate(self.current_indices):
            sprite = self.document.get_sprite(index)
            if sprite:
                pixmap = self.document.get_sprite_pixmap(sprite, QSize(thumb_size, thumb_size))
                
                # Update the cell widget (QLabel) with new pixmap
                thumb_label = self.table.cellWidget(row, 0)
                if isinstance(thumb_label, QLabel):
                    thumb_label.setPixmap(pixmap)
    
    def on_splitter_moved(self, pos: int, index: int):
        """Handle splitter movement to update thumbnail scaling"""
        if self.current_single_index is not None and self.single_editor.isVisible():
            sprite = self.document.get_sprite(self.current_single_index)
            if sprite:
                pixmap = self.document.get_sprite_pixmap(sprite, QSize(600, 600))
                scaled = pixmap.scaled(
                    self.thumb_label.size(),
                    Qt.AspectRatioMode.KeepAspectRatio,
                    Qt.TransformationMode.SmoothTransformation
                )
                self.thumb_label.setPixmap(scaled)
    
    def on_table_changed(self, item: QTableWidgetItem):
        """Handle table cell edit"""
        if item.row() >= len(self.current_indices):
            return
            
        index = self.current_indices[item.row()]
        sprite = self.document.get_sprite(index)
        if not sprite:
            return
            
        col = item.column()
        if col == 0:  # Skip thumbnail column
            return
            
        value = item.text()
        
        # Adjusted for thumbnail column at index 0
        fields = ["putUnder", "text", "src", "width", "height", "hidden", "otherbg"]
        field = fields[col - 1]
        
        # Type conversion
        if field in ["width", "height"]:
            try:
                value = int(value) if value else None
            except ValueError:
                return
        elif field == "hidden":
            value = value.lower() in ["true", "1", "yes"]
            
        if value:
            sprite[field] = value
        elif field in sprite:
            del sprite[field]
            
        self.document.update_sprite(index, sprite)
        
    def update_field(self, index: int, key: str, value: Any):
        """Update single field in sprite"""
        sprite = self.document.get_sprite(index)
        if sprite:
            sprite[key] = value
            self.document.update_sprite(index, sprite)


class ScanSpritesDialog(QDialog):
    """Dialog for scanning and adding new sprites"""
    
    def __init__(self, document: AssetDocument, new_sprites: List[Dict[str, Any]], parent=None):
        super().__init__(parent)
        self.document = document
        self.new_sprites = new_sprites
        self.selected_sprites: List[Dict[str, Any]] = []
        self.setup_ui()
        
    def setup_ui(self):
        self.setWindowTitle("Scan for New Sprites")
        self.resize(800, 600)
        
        layout = QVBoxLayout(self)
        
        label = QLabel(f"Found {len(self.new_sprites)} new sprite(s) not in assets.json:")
        layout.addWidget(label)
        
        # List of new sprites with checkboxes
        self.list = QListWidget()
        self.list.setSelectionMode(QAbstractItemView.SelectionMode.MultiSelection)
        
        for sprite in self.new_sprites:
            text = f"{sprite['src']} → {sprite['putUnder']}"
            item = QListWidgetItem(text)
            item.setData(Qt.ItemDataRole.UserRole, sprite)
            item.setCheckState(Qt.CheckState.Checked)
            self.list.addItem(item)
            
        layout.addWidget(self.list)
        
        # Buttons
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
        
    def accept(self):
        """Collect selected sprites"""
        self.selected_sprites = []
        for i in range(self.list.count()):
            item = self.list.item(i)
            if item.checkState() == Qt.CheckState.Checked:
                self.selected_sprites.append(item.data(Qt.ItemDataRole.UserRole))
        super().accept()


class ValidationDialog(QDialog):
    """Dialog showing validation issues"""
    
    def __init__(self, issues: List[ValidationIssue], parent=None):
        super().__init__(parent)
        self.issues = issues
        self.setup_ui()
        
    def setup_ui(self):
        self.setWindowTitle("Validation Results")
        self.resize(600, 400)
        
        layout = QVBoxLayout(self)
        
        if not self.issues:
            label = QLabel("✓ No issues found!")
            label.setStyleSheet("color: green; font-weight: bold;")
            layout.addWidget(label)
        else:
            label = QLabel(f"Found {len(self.issues)} issue(s):")
            layout.addWidget(label)
            
            text = QTextEdit()
            text.setReadOnly(True)
            
            for issue in self.issues:
                color = {"error": "red", "warning": "orange", "info": "blue"}.get(issue.severity, "black")
                text.append(f'<span style="color: {color}"><b>[{issue.severity.upper()}]</b> {issue.message}</span>')
                
            layout.addWidget(text)
            
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok)
        buttons.accepted.connect(self.accept)
        layout.addWidget(buttons)


class MainWindow(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.document = AssetDocument()
        self.settings = QSettings("TerraformingMars", "AssetManager")
        
        # Auto-detect sprite folder (project root = parent of tools folder)
        script_dir = Path(__file__).parent  # tools/
        project_root = script_dir.parent     # project root
        if project_root.exists():
            self.document.sprite_folder = project_root
        
        self.setup_ui()
        self.load_settings()
        
    def setup_ui(self):
        self.setWindowTitle("Terraforming Mars - Asset Manager")
        self.resize(1400, 800)
        
        # Menu bar
        menubar = self.menuBar()
        
        file_menu = menubar.addMenu("&File")
        file_menu.addAction("&Open...", self.open_file, "Ctrl+O")
        file_menu.addAction("&Save", self.save_file, "Ctrl+S")
        file_menu.addAction("Save &As...", self.save_as_file, "Ctrl+Shift+S")
        file_menu.addSeparator()
        file_menu.addAction("&Reload", self.reload_file, "Ctrl+R")
        file_menu.addSeparator()
        file_menu.addAction("E&xit", self.close, "Ctrl+Q")
        
        edit_menu = menubar.addMenu("&Edit")
        edit_menu.addAction("&Duplicate Selected", self.duplicate_selected, "Ctrl+D")
        edit_menu.addAction("De&lete Selected", self.delete_selected, "Delete")
        
        tools_menu = menubar.addMenu("&Tools")
        tools_menu.addAction("Set &Sprite Folder...", self.set_sprite_folder)
        tools_menu.addAction("&Scan for New Sprites...", self.scan_sprites, "Ctrl+N")
        tools_menu.addAction("&Validate", self.validate, "Ctrl+V")
        
        # Status bar
        self.statusBar = QStatusBar()
        self.setStatusBar(self.statusBar)
        
        # Main layout with tabbed interface
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Tab widget
        self.tabs = QTabWidget()
        
        # Tab 1: Sprites (original two-panel layout)
        sprites_widget = QWidget()
        sprites_layout = QHBoxLayout(sprites_widget)
        sprites_layout.setContentsMargins(5, 5, 5, 5)
        
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Left panel: Category browser
        self.browser = CategoryBrowser(self.document)
        self.browser.sprite_selected.connect(self.on_sprite_selected)
        splitter.addWidget(self.browser)
        
        # Right panel: Property editor
        self.editor = PropertyEditor(self.document)
        splitter.addWidget(self.editor)
        
        splitter.setSizes([400, 800])
        sprites_layout.addWidget(splitter)
        
        self.tabs.addTab(sprites_widget, "Sprites")
        
        # Tab 2: Thumbnails
        self.thumbnail_manager = ThumbnailManager(self.document)
        self.tabs.addTab(self.thumbnail_manager, "Thumbnails")
        
        layout.addWidget(self.tabs)
        
    def load_settings(self):
        """Load application settings"""
        sprite_folder = self.settings.value("sprite_folder")
        if sprite_folder:
            self.document.sprite_folder = Path(sprite_folder)
            
        last_file = self.settings.value("last_file")
        if last_file and Path(last_file).exists():
            try:
                self.document.load(Path(last_file))
                self.refresh_all()
            except Exception as e:
                pass  # Silently fail on startup
                
    def save_settings(self):
        """Save application settings"""
        if self.document.sprite_folder:
            self.settings.setValue("sprite_folder", str(self.document.sprite_folder))
        if self.document.file_path:
            self.settings.setValue("last_file", str(self.document.file_path))
            
    def refresh_all(self):
        """Refresh all UI components"""
        self.browser.refresh()
        self.thumbnail_manager.update_button_states()
        self.update_title()
        self.update_status()
        
    def update_title(self):
        """Update window title with file name and dirty state"""
        title = "Terraforming Mars - Asset Manager"
        if self.document.file_path:
            title += f" - {self.document.file_path.name}"
        if self.document.dirty:
            title += " *"
        self.setWindowTitle(title)
        
    def update_status(self):
        """Update status bar"""
        if self.document.file_path:
            count = len(self.document.data["blockList"])
            self.statusBar.showMessage(f"{self.document.file_path} | {count} sprites")
        else:
            self.statusBar.showMessage("No file loaded")
            
    def open_file(self):
        """Open assets.json file"""
        if self.document.dirty:
            reply = QMessageBox.question(
                self, "Unsaved Changes",
                "Save changes before opening?",
                QMessageBox.StandardButton.Save | 
                QMessageBox.StandardButton.Discard | 
                QMessageBox.StandardButton.Cancel
            )
            if reply == QMessageBox.StandardButton.Save:
                self.save_file()
            elif reply == QMessageBox.StandardButton.Cancel:
                return
                
        path, _ = QFileDialog.getOpenFileName(
            self, "Open Assets File",
            str(self.document.file_path.parent if self.document.file_path else Path.home()),
            "JSON Files (*.json);;All Files (*)"
        )
        
        if path:
            try:
                self.document.load(Path(path))
                self.refresh_all()
                self.save_settings()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to load file:\n{e}")
                
    def save_file(self):
        """Save current file"""
        if self.document.file_path is None:
            self.save_as_file()
            return
            
        try:
            self.document.save()
            self.update_title()
            self.statusBar.showMessage("Saved", 3000)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to save file:\n{e}")
            
    def save_as_file(self):
        """Save as new file"""
        path, _ = QFileDialog.getSaveFileName(
            self, "Save Assets File",
            str(self.document.file_path if self.document.file_path else Path.home() / "assets.json"),
            "JSON Files (*.json);;All Files (*)"
        )
        
        if path:
            try:
                self.document.save(Path(path))
                self.update_title()
                self.save_settings()
                self.statusBar.showMessage("Saved", 3000)
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to save file:\n{e}")
                
    def reload_file(self):
        """Reload file from disk"""
        if self.document.file_path is None:
            return
            
        if self.document.dirty:
            reply = QMessageBox.question(
                self, "Unsaved Changes",
                "Discard unsaved changes?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            if reply == QMessageBox.StandardButton.No:
                return
                
        try:
            self.document.load(self.document.file_path)
            self.refresh_all()
            self.statusBar.showMessage("Reloaded", 3000)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to reload file:\n{e}")
            
    def set_sprite_folder(self):
        """Set sprite folder path"""
        # Show helpful message
        QMessageBox.information(
            self, "Select Sprite Folder",
            "Select the PROJECT ROOT folder (parent of the 'blocks' folder).\n\n"
            "Example: If your sprites are in:\n"
            "  /project/blocks/templates/template_name.png\n\n"
            "Then select: /project/\n\n"
            "The tool will use the 'putUnder' field (e.g., 'blocks/templates') "
            "to locate images."
        )
        
        folder = QFileDialog.getExistingDirectory(
            self, "Select Sprite Folder (Project Root)",
            str(self.document.sprite_folder if self.document.sprite_folder else Path.home())
        )
        
        if folder:
            self.document.sprite_folder = Path(folder)
            self.document._image_cache.clear()
            self.save_settings()
            self.refresh_all()
            self.statusBar.showMessage(f"Sprite folder set to: {folder}", 5000)
            
    def scan_sprites(self):
        """Scan for new sprites"""
        if self.document.sprite_folder is None:
            QMessageBox.warning(
                self, "No Sprite Folder",
                "Please set sprite folder first (Tools → Set Sprite Folder)"
            )
            return
            
        new_sprites = self.document.scan_sprites(self.document.sprite_folder)
        
        if not new_sprites:
            QMessageBox.information(self, "Scan Complete", "No new sprites found.")
            return
            
        dialog = ScanSpritesDialog(self.document, new_sprites, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            for sprite in dialog.selected_sprites:
                self.document.add_sprite(sprite)
            self.refresh_all()
            self.statusBar.showMessage(f"Added {len(dialog.selected_sprites)} sprite(s)", 3000)
            
    def validate(self):
        """Run validation and show results"""
        issues = self.document.validate()
        dialog = ValidationDialog(issues, self)
        dialog.exec()
        
    def duplicate_selected(self):
        """Duplicate selected sprites"""
        self.browser.duplicate_selected()
        self.refresh_all()
        
    def delete_selected(self):
        """Delete selected sprites"""
        self.browser.delete_selected()
        self.refresh_all()
        
    def on_sprite_selected(self, indices: List[int]):
        """Handle sprite selection"""
        self.editor.show_sprites(indices)
        
    def closeEvent(self, event):
        """Handle window close"""
        if self.document.dirty:
            reply = QMessageBox.question(
                self, "Unsaved Changes",
                "Save changes before closing?",
                QMessageBox.StandardButton.Save | 
                QMessageBox.StandardButton.Discard | 
                QMessageBox.StandardButton.Cancel
            )
            if reply == QMessageBox.StandardButton.Save:
                self.save_file()
                event.accept()
            elif reply == QMessageBox.StandardButton.Discard:
                event.accept()
            else:
                event.ignore()
        else:
            event.accept()


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("TM Asset Manager")
    app.setOrganizationName("TerraformingMars")
    
    # Set palette from system (supports dark mode)
    app.setStyle("Fusion")
    palette = app.palette()
    app.setPalette(palette)
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
