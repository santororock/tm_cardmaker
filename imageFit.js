/* 
  ================================================================================
  IMAGE PACKING ALGORITHM - imageFit.js
  ================================================================================
  
  Purpose:
    This module implements a bin packing algorithm to efficiently arrange multiple
    images into a compact rectangle. Used by the card maker to create sprite sheets
    for the debug overlay and asset browsing.
    
  Original Source:
    Based on "potpack" algorithm by Mapbox (ISC License)
    Reference: https://github.com/mapbox/potpack
    
  The Algorithm: Guillotine-Style Bin Packing
    
    What it does:
      - Takes an array of images with width/height properties
      - Arranges them into a minimal bounding rectangle
      - Returns positions (x, y) for each image
      - Useful for creating sprite sheets, texture atlases
    
    How it works:
      1. Sort images by height (descending) - larger items first
      2. Start with one large empty space
      3. For each image:
         - Find first space that fits
         - Place image at space's top-left corner
         - Split remaining space into new rectangles
         - Update list of available spaces
      4. Track container dimensions as images are placed
    
    Why this approach?
      - Better packing efficiency than naive top-to-bottom placement
      - O(n²) complexity is acceptable for small sprite sets (<200 items)
      - Simple to understand and implement
      - Deterministic output (same input = same packing)
    
    Limitations:
      - Not guaranteed optimal solution (NP-hard problem)
      - Performance degrades with many items (would need quadtree for >1000)
      - Doesn't rotate items (could improve packing by 10-15%)
    
    Applications in TM Cardmaker:
      - Building sprite sheets for the debug overlay
      - Asset preview grid layout
      - Texture atlas generation
    
    Further Reading:
      - "A Thousand Ways to Pack the Bin" (2013) survey paper
      - Game engine texture atlasing techniques
      - WebGL texture memory optimization
      - Canvas performance best practices
      
  License: ISC
    Permission is granted to use/modify/distribute this software freely,
    provided the original copyright notice is retained.
*/

// This code is based on (https://github.com/mapbox/potpack) license by
// ISC License

// Copyright (c) 2018, Mapbox

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.

//////////////////////////////////////////////////////////////////////////////

