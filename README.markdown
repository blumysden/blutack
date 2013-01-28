# Blutack

A simple jQuery plugin for our fixed element needs.  (Starting with a minimal feature set.  Please build on this!)

## Usage

All elements with class `blutack` will automatically be set on document ready to affix with offsetTop = 0.

To programmatically affix elements, use `$('.any-old-selector').blutack().

## Options

At the moment, blutack only takes one option:

- `offsetTop`: (INT) specified the padding between the viewport top and the element while it is fixed