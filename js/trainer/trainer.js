var trainer = angular.module('trainerModule', ['ionic', 'accountModule', 'starter','react', 'eventModule', 'angularCharts']);

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

trainer.controller('MyConversationsCtrl', function($scope, Conversations, $state, $localstorage, Users, Trainers, $ionicModal, $firebaseObject, $firebaseArray, appFactory, $timeout, $stateParams, appConfig, Notifications){
    $scope.myConversations = $firebaseArray(Conversations.ref().child(appFactory.user.$id).child("metadata"));
    $scope.users = {};
    $scope.messages = {};

    $scope.myConversations.$watch(function(event){
        if(event.event == "child_added"){
//            $scope.myConversations.$getRecord(event.key).lastMessage.acknowledged = true;
//            $scope.myConversations.$save($scope.myConversations.$indexFor(event.key));
////            $scope.users[record.$id] = $firebaseObject(Users.ref().child(record.$id));
            $scope.messages[event.key] = $firebaseArray(Conversations.ref().child(appFactory.user.$id).child(event.key).limitToLast(1));
        }
    });

    $scope.clickConversation = function(conversation){
        $scope.myConversations.$getRecord(conversation.$id).lastMessage.acknowledged = true;
        $scope.myConversations.$save($scope.myConversations.$indexFor(conversation.$id));

        $state.transitionTo("menu.conversations", {userID: conversation.$id});
    }
    console.log($scope.myConversations);
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

    var messagesToGet = appConfig.defaultItemsPerPage;
    $scope.doRefresh = function(){
        messagesToGet += appConfig.defaultItemsPerPage;
        $scope.myMessages = $firebaseArray(Conversations.ref().child(appFactory.user.$id).child($stateParams.userID).limitToLast(messagesToGet));
        $scope.myMessages.$loaded(function(){
            $scope.$broadcast('scroll.refreshComplete');
        })
    };

    $scope.user = $firebaseObject(Trainers.ref().child($stateParams.userID));

    $scope.newmessage = {};
//    $scope.users = {};
//    $scope.users[appFactory.user.$id] = appFactory.user;
//
//    if(appFactory.users[$stateParams.userID]){
//        $scope.users[$stateParams.userID] = appFactory.users[$stateParams.userID];
//        console.log($scope.users);
//    } else {
//        $scope.user = $firebaseObject(Trainers.ref().child($stateParams.userID));
//        user.$loaded(function(){
//            $scope.users[$stateParams.userID] = user;
//            console.log($scope.users);
//            appFactory.users[$stateParams.userID] = user;
//            $localstorage.setObject("Users", appFactory.users);
//        });
//    }

    $scope.myMessages = $firebaseArray(Conversations.ref().child(appFactory.user.$id).child($stateParams.userID).limitToLast(appConfig.defaultItemsPerPage));
    $scope.myMessages.$watch(function(event) {
        console.log(event);
        if(event.event == "child_added"){
            console.log($scope.myMessages.$getRecord(event.key));
            $scope.myMessages.$getRecord(event.key).acknowledged = true;
            $scope.myMessages.$save($scope.myMessages.$indexFor(event.key));
        }
    });

    $scope.hisMessages = $firebaseArray(Conversations.ref().child($stateParams.userID).child(appFactory.user.$id).limitToLast(appConfig.defaultItemsPerPage));

    $scope.addNewMessage = function(){
        $scope.newmessage.created = new Date().getTime();
        $scope.newmessage.userID = appFactory.user.$id;
        $scope.newmessage.acknowledged = true;

        $scope.myMessages.$add($scope.newmessage).then(function(){
            console.log($scope.newmessage);

            var notif = {
                creatorID: appFactory.user.$id,
                starttime: new Date().getTime(),
                url: "#/menu/conversations/" + appFactory.user.$id,
                receivers: [$stateParams.userID],
                message: appFactory.user.username + " has left you a message: " + $scope.newmessage.text
            }

            var metadata = $firebaseObject(Conversations.ref().child(appFactory.user.$id).child("metadata").child($stateParams.userID));
            metadata.username = $scope.user.username;
            metadata.lastModifiedDate = $scope.newmessage.created;
            metadata.lastMessage = $scope.newmessage;
            metadata.$save().then(function(){
                var hismessage = $scope.newmessage;
                hismessage.acknowledged = false;
                var hismetadata = $firebaseObject(Conversations.ref().child($stateParams.userID).child("metadata").child(appFactory.user.$id));
                hismetadata.username = appFactory.user.username;
                hismetadata.lastModifiedDate = $scope.newmessage.created;
                hismetadata.lastMessage = hismessage;
                hismetadata.$save();
                $scope.hisMessages.$add(hismessage).then(function(){
                    $scope.newmessage.text = "";
                });

            });

            Notifications.ref().push(notif);


        });


    }
});


