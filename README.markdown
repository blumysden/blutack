# Blutack

A simple jQuery plugin for our fixed element needs.  (Starting with a minimal feature set.  Please build on this!)

## Usage

### Programatic

#### $(selector).blutack(options)

To programmatically affix elements, use `$('.any-old-selector').blutack()`.  Element position will be fixed immediately if page is already scrolled past position fix position.  Options is an optional hash.  (See __Options__ below.)

#### $(selector).blutack('remove')

Instantly unfixes any tacked elements that match the selector and deactivates blutack behavior on those elements.

#### $(selector).blutack('tacked')

Returns `true` if the element is currently fixed, `false` if element is in its original unfixed position.

### Automatic

All elements with class `blutack` will automatically be set on document ready to affix with offsetTop = 0.  Options can be inlined by adding a `data-blutack-options` attribute to the element, with options as key/value pairs separated by a semi-colon:

    <div class="blutack" data-blutack-options="offsetTop:10; freezeWidth: true;">Lorem ipsum...</div>  

## Options

At the moment, blutack only takes two options:

* `offsetTop: INT`: specifies the padding between the viewport top and the element while it is fixed.  _Default_ `0`
* `freezeWidth: BOOL`: fix width of tacked element once it is tacked.  If `false`, element width will be set to 'auto'.  _Default_ `false`