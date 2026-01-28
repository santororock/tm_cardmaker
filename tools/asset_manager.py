#!/usr/bin/env python3
"""
Terraforming Mars Card Maker - Asset Manager
A standalone Qt desktop tool for managing sprite definitions in assets.json

Requirements:
    pip install PySide6
    # OR: pip install PyQt6 (change imports below)

Usage:
    python tools/asset_manager.py
"""

import sys
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field

try:
    from PySide6.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QSplitter, QTreeWidget, QTreeWidgetItem, QLabel, QLineEdit,
        QPushButton, QFileDialog, QMessageBox, QTableWidget, QTableWidgetItem,
        QFormLayout, QSpinBox, QCheckBox, QComboBox, QDialog, QDialogButtonBox,
        QTextEdit, QListWidget, QListWidgetItem, QMenu, QToolBar, QStatusBar,
        QGroupBox, QScrollArea, QHeaderView, QAbstractItemView, QSizePolicy
    )
    from PySide6.QtCore import (
        Qt, Signal, QSize, QSettings, QTimer, QModelIndex, QPoint
    )
    from PySide6.QtGui import (
        QPixmap, QAction, QIcon, QImage, QPalette, QFont, QUndoStack, QUndoCommand
    )
except ImportError:
    print("PySide6 not found. Please install: pip install PySide6")
    sys.exit(1)


@dataclass
class ValidationIssue:
    """Represents a validation issue found in the asset data"""
    severity: str  # 'error', 'warning', 'info'
    message: str
    sprite_index: Optional[int] = None
    category: Optional[str] = None
    src: Optional[str] = None


class AssetDocument:
    """Core document managing the assets.json data"""
    
    def __init__(self):
        self.file_path: Optional[Path] = None
        self.data: Dict[str, Any] = {"blockList": [], "blockDefaults": {}}
        self.dirty: bool = False
        self.sprite_folder: Optional[Path] = None
        self._image_cache: Dict[str, QPixmap] = {}
        self.unsaved_indices: set = set()  # Track indices of unsaved (new) sprites
        
    def load(self, path: Path) -> None:
        """Load assets.json from file"""
        with open(path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        
        # Ensure required keys exist
        if "blockList" not in self.data:
            self.data["blockList"] = []
        if "blockDefaults" not in self.data:
            self.data["blockDefaults"] = {}
            
        self.file_path = path
        self.dirty = False
        self._image_cache.clear()
        self.unsaved_indices.clear()  # All sprites are saved when loaded
        
    def save(self, path: Optional[Path] = None) -> None:
        """Save assets.json to file"""
        if path is None:
            path = self.file_path
        if path is None:
            raise ValueError("No file path specified")
        
        # Normalize all putUnder paths to use forward slashes (required for web app)
        for sprite in self.data["blockList"]:
            if "putUnder" in sprite:
                sprite["putUnder"] = sprite["putUnder"].replace("\\", "/")
            
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
        
        self.file_path = path
        self.dirty = False
        self.unsaved_indices.clear()  # All sprites are saved now
        
    def set_dirty(self, dirty: bool = True):
        """Mark document as modified"""
        self.dirty = dirty
        
    def get_sprite(self, index: int) -> Optional[Dict[str, Any]]:
        """Get sprite entry by index"""
        if 0 <= index < len(self.data["blockList"]):
            return self.data["blockList"][index]
        return None
        
    def update_sprite(self, index: int, sprite: Dict[str, Any]):
        """Update sprite entry"""
        if 0 <= index < len(self.data["blockList"]):
            self.data["blockList"][index] = sprite
            self.set_dirty()
            
    def delete_sprite(self, index: int):
        """Delete sprite entry"""
        if 0 <= index < len(self.data["blockList"]):
            del self.data["blockList"][index]
            # Remove from unsaved and shift indices
            self.unsaved_indices.discard(index)
            self.unsaved_indices = {i - 1 if i > index else i for i in self.unsaved_indices}
            self.set_dirty()
            
    def add_sprite(self, sprite: Dict[str, Any], index: Optional[int] = None):
        """Add new sprite entry"""
        if index is None:
            new_index = len(self.data["blockList"])
            self.data["blockList"].append(sprite)
        else:
            new_index = index
            self.data["blockList"].insert(index, sprite)
            # Shift existing unsaved indices
            self.unsaved_indices = {i + 1 if i >= index else i for i in self.unsaved_indices}
        
        self.unsaved_indices.add(new_index)
        self.set_dirty()
        
    def duplicate_sprite(self, index: int) -> int:
        """Duplicate sprite at index, returns new index"""
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
        
        # Category tree
        self.tree = QTreeWidget()
        self.tree.setHeaderLabel("Categories & Sprites")
        self.tree.setSelectionMode(QAbstractItemView.SelectionMode.ExtendedSelection)
        self.tree.itemSelectionChanged.connect(self.on_selection_changed)
        self.tree.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.tree.customContextMenuRequested.connect(self.show_context_menu)
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
        self.resize(1200, 800)
        
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
        
        # Main layout
        central = QWidget()
        self.setCentralWidget(central)
        layout = QHBoxLayout(central)
        
        # Two-panel splitter
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Left panel: Category browser
        self.browser = CategoryBrowser(self.document)
        self.browser.sprite_selected.connect(self.on_sprite_selected)
        splitter.addWidget(self.browser)
        
        # Right panel: Property editor
        self.editor = PropertyEditor(self.document)
        splitter.addWidget(self.editor)
        
        splitter.setSizes([400, 800])
        layout.addWidget(splitter)
        
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
