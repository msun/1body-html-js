var trainer = angular.module('trainerModule', ['ionic', 'accountModule', 'starter', 'ui.bootstrap', 'ui.calendar']);

trainer.factory('Time', function(){
    var Time = function(hour, minute){
        this.hour = hour;
        this.minute = minute;
    }
    return Time;
});

trainer.controller('TrainerDetailCtrl', function(Review, Transaction, Trainers, $ionicModal, $firebase, $scope, Users, appFactory, $timeout, $stateParams, accountFactory, $ionicPopup, $rootScope) {
    console.log($stateParams.trainerName);
    $scope.trainerName = $stateParams.trainerName;
    $scope.max = 5;
    $scope.rate = 0;
    $scope.chosen = [];
    $scope.timeslots = [];
    $scope.amount = 0;
    $scope.isReadonly = false;
    $scope.newreview = {};

    $ionicModal.fromTemplateUrl('js/trainer/templates/review.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    $scope.selectedTrainer = $firebase(Trainers.ref().child($scope.trainerName)).$asObject();
    console.log($scope.selectedTrainer);

    var userRef = appFactory.userRef.child(appFactory.user.$id).child("transactions");
    var userTsct = $firebase(userRef);
    var array = userTsct.$asArray();
    array.$loaded(function(){
        console.log(array);
    });

    var trainerRef = Trainers.ref().child($scope.selectedTrainer.$id).child("transactions");
    var trainerTsct = $firebase(trainerRef);
    var showing = false;

    var showScanQR = function(transaction){
        if(!showing){
            $timeout(function(){
                showing = true;
                $rootScope.offline = true;
                $rootScope.link = "#/menu/account/qrcode/" + transaction.$id;
                $rootScope.warningMsg = "Get ready for your workout, click me to scan your QRcode";
                $rootScope.click = function(){
                    console.log($rootScope.link);
                    window.location.href = "#/menu/account/qrcode/" + transaction.$id;
                    $rootScope.offline = false;
                }
            })
        }
    }

    var showLeaveReview = function(transaction){
        if(!showing){
            $timeout(function(){
                showing = true;
                $rootScope.offline = true;
//                $rootScope.link = "#/tab/account/qrcode/" + transaction.$id;
                $rootScope.warningMsg = "Please leave a review";
                $rootScope.click = function(){
                    console.log($rootScope.link);
//                    window.location.href = "#/tab/account/qrcode/" + transaction.$id;
                    $scope.modal.show();
                    $rootScope.offline = false;
                }
            })
        }
    }

    $scope.showAddReview = function() {
        var returnval = false;
        array.forEach(function (item) {
            if (item.trainerID == $scope.selectedTrainer.$id) {
//                console.log(item);
                if (!item.leftreview && !item.scanned){
                    setTimeout(showScanQR(item), 5000);
                }
                if (!item.leftreview && item.scanned) {
                    $scope.transaction = new Transaction(item);
                    console.log($scope.transaction);
                    setTimeout(showLeaveReview(item), 1000);
                    returnval = true;
                }
            }
        });
        return returnval;
    }



//    Stripe.setPublishableKey('pk_test_DBhUBAORKHi5IqZLUlMUex0Y');



    $scope.showReviewModal = function(){
        $scope.modal.show();
    }

    $scope.closeReviewModal = function(){
        $scope.modal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    $scope.addReview = function(){
        $scope.transaction.disableReview();
        if($scope.newreview.text && $scope.newreview.text.length > 0){
            var newreview = new Review(appFactory.user, $scope.selectedTrainer, $scope.newreview.text, $scope.transaction.$id);
            newreview.add();
            $scope.modal.remove();
        } else {
            alert("Review cannot be empty");
        }
    }
});

trainer.controller('ListCtrl', function($scope, User, appFactory, $timeout, $stateParams, GeoEvents, $firebase, Events) {
    console.log(appFactory.trainers);
    appFactory.state = "Trainers";

    if(appFactory.state == "Trainers"){
        $scope.items = appFactory.trainers;
    } else if (appFactory.state == "Events"){

    } else {
        $scope.items = appFactory.trainers;
    }

});

trainer.directive('schedulerUserView', function($timeout, appFactory, $ionicPopup, Transaction) {
    return {
        restrict: "E",
        templateUrl: "js/trainer/templates/schedulerUserView.html",
        link: function (scope, element, attr) {
            scope.selectDate = function(){
                var mappopup = $ionicPopup.show({
                    template: '<datepicker ng-model="dt" min-date="minDate" class="well well-sm" show-weeks="false"></datepicker>',
                    title: "select date",
                    scope: scope,
                    buttons: [
                        { text: 'okay' }
                    ]
                });
            }

            var slots = {
                hour: [],
                half: []
            }
            scope.active = [];
            slots.hour = _.range(0, 2300, 100);
            slots.hour.forEach(function (hr) {
                slots.half.push(hr);
                slots.half.push(hr + 30);
                scope.active.push(false);
            });
            console.log(slots.half);
            var now = new Date();
            scope.minDate = now;
            scope.dt = now;

            scope.selectTime = function(i){
                scope.chosen[i] = !scope.chosen[i];
                console.log(scope.chosen);

                var count = 0;
                for(var i=0; i<scope.chosen.length; i++){
                    if(scope.chosen[i] == true){
                        count++;
                    }
                }
                scope.amount = 25*count;
            }

            scope.collapse = true;
            scope.$watch('dt', function (newValue, oldValue) {
                scope.theday = scope.dt.getUTCFullYear() + "-" + scope.dt.getUTCMonth() + "-" + scope.dt.getUTCDate();

                scope.selectedTrainer.$loaded(function(){
                    console.log(scope.theday);
                    if(scope.selectedTrainer.schedule[scope.theday]){
                        scope.active = scope.selectedTrainer["schedule"][scope.theday];
                        console.log(scope.active);
                    } else {
                        for(var i=0; i<scope.active.length; i++){
                            scope.active[i] = false;
                        }
                    }
                    scope.timeslots = [];
                    scope.chosen = [];
                    for(var i=0; i<scope.active.length; i++){
                        if(scope.active[i]){
                            scope.timeslots.push(slots.half[i]);
                            scope.chosen.push(false);
                        }
                    }
                    console.log(scope.chosen);
                })
            });

            scope.charge = function(){
                var booked = [];
                var starttime = 0;

                for(var i=0; i < scope.chosen.length; i++) {
                    if (scope.chosen[i]) {
                        booked.push({
                            starttime: scope.timeslots[i]
                        });
                    }
                }
                console.log(booked);
                var bookedReduced = [];
                if(booked.length > 0) {
                    starttime = booked[0].starttime;
                    var connected = 0;
                    bookedReduced.push({
                        starttime: starttime,
                        period: 1
                    })
                    for (var i = 1; i < booked.length; i++) {
                        var found = false;
                        for(var a=0; a<bookedReduced.length; a++){
                            var endtime = booked[a].starttime;
                            for(var j=1; j<=bookedReduced[a].period;j++) {
                                var temp = endtime;
                                endtime = endtime + 30;
                                if (endtime % 100 == 60) {
                                    endtime = temp + 100 - 30;
                                }
                                console.log(endtime);
                                if (booked[i].starttime == endtime) {
                                    bookedReduced[a].period = bookedReduced[a].period+1;
                                    found = true;
                                }
                            }
                        }
                        if(!found){
                            bookedReduced.push({
                                starttime: booked[i].starttime,
                                period: 1
                            })
                        }
                    }
                }
                console.log(bookedReduced);

                for(var i=0; i<bookedReduced.length; i++) {
                    var time = bookedReduced[i].starttime;
                    if(time.toString().length == 1){
                        time=  "00:0" + time;
                    } else if(time.toString().length == 2){
                        time= "00:" + time;
                    } else if(time.toString().length == 3){
                        time= "0" + time.toString().substring(0,1) + ":" + time.toString().substring(1,3);
                    } else if(time.toString().length == 4){
                        time= time.toString().substring(0,2) + ":" + time.toString().substring(2,4);
                    }
                    var curdate = scope.dt.getDate();
                    if(curdate.toString().length == 1){
                        curdate = "0" + curdate.toString();
                    }
                    var starttime = new Date(scope.dt.getUTCFullYear() + "-" + (scope.dt.getMonth()+1) + "-" + curdate + "T" + time + ":00");
                    console.log(starttime);
                    var utcstarttime = new Date(starttime.getTime() + starttime.getTimezoneOffset() * 60000);
                    var epoch = utcstarttime.getTime();
                    console.log(utcstarttime);
                    var newtransaction = new Transaction(appFactory.user, scope.selectedTrainer, bookedReduced[i].period*30, bookedReduced[i].period*30, epoch);
                    console.log(newtransaction);
                    newtransaction.add(function () {
                        if(i==bookedReduced.length-1){
                            var alertPopup = $ionicPopup.alert({
                                title: 'Success',
                                template: 'Transactions Added Successfully'
                            });
                            alertPopup.then(function (res) {
                                console.log('popup closed');
                            });
                        }
                    });
                }
                for(var i=0; i<slots.half.length; i++){
                    for(var j=0; j<booked.length; j++){
                        if(slots.half[i] == booked[j].starttime){
                            console.log(booked[j].starttime);
                            console.log(scope.selectedTrainer["schedule"][scope.theday][i]);
                            scope.selectedTrainer["schedule"][scope.theday][i] = false;
                        }
                    }

                    if(scope.active[i]){
                        scope.timeslots.push(slots.half[i]);
                        scope.chosen.push(false);
                    }
                }
                console.log(scope.selectedTrainer["schedule"][scope.theday]);
                scope.selectedTrainer.$save();
            }
        }
    }
});

trainer.directive('scheduler', function($timeout, appFactory){
    return {
        restrict: "E",
        templateUrl: "js/trainer/templates/scheduler.html",
        link: function(scope, element, attr) {
            var now = new Date();
            console.log(now);
            scope.minDate = now;
            scope.dt = now;
            var y = now.getYear();
            var m = now.getMonth();
            var d = now.getDate();
            var h = now.getHours();
            var min = now.getMinutes();

            var slots = {
                hour: [],
                half: []
            }

            scope.active = [];
            slots.hour = _.range(0, 2300, 100);
            slots.hour.forEach(function (hr) {
                slots.half.push(hr);
                slots.half.push(hr + 30);
                scope.active.push(false);
            });

            scope.timeslots = slots.half;

            scope.selectTime = function(i){
                scope.active[i] = !scope.active[i];
            }

            scope.confirm = function () {
                var name = scope.dt.getUTCFullYear() + "-" + scope.dt.getUTCMonth() + "-" + scope.dt.getUTCDate();

                console.log(name);
                if(!appFactory.user["schedule"]){
                    appFactory.user["schedule"] = [];
                }
                appFactory.user["schedule"][name] = scope.active;
                console.log(appFactory.user);
                appFactory.user.$save();

            }

            scope.collapse = true;
            scope.$watch('dt', function (newValue, oldValue) {
                var name = scope.dt.getUTCFullYear() + "-" + scope.dt.getUTCMonth() + "-" + scope.dt.getUTCDate();
                if(appFactory.user["schedule"][name]){
                    scope.active = appFactory.user["schedule"][name];
                } else {
                    for(var i=0; i<scope.active.length; i++){
                        scope.active[i] = false;
                    }
                }
            });

        }
    }
});

trainer.directive('scheduleSelect', function($timeout, User){
    return {
        restrict: "A",
        link: function(scope, element, attr){
        }
    }
})

trainer.filter('displayTime', function() {
    return function(time) {
        var endtime = time+30;
        if (endtime%100 == 60){
            endtime = time + 100 - 30;
        }
        var stringtime = ""
        if(endtime.toString().length == 1){
            stringtime =  "00:0" + endtime;
        } else if(endtime.toString().length == 2){
            stringtime =  "00:" + endtime;
        } else if(endtime.toString().length == 3){
            stringtime = "0" + endtime.toString().substring(0,1) + ":" + endtime.toString().substring(1,3);
        } else if(endtime.toString().length == 4){
            stringtime = endtime.toString().substring(0,2) + ":" + endtime.toString().substring(2,4);
        }

        if(time.toString().length == 1){
            return "00:0" + time + " - " + stringtime;
        } else if(time.toString().length == 2){
            return "00:" + time + " - " + stringtime;
        } else if(time.toString().length == 3){
            return "0" + time.toString().substring(0,1) + ":" + time.toString().substring(1,3)  + " - " + stringtime;
        } else if(time.toString().length == 4){
            return time.toString().substring(0,2) + ":" + time.toString().substring(2,4)  + " - " + stringtime;
        }
    }
});