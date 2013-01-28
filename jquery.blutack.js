(function() {
  'use strict';

  var context = this,
      $ = context.jQuery,
      fixPoints = {},
      proxyId = 'nyt-affix-proxy-' + Date.parse(new Date()),
      affixedClass = 'nyt-affixed',
      watched = 0;

  function affix(options) {
    var $elem = $(this),
        top = options.offsetTop,
        fixAt = $elem.offset().top - top,
        props = {
          offsetTop: top,
          fixAt: fixAt,
          proxyId: proxyId
        };
    $elem.data('affixProps', props);
    if (!fixPoints[fixAt]) {
      fixPoints[fixAt] = {
        free: [$elem],
        affixed: []
      };
    } else {
      fixPoints[fixAt].free.push($elem);
    }
    proxyId += 1;
    watched += 1;
    if (watched == 1) {
      initAffix();
    }
    checkAffixed();
  }
  
  function checkAffixed() {
    var scrollTop = $(window).scrollTop(),
        point,
        $elem,
        props,
        $proxy,
        affixed,
        free,
        y,
        i,
        count;
    if (!watched) {
      return false;
    }
    for (y in fixPoints) {
      if (fixPoints.hasOwnProperty(y)) {
        point = fixPoints[y];
        affixed = point.affixed;
        free = point.free;
        if (scrollTop > y && !point.fixing) {
          // affix!
          point.fixing = true;
          // debugger;
          for (i = free.length - 1; i >= 0; i--) {
            $elem = free.pop();
            props = $elem.data('affixProps');
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
              width: setAffixedWidth($elem),
              // 'z-index': 10000
            }).
            addClass(affixedClass);
            affixed.push($elem);
          }
          point.fixing = false;
        } else if (scrollTop <= y && !point.fixing) {
          point.fixing = true;
          for (i = affixed.length - 1; i >= 0; i--) {
            $elem = affixed.pop();
            props = $elem.data('affixProps');
            $('#' + props.proxyId).hide();
            $elem.css({
              position: 'static',
              top: 'auto'
            }).removeClass(affixedClass);
            free.push($elem);
          }
          point.fixing = false;
        }
      }
    }
  }

  function setAffixedWidth($elem) {
    var delta = $elem.outerWidth() - $elem.innerWidth();
    $elem.width($elem.parent().width() - delta);
  }

  function initAffix() {
    if(watched) {
      $(window).scroll(checkAffixed);
      $('body').on('orientationchange', function() {
          var y,
              i;
          setAffixedWidth();
          for (y in fixPoints) {
            for (i = fixPoints[y].affixed.length - 1; i >= 0; i--) {
              setAffixedWidth(fixPoints[y].affixed[i]);
            }
          }
          checkAffixed();
      }).on('touchend', function(e) {
        // Since scroll doesn't register until scrollend.
        // This seems to work well on scroll down anyway.
        checkAffixed();
      });
    }
  }

  $.fn.blutack = function(options) {
    var opts = $.extend({
      offsetTop: 0
    }, options || {});
    return this.each(function() {
      affix.apply(this, [opts]);
    });
  };

  // auto affix!
  $(document).ready(function() {
    $('.blutack').blutack();
  });

 }).call(this);