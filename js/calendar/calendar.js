var calendar = angular.module('calendarModule', ['ionic', 'accountModule', 'starter', 'eventModule', 'react']);
calendar.controller( 'CalendarController', function( $scope, $interval, $stateParams, $state, Schedule, $firebaseObject, $firebaseArray ) {
    $scope.type = $stateParams.type;
    var userID = $stateParams.userID;
    var userName = $stateParams.userName;
    console.log($scope.type);

    $scope.selected = moment().startOf("day");

    $scope.slotsopen = [[],[],[],[],[],[],[],[],[],[],[],[]];
    $scope.slotsbooked = [[],[],[],[],[],[],[],[],[],[],[],[]];

    var checkMonthSlotsopen = function(now){
        console.log(now);
        for (var i = 0; i < 32; i++) {
            $scope.slotsopen[now.getMonth()].push(0);
            $scope.slotsbooked[now.getMonth()].push(0);
        }
        console.log($scope.slotsopen);

        var monthSchedule = $firebaseArray(Schedule.monthRef(userID, now));
        monthSchedule.$loaded(function () {
            console.log(monthSchedule);
            for (var i = 0; i < monthSchedule.length; i++) {
                var openings = 0;
                var booked = 0;
                for (var j = 0; j < monthSchedule[i].active.length; j++) {
                    if (monthSchedule[i].active[j].status == 0) {
                        openings++;
                    } else if(monthSchedule[i].active[j].status == 1){
                        booked++;
                    }
                }
                $scope.slotsopen[now.getMonth()][monthSchedule[i].$id] = openings;
                $scope.slotsbooked[now.getMonth()][monthSchedule[i].$id] = booked;
            }
            console.log($scope.slotsopen);
        });

        monthSchedule.$watch(function(event) {
            console.log(event);
            for (var i = 0; i < monthSchedule.length; i++) {
                var openings = 0;
                var booked = 0;
                for (var j = 0; j < monthSchedule[i].active.length; j++) {
                    if (monthSchedule[i].active[j].status == 0) {
                        openings++;
                    } else if(monthSchedule[i].active[j].status == 1){
                        booked++;
                    }
                }
                $scope.slotsopen[now.getMonth()][monthSchedule[i].$id] = openings;
                $scope.slotsbooked[now.getMonth()][monthSchedule[i].$id] = booked;
            }
        });
    }

    var setOpenSlots = function(month) {
        var now = new Date();
        if(month){
            now.setMonth(month);
        }
        if($scope.slotsopen[now.getMonth()].length == 0) {
            checkMonthSlotsopen(now);
        }

        var nextMonth = new Date();
        nextMonth.setDate(1);
        nextMonth.setMonth(now.getMonth() + 1);
        console.log(nextMonth.getMonth());
        if($scope.slotsopen[nextMonth.getMonth()].length == 0) {
            checkMonthSlotsopen(nextMonth);
        }
    };

    setOpenSlots();

    $scope.goto = function(day){
        console.log(day);
        if(!day.beforeToday || day.isToday){
            $state.transitionTo('menu.' + $stateParams.type, {trainerID: $stateParams.userID, trainerName: $stateParams.userName, year: day.date.year(), month: day.date.month(), day: day.date.date()});
        }
    };

    $scope.next = function(month){
        setOpenSlots(month);
    };

    $scope.previous = function(month){
        setOpenSlots(month);
    };

} );

calendar.directive('calendar', function(reactDirective) {
    return reactDirective(Calendar);
} );