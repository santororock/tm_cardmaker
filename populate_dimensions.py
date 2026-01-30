#!/usr/bin/env python3
"""
================================================================================
POPULATE IMAGE DIMENSIONS - populate_dimensions.py
================================================================================

Purpose:
    This utility script automates adding width/height properties to every block
    entry in assets.json by reading the actual PNG image files.
    
    Problem it solves:
      - The card maker needs image dimensions for aspect-ratio-preserving scaling
      - Manually measuring and typing 115+ dimensions is tedious and error-prone
      - This tool is a "force multiplier" for asset management
      - Eliminates manual data entry and keeps dimensions in sync with actual images
    
How It Works (Pipeline):
    1. Load JSON
       - Read assets.json file
       - Parse into Python dictionary structure
    
    2. Iterate Assets
       - Loop through each block in blockList
       - Construct file path to the PNG image
       
    3. Read Images
       - Use PIL (Python Imaging Library) to open PNG
       - Extract width/height without loading entire image into memory
       
    4. Update JSON
       - Add "width" and "height" properties to block
       - Overwrite existing values if present
       
    5. Save Results
       - Write updated JSON back to disk
       - Pretty-print formatting for readability
       - Report statistics (updated, skipped, errors)
    
Key Programming Concepts Demonstrated:
    
    1. File I/O
       - Reading: open(), json.load(), Path operations
       - Writing: json.dump() with formatting
       - Error handling: try/except for file operations
       - Encoding: UTF-8 for international character support
       
    2. Data Structures
       - Dictionary: JSON maps to Python dict
       - List comprehension: Could be used here for filtering
       - Nested access: block.get('putUnder', '') with defaults
       
    3. Image Processing
       - PIL/Pillow library: Industry-standard image library
       - Lazy loading: Reading dimensions without loading pixel data
       - Path resolution: Multiple naming conventions handled
       
    4. Path Manipulation
       - pathlib.Path: Modern Python path handling (cross-platform)
       - String manipulation: .stem, .with_suffix() for filename operations
       
    5. Error Handling Strategy
       - Graceful degradation: Skip problematic files
       - User feedback: Detailed logging for debugging
       - Statistics: Report summary of what happened
       
    6. Defensive Programming
       - Default values: .get() with fallback values
       - Existence checks: path.exists() before accessing
       - Type validation: Check for valid src before processing
       
    7. Script Entry Point
       - if __name__ == '__main__': Allows import without execution
       - Sys exit codes: Proper exit status reporting
       
Additional Learning Resources:
    - PIL/Pillow docs: https://python-pillow.org/
    - pathlib module: https://docs.python.org/3/library/pathlib.html
    - JSON in Python: https://docs.python.org/3/library/json.html
    - File I/O best practices: Real Python has excellent tutorials
    - Exception handling: PEP 8 style guide recommendations

Usage Examples:
    python populate_dimensions.py
    python populate_dimensions.py --json /path/to/assets.json
    
Exit Codes:
    0 = Success
    1 = File not found
    2 = Invalid JSON format
    3 = PIL not installed

Dependencies:
    - Python 3.6+
    - Pillow (PIL): pip install Pillow
"""

import json
import os
from pathlib import Path  # Modern path handling (better than os.path)
from PIL import Image    # Pillow library: pip install Pillow

# ============================================================================
# MAIN FUNCTION: Orchestrates the dimension population process
# ============================================================================

def populate_dimensions(json_path='assets.json'):
    """
    Read assets.json, scan PNG files to get dimensions, and update each block.
    
    Function Signature:
        populate_dimensions(json_path='assets.json') -> dict
    
    Parameters:
        json_path (str): Path to the assets.json file (default: 'assets.json')
    
    Returns:
        dict: Statistics dictionary with keys:
            - 'updated': Number of blocks with dimensions added/updated
            - 'skipped': Number of blocks skipped (missing src, virtual, etc.)
            - 'errors': Number of blocks that failed to process
            - 'total': Total blocks processed
    
    Raises:
        FileNotFoundError: If assets.json doesn't exist
        json.JSONDecodeError: If assets.json is invalid JSON
        
    Example:
        stats = populate_dimensions('assets.json')
        print(f"Updated {stats['updated']} blocks")
        
    Process Flow (Pipeline Pattern):
        Load JSON
           ↓
        Iterate Blocks
           ↓
        Construct Path
           ↓
        Read Image
           ↓
        Update JSON
           ↓
        Save File
           ↓
        Report Stats
    
    Error Handling Strategy:
        - Try to process each image; skip on error (not fail fast)
        - Continue processing remaining items after errors
        - Report summary at end for investigation
        - This approach is important for batch processes where you want
          to maximize successful processing despite some failures
    """
    # Read the JSON file containing all asset definitions
    print(f"Reading {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)  # Parse JSON into Python dictionary
    
    # Extract the blockList array (main list of image assets)
    # Using .get() with default empty list prevents KeyError if key missing
    block_list = data.get('blockList', [])
    print(f"Found {len(block_list)} blocks to process")
    
    # Track statistics for final report
    # These counters help verify the script worked as expected
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    # ========================================================================
    # MAIN PROCESSING LOOP
    # ========================================================================
    
    # Process each block entry
    for i, block in enumerate(block_list):
        """
        Inner Loop: Process single block
        
        Data Structure Pattern:
            Each block is a dictionary like:
            {
              "putUnder": "blocks/templates",
              "src": "templates__green_normal",
              "text": "Green Card Template",
              "width": 826,          # We're adding this
              "height": 1126         # We're adding this
            }
        """
        # Get key properties from block definition
        put_under = block.get('putUnder', '')  # Folder/category name
        src = block.get('src', '')              # Base filename (no extension)
        text = block.get('text', src)           # Display name (fallback to src)
        
        # Skip blocks with no source identifier
        # This prevents attempting to find images for placeholder entries
        if not src:
            print(f"  [{i+1}] Skipping '{text}': no src field")
            skipped_count += 1
            continue
        
        # Skip the debug_sprite_sheet (it's not a real PNG file, it's generated)
        # debug_sprite_sheet is a special entry used to reference dynamically
        # generated sprite sheets, not a real image file
        if src == 'debug_sprite_sheet':
            print(f"  [{i+1}] Skipping '{text}': virtual template")
            skipped_count += 1
            continue
        
        # ====================================================================
        # PATH RESOLUTION: Handle multiple naming conventions
        # ====================================================================
        
        """
        Challenge: PNG files use two different naming conventions:
        
        Convention 1: Prefixed
            - PNG filename: "category__filename.png"
            - Location: blocks/category/ folder
            - Example: "resources__titanium.png" in blocks/resources/
            
        Convention 2: Unprefixed
            - PNG filename: "filename.png"
            - Location: blocks/category/ folder
            - Example: "titanium.png" in blocks/resources/
        
        Resolution Strategy:
            - Try Convention 1 first (prefixed)
            - If not found, try Convention 2 (unprefixed)
            - If still not found, try other combinations
            - Use whichever file actually exists
        
        Why two conventions?
            - Legacy code used prefixed names
            - Newer code prefers unprefixed (cleaner organization)
            - This flexibility maintains compatibility with both
            
        Lesson: Defensive programming - don't assume file naming is consistent
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
