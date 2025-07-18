#!/bin/bash

# Script to generate PNG icons from SVG
# Run this script if you have ImageMagick installed

if command -v convert &> /dev/null; then
    echo "Generating PNG icons from SVG..."
    
    # Convert SVG to different sizes
    convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
    convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
    convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
    
    echo "Icons generated successfully!"
else
    echo "ImageMagick not found. Please install it or create PNG icons manually."
    echo "You can use online converters to convert the SVG to PNG files."
fi
