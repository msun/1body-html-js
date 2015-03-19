var trainer = angular.module('trainerModule', ['ionic', 'accountModule', 'starter', 'ui.bootstrap', 'ui.calendar', 'eventModule']);

trainer.factory('Time', function(){
    var Time = function(hour, minute){
        this.hour = hour;
        this.minute = minute;
    }
    return Time;
});


trainer.controller('TrainerDetailCtrl', function(mapFactory, Review, Transactions, MyTransactions, Trainers, $ionicModal, $firebaseObject, $firebaseArray, $scope, Users, appFactory, $timeout, $stateParams, accountFactory, $ionicPopup, $rootScope, GeoTrainers, Reviews, appConfig) {
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
        $scope.reviewModal = modal;
    });

    $ionicModal.fromTemplateUrl('js/trainer/templates/image.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.imageModal = modal;
    });

    var loadMap = function(){
        $scope.map = mapFactory.initialize([], "trainer-detail-", {latitude: $scope.selectedTrainerLocation.l[0], longitude: $scope.selectedTrainerLocation.l[1]}, []);
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

    if(appFactory.trainers[$scope.trainerName].refreshed){
        $scope.selectedTrainer = appFactory.trainers[$scope.trainerName];
    } else {
        $scope.selectedTrainer = $firebaseObject(Trainers.ref().child($scope.trainerName));
    }

    $scope.follow = function(){
        if(!appFactory.user.following){
            appFactory.user.following = [];
        }
        appFactory.user.following[$scope.selectedTrainer.$id] = {

        }
    }

    $scope.selectedTrainerLocation = $firebaseObject(GeoTrainers.ref().child($scope.trainerName));

    $scope.selectedTrainerLocation.$loaded(function(){
//        loadMap();
    });

    console.log($scope.selectedTrainer);


    var transactions = Transactions.ref().child($scope.selectedTrainer.$id);

//    var myTransactions = $firebaseObject(MyTransactions.ref().child(appFactory.user.$id).orderByChild("trainerID").equalTo($scope.selectedTrainer.$id));
//    console.log(myTransactions);
    $scope.addTransaction = function(){
        var newTransaction = {
            userID: appFactory.user.$id,
            trainerID: $scope.selectedTrainer.$id,
            created: Date.now(),
            $priority: Date.now()
        };

        var transactionRef = transactions.push(newTransaction);
        console.log(transactionRef.key());
        newTransaction.reviewed = false;
        myTransactions[transactionRef.key()] = newTransaction;
        myTransactions.$save().then(function(ref) {
            console.log(ref.key());

        }, function(error) {
            console.log("Error:", error);
        });
    };

    var reviewRef = Reviews.ref().child($scope.selectedTrainer.$id);

    console.log(appConfig);
    var reviewPriority = 0;
    $scope.reviews = $firebaseArray(reviewRef.startAt(reviewPriority).limitToFirst(appConfig.defaultItemsPerPage));
    $scope.reviews.$loaded(function(){
        console.log($scope.reviews);
        reviewPriority = $scope.reviews[$scope.reviews.length - 1].$priority + 1;
        console.log(reviewPriority);
    });

    $scope.moreReviews = function(){
        $scope.reviews = $firebaseArray(reviewRef.startAt(reviewPriority).limitToFirst(appConfig.defaultItemsPerPage));
        $scope.reviews.$loaded(function(){
            console.log($scope.reviews);
            reviewPriority = $scope.reviews[$scope.reviews.length - 1].$priority + 1;
            console.log(reviewPriority);
        });
    };

    $scope.addReview = function(){
        var newReview = {
            userID: appFactory.user.$id,
            trainerID: $scope.selectedTrainer.$id,
            created: Date.now(),
            $priority: Date.now()
        };

        var newReviewRef = $scope.reviews.$add(newReview);
//        console.log(newReviewRef.key());
//        newReview.reviewed = false;
    };

//
//    var queryref = myTransactions.$ref().orderByChild("trainerID").equalTo($scope.selectedTrainer.$id);
//    console.log(queryref);
//    var queriedArray = $firebaseArray(queryref);
//    queriedArray.$loaded(function(){
//        console.log(queriedArray);
//    });




//    var userRef = appFactory.userRef.child(appFactory.user.$id).child("transactions");
//    var userTsct = $firebase(userRef);
//    var array = userTsct.$asArray();
//    array.$loaded(function(){
//        console.log(array);
//    });
//
//    var trainerRef = Trainers.ref().child($scope.selectedTrainer.$id).child("transactions");
//    var trainerTsct = $firebase(trainerRef);
//    var showing = false;
//
//    var showScanQR = function(transaction){
//        if(!showing){
//            $timeout(function(){
//                showing = true;
//                $rootScope.offline = true;
//                $rootScope.link = "#/menu/account/qrcode/" + transaction.$id;
//                $rootScope.warningMsg = "Get ready for your workout, click me to scan your QRcode";
//                $rootScope.click = function(){
//                    console.log($rootScope.link);
//                    window.location.href = "#/menu/account/qrcode/" + transaction.$id;
//                    $rootScope.offline = false;
//                }
//            })
//        }
//    }
//
//    var showLeaveReview = function(transaction){
//        if(!showing){
//            $timeout(function(){
//                showing = true;
//                $rootScope.offline = true;
////                $rootScope.link = "#/tab/account/qrcode/" + transaction.$id;
//                $rootScope.warningMsg = "Please leave a review";
//                $rootScope.click = function(){
//                    console.log($rootScope.link);
////                    window.location.href = "#/tab/account/qrcode/" + transaction.$id;
//                    $scope.modal.show();
//                    $rootScope.offline = false;
//                }
//            })
//        }
//    }
//
//    $scope.showAddReview = function() {
//        var returnval = false;
//        array.forEach(function (item) {
//            if (item.trainerID == $scope.selectedTrainer.$id) {
////                console.log(item);
//                if (!item.leftreview && !item.scanned){
//                    setTimeout(showScanQR(item), 5000);
//                }
//                if (!item.leftreview && item.scanned) {
//                    $scope.transaction = new Transaction(item);
//                    console.log($scope.transaction);
//                    setTimeout(showLeaveReview(item), 1000);
//                    returnval = true;
//                }
//            }
//        });
//        return returnval;
//    }

    $scope.showReviewModal = function(){
        $scope.reviewModal.show();
    }

    $scope.closeReviewModal = function(){
        $scope.reviewModal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.reviewModal.remove();
        $scope.imageModal.remove();
    });