trainer.controller('TrainerDetailCtrl', function(mapFactory, $localstorage, Sizes, Review, MyReviews, Transactions, MyTransactions, Trainers, $ionicModal, $firebaseObject, $firebaseArray, $scope, Users, appFactory, $timeout, $stateParams, $ionicPopup, $rootScope, GeoTrainers, GeoGyms, Reviews, appConfig, Followers, Following, Notifications, Feeds) {
    console.log($stateParams.trainerID);
    $scope.trainerID = $stateParams.trainerID;
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
    $scope.tabIndex = 0;

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

//    $ionicModal.fromTemplateUrl('js/trainer/templates/trainer-schedule-modal.html', {
//        scope: $scope,
//        animation: 'slide-in-up'
//    }).then(function(modal){
//        $scope.scheduleModal = modal;
//    });

    var loadMap = function(location){
        $scope.map = new google.maps.Map(document.getElementById('trainer-detail-map'), {
            zoom: 12,
            center: new google.maps.LatLng(location[0], location[1]),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        if($scope.marker){
            $scope.marker.setMap(null);
        }

        $scope.marker = new google.maps.Marker({
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
                center: new google.maps.LatLng(location[0], location[1]),
                radius: $scope.selectedTrainer.radius
            };
            // Add the circle for this city to the map.
            var trainerCircle = new google.maps.Circle(populationOptions);
        }
    }

    var loadData = function() {
        $scope.sizes = $firebaseObject(Sizes.ref().child($stateParams.trainerID));

        $scope.followerMe = $firebaseObject(Followers.ref().child($stateParams.trainerID).child(appFactory.user.$id));

        appFactory.selectedTrainer = $scope.selectedTrainer;

        /**TODO: review rework
         * 1. when transaction is processed, add review to trainer review list without content
         * 2. check list of trainer reviews in trainer detail page, find reviews without content
         *
         * 1. push new transaction into MyTransactions to get new unique id for transaction
         * 2. generate qr code with new unique id
         * 3. scan this code and save it to transcation in Transactions
         * 4. server monitors transcations and compares transacation with unique id from MyTranscations
         * 5. if matches, then reduce token otherwise do not process transaction
         **/
//        $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("sessionID").equalTo($scope.selectedTrainer.$id));

        $scope.emptyReviews = $firebaseArray(Reviews.ref().child($scope.selectedTrainer.$id).orderByChild("userID").equalTo(appFactory.user.$id));

        $scope.emptyReviews.$loaded(function(){
            console.log($scope.emptyReviews);
            for(var k=0; k<$scope.emptyReviews.length; k++){
                if(!$scope.emptyReviews[k].text){
//                    alert("Please leave a review");
//                    $scope.showReviewModal();
                    $scope.review = $scope.emptyReviews[k];
                    console.log($scope.review);
//                    $scope.transaction = $scope.myTransactions[i];
                    break;
                }
            }
        })


        if($scope.selectedTrainer.gym && $scope.selectedTrainer.gym.gymID){
            GeoGyms.get($scope.selectedTrainer.gym.gymID).then(function(location){
                locationReady(location);
            });
        } else {
            GeoTrainers.get($scope.trainerID).then(function(location){
                locationReady(location);
            });
        }

        function locationReady(location){
            appFactory.selectedTrainer.location = location;
            loadMap(location);

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
        }

        $scope.reviews = [];
        $scope.hasMoreReviews = true;
        var reviewRef = Reviews.ref().child($stateParams.trainerID);
        var reviewArray = $firebaseArray(reviewRef.orderByPriority().endAt(Date.now()).limitToLast(appConfig.defaultItemsPerPage));
        reviewArray.$loaded(function(){
            angular.forEach(reviewArray, function(value, key){
                console.log(value.$priority);
                $scope.reviews.push(value);
            });
            if(reviewArray.length < 5){
                $scope.hasMoreReviews = false;
            }
        });
//        $scope.reviews = $firebaseArray(reviewRef.orderByPriority().endAt(Date.now()).limitToLast(appConfig.defaultItemsPerPage));

        $scope.moreReviews = function(){
            console.log($scope.hasMoreReviews);
            if($scope.hasMoreReviews){
//                console.log("pri " + $scope.reviews[$scope.reviews.length - appConfig.defaultItemsPerPage].$priority);
                var moreReviewsArray = $firebaseArray(reviewRef.orderByPriority().endAt($scope.reviews[$scope.reviews.length - appConfig.defaultItemsPerPage].$priority - 1).limitToLast(appConfig.defaultItemsPerPage));
                moreReviewsArray.$loaded(function(){
                    angular.forEach(moreReviewsArray, function(value, key){
                        console.log(value.$priority);
                        $scope.reviews.push(value);
                    });
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    if(moreReviewsArray.length < 5){
                        $scope.hasMoreReviews = false;
                    }
                });
            }
        };
    };

    var loadFromFirebase = function(){
        var firebaseObj = $firebaseObject(Trainers.ref().child($scope.trainerID));
        firebaseObj.$loaded(function(){
            $scope.selectedTrainer = firebaseObj;
            appFactory.users[$scope.trainerID] = $scope.selectedTrainer;
            alert("loaded from firebase");
            console.log(appFactory.users);
            $localstorage.setObject("Users", appFactory.users);
            loadData();
        })
    };

    if(appFactory.users[$scope.trainerID]) {
        $scope.selectedTrainer = appFactory.users[$scope.trainerID];
        loadData();

        var lastModified = $firebaseObject(Users.ref().child($scope.trainerID).child("modified"));
        var savedModified = appFactory.users[$scope.trainerID]['modified'];
        lastModified.$loaded(function () {
            if (lastModified.$value > savedModified) {
                loadFromFirebase();
            }
        });
    } else {
        loadFromFirebase();
    }

    $scope.addReview = function(){
        var newReview = {
            userID: appFactory.user.$id,
            trainerID: $stateParams.trainerID,
            text: $scope.newreview.text,
            rating: $scope.newreview.rating,
            created: Firebase.ServerValue.TIMESTAMP,
            $priority: Firebase.ServerValue.TIMESTAMP
        };

        $scope.review.text = $scope.newreview.text;
        $scope.review.reviewAdded = Firebase.ServerValue.TIMESTAMP;
        $scope.review.$priority = Firebase.ServerValue.TIMESTAMP;

        console.log(newReview);

//        var newReviewRef = $scope.reviews.$add(newReview).then(function(ref) {
            if($scope.sizes.rating){
                $scope.sizes.numOfReviews++;
                $scope.sizes.rating += $scope.newreview.rating;
            } else {
                $scope.sizes.rating = $scope.newreview.rating;
                $scope.sizes.numOfReviews = 1;
            }

            $scope.sizes.$save().then(function(){
                console.log($scope.sizes);
                $scope.emptyReviews.$save($scope.review).then(function(){
                    alert("Review added");
                    $scope.closeReviewModal();
                });
                $scope.transaction.reviewed = true;
                $scope.myTransactions.$save($scope.transaction).then(function(){
                    alert("Review added");
                    $scope.closeReviewModal();
                });
            });
            var myreview = $firebaseObject(MyReviews.ref().child(appFactory.user.$id).child($scope.review.$id));
            myreview.userID = appFactory.user.$id;
            myreview.trainerID = $stateParams.trainerID;
            myreview.text = $scope.newreview.text;
            myreview.rating = $scope.newreview.rating;
            myreview.created = Firebase.ServerValue.TIMESTAMP;
            myreview.$priority = Firebase.ServerValue.TIMESTAMP;
            myreview.$save();

            Feeds.push("Users",
                $stateParams.trainerID,
                $scope.selectedTrainer.username,
                "You left a review for " + $scope.selectedTrainer.username,
                appFactory.user.username + " left you a review"
            );
//        });
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
//        $scope.scheduleModal.remove();
    });

//    $scope.showScheduleModal = function(){
//        $scope.scheduleModal.show();
//    }
//
//    $scope.closeScheduleModal = function(){
//        $scope.scheduleModal.hide();
//    }

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

trainer.controller('FollowersListCtrl', function($scope, appFactory, $timeout, $stateParams, GeoEvents, $firebaseArray, Followers, Trainers) {
    $scope.items = $firebaseArray(Followers.ref().child($stateParams.userID));

    $scope.items.$loaded(function(){
        console.log($scope.items);
    });
});

trainer.controller('FollowingListCtrl', function($scope, appFactory, $timeout, $stateParams, GeoEvents, $firebaseArray, Following, Trainers) {
    $scope.items = $firebaseArray(Following.ref().child($stateParams.userID));

    $scope.items.$loaded(function(){
        console.log($scope.items);
    });
});

trainer.controller('MobileTrainerRequestCtrl', function($ionicModal, $localstorage, Feeds, $ionicPopup, $scope,
                                                        appFactory, $timeout, $stateParams, $firebaseObject,
                                                        eventFactory, apikey, Requests, GeoRequests, Trainers,
                                                        IncomingRequests, Schedule, $ionicHistory) {
    $scope.newrequest = {};
    $scope.newrequest.minutes = 30;
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

        $scope.mobile_trainers = [];
        for(var key in appFactory.users){
            if(!appFactory.users.hasOwnProperty(key)){
                continue;
            }

            if(appFactory.users[key].mobile){
//                $scope.mobile_trainers.push(appFactory.users[key]);
                (function(id){
                    var num = $scope.dt.getHours() * 2;
                    if($scope.dt.getMinutes() >= 15){
                        num++;
                    }
                    console.log(num);
                    console.log(theday);
                    var availability = $firebaseObject(Schedule.ref().child(id).child(theday));

                    availability.$loaded(function(){
                        if(availability.active){
                            var add = true;
                            console.log(availability.active);
                            for(var i=num; i < num + $scope.newrequest.minutes/30; i++){
                                if(availability.active[i].status == 1){
                                    add = false;
                                    console.log(i);
                                    break;
                                }
                            }
                            if(add){
                                $scope.mobile_trainers.push(appFactory.users[id]);
                            }
                        } else {
                            $scope.mobile_trainers.push(appFactory.users[id]);
                        }
                    });
                }(key));
            }
        }
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
                    Feeds.push("Users",
                        $scope.newrequest.trainerID,
                        $scope.newrequest.trainerName,
                            "You have made a mobile training request at " + new Date(),
                            appFactory.user.username + " has made a mobile training request to you"
                    );
//                    var incomingRequestRef = IncomingRequests.ref().child(mNewrequest.trainerID).child(newReqRef.key());
//
//                    incomingRequestRef.set(mNewrequest);
//                    incomingRequestRef.setPriority(appFactory.user.$id);
                }($scope.newrequest));

                if(j == $scope.checked.length -1){
                    alert("Requests sent to trainers.");
                    $ionicHistory.goBack();
                }

            }

            if(noTrainer){
                alert("please select trainer");
                return;
            }
        });
    }
});

