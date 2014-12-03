(function(){
  "use strict";

  function WhatsOn(options) {
    this.$el = options.el;
    this.$indicator = options.indicator;
    this.refreshInterval = 30000;

    this.$indicator.hide();
    this.init();
  }

  WhatsOn.prototype.init = function init() {
    this.fetchEvents();
  }

  WhatsOn.prototype.fetchEvents = function fetchEvents() {
    this.$indicator.show();
    $.ajax({
      dataType: 'json',
      url: '/events.json',
      success: $.proxy(function(events){
        this.buildEventsList(events);
        this.scheduleNextFetch();
        this.$indicator.hide();
      }, this)
    });
  }

  WhatsOn.prototype.scheduleNextFetch = function scheduleNextFetch() {
    setTimeout(
      $.proxy(this.fetchEvents, this),
      this.refreshInterval
    );
  }

  WhatsOn.prototype.buildEventsList = function buildEventsList(events) {
    this.$el.find('li.event:not(.placeholder)').remove();

    $.each(events, $.proxy(function(i, event){
      var $event = this.buildEvent(event);
      this.$el.append($event);
    }, this));
  }

  WhatsOn.prototype.buildEvent = function buildEvent(event) {
    var $placeholder = this.$el.find('.placeholder');
    var $event = $placeholder.clone();

    $event.removeClass('placeholder');
    if (this.isToday(event.start)) {
      $event.addClass('today');
    }

    $event.find('h1').text(event.title);

    $event.find('.datetime').text(
      this.formatDateTime(event.start, event.end)
    );
    $event.find('.duration').text(
      this.formatDuration(event.start, event.end)
    );

    if (event.location == null) {
      $event.find('.location').remove();
    } else {
      $event.find('.location').text(event.location);
    }

    return $event;
  }

  WhatsOn.prototype.isToday = function isToday(start) {
    var tzStart = moment(start).tz("Europe/London");
    var now = moment();

    if (tzStart.isAfter(now, 'day')) {
      return false;
    }
    return true;
  }

  WhatsOn.prototype.formatDateTime = function formatDateTime(start, end) {
    var tzStart = moment(start).tz("Europe/London");
    var now = moment();

    var formattedDay = (this.isToday(start)) ? "Today" : tzStart.format('dddd');
    var formattedTime = this.formatStartTime(tzStart);

    return formattedDay + ', ' + formattedTime;
  }

  WhatsOn.prototype.formatStartTime = function formatStartTime(time) {
    if (time.minutes() == 0) {
      return time.format("ha");
    } else {
      return time.format("h:mma");
    }
  }

  WhatsOn.prototype.formatDuration = function formatDuration(start, end) {
    var tzStart = moment(start).tz("Europe/London");
    var tzEnd = moment(end).tz("Europe/London");

    var durationInMinutes = tzEnd.diff(tzStart, 'minutes');

    return durationInMinutes + ' mins';
  }

  window.WhatsOn = WhatsOn;
}());