//    $scope.addReview = function(){
//        $scope.transaction.disableReview();
//        if($scope.newreview.text && $scope.newreview.text.length > 0){
//            var newreview = new Review(appFactory.user, $scope.selectedTrainer, $scope.newreview.text, $scope.transaction.$id);
//            newreview.add();
//            $scope.reviewModal.remove();
//        } else {
//            alert("Review cannot be empty");
//        }
//    };

    $scope.openImageModal = function(){
        $scope.imageModal.show();
        $scope.bigimage = $firebase(Images.ref().child($scope.selectedTrainer.$id).child("profilepic")).$asObject();
        $scope.bigimage.$loaded(function(){
            console.log($scope.bigimage);
        });
    };

    $scope.closeImageModal = function(){
        $scope.imageModal.hide();
    };

    $scope.follow = function(){
        var followers = $firebase(Followers.ref().child($scope.selectedTrainer.$id).child(appFactory.user.$id)).$asObject();
        followers.$loaded(function() {
            followers.username = appFactory.user.username;
            if(appFactory.user.profilepic){
                followers.profilepic = appFactory.user.profilepic;
            }
            if(appFactory.user.info){
                followers.info = appFactory.user.info;
            }
            followers.$save();
        });

        var following = $firebase(Following.ref().child(appFactory.user.$id).child($scope.selectedTrainer.$id)).$asObject();
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
                alert("Following user: " + $scope.selectedTrainer.username);
            });
        });
    };
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