trainer.directive('schedulerUserView', function($timeout, $firebaseObject, appFactory, $ionicPopup, Schedule, $firebaseArray, Transactions, MyTransactions, Notifications, Feeds, $ionicPopup, TransactionQueue) {
    return {
        restrict: "E",
        templateUrl: "js/trainer/templates/schedulerUserView.html",
        link: function (scope, element, attr) {

        }
    }
});

trainer.controller('TransactionSearchTimeCtrl', function($scope, $ionicScrollDelegate, $location, $timeout, appConfig, $firebaseObject, Reviews, appFactory, Users, Schedule, $firebaseArray, Transactions, MyTransactions, $stateParams) {
    console.log($stateParams);
    $scope.total = 0;

    $scope.params = $stateParams;

    $scope.userTransactions = [];
    $scope.dayTransactions = [];
    $scope.hourTransactions = [];
    $scope.primeTransactions = [
        {
            prime: 'prime',
            transactions: [],
            total: 0
        },
        {
            prime: 'off',
            transactions: [],
            total: 0
        }
    ];
    $scope.predicate = "user";

    $scope.data1 = {
        series: ["User"],
        data: []
    };

    $scope.data2 = {
        series: ["Day"],
        data: []
    };

    $scope.data3 = {
        series: ["Hour"],
        data: []
    };

    $scope.data4 = {
        series: ["Prime/Off"],
        data: [
            {
                x: "prime",
                y:[0]
            },
            {
                x: "off",
                y:[0]
            }
        ]
    };

    $scope.data = $scope.data1;

    $scope.chartType = 'pie';

    $scope.predicateChange = function(predicate){
        console.log(predicate);
        if (predicate == "user"){
            $scope.data = $scope.data1;
        } else if (predicate == "hour") {
            $scope.data = $scope.data3;
        } else if (predicate == "day") {
            $scope.data = $scope.data2;
        } else if (predicate == "prime") {
            $scope.data = $scope.data4;
        }
    };

    $scope.scrollTo = function(index){
        $location.hash("anchor"+index);
        $ionicScrollDelegate.anchorScroll();
    };

    $scope.config1 = {
        labels: true,
        tooltips: true,
        click : function(d) {
            console.log(d.data.x);
            $scope.scrollTo(d.data.x);
        },
        title: "Income from user",
        legend: {
            display: true,
            position: 'left'
        },
        innerRadius: 0
    };


    if(!$stateParams.start){
        var tmpDate = new Date();
        tmpDate.setMonth(0);
        tmpDate.setDate(1);
        tmpDate.setHours(0);
        tmpDate.setMinutes(0);
        tmpDate.setSeconds(0);
        tmpDate.setMilliseconds(0);
        $scope.params.start = tmpDate.getTime();
    }

    if(!$stateParams.end){
        $scope.params.end = Date.now();
    }

    $scope.transactions = $firebaseArray(Transactions.ref().child(appFactory.user.$id).orderByPriority().startAt(parseInt($scope.params.start)).endAt(parseInt($scope.params.end)));

    $scope.transactions.$loaded(function(){
        console.log($scope.transactions);

        angular.forEach($scope.transactions, function(value, key){
            console.log(value);
            $scope.total += value.amount | value.tokens * appConfig.tokenRate;

            var tdate = new Date(parseInt(value.starttime));
            var dayInWeek = appConfig.daysOfWeek[tdate.getDay()];
            var hourInDay = appConfig.hoursOfDay[tdate.getHours()];

            var found = false;
            if(value.reviewID){
                value.review = $firebaseObject(Reviews.ref().child(appFactory.user.$id).child(value.reviewID));
            }

            if(value.prime){
                console.log($scope.data4);
                console.log($scope.primeTransactions[0]);

                $scope.primeTransactions[0].total += value.amount | value.tokens * appConfig.tokenRate;
                $scope.primeTransactions[0].transactions.push(value);
            } else {

                $scope.data4.data[1].y[0] += Math.round(value.tokens * appConfig.tokenRate*100)/100;
                $scope.primeTransactions[1].total += value.amount | value.tokens * appConfig.tokenRate;
                $scope.primeTransactions[1].transactions.push(value);
            }

            for(var i=0; i<$scope.dayTransactions.length; i++){
                if($scope.dayTransactions[i].dayInWeek == dayInWeek){
                    found = true;
                    $scope.dayTransactions[i].transactions.push(value);
                    $scope.dayTransactions[i].total += value.amount | value.tokens * appConfig.tokenRate;
                }
            }

            if(!found){
                $scope.dayTransactions.push({
                    dayInWeek: dayInWeek,
                    transactions: [value],
                    total: value.amount | value.tokens * appConfig.tokenRate
                });
            }

            found = false;

            for(var i=0; i<$scope.hourTransactions.length; i++){
                if($scope.hourTransactions[i].hourInDay == hourInDay){
                    found = true;
                    $scope.hourTransactions[i].transactions.push(value);
                    $scope.hourTransactions[i].total += value.amount | value.tokens * appConfig.tokenRate;
                }
            }

            if(!found){
                $scope.hourTransactions.push({
                    hourInDay: hourInDay,
                    transactions: [value],
                    total: value.amount | value.tokens * appConfig.tokenRate
                });
            }

            found = false;

            for(var i=0; i<$scope.userTransactions.length; i++){
                if($scope.userTransactions[i].userID == value.userID){
                    found = true;
                    $scope.userTransactions[i].transactions.push(value);
                    $scope.userTransactions[i].total += value.amount | value.tokens * appConfig.tokenRate;
                }
            }
            if(!found){
                $scope.userTransactions.push({
                    userID: value.userID,
                    userName: value.userName,
                    transactions: [value],
                    total: value.amount | value.tokens * appConfig.tokenRate
                });
            }

            found = false;
        });
        angular.forEach($scope.userTransactions, function(value, key){
//            if($scope.data1.series.indexOf(value.userName) < 0){
//                $scope.data1.series.push(value.userName);
//            }

            $scope.data1.data.push({
                x:value.userName,
                y:[Math.round(value.total*100)/100],
                tooltip: value.userName + ": " + value.total
            })
        });

        angular.forEach($scope.dayTransactions, function(value, key){
            $scope.data2.data.push({
                x:value.dayInWeek,
                y:[Math.round(value.total*100)/100],
                tooltip: value.dayInWeek + ": " + value.total
            })
        });

        angular.forEach($scope.hourTransactions, function(value, key){
            $scope.data3.data.push({
                x:value.hourInDay,
                y:[Math.round(value.total*100)/100],
                tooltip: value.hourInDay + ": " + value.total
            })
        });

        $scope.data4.data[0].y[0] += Math.round($scope.primeTransactions[0].total*100)/100;
        $scope.data4.data[1].y[0] += Math.round($scope.primeTransactions[1].total*100)/100;
        console.log($scope.data4);
        console.log($scope.data3);
    });

});

