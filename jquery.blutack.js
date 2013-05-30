(function() {
  'use strict';

  var context = this,
      $ = context.jQuery,
      added = [],
      tackPoints = {},
      proxyCounter = 0,
      proxyId = 'blutack-proxy-',
      tackedClass = 'blutacked',
      watched = 0,
      hasInitialized = false,
      lastY;

  if ($.fn.blutack) {
    return false;
  }

  function getProps($elem) {
    return $elem.data('tackProps');
  }

  function setProps($elem, props) {
    $elem.data('tackProps', props);
  }

  function add(options) {
    // don't re-add:
    if (getProps($(this))) {
      return;
    }
    var $elem = $(this),
        top = options.offsetTop,
        offset = $elem.offset(),
        tackAt = offset.top - top,
        position = $elem.css('position') || 'static',
        props = {
          offsetTop: parseInt(top, 10),
          offsetLeft: (position != 'static') ? offset.left : 'auto',
          tackAt: tackAt,
          proxyId: proxyId + proxyCounter,
          keepWithin: (options.keepWithin) ? $(options.keepWithin) : null,
          // store height for keepWithin checks; how to handle if it changes?
          height: $elem.height(),
          initial: {
            position: position,
            width: (options.freezeWidth) ? $elem.css('width') : 'auto',
            top: $elem.css('top') || 'auto',
            right: $elem.css('right'),
            left: $elem.css('left')
          },
          options: options
        };
    
    setProps($elem, props);
    if (!tackPoints[tackAt]) {
      tackPoints[tackAt] = {
        free: [$elem],
        tacked: [],
        pinched: []
      };
    } else {
      tackPoints[tackAt].free.push($elem);
    }
    proxyCounter += 1;
    watched += 1;
    added.push(this);
    if (watched == 1 && !hasInitialized) {
      hasInitialized = true;
      initTacked();
    }
    checkTacked();
  }

  function remove() {
    var $elem = $(this),
        props = getProps($elem) || {},
        group = ($elem.hasClass(tackedClass)) ? 'tacked' : 'free',
        point = tackPoints[props.tackAt],
        i;
    if (point) {
      for (i = point[group].length - 1; i >= 0; i--) {
        if (point[group][i].get(0) == this) {
          point[group].splice(i, 1);
          peel($elem);
          setProps($elem, null);
          watched -= 1;
          $('#' + props.proxyId).remove();
          break;
        }
      }
    }
    for (var i = added.length - 1; i >= 0; i--) {
      if (added[i] == this) {
        added.splice(i, 1);
        break;
      }
    };
  }

  function tack($elem) {
    var props = getProps($elem),
        $proxy = $('#' + props.proxyId);
    if (!$proxy.length) {
      $proxy = $('<div id="' + props.proxyId + '"></div>');
      // why was blutack working while this didn't?
      // $proxy.height(props.height);
      $proxy.insertBefore($elem);
    }
    $proxy.show();
    $elem.css({
      position: 'fixed',
      top: props.offsetTop,
      width: setTackededWidth($elem),
      left: props.offsetLeft,
      right: 'auto'
    }).
    addClass(tackedClass);
  }

  function pinch($elem, pinchAt) {
    $elem.css({

    })
  }

  function peel($elem) {
    var props = getProps($elem);
    $('#' + props.proxyId).hide();
    $elem.css(props.initial).removeClass(tackedClass);
  }

  var retackAll = (function() {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(function() {
        var removed = [],
            elem,
            i;
        for (i = added.length - 1; i >= 0; i--) {
          elem = added[i];
          removed.push({
            elem: elem,
            options: getProps($(elem)).options
          });
          remove.apply(elem);
        }
        for (i = removed.length - 1; i >= 0; i--) {
          add.apply(removed[i].elem, [removed[i].options]);
        }
      }, 200);
    };
  })();

  function isWithinWithin($elem, scrollTop) {
    var props = getProps($elem),
        $within = props.keepWithin;
    if ($within) {
      return (props.height + props.offsetTop <
          $within.offset().top + $within.height() - scrollTop);
    } else {
      return null;
    }
  }

  function checkTacked(e) {
    var scrollTop = $(window).scrollTop(),
        scrollDir = (e && lastY !== undefined) ? ((scrollTop > lastY) ?
          'down' : 'up') : null,
        point,
        $elem,
        tacked,
        free,
        y,
        i;

    if (e) {
      lastY = scrollTop;
    }

    if (!watched) {
      return false;
    }

    for (y in tackPoints) {
      if (tackPoints.hasOwnProperty(y)) {
        y = Number(y);
        point = tackPoints[y];
        tacked = point.tacked;
        free = point.free;
        if (scrollDir != 'up' && scrollTop > y && !point.fixing) {
          // affix!
          point.fixing = true;
          // debugger;
          for (i = free.length - 1; i >= 0; i--) {
            $elem = free.pop();
            tack($elem);
            tacked.push($elem);
          }
          for (i = tacked.length - 1; i >= 0; i--) {
            // to expensive?
            if (isWithinWithin(tacked[i], scrollTop) === false) {
              console.log('let go');
            }
          }
          point.fixing = false;
        } else if (scrollDir != 'down' && scrollTop <= y && !point.fixing) {
          point.fixing = true;
          for (i = tacked.length - 1; i >= 0; i--) {
            $elem = tacked.pop();
            peel($elem);
            free.push($elem);
          }
          point.fixing = false;
        }
      }
    }
  }

  function setTackededWidth($elem) {
    var props = getProps($elem),
        setTo = (props.initial.width != 'auto') ? props.initial.width :
          $elem.parent().width() - ($elem.outerWidth() - $elem.width());
    $elem.width(setTo);
  }

  function initTacked() {
    if (watched) {
      $(window).scroll(checkTacked);
      $(window).on('resize', retackAll);
      $('body').
        on('orientationchange', retackAll).
        on('touchend', checkTacked);
    }
  }

  function parseOptions(elem, options) {
    var defaultOptions = {
          offsetTop: 0,
          freezeWidth: false
        },
        attrOptions = ($(elem).data('blutack-options') || '').split(';'),
        passedOptions = {},
        parts,
        prop,
        val,
        nums,
        i;
    for (i = attrOptions.length - 1; i >= 0; i--) {
      parts = attrOptions[i].split(':');
      if (parts.length == 2) {
        prop = $.trim(parts[0]);
        if (defaultOptions[prop] !== undefined) {
          val = $.trim(parts[1]);
          nums = val.match(/d+/);
          if (nums && nums.length == val.length) {
            val = Number(val);
          } else if (val === 'false') {
            val = false;
          } else if (val === 'true') {
            val = true;
          }
          passedOptions[prop] = val;
        }
      }
    }
    return $.extend({}, defaultOptions, passedOptions, options);
  }

  $.fn.blutack = function(options) {
    if (options == 'remove') {
      return this.each(function() {
        remove.apply(this);
      });
    }
    if (options == 'tacked') {
      return this.hasClass(tackedClass);
    }
    return this.each(function() {
      add.apply(this, [parseOptions(this, options)]);
    });
  };

  // auto affix!
  $(document).ready(function() {
    $('.blutack').blutack();
  });

 }).call(this);