trainer.controller('MobileTrainerRequestCtrl', function($ionicModal, $ionicPopup, $scope, User, appFactory, $timeout, $stateParams, $firebase, eventFactory, apikey, Requests, GeoRequests, Trainers) {
    $scope.newrequest = {};
    $scope.newrequest.duration = 30;

    $scope.mobile_trainers = [];

    $timeout(function(){
        for(var i=0; i< appFactory.trainers.length; i++){
            if(appFactory.trainers[i].mobile){
                $scope.mobile_trainers.push(appFactory.trainers[i]);
            }
        }
        console.log($scope.mobile_trainers);
    })


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
                mobile.checked = false;
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

            $scope.newrequest.created = Date.now();
            $scope.newrequest.trainers = [];

            var noTrainer = true;
            for (var j = 0; j < $scope.checked.length; j++) {
                noTrainer = false;
                $scope.newrequest.trainers[$scope.checked[j].id] = {trainerAccecpted: false, created: $scope.newrequest.created, trainer: $scope.checked[j].username, starttime: $scope.newrequest.starttime};
            }

            if(noTrainer){
                alert("please select trainer");
                return;
            }

            console.log($scope.newrequest);
            Requests.sync().$push($scope.newrequest).then(function (ref) {
                console.log(ref.path.m[1]);
                var requestID = ref.path.m[1];
                GeoRequests.set(requestID, [$scope.newrequest.latitude, $scope.newrequest.longitude]).then(function () {
                    console.log("Provided key has been added to GeoFire");
                });

                if (!appFactory.user.requests) {
                    appFactory.user.requests = [];
                }

                appFactory.user.requests[requestID] = $scope.newrequest.trainers;
                appFactory.user.$save().then(function () {
                    var numTrainerSaved = 0;
                    for (var j = 0; j < $scope.checked.length; j++) {
                        var temp = $scope.checked[j].id;
                        console.log($scope.checked[j]);
                        (function(t_id) {
                            console.log(t_id);
                            var m_trainer = $firebase(Trainers.ref().child(t_id)).$asObject();
                            m_trainer.$loaded(function () {
                                console.log(m_trainer);
                                if (!m_trainer.incoming_requests) {
                                    m_trainer.incoming_requests = [];
                                }
                                m_trainer["incoming_requests"][requestID] = {userID: appFactory.user.$id, accepted: false, created: $scope.newrequest.created, starttime: $scope.newrequest.starttime, username: appFactory.user.username, profilepic: appFactory.user.profilepic, latitude: $scope.newrequest.latitude, longitude: $scope.newrequest.longitude, message:$scope.newrequest.message};
                                console.log(m_trainer);
                                m_trainer.$save().then(function () {
                                    numTrainerSaved++;
                                    if (numTrainerSaved == $scope.checked.length) {
                                        alert(numTrainerSaved);
                                        window.location.href = "#/menu/map";
                                    }
                                    console.log("trainer " + m_trainer.$id + " saved.");
                                })
                            })
                        }(temp));
                    }
                });
            });
        });
    }
});

trainer.directive('schedulerUserView', function($timeout, appFactory, $ionicPopup) {
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
//                    var newtransaction = new Transaction(appFactory.user, scope.selectedTrainer, bookedReduced[i].period*30, bookedReduced[i].period*30, epoch);
//                    console.log(newtransaction);
//
//                    var successCallback = function(result){
//                        console.log(result);
//                        newtransaction.add(function () {
//                            if(i==bookedReduced.length-1){
//
//                                var alertPopup = $ionicPopup.alert({
//                                    title: 'Success',
//                                    template: 'Transactions Added Successfully'
//                                });
//                                alertPopup.then(function (res) {
//                                    console.log('popup closed');
//                                });
//                            }
//                        });
//                    }
//                    var errorCallback = function(result){
//                        console.log(result);
//                    }
//
//                    exec(successCallback, errorCallback, 'Card_io', 'paypalpayment', [
//                        {amount: scope.amount, currency: "cad", type: "training"}
//                    ]);



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