trainer.controller('TransactionSearchUserCtrl', function($scope, $timeout, appConfig, $firebaseObject, Reviews, appFactory, Users, Schedule, $firebaseArray, Transactions, MyTransactions, $stateParams) {
    console.log($stateParams);
    $scope.total = 0;

    $scope.params = $stateParams;

    $scope.monthlyTransactions = [];

    $scope.data1 = {
        series: ['Income by Month'],
        data: []
    };

    $scope.chartType = 'bar';

    $scope.config1 = {
        labels: false,
        tooltips: true,
        click : function(d) {
            console.log(d);
        },
        title: "Income from users",
        legend: {
            display: true,
            position: 'left'
        },
        innerRadius: 0
    };


    if(!$stateParams.start){
        var tmpDate = new Date();
        tmpDate.setMonth(0);
        tmpDate.setDate(1);
        tmpDate.setHours(0);
        tmpDate.setMinutes(0);
        tmpDate.setSeconds(0);
        tmpDate.setMilliseconds(0);
        $scope.params.start = tmpDate.getTime();
    }

    if(!$stateParams.end){
        $scope.params.end = Date.now();
    }

    if($stateParams.username){
        $scope.transactions = $firebaseArray(Transactions.ref().child(appFactory.user.$id).orderByChild("userName").equalTo($stateParams.username));
    } else if($stateParams.userID) {
        $scope.transactions = $firebaseArray(Transactions.ref().child(appFactory.user.$id).orderByChild("userID").equalTo($stateParams.userID));
    }

    $scope.transactions.$loaded(function(){
        console.log($scope.transactions);
        if($scope.transactions.length > 0){
            var tdate = new Date(parseInt($scope.transactions[0].starttime));
            var yearMonth = tdate.getFullYear() + "-" + tdate.getMonth();
            $scope.params.month = yearMonth;
        }

        angular.forEach($scope.transactions, function(value, key){
            console.log(value);
            $scope.total += value.amount | value.tokens * appConfig.tokenRate;

            var tdate = new Date(parseInt(value.starttime));
            var yearMonth = tdate.getFullYear() + "-" + (tdate.getMonth() + 1);
            value.yearMonth = tdate.getFullYear() + "-" + (tdate.getMonth() + 1);

            var found = false;
            if(value.reviewID){
                value.review = $firebaseObject(Reviews.ref().child(appFactory.user.$id).child(value.reviewID));
            }

            for(var i=0; i<$scope.monthlyTransactions.length; i++){
                if($scope.monthlyTransactions[i].yearMonth == yearMonth){
                    found = true;
                    $scope.monthlyTransactions[i].transactions.push(value);
                    $scope.monthlyTransactions[i].total += value.amount | value.tokens * appConfig.tokenRate;
                }
            }
            if(!found){
                $scope.monthlyTransactions.push({
                    yearMonth: yearMonth,
                    transactions: [value],
                    total: value.amount | value.tokens * appConfig.tokenRate
                });
            }
        });
        angular.forEach($scope.monthlyTransactions, function(value, key){
            $scope.data1.data.push({
                x:value.yearMonth,
                y:[value.total],
                tooltip: value.yearMonth + ": " + value.total
            })
        });
        console.log($scope.monthlyTransactions);
    });

});

trainer.controller('TransactionMonthlySearchCtrl', function($scope, $timeout, $firebaseObject, appFactory, Users, Schedule, $firebaseArray, Transactions, MyTransactions, $stateParams) {
    console.log($stateParams);
    $scope.total = 0;

    $scope.params = $stateParams;

    $scope.monthlyTransactions = [];

    if(!$stateParams.start){
        var tmpDate = new Date();
        tmpDate.setMonth(0);
        tmpDate.setDate(1);
        tmpDate.setHours(0);
        tmpDate.setMinutes(0);
        tmpDate.setSeconds(0);
        tmpDate.setMilliseconds(0);
        $scope.params.start = tmpDate.getTime();
    }

    if(!$stateParams.end){
        $scope.params.end = Date.now();
    }

    $scope.transactions = $firebaseArray(Transactions.ref().child(appFactory.user.$id).orderByPriority().startAt(parseInt($scope.params.start)).endAt(parseInt($scope.params.end)));

    $scope.transactions.$loaded(function(){
        console.log($scope.transactions);
        $scope.params.username = $scope.transactions[0].username;
        angular.forEach($scope.transactions, function(value, key){
            console.log(value);
            $scope.total += value.amount | value.tokens * appConfig.tokenRate;
            var tdate = new Date(parseInt(value.starttime));
            var yearMonth = tdate.getFullYear() + "-" + tdate.getMonth();
            value.yearMonth = tdate.getFullYear() + "-" + tdate.getMonth();

            var found = false;
            for(var i=0; i<$scope.monthlyTransactions.length; i++){
                if($scope.monthlyTransactions[i].yearMonth == yearMonth){
                    found = true;
                    $scope.monthlyTransactions[i].transactions.push(value);
                    $scope.monthlyTransactions[i].total += value.amount | value.tokens * appConfig.tokenRate;
                }
            }
            if(!found){
                $scope.monthlyTransactions.push({
                    yearMonth: yearMonth,
                    transactions: [value],
                    total: value.amount | value.tokens * appConfig.tokenRate
                });
            }
        })
        console.log($scope.monthlyTransactions);
    });

});

trainer.controller('TransactionDetailCtrl', function($scope, $state, $timeout, $firebaseObject, appFactory, Users, Schedule, $firebaseArray, Transactions, MyTransactions, $stateParams) {
    console.log($stateParams);
    angular.extend($scope, {
        layers: {
            baselayers: {

                googleRoadmap: {
                    name: 'Google Streets',
                    layerType: 'ROADMAP',
                    type: 'google'
                }
            }
        }
    });

    $scope.defaults = {
//            tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
        tileLayerOptions: {
            opacity: 0.9,
            detectRetina: true,
            reuseTiles: true
        },
        attributionControl: false,
        trackResize: false,
        zoomAnimation: false,
        zoomControl:false,
        minZoom: 8
    };

    $scope.center = {
        lat: appFactory.user.location[0],
        lng: appFactory.user.location[1],
        zoom: 13
    };

    $scope.transaction = $firebaseObject(Transactions.ref().child(appFactory.user.$id).child($stateParams.transactionID));
    $scope.transaction.$loaded(function(){
        console.log($scope.transaction);

        if($scope.transaction.location){
            $scope.center = {
                lat: $scope.transaction.location[0],
                lng: $scope.transaction.location[1],
                zoom: 13
            };
        }

        var showmessage = " Address: " + $scope.transaction.address;
        if($scope.transaction.commentlocation){
            showmessage = $scope.transaction.commentlocation + " " + showmessage;
        }

        if($scope.transaction.location) {
            $scope.markers = {
                trainingMarker: {
                    lat: $scope.transaction.location[0],
                    lng: $scope.transaction.location[1],
                    message: showmessage
                }
            };
        }

        if($scope.transaction.userID){
            $scope.user = $firebaseObject(Users.ref().child($scope.transaction.userID));
        }
        console.log($scope.user);
    });

    $scope.accountingThisUser = function(){
        if($scope.transaction.userID){
            $state.go('menu.transaction-search-user', {userID: $scope.transaction.userID});
        } else {
            $state.go('menu.transaction-search-user', {username: $scope.transaction.username});
        }

    };

    $scope.accountingThisMonth = function(){
        var firstDay = new Date();
        firstDay.setDate(1);
        firstDay.setHours(0);
        firstDay.setMinutes(0);
        firstDay.setSeconds(0);
        console.log(firstDay);

        var lastDay = new Date();
        lastDay.setMonth(lastDay.getMonth() + 1);
        lastDay.setDate(1);
        lastDay.setHours(0);
        lastDay.setMinutes(0);
        lastDay.setSeconds(0);
        console.log(lastDay);

        $state.go('menu.transaction-search-time', {orderby: 'month', start: firstDay.getTime(), end: lastDay.getTime()});

    };
});