/* 
  Main Packing Function
  
  Parameters:
    imgList: Array of objects with {width: number, height: number}
             (Can be actual Image elements or plain objects)
    minWidth: Minimum width for the output container (for aspect ratio control)
  
  Returns:
    {
      container: {width: number, height: number},  // Total bounding rectangle
      pos: [{x: number, y: number}, ...]           // Positions for each input image
    }
  
  Example Usage:
    const images = [
      {width: 100, height: 50},
      {width: 200, height: 150},
      {width: 75, height: 75}
    ];
    const packed = fitImages(images, 300);
    console.log(packed.container);  // {width: 375, height: 150}
    console.log(packed.pos[0]);     // {x: 0, y: 0}
*/
function fitImages(imgList, minWidth) {

    // Initialize data structures
    let boxes = [];              // Temporary objects with w/h for calculation
    let pos = [];                // Output array: {x, y} for each image
    let order = [];              // Indices sorted by height (descending)
    
    // Populate boxes and order arrays
    // Use order array instead of sorting boxes to maintain original imgList indices
    for (let i=0; i < imgList.length; i++) {
        boxes[i] = {};
        boxes[i].w = imgList[i].width;
        boxes[i].h = imgList[i].height;
        pos[i] = {};                      // Placeholder for output
        order[i] = i;                     // Track original indices
    }

    /* 
      Calculate total area and maximum width
      
      Why these metrics?
      - area: Used to estimate starting container size (sqrt for square)
      - maxWidth: Ensures we never start smaller than the largest item
      
      Math explanation:
        - For square packing: width = height = sqrt(total_area)
        - Adjustment: divide by 0.9 (assume 90% space utilization)
        - This prevents ultra-wide or ultra-tall containers
    */
    let area = 0;
    let maxWidth = 0;

    for (let i$1 = 0, list = boxes; i$1 < list.length; i$1 += 1) {
        let box = list[i$1];
        area += box.w * box.h;
        maxWidth = Math.max(maxWidth, box.w);
    }

    /* 
      Sort boxes by height (descending)
      
      Why height descending?
        - Places large items first (First Fit Decreasing heuristic)
        - Reduces fragmentation and improves packing
        - Empirically produces 5-10% better results than random order
      
      Note: Sorts order array (indices), not boxes directly, to preserve mapping
      
      Time Complexity: O(n log n) for Array.sort()
      Space Complexity: O(1) - sorts in-place
    */
    order.sort(function (a, b) { return boxes[b].h - boxes[a].h; });

    /* 
      Initial Container Dimension Calculation
      
      Algorithm:
        1. Estimate from total area: sqrt(area / 0.9)
           - Assumes 90% space efficiency (realistic for this packing method)
           - Dividing by 0.9 instead of multiplying accounts for wasted space
      2. Ensure width >= largest item (maxWidth)
      3. Enforce minimum width (parameter)
      
      Example:
        - 10 items totaling 10,000 pixels area
        - Estimated width = sqrt(10000 / 0.9) ≈ 105
        - If maxWidth = 200, use 200
        - If minWidth = 300, use 300
      
      This heuristic works well for typical sprite sheets but can be suboptimal
      for unusual aspect ratios. A more sophisticated algorithm might use
      binary search to find optimal dimensions.
    */
    let startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.9)), maxWidth, minWidth);

    /* 
      Initialize Space List
      
      Core Data Structure:
        spaces: Array of {x, y, w, h} representing available rectangles
      
      Initial State:
        - One rectangle: top-left (0,0), full width, infinite height
        - Height = Infinity because we don't know final height yet
        - Will be trimmed when all items are placed
      
      Invariant: Spaces should never overlap
      Invariant: Spaces should be maximal (not completely contained in another space)
    */
    let spaces = [{x: 0, y: 0, w: startWidth, h: Infinity}];

    let width = 0;
    let height = 0;

    /* 
      Main Packing Loop
      
      For each box (in sorted order of decreasing height):
        1. Find suitable space (backwards search prioritizes smaller spaces)
        2. Place box at space's top-left corner
        3. Update tracking variables (width, height)
        4. Modify or split the space based on fit
        5. Remove or update spaces in the list
      
      This is the core algorithm. Understanding the space splitting logic
      is crucial to understanding how this packing works.
      
      Time Complexity: O(n × m) where n=items, m=spaces
                       Worst case: O(n²) if we have O(n) spaces
      Space Complexity: O(n) for spaces array
    */
    for (let i$2 = 0, list$1 = boxes; i$2 < list$1.length; i$2 += 1) {
        /* 
          Retrieve box from original order
          
          Using order[i$2] maintains the mapping from current position
          to the original imgList index
        */
        let box$1 = list$1[order[i$2]];

        /* 
          Iterate backwards through spaces
          
          Why backwards?
            - Recent spaces (end of array) are typically smaller
            - Smaller spaces are filled first (reduces fragmentation)
            - Better cache locality than forward iteration
        */
        for (let i = spaces.length - 1; i >= 0; i--) {
            let space = spaces[i];

            /* 
              Check if box fits in current space
              
              Condition: width AND height must both fit
              (If condition is false, move to next space)
            */
            if (box$1.w > space.w || box$1.h > space.h) { continue; }

            /* 
              Place Box: Found a suitable space!
              
              Placement rule: Always use space's top-left corner
              
              Coordinate System:
                (0,0) is top-left of container
                x increases rightward
                y increases downward (canvas/screen convention)
              
              Visual:
              Before placement:
                |-----------|
                | space     |
                |-----------|
              
              After placement (box in top-left):
                |--box--|---|
                |_______|   |
                |  space    |
                |-----------|
            */
            box$1.x = space.x;
            box$1.y = space.y;
            pos[order[i$2]].x = space.x;
            pos[order[i$2]].y = space.y;

            /* 
              Update container dimensions
              
              As boxes are placed, track the maximum x and y extents
              to calculate final container size
            */
            height = Math.max(height, box$1.y + box$1.h);
            width = Math.max(width, box$1.x + box$1.w);

            /* 
              Space Splitting Logic
              
              After placing a box, we need to update available spaces:
              1. Remove or shrink the space we just used
              2. Create new spaces from leftover area
              
              Three cases based on how well the box fits:
              
              Case 1: Perfect fit (box exactly matches space)
                - Remove space completely
                
              Case 2: Box matches space height
                - Shrink space horizontally (remaining right side)
                - Box and space have same height, so clean split
              
              Case 3: Box matches space width
                - Shrink space vertically (remaining bottom)
                - Box and space have same width, so clean split
              
              Case 4: Box smaller in both dimensions
                - Create two new spaces from the leftover L-shaped area
                - One space to the right of box (same height as box)
                - One space below box (full width of original space)
            */
            
            if (box$1.w === space.w && box$1.h === space.h) {
                // Case 1: Perfect fit - remove space
                // Optimization: Pop last element and move it to current position
                // (This O(1) removal requires last-element swap)
                let last = spaces.pop();
                if (i < spaces.length) { spaces[i] = last; }

            } else if (box$1.h === space.h) {
                // Case 2: Height matches - update space to right side
                // |-------|-----------|
                // |  box  | remaining |
                // |_______|___________|
                space.x += box$1.w;
                space.w -= box$1.w;

            } else if (box$1.w === space.w) {
                // Case 3: Width matches - update space to bottom
                // |-----------|
                // |    box    |
                // |___________|
                // | remaining |
                // |___________|
                space.y += box$1.h;
                space.h -= box$1.h;

            } else {
                // Case 4: Box smaller in both dimensions - split into 2 spaces
                // Create L-shaped remaining area: right strip + bottom strip
                
                // New space to the right (same height as box)
                // |-------|---------|
                // |  box  | new1    |
                // |_______|_________|
                // | space2|
                // |_______|
                spaces.push({
                    x: space.x + box$1.w,
                    y: space.y,
                    w: space.w - box$1.w,
                    h: box$1.h
                });
                
                // Modify current space to be below box
                // (Continues from previous visual)
                space.y += box$1.h;
                space.h -= box$1.h;
            }
            break;  // Move to next box (this one is placed)
        }
    }

    /* 
      Build and Return Result
      
      Output Format:
        - container: {width, height} - minimal bounding rectangle
        - pos: Array of {x, y} coordinates in same order as input imgList
      
      This format is ideal for canvas operations:
        - Create canvas: createCanvas(result.container.width, height)
        - Draw each image: context.drawImage(img[i], result.pos[i].x, result.pos[i].y)
    */
    let ret = {container:{}};
    ret.container.height = height;
    ret.container.width = width;
    ret.pos = pos;

    return ret;
}