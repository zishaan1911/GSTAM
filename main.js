/* ==========================================================================
   GSTAM — shared site behaviour
   Uses: localStorage (persisted preferences), sessionStorage (session-only
   UI state), cookies (consent), IntersectionObserver (reveals / counters)
   ========================================================================== */
(function(){
  "use strict";

  /* ---------- tiny cookie helpers ---------- */
  function setCookie(name, value, days){
    var expires = "";
    if(days){
      var d = new Date();
      d.setTime(d.getTime() + days*24*60*60*1000);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
  }
  function getCookie(name){
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /* ---------- mobile navigation ---------- */
  function initNav(){
    var toggle = document.querySelector('.nav-toggle');
    var mobile = document.querySelector('.nav-mobile');
    var close = document.querySelector('.nav-mobile__close');
    if(!toggle || !mobile) return;

    function open(){
      mobile.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
      document.body.style.overflow = 'hidden';
      sessionStorage.setItem('gstam_nav_open','1');
      var firstLink = mobile.querySelector('a');
      if(firstLink) firstLink.focus();
    }
    function shut(){
      mobile.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
      sessionStorage.removeItem('gstam_nav_open');
      toggle.focus();
    }
    toggle.addEventListener('click', function(){
      mobile.classList.contains('is-open') ? shut() : open();
    });
    if(close) close.addEventListener('click', shut);
    mobile.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', shut); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && mobile.classList.contains('is-open')) shut();
    });
  }

  /* ---------- header hide-on-scroll ---------- */
  function initHeader(){
    var header = document.querySelector('.site-header');
    if(!header) return;
    var lastY = window.scrollY, ticking = false;
    function update(){
      var y = window.scrollY;
      if(y > 140 && y > lastY){ header.classList.add('is-hidden'); }
      else { header.classList.remove('is-hidden'); }
      lastY = y; ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }, {passive:true});
  }

  /* ---------- scroll reveal ---------- */
  function initReveal(){
    var els = document.querySelectorAll('[data-reveal]');
    if(!els.length) return;
    if(!('IntersectionObserver' in window)){
      els.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.16, rootMargin:'0px 0px -60px 0px'});
    els.forEach(function(el){ io.observe(el); });
  }

  /* ---------- number counters ---------- */
  function initCounters(){
    var els = document.querySelectorAll('[data-count-to]');
    if(!els.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count-to'));
        var decimals = (el.getAttribute('data-count-to').split('.')[1] || '').length;
        var duration = 1400, start = null;
        function step(ts){
          if(!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if(progress < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(decimals);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, {threshold:0.6});
    els.forEach(function(el){ io.observe(el); });
  }

  /* ---------- announcement bar (localStorage dismissal) ---------- */
  function initAnnounce(){
    var bar = document.querySelector('.announce');
    if(!bar) return;
    var id = bar.getAttribute('data-announce-id') || 'default';
    var key = 'gstam_dismissed_announce_' + id;
    if(localStorage.getItem(key) === '1'){
      bar.classList.add('is-hidden');
    }
    var closeBtn = bar.querySelector('.announce__close');
    if(closeBtn){
      closeBtn.addEventListener('click', function(){
        bar.classList.add('is-hidden');
        localStorage.setItem(key, '1');
      });
    }
  }

  /* ---------- cookie consent ---------- */
  function initCookieConsent(){
    var bar = document.querySelector('.cookie-bar');
    if(!bar) return;
    var consent = getCookie('gstam_cookie_consent');
    if(!consent){
      setTimeout(function(){ bar.classList.add('is-visible'); }, 900);
    }
    var acceptBtn = bar.querySelector('.cookie-accept');
    var declineBtn = bar.querySelector('.cookie-decline');
    if(acceptBtn){
      acceptBtn.addEventListener('click', function(){
        setCookie('gstam_cookie_consent', 'accepted', 180);
        localStorage.setItem('gstam_analytics_pref', 'on');
        bar.classList.remove('is-visible');
      });
    }
    if(declineBtn){
      declineBtn.addEventListener('click', function(){
        setCookie('gstam_cookie_consent', 'declined', 180);
        localStorage.setItem('gstam_analytics_pref', 'off');
        bar.classList.remove('is-visible');
      });
    }
  }

  /* ---------- back to top ---------- */
  function initBackToTop(){
    var btn = document.querySelector('.back-to-top');
    if(!btn) return;
    window.addEventListener('scroll', function(){
      btn.classList.toggle('is-visible', window.scrollY > 900);
    }, {passive:true});
    btn.addEventListener('click', function(){
      window.scrollTo({top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  }

  /* ---------- hero image load state ---------- */
  function initHero(){
    var hero = document.querySelector('.hero');
    if(!hero) return;
    var img = hero.querySelector('.hero__media img');
    if(!img) return;
    if(img.complete){ hero.classList.add('is-loaded'); }
    else{ img.addEventListener('load', function(){ hero.classList.add('is-loaded'); }); }
  }

  /* ---------- lazy video: swap poster button for YouTube iframe ---------- */
  function initVideo(){
    document.querySelectorAll('.video-block__poster').forEach(function(btn){
      btn.addEventListener('click', function(){
        var wrap = btn.closest('.video-block');
        var id = wrap.getAttribute('data-yt-id');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        iframe.title = 'GSTAM video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        wrap.innerHTML = '';
        wrap.appendChild(iframe);
      });
    });
  }

  /* ---------- recently viewed (localStorage) ---------- */
  function trackRecentlyViewed(){
    var page = document.body.getAttribute('data-page-title');
    var url = window.location.pathname.split('/').pop() || 'index.html';
    if(!page) return;
    try{
      var list = JSON.parse(localStorage.getItem('gstam_recently_viewed') || '[]');
      list = list.filter(function(item){ return item.url !== url; });
      list.unshift({title:page, url:url, ts:Date.now()});
      list = list.slice(0,5);
      localStorage.setItem('gstam_recently_viewed', JSON.stringify(list));
    }catch(e){ /* storage unavailable — fail silently */ }
  }

  /* ---------- restore mobile-nav session state (e.g. after in-page nav) ---------- */
  function restoreNavState(){
    if(sessionStorage.getItem('gstam_nav_open') === '1'){
      sessionStorage.removeItem('gstam_nav_open');
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    initNav();
    initHeader();
    initReveal();
    initCounters();
    initAnnounce();
    initCookieConsent();
    initBackToTop();
    initHero();
    initVideo();
    trackRecentlyViewed();
    restoreNavState();

    var yearEl = document.querySelector('[data-current-year]');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
