angular.module('timeAndDate', [])

    .constant('timeAndDateConfig', {
        minuteStep: 10,
        showMeridian: true,
        meridians: ['AM', 'PM'],
        widgetColClass: 'col-xs-4',
        incIconClass: 'icon-chevron-up',
        decIconClass: 'icon-chevron-down',
        daysInAWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    })

    .directive('timePicker', ['timeAndDateConfig', '$timeout', function(timeAndDateConfig, $timeout) {
        return {
            restrict: 'E',
            transclude: 'true',
//            scope:{
//                dt: '=dt'
//            },
            templateUrl: 'js/event/templates/timepicker.html',
            link: function(scope, element, attrs) {
                scope.minuteStep = parseInt(attrs.minuteStep, 10) || timeAndDateConfig.minuteStep;
                scope.showMeridian = scope.$eval(attrs.showMeridian) || timeAndDateConfig.showMeridian;
                scope.meridians = attrs.meridians || timeAndDateConfig.meridians;
                scope.widgetColClass = attrs.widgetColClass || timeAndDateConfig.widgetColClass;
                scope.incIconClass = attrs.incIconClass || timeAndDateConfig.incIconClass;
                scope.decIconClass = attrs.decIconClass || timeAndDateConfig.decIconClass;
                scope.widget = {};
                scope.showTimePicker = attrs.showTimePicker || true;
                scope.showDatePicker = attrs.showDatePicker || true;
                scope.allowTimeBeforeNow = attrs.allowTimeBeforeNow || false;

                scope.time = attrs.time;
                console.log(scope);
                var dTime;

                scope.decrementHours = function() {
                    dTime.setHours(dTime.getHours()-1);
                    setDate();
//                    if (scope.showMeridian) {
//                        if(dTime.getHours() > 12){
//                            scope.widget.hours = dTime.getHours() - 12;
//                        } else if(dTime.getHours()%12 == 0){
//                            scope.widget.hours = 12;
//                            scope.toggleMeridian();
//                        } else {
//                            scope.widget.hours == dTime.getHours();
//                        }
//                    }
                };

                scope.incrementHours = function() {
                    dTime.setHours(dTime.getHours()+1);
                    setDate();
//                    if (scope.showMeridian) {
//                        if(dTime.getHours() > 12){
//                            scope.widget.hours = dTime.getHours() - 12;
//                        } else if(dTime.getHours()%12 == 0){
//                            scope.widget.hours = 12;
//                            scope.toggleMeridian();
//                        } else {
//                            scope.widget.hours == dTime.getHours();
//                        }
//                    }
//
//                        if (scope.widget.hours === 11) {
//                            scope.widget.hours++;
//                            scope.toggleMeridian();
//                        } else if (scope.widget.hours === 12) {
//                            scope.widget.hours = 1;
//                        } else {
//                            scope.widget.hours++;
//                        }
//                    }
                };

                scope.incrementMinutes = function() {
                    formatMinutes();
                    dTime.setMinutes(scope.widget.minutes+scope.minuteStep);
                    setDate();
                };

                scope.decrementMinutes = function() {
                    formatMinutes();
                    dTime.setMinutes(scope.widget.minutes-scope.minuteStep);
                    setDate();
                };

                scope.toggleMeridian = function() {
//                    scope.widget.meridian = (scope.widget.meridian === scope.meridians[0] ? scope.meridians[1] : scope.meridians[0]);
//                    if(dTime.getHours() > 12){
//                        dTime.setHours(dTime.getHours()-12);
//                    } else {
//                        dTime.setHours(dTime.getHours()+12);
//                    }
                    dTime.setHours(dTime.getHours()+12);
                    setDate();
                };

                scope.toggleMeridianDown = function() {
                    dTime.setHours(dTime.getHours()-12);
                    setDate();
                };


                var setDate = function(){

                    if(!scope.allowTimeBeforeNow && dTime < Date.now()){
                        dTime = new Date();
                    }
                    var theRightHour = scope.widget.hours;
                    var theRightMeridian = scope.widget.meridian;
                    if (scope.showMeridian) {
                        theRightHour = dTime.getHours();
                        if(dTime.getHours() >= 12){
                            if(dTime.getHours() != 12){
                                theRightHour = dTime.getHours() - 12;
                            }
                            theRightMeridian = scope.meridians[1];
                        } else {
                            theRightMeridian = scope.meridians[0];
                        }
                    }
                    $timeout(function(){
                        scope.widget.meridian = theRightMeridian;
                        scope.widget.hours = theRightHour;
                        scope.widget.minutes = dTime.getMinutes();
                        scope.widget.month = dTime.getMonth() + 1;
                        scope.widget.day = dTime.getDate();
                        scope.widget.year = dTime.getFullYear();
                        scope.dayOfWeek = timeAndDateConfig.daysInAWeek[dTime.getDay()];
                        scope.dt = dTime;
                        scope.$parent.dt = dTime;
                        console.log(scope.dt);
                    })
                }

                scope.decrementYear = function() {
                    dTime.setYear(dTime.getFullYear()-1);
                    setDate();
                };

                scope.incrementYear = function() {
                    dTime.setYear(dTime.getFullYear()+1);
                    setDate();
                };

                scope.decrementMonth = function() {
                    dTime.setMonth(dTime.getMonth()-1);
                    setDate();
                };

                scope.incrementMonth = function() {
                    dTime.setMonth(dTime.getMonth()+1);
                    setDate();
                };

                scope.decrementDay = function() {
                    dTime.setDate(dTime.getDate()-1);
                    setDate();
                };

                scope.incrementDay = function() {
                    dTime.setDate(dTime.getDate()+1);
                    setDate();
                };

                function formatMinutes() {
                    if (parseInt(scope.widget.minutes, 10) < 10) {
                        scope.widget.minutes = '0' + parseInt(scope.widget.minutes, 10);
                    }
                    console.log(scope.widget.minutes);
                    scope.widget.minutes = Math.ceil(scope.widget.minutes / scope.minuteStep) * scope.minuteStep;
                    console.log(scope.widget.minutes);
                };

                var updateModel = function() {
                    if (angular.isDefined(scope.widget.hours) && angular.isDefined(scope.widget.minutes)) {
                        scope.time = scope.widget.hours + ':' + scope.widget.minutes + ' ' + scope.widget.meridian;
                    } else {
                        setTime(scope.time);
                    }
                };

                var isScrollingUp = function(e) {
                    if (e.originalEvent) {
                        e = e.originalEvent;
                    }
                    var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
                    return (e.detail || delta > 0);
                };

//                var scrollHours = function(e) {
//                    scope.$apply(isScrollingUp(e) ? scope.incrementHours() : scope.decrementHours());
//                    e.preventDefault();
//                };
//
//                var scrollMinutes = function(e) {
//                    scope.$apply(isScrollingUp(e) ? scope.incrementMinutes() : scope.decrementMinutes());
//                    e.preventDefault();
//                };
//
//                var scrollMeridian = function(e) {
//                    scope.$apply(scope.toggleMeridian());
//                    e.preventDefault();
//                };

                var setTime = function(time) {
                    var timeArray, hours, minutes;
                    if (time) {
                        console.log(time);
                        if (time.match(new RegExp(scope.meridians[1].substring(0,1), 'i'))) {
                            scope.widget.meridian = scope.meridians[1];
                        } else {
                            scope.widget.meridian = scope.meridians[0];
                        }

                        timeArray = time.replace(/[^0-9\:]/g, '').split(':');
                        hours = timeArray[0] ? timeArray[0].toString() : timeArray.toString();
                        minutes = timeArray[1] ? timeArray[1].toString() : '';

                        if (hours.length > 2) {
                            minutes = hours.substr(2, 2);
                            hours = hours.substr(0, 2);
                        }
                        if (minutes.length > 2) {
                            minutes = minutes.substr(0, 2);
                        }

                        hours = parseInt(hours, 10);
                        minutes = parseInt(minutes, 10);

                        if (isNaN(hours)) {
                            hours = 0;
                        }
                        if (isNaN(minutes)) {
                            minutes = 0;
                        }

                    } else { // set current time
                        dTime = new Date();
                        hours = dTime.getHours();
                        minutes = dTime.getMinutes();
                        setDate();

                        if (scope.showMeridian && hours >= 12) {
                            scope.widget.meridian = scope.meridians[1];
                        } else {
                            scope.widget.meridian = scope.meridians[0];
                        }
                    }

                    if (scope.showMeridian) {
                        if (hours === 0) {
                            scope.widget.hours = 12;
                        } else if (hours > 12) {
                            scope.widget.hours = hours - 12;
                            scope.widget.meridian = scope.meridians[1];
                        } else {
                            scope.widget.hours = hours;
                        }

                    } else {
                        scope.widget.hours = hours;
                    }

                    scope.widget.minutes = Math.ceil(minutes / scope.minuteStep) * scope.minuteStep;

                    formatMinutes();

                    scope.time = scope.widget.hours + ':' + scope.widget.minutes + ' ' + scope.widget.meridian;


                };

//                var input = element.find('input').first();
//                input.on('blur', function() {
//                    scope.$apply(function() {
//                        setTime(input.val());
//                    });
//                });
//                element.find('.hours-col').on('mousewheel wheel', scrollHours);
//                element.find('.minutes-col').on('mousewheel wheel', scrollMinutes);
//                element.find('.meridian-col').on('mousewheel wheel', scrollMeridian);


                scope.$watch('widget', function(val) {
                    updateModel();
                }, true);



            }
        };
    }]);