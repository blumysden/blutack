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
      lastY,
      scrollTimer,
      $doc = $(document),
      docHeight;

  if ($.fn.blutack) {
    return false;
  }

  function isNew(elem) {
    var props = getProps($(elem))
    return props === undefined || props === null;
  }

  function getProps($elem) {
    return $elem.data('tackProps');
  }

  function setProps($elem, props) {
    $elem.data('tackProps', props);
  }

  function add(options) {
    // don't re-add:
    if (!isNew(this)) {
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
          height: $elem.outerHeight(),
          initial: {
            position: position,
            width: (options.freezeWidth) ? $elem.css('width') : 'auto',
            top: $elem.css('top') || 'auto',
            right: $elem.css('right'),
            left: $elem.css('left'),
            'float': $elem.css('float')
          },
          options: options
        };
        
    setProps($elem, props);
    if (!tackPoints[tackAt]) {
      tackPoints[tackAt] = {
        free: [$elem],
        tacked: []
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
        $proxy = $('#' + props.proxyId),
        newProxy = !$proxy.length;
    if (newProxy) {
      $proxy = $('<div id="' + props.proxyId + '"></div>');
      $proxy.insertBefore($elem);
    }
    // $proxy.show();
    setTackededWidth($elem);
    $elem.css({
      position: 'fixed',
      top: props.offsetTop,
      left: props.offsetLeft,
      right: 'auto'
    }).
    addClass(tackedClass).
    data('isPinched', false);
    if (newProxy) {
      $proxy.height(props.height).css(props.initial);
    }
    $proxy.show();
  }

  function pinch($elem, delta) {
    var props = getProps($elem);
    $elem.css({
      top: props.offsetTop + delta
    }).data('isPinched', true);
  }

  function peel($elem) {
    var props = getProps($elem);
    $('#' + props.proxyId).hide();
    $elem.css(props.initial).removeClass(tackedClass);
  }

  function retack() {
    var props = getProps($(this)),
        options = (props) ? props.options : null;
    if (!props) {
      return false;
    }
    remove.apply(this);
    add.apply(this, [options]);
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

  function checkPinch($elem, scrollTop) {
    var props = getProps($elem),
        $within = props.keepWithin,
        delta;
      if ($within) {
        delta = ($within.offset().top + $within.height() - scrollTop) -
          (props.height + props.offsetTop); // why does this always come up short?
        if (delta < 0) {
          pinch($elem, delta);
        } else if ($elem.data('isPinched') && delta >= 0) {
          tack($elem);
        }
      }
  }

  function checkTacked(e) {
    if (!scrollTimer) {
      var curHeight = $doc.height();
      // check the height!
      if (curHeight != docHeight) {
        docHeight = curHeight;
        retackAll();
      }
    } else {
      clearTimeout(scrollTimer);
    }
    scrollTimer = setTimeout(function() {
      scrollTimer = null;
    }, 300);
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
        for (i = tacked.length - 1; i >= 0; i--) {
          checkPinch(tacked[i], scrollTop);
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
      docHeight = $doc.height();
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
    if (options == 'retack') {
      return this.each(function() {
        retack.apply(this);
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