trainer.controller('TrainerScheduleCtrl', function($scope, $timeout, $firebaseObject, Trainers, appFactory, appConfig, Schedule, $firebaseArray, Transactions, MyTransactions, Notifications, Feeds, $ionicPopup, TransactionQueue, $stateParams) {
    $scope.trainerID = $stateParams.trainerID;
    $scope.trainerName = $stateParams.trainerName;
    $scope.selectedTrainer = $firebaseObject(Trainers.ref().child($stateParams.trainerID));
    console.log($stateParams);

    var slots = {
        hour: [],
        half: []
    }
    $scope.active = [];
    slots.hour = _.range(0, 2400, 100);
    slots.hour.forEach(function (hr) {
        slots.half.push(hr);
        slots.half.push(hr + 30);
        $scope.active.push({
            status: -1,
            prime: false
        });
        $scope.active.push({
            status: -1,
            prime: false
        });
    });
    console.log($scope.active);
    var now = new Date();
    $scope.minDate = now;

    now.setFullYear($stateParams.year);
    now.setMonth($stateParams.month);
    now.setDate($stateParams.day);
    console.log(now);
    $scope.dt = now;

    $scope.rules = $firebaseArray(Schedule.ref().child($scope.trainerID).child("rules"));

    $scope.selectTime = function(i){
        $scope.chosen[i].status = 1 - $scope.chosen[i].status;
    };

    $scope.printTime = function(){
        console.log($scope.dt);
    };

    $scope.collapse = true;

    var daySchedule;

    $scope.$watch('dt', function (newValue, oldValue) {
        $scope.rules.$loaded(function() {
            $scope.theday = $scope.dt.getFullYear() + "-" + $scope.dt.getMonth() + "-" + $scope.dt.getDate();
            console.log($scope.dt.getDay());
            console.log($scope.rules);
            for(var i=0; i<48;i++){
                $scope.active[i].status = -1;
            }

            daySchedule = $firebaseObject(Schedule.dateRef($scope.trainerID, $scope.dt));
            daySchedule.$loaded(function () {
                console.log(daySchedule);
                if (daySchedule.active) {
                    $scope.active = daySchedule.active;
                } else {
                    for (var i = 0; i < $scope.rules.length; i++) {
                        if ($scope.rules[i]) {
                            console.log($scope.rules[i]);
                        }
                        if($scope.rules[i][$scope.dt.getDay()] == 1){
                            console.log($scope.rules[i]);
                            $scope.active[$scope.rules[i].$id] = {
                                status: 0,
                                rate: appFactory.selectedTrainer.normalRate,
                                prime: false
                            };
                        } else if($scope.rules[i][$scope.dt.getDay()] == 2){
                            console.log($scope.rules[i]);
                            $scope.active[$scope.rules[i].$id] = {
                                status: 0,
                                rate: appFactory.selectedTrainer.normalRate,
                                prime: true
                            };
                        }
                    }
                }

                $timeout(function(){
                    console.log($scope.active);
                    $scope.timeslots = [];
                    $scope.chosen = [];
                    for (var i = 0; i < $scope.active.length; i++) {
                        if ($scope.active[i].status == 0) {
                            $scope.timeslots.push(slots.half[i]);
                            $scope.chosen.push($scope.active[i]);
                        }
                    }
                    console.log($scope.chosen);
                });

            })

        });

//                console.log(scope.dt);
//                scope.theday = scope.dt.getFullYear() + "-" + scope.dt.getMonth() + "-" + scope.dt.getDate();
//                daySchedule = $firebaseObject(Schedule.ref().child(scope.trainerID).child(scope.theday));
//                daySchedule.$loaded(function(){
//                    console.log(daySchedule);
//                    if(daySchedule.active){
//                        scope.active = daySchedule.active;
//                    } else {
//                        for(var i=0; i<scope.active.length; i++){
//                            scope.active[i] = -1;
//                        }
//                    }
//                    scope.timeslots = [];
//                    scope.chosen = [];
//                    for(var i=0; i<scope.active.length; i++){
//                        if(scope.active[i].status == 0){
//                            scope.timeslots.push(slots.half[i]);
//                            scope.chosen.push(scope.active[i]);
//                        }
//                    }
//                    console.log(scope.chosen);
//                })
    }, true);

    $scope.charge = function(){
        var booked = [];
        var starttime = 0;
        console.log($scope.selectedTrainer);

        for(var i=0; i < $scope.chosen.length; i++) {
            if ($scope.chosen[i].status == 1) {
                booked.push({
                    starttime: $scope.timeslots[i],
                    rate: $scope.chosen[i].rate
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
                period: 1,
                rate: parseInt(booked[0].rate)
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
                            bookedReduced[a].rate += parseInt(booked[i].rate);
                            found = true;
                        }
                    }
                }
                if(!found){
                    bookedReduced.push({
                        starttime: booked[i].starttime,
                        period: 1,
                        rate: parseInt(booked[i].rate)
                    })
                }
            }
        }
        console.log(bookedReduced);

        var transactions = Transactions.ref().child($scope.trainerID);
        var myTransactions = MyTransactions.ref().child(appFactory.user.$id);

        for(var i=0; i<bookedReduced.length; i++) {
            if(i>=1){
                break;
            }
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
            console.log(time);
            console.log(bookedReduced[i]);
            var curdate = $scope.dt.getDate();
            if(curdate.toString().length == 1){
                curdate = "0" + curdate.toString();
            }
            var starttime = $scope.dt.getFullYear() + "-" + ($scope.dt.getMonth()+1) + "-" + curdate + "T" + time + ":00";
            console.log(starttime);
//                    var utcstarttime = new Date(starttime.getTime() + starttime.getTimezoneOffset() * 60000);
//                    var epoch = utcstarttime.getTime();
//                    console.log(utcstarttime);
            var mDate = new Date();
            mDate.setFullYear($scope.dt.getFullYear());
            mDate.setMonth($scope.dt.getMonth());
            mDate.setDate($scope.dt.getDate());
            mDate.setHours(Math.floor(bookedReduced[i].starttime / 100));
            mDate.setMinutes(bookedReduced[i].starttime % 100);
            mDate.setSeconds(0);
            mDate.setMilliseconds(0);
            console.log(mDate);
            var startTimestamp = mDate.getTime();
            console.log(startTimestamp);
            var timezone = jstz.determine();

            var transaction = {
                userID: appFactory.user.$id,
                userName: appFactory.user.username,
                trainerID: $scope.trainerID,
                sessionID: $scope.trainerID,
                trainerName: $scope.trainerName,
                primeRate: $scope.selectedTrainer.primeRate | 5,
                normalRate: $scope.selectedTrainer.normalRate | 3,
                tokens: bookedReduced[i].rate,
                type: "Users",
                location: $scope.selectedTrainer.location,
                created: Firebase.ServerValue.TIMESTAMP,
                duration: bookedReduced[i].period,
                starttimeString: starttime,
                starttime: startTimestamp,
                emails: [$scope.selectedTrainer.email, appFactory.user.email],
                timezone: timezone.name(),
                source: 'web',
                scanned: false,
                reviewed: false
            };

            if (ionic.Platform.isAndroid()) {
                transaction.source = "android";
            }
            if (ionic.Platform.isIOS()) {
                transaction.source = "ios";
            }

            if($scope.selectedTrainer.address){
                transaction.address = $scope.selectedTrainer.address;
            }

            if($scope.selectedTrainer.commentlocation){
                transaction.commentlocation = $scope.selectedTrainer.commentlocation;
            }

            (function(newTransaction){

                var saveTransaction = function(){
                    console.log(newTransaction);
                    var transactionRef = TransactionQueue.ref().push(newTransaction, function(){
                        transactionRef.setPriority(startTimestamp);
                    });

//                            var notifToTrainer = {
//                                creatorID: appFactory.user.$id,
//                                starttime: Firebase.ServerValue.TIMESTAMP,
//                                url: "#/menu/Trainers/" + appFactory.user.$id + "/",
//                                receivers: [scope.trainerID],
//                                message: "A training was booked by user: " + appFactory.user.username + " at " + starttime
//                            };
//                            var notifToUser = {
//                                creatorID: appFactory.user.$id,
//                                starttime: newTransaction.starttime,
//                                notifyPeriod:900000,
//                                url: "#/menu/account/my-transactions",
//                                receivers: [appFactory.user.$id],
//                                message: "A training with: " + scope.trainerName + " is starting at " + starttime
//                            }

                    var addedTransactionRef = MyTransactions.ref().child(appFactory.user.$id);
                    addedTransactionRef.limitToLast(1).on('child_added', function(snapshot) {

                        // all records after the last continue to invoke this function
                        console.log(snapshot.key(), snapshot.val());
                        var addedTransaction = snapshot.val();
                        if(addedTransaction.starttime == newTransaction.starttime) {
                            addedTransactionRef.off();


//                            });
//
//                            var addedTransaction = $firebaseObject(Transactions.ref().child(transactionRef.key()));
//                            var unwatch = addedTransaction.$watch(function() {
                            if (addedTransaction.valid) {
//                                        Notifications.ref().push(notifToTrainer, function () {
//                                            notifToTrainer.created = Firebase.ServerValue.TIMESTAMP;

//                                            Feeds.push("Users",
//                                                scope.trainerID,
//                                                scope.trainerName,
//                                                    "You booked a training session with " + scope.trainerName + " at " + starttime,
//                                                    "A training was booked by user: " + appFactory.user.username + " at " + starttime
//                                            );

//                                            Notifications.ref().push(notifToUser);

//                                            if (ionic.Platform.isAndroid()) {
//                                                var myPopup = $ionicPopup.show({
//                                                    template: 'Would you like to save this to your calendar?',
//                                                    title: 'Save to calendar',
//                                                    scope: scope,
//                                                    buttons: [
//                                                        { text: 'Cancel' },
//                                                        {
//                                                            text: '<b>Okay</b>',
//                                                            type: 'button-positive',
//                                                            onTap: function (e) {
//                                                                e.preventDefault();
//                                                                var jsonData = {
//                                                                    'title': "Training with " + scope.trainerName,
//                                                                    'location': appFactory.selectedTrainer.address,
//                                                                    'starttime': newTransaction.starttime,
//                                                                    'endtime': newTransaction.starttime + newTransaction.duration * 30 * 60 * 1000
//
//                                                                };
//                                                                if (appFactory.selectedTrainer.commentlocation) {
//                                                                    jsonData.description = appFactory.selectedTrainer.commentlocation;
//                                                                }
//                                                                console.log(jsonData);
//                                                                var exec = cordova.require("cordova/exec");
//
//                                                                exec(function (result) {
//                                                                    alert("That worked :D");
//                                                                    window.location.href = "#/menu/Trainers/" + scope.trainerID + "/";
//                                                                }, function (err) {
//                                                                    console.log(err);
//                                                                }, 'Card_io', 'addToCalendar', [
//                                                                    jsonData
//                                                                ]);
//                                                            }
//                                                        }
//                                                    ]
//                                                });
//                                                myPopup.then(function (res) {
//                                                    console.log('Tapped!', res);
//                                                });

//                                            } else {
                                alert("That worked :D");
                                window.location.href = "#/menu/Trainers/" + $scope.trainerID + "/";
//                                            }
//                                        });
                            } else {
                                alert(addedTransaction.error);
                            }
                        }
                    });
                };

                var confirmPopup = $ionicPopup.show({
                    template: "Would you like to continue?",
                    title: newTransaction.tokens + " tokens will reducted from your account",
                    scope: $scope,
                    buttons: [
                        { text: 'Cancel' },
                        {
                            text: '<b>Okay</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                saveTransaction();
                            }
                        }
                    ]
                });
                confirmPopup.then(function (res) {
                    console.log('Tapped!', res);
                });
            }(transaction));
        }
    }
});

