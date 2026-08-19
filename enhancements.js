/* ==========================================================================
   GreenNova — jQuery enhancements layer (v2)
   Adds, on top of the existing vanilla main.js:
     1. A REST API integration (Open-Meteo forecast API) powering the
        "Live Field Conditions" widget on the home page.
     2. A jQuery UI plugin (Slick Carousel) powering the field-photography
        strip on the home page.
     3. A jQuery UI plugin (Magnific Popup) powering the lightbox viewer
        on the Resources photo library.
   Every init function is guarded so this file can be safely included on
   every page even though most of its targets only exist on one page.
   ========================================================================== */
jQuery(function ($) {
  "use strict";

  /* ------------------------------------------------------------------
     1. REST API — live field conditions (Open-Meteo, no API key required)
     Docs: https://open-meteo.com/en/docs
     ------------------------------------------------------------------ */
  function initFieldWeather() {
    var $widget = $("#field-weather");
    if (!$widget.length) return;

    var sites = [
      { name: "Kuala Lumpur (Club HQ)", lat: 3.139, lon: 101.6869 },
      { name: "Matang Mangrove, Perak", lat: 4.8, lon: 100.62 },
      { name: "Danum Valley, Sabah", lat: 4.9667, lon: 117.8 }
    ];

    var WMO = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Depositing rime fog",
      51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
      61: "Light rain", 63: "Rain", 65: "Heavy rain",
      80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
      95: "Thunderstorm"
    };

    sites.forEach(function (site, i) {
      var $card = $(
        '<div class="weather-card" data-reveal data-reveal-delay="' + (i % 3) + '">' +
          '<span class="weather-card__site">' + site.name + "</span>" +
          '<span class="weather-card__status">Fetching live conditions…</span>' +
        "</div>"
      );
      $widget.append($card);

      var endpoint = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + site.lat + "&longitude=" + site.lon +
        "&current_weather=true&timezone=auto";

      $.ajax({
        url: endpoint,
        method: "GET",
        dataType: "json",
        timeout: 8000
      })
        .done(function (data) {
          var cw = data && data.current_weather;
          if (!cw) throw new Error("Malformed response");
          var desc = WMO[cw.weathercode] || "Conditions unavailable";
          $card.find(".weather-card__status").remove();
          $card.append(
            '<span class="weather-card__temp">' + Math.round(cw.temperature) + "&deg;C</span>" +
            '<span class="weather-card__desc">' + desc + "</span>" +
            '<span class="weather-card__wind">Wind ' + Math.round(cw.windspeed) + " km/h</span>" +
            '<span class="weather-card__ts">Updated ' + new Date(cw.time).toLocaleTimeString() + "</span>"
          );
        })
        .fail(function () {
          $card.find(".weather-card__status")
            .text("Live data unavailable right now — please try again later.")
            .addClass("weather-card__status--error");
        });
    });
  }

  /* ------------------------------------------------------------------
     2. jQuery plugin — Slick Carousel for the field-photography strip
     Docs: https://kenwheeler.github.io/slick/
     ------------------------------------------------------------------ */
  function initFieldCarousel() {
    var $car = $(".field-carousel");
    if (!$car.length || typeof $.fn.slick !== "function") return;

    $car.slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 4500,
      dots: true,
      arrows: true,
      infinite: true,
      speed: 500,
      responsive: [
        { breakpoint: 900, settings: { slidesToShow: 2 } },
        { breakpoint: 560, settings: { slidesToShow: 1 } }
      ]
    });
  }

  /* ------------------------------------------------------------------
     3. jQuery plugin — Magnific Popup lightbox for the photo library
     Docs: https://dimsemenov.com/plugins/magnific-popup/
     ------------------------------------------------------------------ */
  function initPhotoLightbox() {
    var $grid = $(".photo-grid");
    if (!$grid.length || typeof $.fn.magnificPopup !== "function") return;

    $grid.magnificPopup({
      delegate: "a.popup-image",
      type: "image",
      gallery: { enabled: true },
      image: { titleSrc: "title" },
      closeOnContentClick: true
    });
  }

  $(function () {
    initFieldWeather();
    initFieldCarousel();
    initPhotoLightbox();
  });
});
