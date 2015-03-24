var trainer = angular.module('trainerModule', ['ionic', 'accountModule', 'starter', 'ui.bootstrap', 'ui.calendar', 'eventModule']);

trainer.factory('Time', function(){
    var Time = function(hour, minute){
        this.hour = hour;
        this.minute = minute;
    }
    return Time;
});


trainer.controller('TrainerDetailCtrl', function(mapFactory, $localstorage, Sizes, Review, MyReviews, Transactions, MyTransactions, Trainers, $ionicModal, $firebaseObject, $firebaseArray, $scope, Users, appFactory, $timeout, $stateParams, accountFactory, $ionicPopup, $rootScope, GeoTrainers, Reviews, appConfig, Followers, Following) {
    console.log($stateParams.trainerName);
    $scope.trainerName = $stateParams.trainerName;
    $scope.max = 5;
    $scope.rate = 0;
    $scope.chosen = [];
    $scope.timeslots = [];
    $scope.amount = 0;
    $scope.isReadonly = false;
    $scope.newreview = {rating:0};
    $scope.notFollowing = true;
    $scope.reviewRating = 0;
    $scope.numOfFollowers = 0;
    $scope.numOfFollowings = 0;
    $scope.numOfReviews = 0;

    $ionicModal.fromTemplateUrl('js/trainer/templates/review.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.reviewModal = modal;
    });

    $ionicModal.fromTemplateUrl('js/trainer/templates/image.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.imageModal = modal;
    });

    $ionicModal.fromTemplateUrl('js/trainer/templates/trainer-schedule-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.scheduleModal = modal;
    });

    var loadMap = function(){
        $scope.map = new google.maps.Map(document.getElementById('trainer-detail-map'), {
            zoom: 12,
            center: new google.maps.LatLng($scope.selectedTrainerLocation.l[0], $scope.selectedTrainerLocation.l[1]),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var marker;

        marker = new google.maps.Marker({
            position: $scope.map.getCenter(),
            map: $scope.map
        });

        if($scope.selectedTrainer.mobile){
            var populationOptions = {
                strokeColor: '#2861ff',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#2861ff',
                fillOpacity: 0.35,
                map: $scope.map,
                center: new google.maps.LatLng($scope.selectedTrainerLocation.l[0], $scope.selectedTrainerLocation.l[1]),
                radius: $scope.selectedTrainer.radius
            };
            // Add the circle for this city to the map.
            var trainerCircle = new google.maps.Circle(populationOptions);
        }
    }

    var loadData = function() {
        $scope.sizes = $firebaseObject(Sizes.ref().child($scope.selectedTrainer.$id));

        $scope.followerMe = $firebaseObject(Followers.ref().child($scope.selectedTrainer.$id).child(appFactory.user.$id));

        $scope.selectedTrainerLocation = $firebaseObject(GeoTrainers.ref().child($scope.trainerName));

        $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("trainerID").equalTo($scope.selectedTrainer.$id));

        $scope.selectedTrainerLocation.$loaded(function () {
            loadMap();

            $scope.myTransactions.$loaded(function () {
                console.log($scope.myTransactions);
                for (var i = 0; i < $scope.myTransactions.length; i++) {
                    if ($scope.myTransactions[i].scanned && $scope.myTransactions[i].reviewed == false) {
                        alert("Please leave a review");
                        $scope.showReviewModal();
                        $scope.transaction = $scope.myTransactions[i];
                        break;
                    }
                }
            });
        });

        var reviewRef = Reviews.ref().child($scope.selectedTrainer.$id);
        var reviewPriority = 0;
        $scope.reviewCount = appConfig.maxReviewCount;
        $scope.reviews = $firebaseArray(reviewRef.startAt(reviewPriority).limitToFirst(appConfig.defaultItemsPerPage));
        $scope.reviews.$loaded(function(){
            if($scope.reviews.length > 0){
                $scope.reviewCount = $scope.reviews[0].$priority;
                console.log($scope.reviews);
                reviewPriority = $scope.reviews[$scope.reviews.length - 1].$priority + 1;
                console.log(reviewPriority);
            }
        });

        $scope.moreReviews = function(){
            $scope.reviews = $firebaseArray(reviewRef.startAt(reviewPriority).limitToFirst(appConfig.defaultItemsPerPage));
            $scope.reviews.$loaded(function(){
                if($scope.reviews.length > 0) {
                    console.log($scope.reviews);
                    reviewPriority = $scope.reviews[$scope.reviews.length - 1].$priority + 1;
                    console.log(reviewPriority);
                }
            });
        };
    }

    if(appFactory.trainers[$scope.trainerName].refreshed){
        $scope.selectedTrainer = appFactory.trainers[$scope.trainerName];
        loadData();
    } else {
        $scope.selectedTrainer = $firebaseObject(Trainers.ref().child($scope.trainerName));
        $scope.selectedTrainer.$loaded(function(){
            appFactory.trainers[$scope.trainerName] = $scope.selectedTrainer;
            appFactory.trainers[$scope.trainerName].refreshed = true;
            alert("loaded from firebase");
            $localstorage.setObject("Trainers", appFactory.trainers);
            loadData();
        })
    }

    $scope.addReview = function(){
        $scope.reviewCount --;
        var newReview = {
            userID: appFactory.user.$id,
            trainerID: $scope.selectedTrainer.$id,
            text: $scope.newreview.text,
            rating: $scope.newreview.rating,
            created: Date.now(),
            $priority: $scope.reviewCount
        };
        console.log(newReview);

        var newReviewRef = $scope.reviews.$add(newReview).then(function(ref) {
            if($scope.sizes.rating){
                $scope.sizes.numOfReviews++;
                $scope.sizes.rating += $scope.newreview.rating;
            } else {
                $scope.sizes.rating = $scope.newreview.rating;
                $scope.sizes.numOfReviews = 1;
            }

            $scope.sizes.$save().then(function(){
                console.log($scope.sizes);
                $scope.myTransactions.$remove($scope.transaction).then(function(){
                    alert("Review added");
                    $scope.closeReviewModal();
                });
            });
            var myreview = $firebaseObject(MyReviews.ref().child(appFactory.user.$id).child(ref.key()));
            myreview.userID = appFactory.user.$id;
            myreview.trainerID = $scope.selectedTrainer.$id;
            myreview.text = $scope.newreview.text;
            myreview.rating = $scope.newreview.rating;
            myreview.created = Date.now();
            myreview.$priority = $scope.reviewCount;
            myreview.$save();

        });
    };

    $scope.showReviewModal = function(){
        $scope.reviewModal.show();
    }

    $scope.closeReviewModal = function(){
        $scope.reviewModal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.reviewModal.remove();
        $scope.imageModal.remove();
        $scope.scheduleModal.remove();
    });

    $scope.showScheduleModal = function(){
        $scope.scheduleModal.show();
    }

    $scope.closeScheduleModal = function(){
        $scope.scheduleModal.hide();
    }

    $scope.openImageModal = function(){
        $scope.imageModal.show();
        $scope.bigimage = $firebaseObject(Images.ref().child($scope.selectedTrainer.$id).child("profilepic"));
        $scope.bigimage.$loaded(function(){
            console.log($scope.bigimage);
        });
    };

    $scope.closeImageModal = function(){
        $scope.imageModal.hide();
    };

    $scope.openImageModal = function(){
        $scope.imageModal.show();
        $scope.bigimage = $firebaseObject(Images.ref().child($scope.selectedTrainer.$id).child("profilepic"));
        $scope.bigimage.$loaded(function(){
            console.log($scope.bigimage);
        });
    };

    $scope.closeImageModal = function(){
        $scope.imageModal.hide();
    };

    $scope.rateTrainer = function(rating){
        $scope.reviewRating = rating
    }

    $scope.follow = function(){
        console.log(appFactory.user);
        $scope.followerMe.username = appFactory.user.username;
        if(appFactory.user.profilepic){
            $scope.followerMe.profilepic = appFactory.user.profilepic;
        }
        if(appFactory.user.info){
            $scope.followerMe.info = appFactory.user.info;
        }
        $scope.followerMe.$save().then(function(){
            if($scope.sizes.numOfFollowers){
                $scope.sizes.numOfFollowers++;
            } else {
                $scope.sizes.numOfFollowers = 1;
            }
            $scope.sizes.$save();
        });

        var following = $firebaseObject(Following.ref().child(appFactory.user.$id).child($scope.selectedTrainer.$id));
        following.$loaded(function() {
            following.username = $scope.selectedTrainer.username;
            console.log($scope.selectedTrainer.profilepic);
            if($scope.selectedTrainer.profilepic){
                following.profilepic = $scope.selectedTrainer.profilepic;
            }
            if($scope.selectedTrainer.info){
                following.info = $scope.selectedTrainer.info;
            }
            console.log(following);
            following.$save().then(function(){
                if(appFactory.mysizes.numOfFollowing){
                    appFactory.mysizes.numOfFollowing++;
                } else {
                    appFactory.mysizes.numOfFollowing = 1;
                }
                appFactory.mysizes.$save();

                alert("Following user: " + $scope.selectedTrainer.username);
            });
        });
    };
});

