#!/usr/bin/env python3
"""
Populate image dimensions in assets.json

This script automates the process of adding width and height properties to
every block entry in assets.json by reading the actual PNG files.

Purpose:
    The card maker needs image dimensions to calculate aspect-ratio-preserving
    scales for the debug sprite sheet. Rather than manually measuring and typing
    115+ dimensions, this script does it automatically.

How it works:
    1. Reads assets.json to get the list of all image assets
    2. For each asset, constructs the file path to the PNG
    3. Uses PIL (Python Imaging Library) to read the image dimensions
    4. Updates the JSON entry with "width" and "height" properties
    5. Saves the updated JSON back to disk

Key concepts demonstrated:
    - File I/O in Python (reading and writing JSON)
    - Image processing with PIL/Pillow
    - Path manipulation and file existence checking
    - Error handling and user feedback
    - Data transformation and serialization

Usage:
    python populate_dimensions.py

Output:
    Updates assets.json in place, adding width/height to all blocks
"""

import json
import os
from pathlib import Path
from PIL import Image  # Pillow library for reading image files

def populate_dimensions(json_path='assets.json'):
    """
    Read assets.json, scan PNG files to get dimensions, and update each block.
    
    This is the main function that orchestrates the dimension population process.
    It handles file reading, image scanning, error handling, and saving results.
    
    Args:
        json_path: Path to the assets.json file (default: 'assets.json')
    
    Process:
        1. Load JSON data from file
        2. Iterate through each block in blockList
        3. Construct image file path (handling two naming conventions)
        4. Read image dimensions with PIL
        5. Update block with width/height properties
        6. Save updated JSON with pretty formatting
    """
    # Read the JSON file containing all asset definitions
    print(f"Reading {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)  # Parse JSON into Python dictionary
    
    # Extract the blockList array (main list of image assets)
    block_list = data.get('blockList', [])
    print(f"Found {len(block_list)} blocks to process")
    
    # Track statistics for final report
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    # Process each block entry
    for i, block in enumerate(block_list):
        # Get key properties from block definition
        put_under = block.get('putUnder', '')  # Folder/category name
        src = block.get('src', '')              # Base filename (no extension)
        text = block.get('text', src)           # Display name (fallback to src)
        
        # Skip blocks with no source identifier
        if not src:
            print(f"  [{i+1}] Skipping '{text}': no src field")
            skipped_count += 1
            continue
        
        # Skip the debug_sprite_sheet (it's not a real PNG file, it's generated)
        if src == 'debug_sprite_sheet':
            print(f"  [{i+1}] Skipping '{text}': virtual template")
            skipped_count += 1
            continue
        
        """
        Construct the image file path
        
        Challenge: The actual PNG files use two different naming conventions:
        1. Prefixed: "category__filename.png" (e.g., "resources__titanium.png")
        2. Unprefixed: "filename.png" stored in category folder
        
        Strategy: Try both patterns and use whichever file exists
        """
        image_path = None
        
        # Try prefixed format first (putUnder__src.png)
        if '__' not in src:
            prefixed_name = f"{put_under}__{src}.png"
        else:
            prefixed_name = f"{src}.png"
        
        # Construct full paths using pathlib (cross-platform path handling)
        prefixed_path = Path(put_under) / prefixed_name
        unprefixed_path = Path(put_under) / f"{src.split('__')[-1]}.png"
        
        # Check which file actually exists on disk
        if prefixed_path.exists():
            image_path = prefixed_path
        elif unprefixed_path.exists():
            image_path = unprefixed_path
        
        # If neither path exists, log error and continue
        if not image_path:
            print(f"  [{i+1}] ERROR: '{text}' - Image not found:")
            print(f"         Tried: {prefixed_path}")
            print(f"         Tried: {unprefixed_path}")
            error_count += 1
            continue
        
        """
        Read image dimensions using PIL (Python Imaging Library / Pillow)
        
        PIL can open many image formats and provides a .size property
        that returns (width, height) as a tuple.
        
        Why use 'with' statement?
        - Ensures the image file is properly closed after reading
        - Prevents resource leaks (important when processing many files)
        - Automatically handles cleanup even if an error occurs
        """
        try:
            with Image.open(image_path) as img:
                width, height = img.size  # Returns tuple: (width_px, height_px)
                
            # Update the block dictionary with dimension properties
            block['width'] = width
            block['height'] = height
            
            # Log success with human-readable output
            print(f"  [{i+1}] '{text}': {width}x{height} ({image_path})")
            updated_count += 1
            
        except Exception as e:
            # Catch any errors during image reading (corrupt file, wrong format, etc.)
            print(f"  [{i+1}] ERROR: '{text}' - Failed to read image: {e}")
            error_count += 1
    
    """
    Save the updated JSON back to disk
    
    Key parameters:
    - indent=2: Pretty-print with 2-space indentation (makes it human-readable)
    - ensure_ascii=False: Allow Unicode characters (important for international text)
    - encoding='utf-8': Use UTF-8 encoding (modern standard for text files)
    
    Why preserve formatting?
    - Makes the JSON file easy to read and edit manually if needed
    - Git diffs will be cleaner and show what changed
    - Maintains professional code quality
    """
    print(f"\nWriting updated data to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Print summary statistics
    print("\n" + "="*60)
    print("Summary:")
    print(f"  Total blocks:   {len(block_list)}")
    print(f"  Updated:        {updated_count}")
    print(f"  Skipped:        {skipped_count}")
    print(f"  Errors:         {error_count}")
    print("="*60)
    
    # Return success/failure status
    if error_count > 0:
        print("\n⚠️  Some images could not be processed. Check errors above.")
        return False
    else:
        print("\n✅ All images processed successfully!")
        return True

# Standard Python idiom: only run main code if script is executed directly
# (not if it's imported as a module)
if __name__ == '__main__':
    try:
        success = populate_dimensions()
        # Exit with code 0 (success) or 1 (failure) for shell script integration
        exit(0 if success else 1)
    except FileNotFoundError:
        print("ERROR: assets.json not found in current directory")
        exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in assets.json: {e}")
        exit(1)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