trainer.controller('EditTransactionCtrl', function($scope, $state, $timeout, $firebaseObject, Trainers, appFactory, appConfig, Schedule, $firebaseArray, Transactions, $ionicPopup, $stateParams) {
    console.log($stateParams);
    var startHour = Math.floor($stateParams.start/2);
    var startMinutes = ($stateParams.start%2==1)? "30":"00";
    var intStartMinutes = ($stateParams.start%2==1)? 30:0;
    console.log(startHour);
    console.log(startMinutes);

    var endHour = Math.floor($stateParams.end/2);
    var endMinutes = ($stateParams.end%2==1)? "30":"00";
    console.log(endHour);
    console.log(endMinutes);

    var start = new Date();
    start.setFullYear($stateParams.year);
    start.setMonth($stateParams.month);
    start.setDate($stateParams.day);
    start.setHours(startHour, intStartMinutes, 0, 0);

    console.log(start);

    $scope.newTransaction = {
        duration: (parseInt($stateParams.end) - parseInt($stateParams.start) + 1) * 30
    };

    var daySchedule = $firebaseObject(Schedule.ref().child(appFactory.user.$id).child($stateParams.year).child($stateParams.month).child($stateParams.day));
    daySchedule.$loaded(function(){
        console.log(daySchedule);
        if(daySchedule.active){
            for(var i=$stateParams.start;i<=$stateParams.end;i++){
                console.log(i);
                console.log(daySchedule.active[i]);
                if(daySchedule.active[i].status == 1){
                    alert("timeslot already taken: " + i/2 + "" + ((i%2==1) ? ":30": ":00"));
                    break;
                }
            }
        } else {
            daySchedule.active = [];
            for(var i=0;i<48;i++){
                daySchedule.active.push({
                    status: -1,
                    prime: false
                });
            }
        }
    });

    $scope.starttime = $stateParams.year + "-" + (parseInt($stateParams.month)+1) + "-" + $stateParams.day + "T" + startHour + ":" + startMinutes + ":00";

    $scope.confirm = function() {
        var timezone = jstz.determine();
        if(!$scope.newTransaction.username){
            alert("Username cannot be empty");
            return;
        }

        var transaction = {
            userName: $scope.newTransaction.username,
            trainerID: appFactory.user.$id,
            sessionID: appFactory.user.$id,
            trainerName: appFactory.user.username,
            tokens: -1,
            amount: $scope.newTransaction.amount,
            type: "Users",
            created: Firebase.ServerValue.TIMESTAMP,
            duration: $scope.newTransaction.duration/30,
            starttimeString: $scope.starttime,
            starttime: start.getTime(),
            emails: [appFactory.user.email],
            timezone: timezone.name(),
            source: 'self',
            scanned: false,
            reviewed: false,
            valid: true
        };

        if (ionic.Platform.isAndroid()) {
            transaction.source = "android";
        }
        if (ionic.Platform.isIOS()) {
            transaction.source = "ios";
        }

        if($scope.newTransaction.address){
            transaction.address = $scope.newTransaction.address;
        }

        if($scope.newTransaction.description){
            transaction.description = $scope.newTransaction.description;
        }

        var proceed = -1;
        for(var i=parseInt($stateParams.start);i<parseInt($stateParams.start) + transaction.duration;i++){
            console.log(i);
            console.log(daySchedule.active[i]);
            if(daySchedule.active[i].status == 1){
                proceed = i;
                alert("timeslot already taken: " + proceed/2 + "" + ((proceed%2==1) ? ":30": ":00"));
                break;
            } else {
                daySchedule.active[i].status = 1;
                daySchedule.active[i].starttime = transaction.starttime;
                daySchedule.active[i].startslot = parseInt($stateParams.start);
                daySchedule.active[i].username = transaction.userName;
                daySchedule.active[i].duration = transaction.duration;
            }
        }
        console.log(daySchedule);

        if(proceed == -1){
            daySchedule.$save().then(function(){
                var transactionRef = Transactions.ref().child(appFactory.user.$id).push(transaction, function(error){
                    transactionRef.setPriority(start.getTime());
                    if(error){
                        alert(error);
                    } else {
                        alert("Transaction saved");
                        $state.go("menu.my-schedule", {year: $stateParams.year, month: $stateParams.month, day: $stateParams.day}, {reload: true});
                    }
                });
            }, function(error){
                alert(error);
            });
        }
        console.log(transaction);
    };

});

