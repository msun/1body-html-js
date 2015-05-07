var trainer = angular.module('trainerModule', ['ionic', 'accountModule', 'starter', 'ui.bootstrap', 'ui.calendar', 'eventModule']);

trainer.factory('Time', function(){
    var Time = {};
    Time.parseTime = function(time) {
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
    return Time;
});

trainer.controller('ConversationCtrl', function($scope, $localstorage, Conversations, Users, Trainers, $ionicModal, $firebaseObject, $firebaseArray, appFactory, $timeout, $stateParams, $window, appConfig, Notifications){
    console.log($stateParams.userID);
    var conversationID = "";
    if($stateParams.userID.localeCompare(appFactory.user.$id) > 0){
        conversationID = $stateParams.userID + ":::" + appFactory.user.$id;
    } else if($stateParams.userID.localeCompare(appFactory.user.$id) < 0){
        conversationID = appFactory.user.$id + ":::" + $stateParams.userID;
    } else {
        alert("please do not talk to yourself");
        $window.history.back();
    }

    $scope.newmessage = {};
    $scope.users = {};
    $scope.users[appFactory.user.$id] = appFactory.user;

    if(appFactory.users[$stateParams.userID]){
        $scope.users[$stateParams.userID] = appFactory.users[$stateParams.userID];
        console.log($scope.users);
    } else {
        var user = $firebaseObject(Trainers.ref().child($stateParams.userID));
        user.$loaded(function(){
            $scope.users[$stateParams.userID] = user;
            console.log($scope.users);
            appFactory.users[$stateParams.userID] = user;
            $localstorage.setObject("Users", appFactory.users);
        });
    }

    $scope.messages = $firebaseArray(Conversations.ref().child(conversationID).limitToLast(appConfig.defaultItemsPerPage));

    $scope.addNewMessage = function(){
        $scope.newmessage.created = new Date().getTime();
        $scope.newmessage.userID = appFactory.user.$id;

        $scope.messages.$add($scope.newmessage).then(function(){
            console.log($scope.newmessage);

            var notif = {
                creatorID: appFactory.user.$id,
                starttime: new Date().getTime(),
                url: "#/menu/conversations/" + appFactory.user.$id,
                receivers: [$stateParams.userID],
                message: appFactory.user.username + " has left you a message: " + $scope.newmessage.text
            }

            Notifications.ref().push(notif);

            $scope.newmessage.text = "";
        });
    }
});


trainer.controller('TrainerDetailCtrl', function(mapFactory, $localstorage, Sizes, Review, MyReviews, Transactions, MyTransactions, Trainers, $ionicModal, $firebaseObject, $firebaseArray, $scope, Users, appFactory, $timeout, $stateParams, accountFactory, $ionicPopup, $rootScope, GeoTrainers, GeoGyms, Reviews, appConfig, Followers, Following, Notifications, Feeds) {
    console.log($stateParams.trainerName);
    $scope.trainerName = $stateParams.trainerName;
    $scope.max = 5;
    $scope.rate = 0;
    $scope.chosen = [];
    $scope.timeslots = [];
    $scope.amount = 0;
    $scope.isReadonly = false;
    $scope.newreview = {rating:0};
    $scope.reviewRating = 0;
    $scope.numOfFollowers = 0;
    $scope.numOfFollowing = 0;

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

        $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("trainerID").equalTo($scope.selectedTrainer.$id));

        if($scope.selectedTrainer.gym && $scope.selectedTrainer.gym.gymID){
            $scope.selectedTrainerLocation = $firebaseObject(GeoGyms.ref().child($scope.selectedTrainer.gym.gymID));
        } else {
            $scope.selectedTrainerLocation = $firebaseObject(GeoTrainers.ref().child($scope.trainerName));
        }

        $scope.selectedTrainerLocation.$loaded(function () {
            console.log($scope.selectedTrainerLocation);
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
        $scope.reviews = $firebaseArray(reviewRef.orderByPriority().endAt(Date.now()).limitToLast(appConfig.defaultItemsPerPage));

        $scope.moreReviews = function(){
            $scope.reviews = $firebaseArray(reviewRef.orderByPriority().endAt($scope.reviews[0].$priority).limitToLast(appConfig.defaultItemsPerPage));
        };
    }

    if(appFactory.users[$scope.trainerName] && appFactory.users[$scope.trainerName].refreshed){
        $scope.selectedTrainer = appFactory.users[$scope.trainerName];
        loadData();
    } else {
        $scope.selectedTrainer = $firebaseObject(Trainers.ref().child($scope.trainerName));
        $scope.selectedTrainer.$loaded(function(){
            appFactory.users[$scope.trainerName] = $scope.selectedTrainer;
            appFactory.users[$scope.trainerName].refreshed = true;
            alert("loaded from firebase");
            $localstorage.setObject("Users", appFactory.users);
            loadData();
        })
    }

    $scope.addReview = function(){
        var newReview = {
            userID: appFactory.user.$id,
            trainerID: $scope.selectedTrainer.$id,
            text: $scope.newreview.text,
            rating: $scope.newreview.rating,
            created: Firebase.ServerValue.TIMESTAMP,
            $priority: Firebase.ServerValue.TIMESTAMP
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
                $scope.transaction.reviewed = true;
                $scope.myTransactions.$save($scope.transaction).then(function(){
                    alert("Review added");
                    $scope.closeReviewModal();
                });
            });
            var myreview = $firebaseObject(MyReviews.ref().child(appFactory.user.$id).child(ref.key()));
            myreview.userID = appFactory.user.$id;
            myreview.trainerID = $scope.selectedTrainer.$id;
            myreview.text = $scope.newreview.text;
            myreview.rating = $scope.newreview.rating;
            myreview.created = Firebase.ServerValue.TIMESTAMP;
            myreview.$priority = Firebase.ServerValue.TIMESTAMP;
            myreview.$save();

            Feeds.push("Users",
                $scope.selectedTrainer.$id,
                $scope.selectedTrainer.username,
                "You left a review for " + $scope.selectedTrainer.username,
                appFactory.user.username + " left you a review"
            );
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
    };

    $scope.closeImageModal = function(){
        $scope.imageModal.hide();
    };

    $scope.rateTrainer = function(rating){
        $scope.reviewRating = rating
    }

    $scope.follow = function(){
        $scope.followerMe.username = appFactory.user.username;
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
            following.modified = Firebase.ServerValue.TIMESTAMP;
            following.$priority = following.modified;
            if($scope.selectedTrainer.info){
                following.info = $scope.selectedTrainer.info;
            }
            console.log(appFactory.mysizes);
            following.$save().then(function(){
                if(appFactory.mysizes.numOfFollowing){
                    appFactory.mysizes.numOfFollowing++;
                } else {
                    appFactory.mysizes.numOfFollowing = 1;
                }
                appFactory.mysizes.$save();

                var notif = {
                    creatorID: appFactory.user.$id,
                    starttime: Firebase.ServerValue.TIMESTAMP,
                    url: "#/menu/Users/" + appFactory.user.$id,
                    receivers: [$scope.selectedTrainer.$id],
                    message: appFactory.user.username + " is following you."
                };
                Notifications.ref().push(notif);

                Feeds.push("Users",
                    $scope.selectedTrainer.$id,
                    $scope.selectedTrainer.username,
                    "You followed " + $scope.selectedTrainer.username,
                    appFactory.user.username + " followed you"
                );
                alert("Following user: " + $scope.selectedTrainer.username);
            });
        });
    };

    $scope.unfollow = function(){
        $scope.followerMe.$remove().then(function(){
            $scope.sizes.numOfFollowers--;
            $scope.sizes.$save();
        });

        var following = $firebaseObject(Following.ref().child(appFactory.user.$id).child($scope.selectedTrainer.$id));
        following.$remove().then(function() {
            appFactory.mysizes.numOfFollowing--;
            appFactory.mysizes.$save();

            var notif = {
                creatorID: appFactory.user.$id,
                starttime: Firebase.ServerValue.TIMESTAMP,
                url: "#/menu/Users/" + appFactory.user.$id,
                receivers: [$scope.selectedTrainer.$id],
                message: appFactory.user.username + " has stopped following you."
            };
            Notifications.ref().push(notif);

            Feeds.push("Users",
                $scope.selectedTrainer.$id,
                $scope.selectedTrainer.username,
                "You unfollowed " + $scope.selectedTrainer.username,
                appFactory.user.username + " followed you"
            );

            alert("Following user: " + $scope.selectedTrainer.username);
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

trainer.controller('MobileTrainerRequestCtrl', function($ionicModal, $ionicPopup, $scope, User, appFactory, $timeout, $stateParams, $firebaseObject, eventFactory, apikey, Requests, GeoRequests, Trainers, IncomingRequests, Schedule) {
    $scope.newrequest = {};
    $scope.newrequest.duration = 30;
    $scope.dt = Date.now();

    $scope.mobile_trainers = [];

    $ionicModal.fromTemplateUrl('js/trainer/templates/choose-trainer-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

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
                            $scope.newrequest.address = data.results[0].formatted_address;
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

        var theday = $scope.dt.getFullYear() + "-" + $scope.dt.getMonth() + "-" + $scope.dt.getDate();
        for(var key in appFactory.users){
            if(!appFactory.users.hasOwnProperty(key)){
                continue;
            }

            if(appFactory.users[key].mobile){
                $scope.mobile_trainers.push(appFactory.users[key]);
//                (function(id){
//                    var num = $scope.dt.getHours() * 2;
//                    if($scope.dt.getMinutes() == 30){
//                        num++;
//                    }
//                    console.log(num);
//                    console.log(theday);
//                    var availability = $firebaseObject(Schedule.ref().child(key).child(theday).child("active").child(num));
//
//                    availability.$loaded(function(){
//                        console.log(availability);
//                        console.log(availability[num]);
//                        if(availability.$value == 0){
//                            $scope.mobile_trainers.push(appFactory.users[id]);
//                        }
//                    });
//
//
//                }(key));
            }
        }
        console.log($scope.mobile_trainers);
    }

    $scope.showOnMap = function(item){
        var center = new google.maps.LatLng(item.location[0], item.location[1]);
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
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newrequest.address.replace(/ /g, "+") + "&key=" + apikey;
        eventFactory.getStreetAddress(url, function(data, status) {
            console.log(data);
            $scope.newrequest.location = [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];

            $scope.newrequest.starttime = $scope.dt.getTime();

            $scope.newrequest.userID = appFactory.user.$id;
            $scope.newrequest.userName = appFactory.user.username;
            $scope.newrequest.duration = $scope.newrequest.minutes / 30;

            $scope.newrequest.created = Date.now();

            var requestRef = Requests.ref();

            var noTrainer = true;
            for (var j = 0; j < $scope.checked.length; j++) {
                noTrainer = false;
                $scope.newrequest.trainerID = $scope.checked[j].id;
                $scope.newrequest.trainerName = $scope.checked[j].username;
                (function(mNewrequest) {
                    console.log(mNewrequest);
                    var newReqRef = requestRef.push(mNewrequest);
                    console.log(newReqRef.key());

                    newReqRef.setPriority($scope.newrequest.created);

//                    var incomingRequestRef = IncomingRequests.ref().child(mNewrequest.trainerID).child(newReqRef.key());
//
//                    incomingRequestRef.set(mNewrequest);
//                    incomingRequestRef.setPriority(appFactory.user.$id);
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

trainer.directive('schedulerUserView', function($timeout, $firebaseObject, appFactory, $ionicPopup, Schedule, $firebaseArray, Transactions, MyTransactions, Notifications, Feeds) {
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
                daySchedule = $firebaseObject(Schedule.ref().child(scope.trainerName).child(scope.theday));
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
                        type: "Users",
                        created: Firebase.ServerValue.TIMESTAMP,
                        duration: bookedReduced[i].period,
                        starttime: startTimestamp
                    };


                    (function(newTransaction){
                        console.log(newTransaction);
                        var transactionRef = transactions.push(newTransaction, function(){
                            transactionRef.setPriority(startTimestamp);
                            console.log(transactionRef.key());
                            var notifToTrainer = {
                                creatorID: appFactory.user.$id,
                                starttime: Firebase.ServerValue.TIMESTAMP,
                                url: "#/menu/Trainers/" + appFactory.user.$id + "/",
                                receivers: [scope.selectedTrainer.$id],
                                message: "A training was booked by user: " + appFactory.user.username + " at " + starttime
                            };
                            Notifications.ref().push(notifToTrainer, function(){
                                notifToTrainer.created = Firebase.ServerValue.TIMESTAMP;

                                Feeds.push("Users",
                                    $scope.selectedTrainer.$id,
                                    $scope.selectedTrainer.username,
                                    "You booked a training session with " + $scope.selectedTrainer.username + " at " + starttime,
                                    "A training was booked by user: " + appFactory.user.username + " at " + starttime
                                );
                            });


                            var notifToUser = {
                                creatorID: appFactory.user.$id,
                                starttime: newTransaction.starttime,
                                notifyPeriod:900000,
                                url: "#/menu/account/my-transactions",
                                receivers: [appFactory.user.$id],
                                message: "A training with: " + scope.selectedTrainer.username + " is starting at " + starttime
                            }
                            Notifications.ref().push(notifToUser);

                            newTransaction.reviewed = false;
                            newTransaction.scanned = false;

                            myTransactions.child(transactionRef.key()).set(newTransaction, function(){
                                myTransactions.child(transactionRef.key()).setPriority(startTimestamp);

                            });
                        });

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
                    scope.scheduleModal.hide();
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
                    window.location.href = "#/menu/map";
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

trainer.filter('displayTime', function(Time) {
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