trainer.controller('FollowersCtrl', function($scope, User, appFactory, $timeout, $stateParams, GeoEvents, $firebase, Followers, Trainers) {
    $scope.items = $firebase(Followers.ref().child(appFactory.user.$id)).$asArray();

    $scope.items.$loaded(function(){
        console.log($scope.items);
        for(var i=0; i<$scope.items.length; i++){
            (function(index) {
                var item = $firebase(Trainers.ref().child($scope.items[index].$id)).$asObject();
                item.$loaded(function(){
                    console.log(item);
                    if(item.profilepic){
                        $scope.items[index].profilepic = item.profilepic;
                    }
                    if(item.info){
                        $scope.items[index].info = item.info;
                    }
                    $scope.items[index].group = item.group;
                    $scope.items.$save(index);
                })
            }(i));
        }
    });
});

trainer.controller('FollowingTrainerCtrl', function($scope, User, appFactory, $timeout, $stateParams, GeoEvents, $firebase, Following, Trainers) {
    $scope.items = $firebase(Following.ref().child(appFactory.user.$id)).$asArray();

    $scope.items.$loaded(function(){
        console.log($scope.items);
        for(var i=0; i<$scope.items.length; i++){
            (function(index) {
                var item = $firebase(Trainers.ref().child($scope.items[index].$id)).$asObject();
                item.$loaded(function(){
                    console.log(item);
                    if(item.profilepic){
                        $scope.items[index].profilepic = item.profilepic;
                    }
                    if(item.info){
                        $scope.items[index].group = item.info;
                    }
                    $scope.items[index].group = item.group;
                    $scope.items.$save(index);
                })
            }(i));
        }
    });
});

