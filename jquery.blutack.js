(function() {
  'use strict';

  var context = this,
      $ = context.jQuery,
      tackPoints = {},
      proxyCounter = 0,
      proxyId = 'blutack-proxy-',
      tackedClass = 'blutacked',
      watched = 0,
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
    var $elem = $(this),
        top = options.offsetTop,
        tackAt = $elem.offset().top - top,
        props = {
          offsetTop: top,
          tackAt: tackAt,
          proxyId: proxyId + proxyCounter,
          position: $elem.css('position') || 'static',
          width: (options.freezeWidth) ? $elem.css('width') : null,
          top: $elem.css('top') || 'auto'
        };
    // don't re-add:
    if (getProps($elem)) {
      return;
    } else {
      setProps($elem, props);
    }
    console.log('added');
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
    if (watched == 1) {
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
          break;
        }
      }
    }
  }

  function tack($elem) {
    var props = getProps($elem),
        $proxy = $('#' + props.proxyId);
    if (!$proxy.length) {
      $proxy = $('<div id="' + props.proxyId + '"></div>').
        height(props.height).
        insertBefore($elem);
    }
    $proxy.show();
    $elem.css({
      position: 'fixed',
      top: props.offsetTop,
      width: setTackededWidth($elem)
    }).
    addClass(tackedClass);
  }

  function peel($elem) {
    var props = getProps($elem);
    $('#' + props.proxyId).hide();
    $elem.css({
      position: props.position,
      top: props.top
    }).removeClass(tackedClass);
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
        i,
        count;

    if (e) {
      lastY = scrollTop;
    }

    if (!watched) {
      return false;
    }

    for (y in tackPoints) {
      if (tackPoints.hasOwnProperty(y)) {
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
      }
    }
  }

  function setTackededWidth($elem) {
    var props = getProps($elem),
        setTo = props.width || $elem.parent().width() -
        ($elem.outerWidth() - $elem.width());
    $elem.width(setTo);
  }

  function initTacked() {
    if(watched) {
      // lastY = $(window).scrollTop();
      $(window).scroll(checkTacked);
      $('body').on('orientationchange', function() {
          var y,
              i;
          setTackededWidth();
          for (y in tackPoints) {
            for (i = tackPoints[y].tacked.length - 1; i >= 0; i--) {
              setTackededWidth(tackPoints[y].tacked[i]);
            }
          }
          checkTacked();
      }).on('touchend', function(e) {
        // Since scroll doesn't register until scrollend.
        // This seems to work well on scroll down anyway.
        checkTacked();
      });
    }
  }

  $.fn.blutack = function(options) {
    if (options == 'remove') {
      return this.each(function() {
        remove.apply(this, [opts]);
      });
    }
    var opts = $.extend({
      offsetTop: 0,
      freezeWidth: false
    }, options || {});
    return this.each(function() {
      add.apply(this, [opts]);
    });
  };

  // auto affix!
  $(document).ready(function() {
    $('.blutack').blutack();
  });

 }).call(this);