trainer.controller('MyScheduleCtrl', function($scope, $ionicPopup, $state, $location, $ionicScrollDelegate, MyTransactions, Transactions, $timeout, appFactory, $firebaseArray, $firebaseObject, Schedule, appConfig, $ionicModal, $state, $ionicHistory, $stateParams){
    $ionicModal.fromTemplateUrl('js/trainer/templates/trainer-schedule-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    $scope.meridiem = 'am';
    $scope.showOnly = -2;

    $scope.sidebar = [0,1,2,3,4,5,6,7,8,9,10,11];
    $scope.edit = {};
    $scope.edit.time = 0;
    $scope.edit.index = 0;
    $scope.rules = $firebaseObject(Schedule.ref().child(appFactory.user.$id).child("rules"));

//    $anchorScrollProvider.disableAutoScrolling();

    $scope.scrollTo = function(index){
        $location.hash("anchor"+index*2);
//        $anchorScroll();
//        document.getElementById("anchor"+index).scrollIntoView();
        $ionicScrollDelegate.anchorScroll();
    };

    $scope.changeMeridiem = function(){
        $scope.meridiem = ($scope.meridiem == 'am') ? 'pm':'am';
        if($scope.meridiem == 'pm'){
            $scope.sidebar = [12,13,14,15,16,17,18,19,20,21,22,23];
        } else {
            $scope.sidebar = [0,1,2,3,4,5,6,7,8,9,10,11];
        }
    }

    $scope.getSelectedClass = function(selected){
        if(selected == 1){
            return "ob-button-blue";
        } else if(selected == 2){
            return "ob-button-darkblue";
        } else {
            return "ob-button-dark";
        }
    };

    $scope.selectTimeSlot = function(id){
        if($scope.active[id].status == 1){
            alert("this time slot is already booked");
        }

        if($scope.active[id].selected && $scope.active[id+1].selected && $scope.active[id-1].selected){
            for(var i=0; i<$scope.active.length; i++) {
                $scope.active[i].selected = false;
            }
            return;
        }

        if($scope.active[id].selected){
            $scope.active[id].selected = false;
            return;
        }

        if(id > 0 && $scope.active[id-1].selected){
            $scope.active[id].selected = true;
            return;
        }

        if(id < $scope.active.length -1 && $scope.active[id+1].selected){
            $scope.active[id].selected = true;
            return;
        }

        for(var i=0; i<$scope.active.length; i++) {
            $scope.active[i].selected = false;
        }
        $scope.active[id].selected = true;
    };

    $scope.editTransaction = function(){
        var first = false;
        var start = -1;
        var end = -1;
        for(var i=0; i<$scope.active.length; i++) {
            if($scope.active[i].selected && !first){
                first = true;
                console.log($scope.active[i]);
                start = i;
            }
            if(!$scope.active[i].selected && first){
                end = i-1;
                break;
            }
        }

        console.log(start);
        console.log(end);
        $state.go('menu.edit-transaction', {start: start, end: end, day: $stateParams.day, month: $stateParams.month, year: $stateParams.year});
    };

    $scope.gotoTransactionPage = function(time){
        console.log(time);
        var mDate = new Date();
        mDate.setFullYear($scope.dt.getFullYear());
        mDate.setMonth($scope.dt.getMonth());
        mDate.setDate($scope.dt.getDate());
        mDate.setHours(Math.floor(time / 100));
        mDate.setMinutes(time % 100);
        mDate.setSeconds(0);
        mDate.setMilliseconds(0);
        console.log(mDate);
        var tran = $firebaseArray(Transactions.ref().child(appFactory.user.$id).orderByPriority().equalTo(mDate.getTime()));
        tran.$loaded(function(){
            console.log(tran[0]);
            $state.go('menu.transaction-detail', {transactionID: tran[0].$id});
        });

    };

    $scope.openScheduleModal = function(index, time, $event){
        if($event.target.className.indexOf("ob-form-button") < 0) {
            console.log($event);
            $scope.edit.time = time;
            $scope.edit.index = index;
            $scope.edit.active = $scope.active[index];
            if (!$scope.rules[index]) {
                $scope.rules[index] = [0, 0, 0, 0, 0, 0, 0];
            }
            console.log($scope.rules);

            $scope.modal.show();
        }
    };

    $scope.closeScheduleModal = function(){
        $scope.modal.hide();
    };

    var now = new Date();
    now.setFullYear($stateParams.year);
    now.setMonth($stateParams.month);
    now.setDate($stateParams.day);
    console.log(now);
    $scope.minDate = now;
    $scope.dt = now;
    var y = now.getYear();
    var m = now.getMonth();
    var d = now.getDate();
    var h = now.getHours();
    var min = now.getMinutes();

    var slots = {
        hour: [],
        half: []
    };

    $scope.user = appFactory.user;
    if(!$scope.user.normalRate){
        $scope.user.normalRate = 3;
    }
    if(!$scope.user.primeRate){
        $scope.user.primeRate = 5;
    }

    $scope.setRate = function(){
        if($scope.user.normalRate < 3 || $scope.user.primeRate < 5){
            alert("Minimum rate for off hour rate is 3, minimum rate for prime hour rate is 5")
        } else {
            $scope.user.$save().then(function(){
                alert("Rate set");
            });

        }
    };

    $scope.active = [];
    slots.hour = _.range(0, 2400, 100);
    slots.hour.forEach(function (hr) {
        slots.half.push(hr);
        slots.half.push(hr + 30);
        $scope.active.push({
            status: -1,
            prime: false
        });
        $scope.active.push({
            status: -1,
            prime: false
        });
    });
    console.log($scope.active);

    $scope.timeslots = slots.half;

    $scope.selectTime = function(i){
        $scope.active[i].status = -1 - $scope.active[i].status;
    };

    $scope.confirm = function () {
        for(var i=0; i<$scope.active.length; i++){
            $scope.active[i].rate = appFactory.user.normalRate;
            if($scope.active[i].prime){
                $scope.active[i].rate = appFactory.user.primeRate;
            }
        }
        var name = $scope.dt.getFullYear() + "-" + $scope.dt.getMonth() + "-" + $scope.dt.getDate();
        var daySchedule = $firebaseObject(Schedule.dateRef(appFactory.user.$id, $scope.dt));
        daySchedule.active = $scope.active;

        daySchedule.$save().then(function(){
            alert("Schedule saved, thanks");
            $ionicHistory.goBack();
//            $state.transitionTo("menu.calendar" , {type: "my-schedule", userID: appFactory.user.$id, username: appFactory.user.username});
        });

    };

    $scope.printTime = function(){
        console.log($scope.dt);
    };

    $scope.showTableRow = function(index){
        if($scope.rules[index] && $scope.rules[index][$scope.dt.getDay()] == -1){
            return false;
        } else {
            if($scope.active[index].startslot && $scope.active[index].startslot != index){
                return false;
            }
            return true;
        }
    };

    $scope.addRule = function(event, day){
        console.log($scope.edit);
        console.log(day);
        console.log(event);

        if(!$scope.rules[$scope.edit.index]){
            $scope.rules[$scope.edit.index] = [0, 0, 0, 0, 0, 0, 0];
        }
        if($scope.rules[$scope.edit.index][day] == 0){
            $scope.rules[$scope.edit.index][day] = 1;
            if($scope.dt.getDay() == day){
                $timeout(function(){
                    $scope.active[$scope.edit.index].status = 0;
                    $scope.active[$scope.edit.index].prime = false;
                    $scope.active[$scope.edit.index].rate = appFactory.user.normalRate;
                });
            }

//            $(event.target).addClass('ob-form-button-selected');
        } else if($scope.rules[$scope.edit.index][day] == 1){
            $scope.rules[$scope.edit.index][day] = 2;
            if($scope.dt.getDay() == day){
                $timeout(function(){
                    $scope.active[$scope.edit.index].status = 0;
                    $scope.active[$scope.edit.index].prime = true;
                    $scope.active[$scope.edit.index].rate = appFactory.user.primeRate;
                });
            }

//            $(event.target).addClass('ob-form-button-selected');
        } else {
            $scope.rules[$scope.edit.index][day] = 0;
            if($scope.dt.getDay() == day) {
                $timeout(function(){
                    $scope.active[$scope.edit.index].status = -1;
                })
            }
//            $(event.target).removeClass('ob-form-button-selected');
        }
        console.log($scope.rules);
        $scope.rules.$save();
    };


    $scope.removeTimeSlot = function(index){
        var myPopup = $ionicPopup.show({
            template: 'Would you like to continue?',
            title: "This will remove the time slot from your scheduler",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Okay</b>',
                    type: 'button-positive',
                    onTap: function (e) {
//                        e.preventDefault();
                        $scope.modal.hide();
                        $scope.rules[$scope.edit.index] = [-1, -1, -1, -1, -1, -1, -1];
                        $scope.rules.$save();
                    }
                }
            ]
        });
        myPopup.then(function (res) {
            console.log('Tapped!', res);
        });


    };

    $scope.collapse = true;

        $scope.$watch('dt', function () {
            $scope.rules.$loaded(function(){
            var name = $scope.dt.getFullYear() + "-" + $scope.dt.getMonth() + "-" + $scope.dt.getDate();

            var daySchedule = $firebaseObject(Schedule.dateRef(appFactory.user.$id, $scope.dt));
            daySchedule.$loaded(function () {
                if (daySchedule.active) {
                    $scope.active = daySchedule.active;
                } else {
                    for (var i = 0; i < $scope.active.length; i++) {
                        if($scope.rules[i]){
                            console.log($scope.rules[i][$scope.dt.getDay()]);
                        }

                        if($scope.rules[i] && $scope.rules[i][$scope.dt.getDay()] == 1) {
                            $scope.active[i] = {
                                status: 0,
                                rate: appFactory.user.normalRate,
                                prime: false
                            };
                        } else if ($scope.rules[i] && $scope.rules[i][$scope.dt.getDay()] == 2) {
                            $scope.active[i] = {
                                status: 0,
                                rate: appFactory.user.primeRate,
                                prime: true
                            };
                        } else {
                            $scope.active[i] = {
                                status: -1,
                                prime: false
                            };
                        }
                    }
                }
            })
        });
    }, true);
});