trainer.controller('MobileTrainerRequestCtrl', function($ionicModal, $ionicPopup, $scope, User, appFactory, $timeout, $stateParams, $firebase, eventFactory, apikey, Requests, GeoRequests, Trainers, IncomingRequests) {
    $scope.newrequest = {};
    $scope.newrequest.duration = 30;

    $scope.mobile_trainers = [];

    for(var key in appFactory.trainers){
        if(!appFactory.trainers.hasOwnProperty(key)){
            continue;
        }

        if(appFactory.trainers[key].mobile){
            $scope.mobile_trainers.push(appFactory.trainers[key]);
        }
    }
    console.log($scope.mobile_trainers);

    $ionicModal.fromTemplateUrl('js/trainer/templates/choose-trainer-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });


    $scope.openDatePicker = function() {
        console.log('openDatePicker');
        $scope.tmp = {};
        $scope.tmp.newDate = {};

        var birthDatePopup = $ionicPopup.show({
            template: '<datetimepicker ng-model="tmp.newDate"></datetimepicker>',
            title: "Choose Start Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        $scope.newrequest.starttime = $scope.tmp.newDate.getTime();
//                        console.log($scope.newrequest.starttime.getTime());
                        if(typeof $scope.tmp.newDate.getTime === 'undefined'){
                            alert("please select a valid time");
                        }
                    }
                }
            ]
        });
    }

    $scope.openMap = function(){
        var marker;
        setTimeout(function(){
            console.log("ready to load map");
            console.log(appFactory.user);
//            $scope.map = mapFactory.initialize([], "create-event", appFactory.user, []);
            var map = new google.maps.Map(document.getElementById('create-requestmap'), {
                zoom: 11,
                center: new google.maps.LatLng(appFactory.user.latitude, appFactory.user.longitude),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            marker = new google.maps.Marker({
                position: map.getCenter(), //new google.maps.LatLng(appFactory.user.latitude, appFactory.users.longitude),
                map: map,
                draggable: true
            });

            google.maps.event.addListener(map, 'center_changed', function() {
                marker.setPosition(map.getCenter());
            });
        }, 500);

        var mappopup = $ionicPopup.show({
            template: '<div id="create-requestmap" data-tap-disabled="true"></div>',
            title: "Choose Start Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        console.log(marker.getPosition());
                        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&key=" + apikey;
                        console.log(url);
                        eventFactory.getStreetAddress(url, function(data, status){
                            console.log(data);
                            $scope.newrequest.location = data.results[0].formatted_address;
                        });
                    }
                }
            ]
        });
    }

    $scope.openSelectTrainerModal = function(){
        $scope.modal.show();

        $scope.mobile_trainer_location = new google.maps.Map(document.getElementById('mobile-trainer-location'), {
            zoom: 13,
            center: new google.maps.LatLng(appFactory.user.latitude, appFactory.user.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

//        var marker = new google.maps.Marker({
//            position: $scope.mobile_trainer_location.getCenter(),
//            map: $scope.mobile_trainer_location,
//            draggable: true
//        });
    }

    $scope.showOnMap = function(item){
        var center = new google.maps.LatLng(item.latitude, item.longitude);
        if($scope.marker){
            $scope.marker.setMap(null);
        }
        $scope.marker = new google.maps.Marker({
            position: center,
            map: $scope.mobile_trainer_location,
            draggable: true
        });

        if($scope.trainerCircle){
            $scope.trainerCircle.setMap(null);
        }

        var populationOptions = {
            strokeColor: '#2861ff',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#2861ff',
            fillOpacity: 0.35,
            map: $scope.mobile_trainer_location,
            center: center,
            radius: item.radius
        };

        $scope.mobile_trainer_location.setCenter(center);
        // Add the circle for this city to the map.
        $scope.trainerCircle = new google.maps.Circle(populationOptions);

    };

    $scope.closeSelectTrainerModal = function(){
        $scope.checked = [];
        for(var j=0; j<$scope.mobile_trainers.length; j++){
            var mobile = $scope.mobile_trainers[j];
            if(mobile.checked){
                $scope.mobile_trainers[j].checked = false;
            }
        }
        $scope.modal.hide();
    };

    $scope.confirmSelectTrainerModal = function(){
        $scope.checked = [];
        for(var j=0; j<$scope.mobile_trainers.length; j++){
            var mobile = $scope.mobile_trainers[j];
            if(mobile.checked){
                $scope.checked.push({
                    id: mobile.$id,
                    username: mobile.username
                });
            }
        }
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    $scope.confirmRequest = function(){
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newrequest.location.replace(/ /g, "+") + "&key=" + apikey;
        eventFactory.getStreetAddress(url, function(data, status) {
            console.log(data);
            $scope.newrequest.latitude = data.results[0].geometry.location.lat;
            $scope.newrequest.longitude = data.results[0].geometry.location.lng;

            $scope.newrequest.userID = appFactory.user.$id;
            $scope.newrequest.userName = appFactory.user.username;

            $scope.newrequest.created = Date.now();

            var requestRef = Requests.ref().child(appFactory.user.$id);

            var noTrainer = true;
            for (var j = 0; j < $scope.checked.length; j++) {
                noTrainer = false;
                $scope.newrequest.trainerID = $scope.checked[j].id;
                $scope.newrequest.trainerName = $scope.checked[j].username;
                (function(mNewrequest) {
                    console.log(mNewrequest);
                    var newReqRef = requestRef.push(mNewrequest);
                    console.log(newReqRef.key());

                    newReqRef.setPriority(mNewrequest.created);

                    var incomingRequestRef = IncomingRequests.ref().child(mNewrequest.trainerID).child(newReqRef.key());

                    incomingRequestRef.set(mNewrequest);
                    incomingRequestRef.setPriority(appFactory.user.$id);
                }($scope.newrequest));

                if(j == $scope.checked.length -1){
                    alert("Requests sent to trainers.");
                    window.location.href = "#/menu/map";
                }

            }

            if(noTrainer){
                alert("please select trainer");
                return;
            }
        });
    }
});

trainer.directive('schedulerUserView', function($timeout, $firebaseObject, appFactory, $ionicPopup, Schedule, $firebaseArray, Transactions, MyTransactions) {
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
                scope.active.push(-1);
                scope.active.push(-1);
            });
            console.log(slots.half);
            var now = new Date();
            scope.minDate = now;
            scope.dt = now;

            scope.selectTime = function(i){
                scope.chosen[i] = 1 - scope.chosen[i];
//                console.log(scope.chosen);
//
//                var count = 0;
//                for(var i=0; i<scope.chosen.length; i++){
//                    if(scope.chosen[i] == true){
//                        count++;
//                    }
//                }
//                scope.amount = 25*count;
            }

            scope.printTime = function(){
                console.log(scope.dt);
            }
            scope.collapse = true;

            var daySchedule;

            scope.$watch('dt', function (newValue, oldValue) {
                console.log(scope.dt);
                scope.theday = scope.dt.getFullYear() + "-" + scope.dt.getMonth() + "-" + scope.dt.getDate();
                daySchedule = $firebaseObject(Schedule.ref().child(scope.selectedTrainer.$id).child(scope.theday));
                daySchedule.$loaded(function(){
                    if(daySchedule.active){
                        scope.active = daySchedule.active;
                    } else {
                        for(var i=0; i<scope.active.length; i++){
                            scope.active[i] = -1;
                        }
                    }
                    scope.timeslots = [];
                    scope.chosen = [];
                    for(var i=0; i<scope.active.length; i++){
                        if(scope.active[i] == 0){
                            scope.timeslots.push(slots.half[i]);
                            scope.chosen.push(0);
                        }
                    }
                    console.log(scope.chosen);
                })
            }, true);

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

                var transactions = Transactions.ref().child(scope.selectedTrainer.$id);
                var myTransactions = MyTransactions.ref().child(appFactory.user.$id);

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
                    var starttime = scope.dt.getFullYear() + "-" + (scope.dt.getMonth()+1) + "-" + curdate + "T" + time + ":00";
                    console.log(starttime);
//                    var utcstarttime = new Date(starttime.getTime() + starttime.getTimezoneOffset() * 60000);
//                    var epoch = utcstarttime.getTime();
//                    console.log(utcstarttime);
                    var startTimestamp = scope.dt.getTime();
                    console.log(startTimestamp);

                    var transaction = {
                        userID: appFactory.user.$id,
                        trainerID: scope.selectedTrainer.$id,
                        trainerName: scope.selectedTrainer.username,
                        tokens: 2,
                        created: Date.now(),
                        duration: bookedReduced[i].period,
                        starttime: starttime,
                        startTimestamp: startTimestamp
                    };

                    (function(newTransaction){
                        console.log(newTransaction);
                        var transactionRef = transactions.push(newTransaction);
                        transactionRef.setPriority(startTimestamp);
                        console.log(transactionRef.key());
                        newTransaction.reviewed = false;
                        newTransaction.scanned = false;
                        myTransactions.child(transactionRef.key()).set(newTransaction);
                        myTransactions.child(transactionRef.key()).setPriority(startTimestamp);
                    }(transaction));
                }

                for(var i=0; i<slots.half.length; i++){
                    for(var j=0; j<booked.length; j++){
                        if(slots.half[i] == booked[j].starttime){
                            console.log(booked[j].starttime);
                            console.log(daySchedule.active[i]);
                            daySchedule.active[i] = 1;
                        }
                    }
                }
                daySchedule.$save().then(function(){
                    alert("That worked :D");
                });

            }
        }
    }
});

