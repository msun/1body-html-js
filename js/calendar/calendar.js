var calendar = angular.module('calendarModule', ['ionic', 'accountModule', 'starter', 'eventModule', 'react']);
calendar.controller( 'CalendarController', function( $scope, $interval, $ionicLoading, $stateParams, $state, Schedule, $firebaseObject, $firebaseArray ) {
    $ionicLoading.show({
        content: '<i class="icon ion-looping"></i> Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    $scope.type = "my-schedule";
    var userID = $stateParams.userID;
    var userName = $stateParams.userName;
    console.log($scope.type);

    $scope.selected = moment().startOf("day");

    $scope.accountingThisMonth = function(){
        console.log($scope.month);

        var firstDay = new Date();
        firstDay.setDate(1);
        if($scope.month){
            firstDay.setMonth(parseInt($scope.month));
        }
        firstDay.setHours(0);
        firstDay.setMinutes(0);
        firstDay.setSeconds(0);
        console.log(firstDay);

        var lastDay = new Date();
        if($scope.month){
            lastDay.setMonth(parseInt($scope.month + 1));
        } else {
            lastDay.setMonth(lastDay.getMonth() + 1);
        }
        lastDay.setDate(1);
        lastDay.setHours(0);
        lastDay.setMinutes(0);
        lastDay.setSeconds(0);
        console.log(lastDay);

        $state.go('menu.transaction-search-time', {orderby: 'month', start: firstDay.getTime(), end: lastDay.getTime()});
    };

    var slots = {
        hour: [],
        half: []
    }
    $scope.active = [];
    slots.hour = _.range(0, 2300, 100);
    slots.hour.forEach(function (hr) {
        slots.half.push(hr);
        slots.half.push(hr + 30);
    });

    $scope.slotsopen = [[],[],[],[],[],[],[],[],[],[],[],[]];
    $scope.slotsbooked = [[],[],[],[],[],[],[],[],[],[],[],[]];
    $scope.rulesopen = [[],[],[],[],[],[],[],[],[],[],[],[]];

    var checkMonthSlotsopen = function(now){
        $scope.slotsopen[now.getMonth()] = [];
        $scope.slotsbooked[now.getMonth()] = [];
        $scope.rulesopen[now.getMonth()] = [];

        console.log($scope.slotsopen);

        var monthSchedule = $firebaseArray(Schedule.monthRef(userID, now));
        var rules = $firebaseArray(Schedule.ref().child(userID).child("rules"));

        rules.$watch(function(event) {
            $scope.rulesopen[now.getMonth()] = [];

//            angular.forEach(rules, function (value, key) {
            for (var i = 0; i < rules.length; i++) {
//                if(event.event == "child_added" && rules[i].$id == event.key) {
//                    console.log($scope.rulesopen[now.getMonth()]);
//                    console.log(rules[i]);
                    for (var j = 0; j < 32; j++) {
                        var day = new Date();
                        day.setMonth(now.getMonth());
                        day.setDate(j);
                        if (rules[i][day.getDay()] >= 1) {
                            if(!$scope.slotsbooked[now.getMonth()][j]){
                                $scope.slotsbooked[now.getMonth()][j] = 0;
                            }

                            if ($scope.rulesopen[now.getMonth()][j]) {
                                $scope.rulesopen[now.getMonth()][j]++;
                            } else {
                                $scope.rulesopen[now.getMonth()][j] = 1;
                            }
//                            console.log($scope.rulesopen[now.getMonth()]);
                        }
                    }
                }
            render();
//                console.log($scope.rulesopen);
//            };
        });

        monthSchedule.$watch(function (event) {
            console.log(monthSchedule);
            $ionicLoading.hide();
//            $scope.slotsopen[now.getMonth()] = [];
//            $scope.slotsbooked[now.getMonth()] = [];
            for (var i = 0; i < monthSchedule.length; i++) {

                $scope.slotsopen[now.getMonth()][monthSchedule[i].$id] = 0;
                $scope.slotsbooked[now.getMonth()][monthSchedule[i].$id] = 0;

                for (var j = 0; j < monthSchedule[i].active.length; j++) {
                    if (monthSchedule[i].active[j].status == 0) {
                        $scope.slotsopen[now.getMonth()][monthSchedule[i].$id]++;
                    } else if (monthSchedule[i].active[j].status >= 1) {
                        console.log(monthSchedule[i].active[j]);
                        $scope.slotsbooked[now.getMonth()][monthSchedule[i].$id]++;
                        console.log($scope.slotsbooked[now.getMonth()]);
                    }
                }
                console.log($scope.slotsbooked);
            }
            render();
        });
    };

    var setOpenSlots = function(month) {
        $scope.month = month;
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
//        if(!day.beforeToday || day.isToday){
            $state.transitionTo('menu.my-schedule', {year: day.date.year(), month: day.date.month(), day: day.date.date()});
//        }
    };

    $scope.next = function(month){
        setOpenSlots(month);
    };

    $scope.previous = function(month){
        setOpenSlots(month);
    };

    render();

    function render(){
        React.render(
            React.createElement(Calendar, {selected: $scope.selected, type: $scope.type, slotsbooked: $scope.slotsbooked, rulesopen: $scope.rulesopen, slotsopen: $scope.slotsopen, goto: $scope.goto, next: $scope.next, previous: $scope.previous}),
            document.getElementById('calendar')
        );
    }
});

calendar.controller( 'TrainerScheduleController', function( $scope, $interval, $ionicLoading, $stateParams, $state, Schedule, $firebaseObject, $firebaseArray ) {
    $ionicLoading.show({
        content: '<i class="icon ion-looping"></i> Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    $scope.type = "trainer-schedule";
    var userID = $stateParams.userID;
    var userName = $stateParams.userName;
    console.log($scope.type);

    $scope.selected = moment().startOf("day");

    var slots = {
        hour: [],
        half: []
    }
    $scope.active = [];
    slots.hour = _.range(0, 2300, 100);
    slots.hour.forEach(function (hr) {
        slots.half.push(hr);
        slots.half.push(hr + 30);
    });

    $scope.slotsopen = [[],[],[],[],[],[],[],[],[],[],[],[]];
    $scope.rulesopen = [[],[],[],[],[],[],[],[],[],[],[],[]];

    var checkMonthSlotsopen = function(now){
        $scope.slotsopen[now.getMonth()] = [];
        $scope.rulesopen[now.getMonth()] = [];

        console.log($scope.slotsopen);

        var monthSchedule = $firebaseArray(Schedule.monthRef(userID, now));
        var rules = $firebaseArray(Schedule.ref().child(userID).child("rules"));

        rules.$loaded(function(event) {
            $scope.rulesopen[now.getMonth()] = [];

            for (var i = 0; i < rules.length; i++) {
                for (var j = 0; j < 32; j++) {
                    var day = new Date();
                    day.setMonth(now.getMonth());
                    day.setDate(j);
                    if (rules[i][day.getDay()] >= 1) {
                        if ($scope.rulesopen[now.getMonth()][j]) {
                            $scope.rulesopen[now.getMonth()][j]++;
                        } else {
                            $scope.rulesopen[now.getMonth()][j] = 1;
                        }
                    }
                }
            }
            console.log($scope.rulesopen);
            render();
        });

        monthSchedule.$loaded(function (event) {
            $ionicLoading.hide();
            for (var i = 0; i < monthSchedule.length; i++) {
                console.log(monthSchedule[i].$id);
                console.log(monthSchedule[i].active);
                $scope.slotsopen[now.getMonth()][monthSchedule[i].$id] = 0;
                for (var j = 0; j < monthSchedule[i].active.length; j++) {
                    if (monthSchedule[i].active[j].status == 0) {
                        $scope.slotsopen[now.getMonth()][monthSchedule[i].$id]++;
                    }
                }
            }
            console.log($scope.slotsopen);
            render();
        });
    };

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
            $state.transitionTo('menu.trainer-schedule', {trainerID: $stateParams.userID, trainerName: $stateParams.userName, year: day.date.year(), month: day.date.month(), day: day.date.date()});
        }
    };

    $scope.next = function(month){
        setOpenSlots(month);
    };

    $scope.previous = function(month){
        setOpenSlots(month);
    };

    render();

    function render(){
        React.render(
            React.createElement(Calendar, {selected: $scope.selected, type: $scope.type, slotsbooked: $scope.slotsbooked, rulesopen: $scope.rulesopen, slotsopen: $scope.slotsopen, goto: $scope.goto, next: $scope.next, previous: $scope.previous}),
            document.getElementById('trainer-schedule')
        );
    }
});

calendar.directive('calendar', function(reactDirective) {
    return reactDirective(Calendar);
} );

calendar.controller( 'TransactionCalendarController', function( $scope, $interval, $stateParams, $state, Schedule, MyTransactions, appFactory, $firebaseObject, $firebaseArray ) {
    $scope.selected = moment().startOf("day");
    $scope.slotsopen = [[],[],[],[],[],[],[],[],[],[],[],[]];
    $scope.rulesopen = [[],[],[],[],[],[],[],[],[],[],[],[]];

    var checkMonthSlotsopen = function(now){
        var startDate = new Date();
        startDate.setMonth(now.getMonth());
        startDate.setDate(1);
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);
        console.log(startDate);
        console.log(startDate.getTime());

        var endDate = new Date();
        endDate.setMonth(now.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(59);
        console.log(endDate);
        console.log(endDate.getTime());

        var myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByPriority().startAt(startDate.getTime()).endAt(endDate.getTime()));

        myTransactions.$watch(function(event){
            $scope.slotsopen[now.getMonth()] = [];
            angular.forEach(myTransactions, function(value, key){
                var d = new Date(value.starttime);
                if (!$scope.slotsopen[now.getMonth()][d.getDate()]) {
                    $scope.slotsopen[now.getMonth()][d.getDate()] = 1;
                } else {
                    $scope.slotsopen[now.getMonth()][d.getDate()]++;
                }
            });
            render();
        })
    };

    var setOpenSlots = function(month) {
        var now = new Date();
        if(month){
            now.setMonth(month);
        }
        if($scope.slotsopen[now.getMonth()].length == 0) {
            console.log(now);
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

    $scope.next = function(month){
        setOpenSlots(month);
    };

    $scope.previous = function(month){
        setOpenSlots(month);
    };

    $scope.goto = function(day){
        console.log(day);
        $state.transitionTo("menu.my-transactions", {year: day.date.year(), month: day.date.month(), day: day.date.date()});
    };

    render();

    function render(){
        React.render(
            React.createElement(Calendar, {selected: $scope.selected, type: $scope.type, slotsbooked: $scope.slotsbooked, rulesopen: $scope.rulesopen, slotsopen: $scope.slotsopen, goto: $scope.goto, next: $scope.next, previous: $scope.previous}),
            document.getElementById('my-sessions')
        );
    }
});