trainer.directive('scheduler', function($timeout, appFactory, $firebaseArray, $firebaseObject, Schedule, appConfig){
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

            scope.user = appFactory.user;
            if(!scope.user.normalRate){
                scope.user.normalRate = 3;
            }
            if(!scope.user.primeRate){
                scope.user.primeRate = 5;
            }

            scope.setRate = function(){
                if(scope.user.normalRate < 3 || scope.user.primeRate < 5){
                    alert("Minimum rate for off hour rate is 3, minimum rate for prime hour rate is 5")
                } else {
                    scope.user.$save().then(function(){
                        alert("Rate set");
                    });

                }
            };

            scope.active = [];
            slots.hour = _.range(0, 2400, 100);
            slots.hour.forEach(function (hr) {
                slots.half.push(hr);
                slots.half.push(hr + 30);
                scope.active.push({
                    status: -1,
                    prime: false
                });
                scope.active.push({
                    status: -1,
                    prime: false
                });
            });
            console.log(scope.active);

            scope.timeslots = slots.half;

            scope.selectTime = function(i){
                scope.active[i].status = -1 - scope.active[i].status;
            };

            scope.confirm = function () {
                for(var i=0; i<scope.active.length; i++){
                    scope.active[i].rate = appFactory.user.normalRate;
                    if(scope.active[i].prime){
                        scope.active[i].rate = appFactory.user.primeRate;
                    }
                }
                var name = scope.dt.getFullYear() + "-" + scope.dt.getMonth() + "-" + scope.dt.getDate();
                var daySchedule = $firebaseObject(Schedule.ref().child(appFactory.user.$id).child(name));
                daySchedule.active = scope.active;

                daySchedule.$save().then(function(){
                    alert("Schedule saved, thanks");
                    window.location.href = "#/menu/map";
                });

            };

            scope.printTime = function(){
                console.log(scope.dt);
            };

            scope.showTableRow = function(index){
                return !appConfig.removedTimeSlot[index];
            };

            scope.removeTimeSlot = function(index){

                appConfig.removedTimeSlot[index] = true;
            };

            scope.collapse = true;
            scope.$watch('dt', function () {
                var name = scope.dt.getFullYear() + "-" + scope.dt.getMonth() + "-" + scope.dt.getDate();

                var daySchedule = $firebaseObject(Schedule.ref().child(appFactory.user.$id).child(name));
                daySchedule.$loaded(function(){
                    if(daySchedule.active){
                        scope.active = daySchedule.active;
                    } else {
                        for(var i=0; i<scope.active.length; i++){
                            scope.active[i] = {
                                status: -1,
                                prime: false
                            };
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
});

trainer.filter('displayTime', function(Time) {
    return function(time, args) {
        if(time == undefined){
            return "";
        }
        var endtime = time;
        if(args && args.timeslot.startslot == args.index){
            console.log(time);
            console.log(args);

            for (var i=0; i<args.timeslot.duration; i++){
                endtime += 30;
                if (endtime%100 == 60){
                    endtime = time + 100 - 30;
                }
            }
            console.log(endtime);
        } else {
            endtime += 30;
            if (endtime%100 == 60){
                endtime = time + 100 - 30;
            }
        }

        var stringtime = "";
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