trainer.directive('scheduler', function($timeout, appFactory, $firebaseArray, $firebaseObject, Schedule){
    return {
        restrict: "E",
        transclude: 'true',
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
                scope.active.push(-1);
                scope.active.push(-1);
            });

            scope.timeslots = slots.half;

            scope.selectTime = function(i){
                scope.active[i] = -1 - scope.active[i];
            }

            scope.confirm = function () {
                var name = scope.dt.getFullYear() + "-" + scope.dt.getMonth() + "-" + scope.dt.getDate();
                var daySchedule = $firebaseObject(Schedule.ref().child(appFactory.user.$id).child(name));
                daySchedule.active = scope.active;

                daySchedule.$save().then(function(){
                    alert("Sechdule saved, thanks");
                });

            }
            scope.printTime = function(){
                console.log(scope.dt);
            }

            scope.collapse = true;
            scope.$watch('dt', function () {
                var name = scope.dt.getFullYear() + "-" + scope.dt.getMonth() + "-" + scope.dt.getDate();

                var daySchedule = $firebaseObject(Schedule.ref().child(appFactory.user.$id).child(name));
                daySchedule.$loaded(function(){
                    if(daySchedule.active){
                        scope.active = daySchedule.active;
                    } else {
                        for(var i=0; i<scope.active.length; i++){
                            scope.active[i] = -1;
                        }
                    }
                })

            }, true);
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


