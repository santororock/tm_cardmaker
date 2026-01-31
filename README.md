# tm_cardmaker

Web App for people to make fan cards for the game Terraforming Mars.

This is currently 100% client-side. It works best on a desktop/laptop but probably works on tablets and even (painfully) on phones.
You can access the original at https://sliceofbread.neocities.org/tm/tm_cardmaker.html

This is a fork of https://github.com/SliceOfBread/tm_cardmaker with significant enhancements and new features.

## Creator's Statement

(The below is from https://boardgamegeek.com/thread/2433226/article/34902171#34902171)

From Jacob Fryxelius:
"Hi fellow terraformers!

FryxGames is very pleased with the creativity and imagination sparked by TM. It has been one of the design goals to inspire people, and this is proof of our success in that regard, so we couldn't be more happy.

Just to avoid any conflicts of interest, please mark all cards 'fan made' so there is a clear distinction between official and non-official content. And if you publish the cards, you'll probably want to avoid using copyrighted artwork. We also want to remind you that fan-made content may not be used commercially.

Other than that, feel free to continue the creative journey of expanding your Terraforming Mars world!

Cheers!"

## Setup & Running

### Web Browser Access

Serve the folder over HTTP to avoid CORS and tainted canvas issues when exporting:

```bash
# Python 3
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Then open `http://localhost:8000/tm_cardmaker.html` in your browser.

**Important**: Do not use the `file://` protocol directly as it will cause CORS errors when loading external images.

## How to Use

TM_Cardmaker provides **templates**, **presets** and graphic assets called **blocks** to help build attractive card that match the look and feel of the original game.

To begin, click on **File** > **New from Template**, and select an appropriate starting template for the card that you wish to design. The available templates include:

- Corporation
- Prelude card
- Green project card (three layouts)
- Blue project card (three layouts)
- Red event card (two layouts)

For this example, we'll choose 'Green Card'. This will create layers with the elements of the most common type of project card. On the right (possibly bottom if you have a small screen) you will see the list of layers. Let's set the cost of the card by first selecting that layer. To start, it is labelled  'Text:Cost'. Click that.

Clicking on a layer opens up the layer information pane, which contains all of the information needed to render the layer (postion, font color, etc). Change the text, which is in the box jest below 'height'. It currently says 'Cost'. Change it to a number. To see the change, you need to 'tab' or click outside this box.

If you felt like the number wasn't in the right spot, you can click on it on the rendered card, and drag it to the right spot. You can make fine adjustments by using the keyboard shortcuts:

- The arrow keys will move the object one pixel
- Shift + arrow keys move 1/12" at a time
- Alt + up and down arrows will make the text size larger or smaller
- Alt + left and right arrows will change the width of the text bounding box, which controls where word-wrapping happens.

If you know exactly where you want the object to go, you can also type in its X and Y coordinates in the layer information pane. The 'height' controls the size of the text, and the 'width' is the aforementioned word-wrapping boundary. There is also a 'V space' setting that controls the line-to--line spacing. There's also a 'Justify' selection if you want your text to be centered, aligned on the left or right. Click on the layer name to apply your changes and re-render the object. Note that you can change the layer names to anything that you prefer.

Other than text, there are a few other things already in your card.

- 'Base' is just the size of your card, in pixels, and the background color.
- 'Green Card' is almost everything else you see (sans text). Generally you won't adjust this layer.
- 'No Requirement' is that little graphic near the card cost. In this case the card has no requirements.

To demonstrate how to place new blocks and use presets, we'll change the card to a card with a requirement.

- Delete the 'No Requirement' layer by clicking the 'X' next to its name.
- On the left menu, click 'Add Block' then 'Requirements' then 'Min Requirement (small)'. Wow that is NOT small!
- On the right, the layer has been added 'Min Requirement (sma'. Click it. Under 'Presets' choose the obvious 'Min Small'. Things should look much more normal. There are presets for almost anything you add. Some are more useful than others
- Let's require an Ocean tile. On the left click 'Tiles' then 'Ocean'. On the right, click the new layer 'Ocean'. There is one preset, 'Standard'. Hmm, that is not very useful.
- Change 'X' to 214 and 'y' to 87. Change 'width' to 67 (and watch height will change automatically). Mostly you will leave the 'Lock aspect ratio' box checked but if you want to change height and width independently, just uncheck it.

Blocks can also be moved around with the mouse and arrow keys, just like text layers. Resizing blocks is a little different, though.

- Alt + left and right arrow keys resize the selected object, maintaining anchor at upper-left
- Alt + up and down arrow keys resize the selected object, maintaining anchor at the center of the object

A couple other things to highlight:

- If you want to use an image from the Web (with permission of course), that's under 'Add Block' -> 'User Images' -> 'Load Web Image'.
- If you want to use an image from your computer, it's the same as above but 'Load Local Image'
- You might want the above (or some other) layer to look like it's in the background. Drag the layer name to where you want it. The layers are draw, in order, from the top of the list to the bottom. 'Base' is always the first layer.
- If you want to use a font from the web (and this has only been checked with Google fonts https://fonts.google.com/) it hopefully has something like the google fonts and you can add that using 'Add Block' -> 'Add Web Font'. Here's and example from Google of what to look for to paste in the box that pops up:
<link href="https://fonts.googleapis.com/css2?family=Turret+Road:wght@400;700;800&display=swap" rel="stylesheet"> OR just the URL https://fonts.googleapis.com/css2?family=Turret+Road:wght@400;700;800&display=swap
- You can save your project using the 'File' -> 'Save as Project'. This saves your project as an image. This is especially important if you used any local (non-web) image files. This image can also be shared with others who might want to translate or modify your card.
- You can later load one of these project images using 'File' -> 'Clear & Load Project'
## New Features (Since Fork from SliceOfBread)

### Undo/Redo System

The webapp now includes a comprehensive undo/redo system to help you recover from mistakes:

- **Undo** (`Ctrl+Z` or `Cmd+Z`): Revert to the previous state
- **Redo** (`Ctrl+Shift+Z` or `Cmd+Shift+Z`): Re-apply an undone action
- **Undo History**: Configured to maintain up to 50 undo steps (configurable in settings)
- **Automatic Snapshots**: The undo system automatically captures state changes when you:
  - Add or delete layers
  - Modify layer properties
  - Move or resize objects
  - Change text content

The undo stack is cleared when you start a new project or load a saved project to maintain a clean working state.

### Auto-Save

Your work is automatically saved to your browser's local storage:

- **Automatic Saving**: Every change to your project is automatically saved to `localStorage`
- **Crash Recovery**: If your browser crashes or you accidentally close the tab, your work can be recovered
- **Load Auto-Save**: When opening the webapp, it will prompt you to restore a previously saved project
- **Manual Save**: You can still manually save projects as images using 'File' -> 'Save as Project'

### Project Embedding

Projects can now be embedded directly into the exported PNG images:

- **Save Project Data**: When you export a card as PNG using 'File' -> 'Save as Project', the full project state is embedded in the image
- **Roundtrip Loading**: You can load these saved project images back into the editor using 'File' -> 'Clear & Load Project'
- **Data Integrity**: The project data uses the signature `tm_cmV01` to identify embedded projects
- **Lossless Workflow**: All layer information, local images, and properties are preserved

### Asset Management from JSON

The webapp now loads block definitions from an external `assets.json` file:

- **Centralized Asset Configuration**: All block definitions are in `assets.json` instead of hardcoded in JavaScript
- **Easier Maintenance**: Add, remove, or modify blocks without editing JavaScript code
- **Standardized Format**: Each block has properties like `putUnder` (folder), `src` (image name), dimensions, and presets
- **Flexible Asset Loading**: Assets are loaded asynchronously at startup

### Enhanced Layer Types

The system supports multiple layer types for maximum flexibility:

- **base**: Card background and dimensions
- **block**: Image assets (the most common type)
- **text**: Text boxes with full formatting control (font, size, color, alignment)
- **production**: Production/resource box layers
- **effect**: Special effect visualization layers
- **line**: Draw decorative lines
- **embedded**: Embedded images (e.g., SVG or raster images encoded in project data)
- **webFile**: Images loaded from URLs
- **userFile**: Local images uploaded by the user

### External Asset Manager Tool

A companion desktop application for managing sprite definitions (see **Asset Manager** section below).

## Asset Manager Tool

The `asset_manager.py` tool is a standalone desktop application for managing the sprites and blocks used by the webapp. It provides a visual interface for organizing, editing, and validating your sprite definitions.

### Installation

Requirements:
- Python 3.7+
- PySide6 or PyQt6

```bash
pip install PySide6
# OR
pip install PyQt6
```

### Running the Tool

```bash
python tools/asset_manager.py
```

### Main Features

#### Asset Management

- **Load/Save Projects**: Open `assets.json` files and save changes back to disk
- **Browse Sprites**: View all sprites organized by category (the `putUnder` field)
- **Add Sprites**: Create new sprite entries for your card templates
- **Edit Sprites**: Modify all sprite properties (src, dimensions, text labels, etc.)
- **Delete Sprites**: Remove sprites from the list
- **Duplicate Sprites**: Copy an existing sprite as a starting point for a new one
- **Reorder Sprites**: Drag and drop to reorganize sprites within the list

#### Sprite Properties

When editing a sprite, you can configure:

- **src** (required): The base filename of the image (without .png extension)
- **putUnder** (required): The folder path relative to the project (e.g., `blocks/templates`)
- **text** (optional): A human-readable label for the sprite
- **width/height**: Dimensions of the image (automatically detected if possible)
- **hidden**: Boolean flag to hide the sprite from the UI
- **otherbg**: Reference to another sprite to use as background
- **Presets**: Collections of pre-configured property sets for different use cases

#### Image Browsing

- **Thumbnail Preview**: All sprites display a preview thumbnail (64x64 by default)
- **Image Caching**: Thumbnails are cached for performance
- **Folder Detection**: Set the sprite folder to automatically find and load images
- **Relative Path Resolution**: Images are located using `putUnder/src.png` paths

#### Validation & Diagnostics

The tool includes comprehensive validation to help maintain asset integrity:

- **Missing Fields**: Detects required fields like `src` and `putUnder`
- **Duplicate Detection**: Warns about duplicate sprite IDs
- **Missing Images**: Identifies sprites that reference non-existent image files
- **Missing Metadata**: Warns about sprites missing optional but recommended fields
- **Cross-References**: Validates that referenced sprites exist
- **Validation Report**: View all issues in a structured list with severity levels (error, warning, info)

#### Sprite Discovery

- **Scan Folder**: Automatically discover PNG files not yet in your sprite list
- **Auto-Suggest**: The tool can infer sprite properties from file names and folder structure
- **Batch Import**: Add multiple discovered sprites at once

#### Unsaved Changes Tracking

- **Visual Indicators**: Newly added sprites are marked differently from saved ones
- **Save Status**: The interface clearly shows which sprites have unsaved changes
- **Change History**: The app remembers which sprites are new vs. modified

#### Advanced Features

- **Drag-Drop Reordering**: Reorganize sprites by dragging on the handle indicator
- **Multi-Select**: Select multiple sprites for batch operations
- **Search/Filter**: Find sprites by name or category
- **Settings Persistence**: Your preferences are saved between sessions
- **Hover Effects**: Visual feedback when hovering over sprites

### Workflow Example

Here's a typical workflow for adding new sprites:

1. **Launch** the tool: `python tools/asset_manager.py`
2. **Open** your project: File > Open > select `assets.json`
3. **Set** sprite folder: Point to your workspace root (parent of `blocks/` folder)
4. **Scan** for new images: Tools > Scan for Unmapped Images
5. **Review** discovered sprites and adjust properties as needed
6. **Validate** the project: Tools > Validate Assets
7. **Save** your changes: File > Save

### File Format

The `assets.json` file has this structure:

```json
{
  "blockList": [
    {
      "putUnder": "blocks/templates",
      "src": "templates__green_normal",
      "text": "Green Card Normal",
      "width": 826,
      "height": 1126
    },
    {
      "putUnder": "blocks/templates",
      "src": "templates__blue_normal",
      "text": "Blue Card Normal",
      "width": 826,
      "height": 1126
    }
  ],
  "blockDefaults": {
    "green_normal": {
      "x": 0,
      "y": 0,
      "width": 826,
      "height": 1126
    }
  }
}
```

All paths in `putUnder` are normalized to use forward slashes for web compatibility when saved.

### Troubleshooting

**PySide6 not found**
```bash
pip install PySide6
```

**Images not showing up**
- Verify the sprite folder is set correctly (should be parent of `blocks/` directory)
- Ensure images are in the correct subdirectories matching the `putUnder` paths
- Check that image files have `.png` extension

**Changes not saved**
- Make sure to use File > Save after making changes
- The tool will warn if you try to close with unsaved changes

**Validation warnings**
- Run Tools > Validate Assets to see detailed issues
- Missing image warnings indicate `src` references that don't have corresponding PNG files
- Fix paths or add the missing images

## Credits & Attribution

### Reference Materials

The Symbol and Play Reference documents included in this project were created by **Magesmiley**:

- **Terraforming Mars + Expansions Symbol and Play Reference**
- Author: [Magesmiley](https://boardgamegeek.com/profile/Magesmiley)
- Available in: `reference/` folder (PDF and PNG formats)

These comprehensive reference materials are invaluable for understanding the game's iconography and mechanics when creating fan-made cards.

### Original Project

This project is a fork of [SliceOfBread's tm_cardmaker](https://github.com/SliceOfBread/tm_cardmaker) with significant enhancements.