var event = angular.module('eventModule', ['ionic', 'accountModule', 'ui.bootstrap', 'starter', 'timeAndDate']);

event.factory('eventFactory', function($resource, baseUrl, $http, appFactory){
    var factory = {};

    factory.getStreetAddress = function(url, callback){
        console.log(url);
        $http({
            url: url,
            method: "GET"
        }).success(function(data, status){
            callback(data, status);
        }).error(function(data, status){
            console.log(data);
            console.log(status);
        });
    };

    factory.findEvent = function(name, callback){
        appFactory.events.forEach(function(item) {
            if (item.name == name) {
                return item;
                callback();
            }
        });
    }
    return factory;
});

event.controller('EventsCtrl', function($scope, User, appFactory) {
    console.log(appFactory.events);
    $scope.events = appFactory.events;
});

event.controller('MyEventsCtrl', function($scope, Events, appFactory, $firebaseArray){
    console.log("MyEventsCtrl");
    $scope.events = $firebaseArray(Events.ref().child(appFactory.user.$id));

    $scope.events.$loaded(function(){
        for(var i=0; i<$scope.events.length; i++){
            if($scope.events[i].starttime < Date.now()){
//                $scope.events.$remove(i);
                //TODO: remove event
            }
        }
    })
});

event.controller('EventDetailCtrl', function($scope, $localstorage, $ionicModal, $firebaseArray, $firebaseObject, EventGoers, User, appFactory, $timeout, mapFactory, $stateParams, Events, Following, Notifications, EventComments, MyTransactions, Feeds, $rootScope) {
    console.log(appFactory.events);
    console.log($stateParams.userID);
    console.log($stateParams.eventID);
    $ionicModal.fromTemplateUrl('js/event/templates/whos-going.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });
    $scope.inEvent = -1;
    var transactionID = "";

    var eventRef = Events.ref().child($stateParams.userID).child($stateParams.eventID);

    $scope.comments = $firebaseArray(EventComments.ref().child($stateParams.eventID));

    $scope.goers = $firebaseArray(EventGoers.ref().child($stateParams.eventID));

    $scope.goers.$loaded(function(){
        console.log($scope.goers);
        for(var i=0; i<$scope.goers.length; i++){
            if($scope.goers[i].userID == appFactory.user.$id){
                $scope.inEvent = i;
                transactionID = $scope.goers[i].transactionID;
            }
        }
    });

    var modified = $firebaseObject(Events.ref().child($stateParams.userID).child($stateParams.eventID).child("modified"));

    $scope.newcomment = {};
    $scope.commentTitle = "Leave a comment:";

    modified.$loaded(function(){
        console.log(modified);
        if(modified.$value && appFactory.events[$stateParams.eventID] && appFactory.events[$stateParams.eventID].modified >= modified.$value){
            $scope.selectedEvent = appFactory.events[$stateParams.eventID];
            showMap();
            console.log($scope.selectedEvent);
        } else {
            $scope.selectedEvent = $firebaseObject(eventRef);
            $scope.selectedEvent.$loaded(function(){
                appFactory.events[$scope.selectedEvent.$id] = $scope.selectedEvent;
                appFactory.events[$scope.selectedEvent.$id].refreshed = false;
                $localstorage.setObject("Events", appFactory.events);
                appFactory.events[$scope.selectedEvent.$id].refreshed = true;
                showMap();
            });
            console.log($scope.selectedEvent);
        }
    });

    $scope.joinEvent = function(){
        console.log($scope.inEvent);
        var going = {
            userID: appFactory.user.$id,
            username: appFactory.user.username,
            created: new Date().getTime()
        };
        var notif = {
            creatorID: appFactory.user.$id,
            starttime: new Date().getTime(),
            url: "#/menu/Events/" + $stateParams.userID + "/" + $stateParams.eventID,
            receivers: [$stateParams.userID],
            message: appFactory.user.username + " has joined your event: " + $scope.selectedEvent.name
        };

        var transaction = {
            userID: appFactory.user.$id,
            eventID: $scope.selectedEvent.$id,
            eventName: $scope.selectedEvent.name,
            type: "Events",
            created: Firebase.ServerValue.TIMESTAMP,
            duration: $scope.selectedEvent.duration,
            starttime: $scope.selectedEvent.starttime
        };

        console.log(going);
        var tranRef = MyTransactions.ref().child(appFactory.user.$id).push(transaction, function(){
            tranRef.setPriority(transaction.starttime);
            going.transactionID = tranRef.key();
            EventGoers.ref().child($stateParams.eventID).child(appFactory.user.$id).set(going, function(){
                $timeout(function(){
//                $scope.inEvent = $scope.goers.$indexFor(appFactory.user.$id);
                    $scope.inEvent = -2;
                })

                Notifications.ref().push(notif, function(){
                    if($scope.selectedEvent.profilepic){
                        notif.profilepic = $scope.selectedEvent.profilepic;
                    }
                    notif.message = "You joined event " + $scope.selectedEvent.name;
                    notif.created = Firebase.ServerValue.TIMESTAMP;
                    Feeds.ref().child(appFactory.user.$id).push(notif);

                    alert("You have joined this event");
                });
            });
        });
    };

    $scope.leaveEvent = function(){
        var notif = {
            creatorID: appFactory.user.$id,
            starttime: new Date().getTime(),
            url: "#/menu/Events/" + $stateParams.userID + "/" + $stateParams.eventID,
            receivers: [$stateParams.userID],
            message: appFactory.user.username + " has left your event: " + $scope.selectedEvent.name
        };

        $firebaseObject(MyTransactions.ref().child(appFactory.user.$id).child(transactionID)).$remove().then(function(){
            $scope.goers.$remove($scope.inEvent).then(function(){
                Notifications.ref().push(notif, function(){
                    if($scope.selectedEvent.profilepic){
                        notif.profilepic = $scope.selectedEvent.profilepic;
                    }
                    notif.message = "You left event " + $scope.selectedEvent.name;
                    notif.created = Firebase.ServerValue.TIMESTAMP;
                    Feeds.ref().child(appFactory.user.$id).push(notif);

                    $timeout(function(){
                        alert("You have left this event.");
                        $scope.inEvent = -2;
                        transactionID = "";
                    })
                });
            });
        })

    };

    $scope.whosGoing = function(){
        $scope.modal.show();
    }

    $scope.closeModal = function(){
        $scope.modal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    $scope.replyto = function(comment){
        $scope.replyUserID = comment.userID;
        $scope.replyUserName = comment.username;
        $timeout(function() {
            $scope.commentTitle = "Leave a comment @" + comment.username + ":";
        });
    }

    $scope.clear = function(){
        $scope.replyUserID = undefined;
        $scope.commentTitle = "Leave a comment:";
    }

    function showMap(){
        $scope.map = new google.maps.Map(document.getElementById('event-detail-map'), {
            zoom: 12,
            center: new google.maps.LatLng($scope.selectedEvent.location[0], $scope.selectedEvent.location[1]),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var marker;

        marker = new google.maps.Marker({
            position: $scope.map.getCenter(),
            map: $scope.map
        });
    }

    $scope.addcomment = function(){
        if(!$scope.newcomment.text || $scope.newcomment.text.length <=0){
            alert("comment cannot be empty");
        } else {
            var notif = {
                creatorID: appFactory.user.$id,
                starttime: new Date().getTime(),
                url: "#/menu/Events/" + $stateParams.userID + "/" + $stateParams.eventID,
                receivers: [$stateParams.userID],
                message: "You have received a new message in event: " + $scope.selectedEvent.name
            }
            if($scope.replyUserID){
                notif.receivers.push($scope.replyUserID);
                $scope.newcomment.replyUserID = $scope.replyUserID;
                $scope.newcomment.replyUserName = $scope.replyUserName;
            }

            $scope.newcomment.creation = Date.now();
            $scope.newcomment.username = appFactory.user.username;
            $scope.newcomment.userID = appFactory.user.$id;
            $scope.comments.$add($scope.newcomment).then(function(){
                Notifications.ref().push(notif, function(){
                    $timeout(function(){
                        $scope.newcomment.text = "";
                        alert("comment added");
                    });
                });
            });
        }
    }
});

event.controller('CreateEventCtrl', function($firebaseArray, $firebaseObject, $rootScope, $scope, $timeout, $stateParams, $ionicPopup, Trainers, Event, eventFactory, appFactory, $ionicSlideBoxDelegate, mapFactory, appConfig, Events, GeoEvents, Categories, Following, Invites, $localstorage) {
    console.log('CreateEventCtrl');
    console.log($stateParams.eventID);

    $scope.categories = Categories;
    var href = "";
    if($stateParams.eventID != "new"){
        var myRef = Events.ref().child($stateParams.eventID);
        $scope.newevent = $firebaseObject(myRef);
        $scope.dt = $scope.newevent.dt;
    } else {
        $scope.dt = new Date();
        $scope.newevent = {};
    }

    console.log($scope.newevent);
    $scope.newevent.duration = 30;

    // Called each time the slide changes
    $scope.slideChanged = function(index) {
        $scope.slideIndex = index;
        console.log(index);
        if(index == 1){
            var marker;

            var setLocation = function(){
                var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&key=" + appConfig.apikey;
                eventFactory.getStreetAddress(url, function(data, status){
                    console.log(data);
                    $scope.newevent.address = data.results[0].formatted_address;
                });
            }

            var map = new google.maps.Map(document.getElementById('create-eventmap'), {
                zoom: 11,
                center: new google.maps.LatLng($rootScope.position.coords.latitude, $rootScope.position.coords.longitude),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            marker = new google.maps.Marker({
                position: map.getCenter(), //new google.maps.LatLng(appFactory.user.latitude, appFactory.users.longitude),
                map: map,
                draggable: true
            });

            google.maps.event.addListener(marker, 'dragend', function(){
                setLocation();
            });

            google.maps.event.addListener(map, 'dragend', function() {
                marker.setPosition(map.getCenter());
                setLocation();
            });

            $scope.locationReady = function(){
                if($scope.newevent.address){
                    console.log($scope.newevent.address.replace(/ /g, "+"));
                    var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newevent.address.replace(/ /g, "+") + "&key=" + appConfig.apikey;
                    eventFactory.getStreetAddress(url, function(data, status){
                        console.log(data);
                        $scope.newevent.latitude = data.results[0].geometry.location.lat;
                        $scope.newevent.longitude = data.results[0].geometry.location.lng;
                        $scope.newevent.location = [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];

                        $ionicSlideBoxDelegate.next();
                    });
                } else {
                    alert("address cannot be empty");
                }

            }
        } else if(index == 3){
            $scope.following = $firebaseArray(Following.ref().child(appFactory.user.$id));
            $scope.following.$loaded(function(){

            });
        }
    };

    $scope.skipInvites = function(){
        window.location.href = "#/menu/my-events";
    }

    $scope.sendInvites = function(){
        var numOfInvites = 0;
        var invitesPushed = 0;
        for(var i=0; i<$scope.following.length; i++){
            if($scope.following[i].checked) {
                numOfInvites++;
                (function (targetUser) {
                    var invite = {
                        ownerID: appFactory.user.$id,
                        type: "Events",
                        name: $scope.newevent.name,
                        key: $scope.newevent.$id,
                        inviteCreated: Date.now(),
                        created: $scope.newevent.created
                    }

                    if(appFactory.user.profilepic){
                        invite.profilepic = appFactory.user.profilepic;
                    }
                    if($scope.newevent.description){
                        invite.description = $scope.newevent.description;
                    }
                    var inviteRef = Invites.ref().child(targetUser.$id).push(invite, function(err){
                        inviteRef.setPriority(appFactory.user.$id);

                        var eventInvite = {
                            userID: targetUser.$id,
                            inviteCreated: Date.now()
                        }
                        if(targetUser.profilepic){
                            eventInvite.profilepic = targetUser.profilepic;
                        }

                        if(!$scope.newevent.invites){
                            $scope.newevent.invites = [];
                        }
                        $scope.newevent.invites.push(eventInvite);
                        invitesPushed++;
                        if(invitesPushed == numOfInvites){
                            console.log($scope.newevent);
                            $scope.newevent.$save().then(function(){
                                alert("Invites sent.");
                            });
                        }
                    });
                }($scope.following[i]));
            }
        }
    };

    $scope.createEvent = function(){
        $scope.newevent.userID = appFactory.user.$id;

        $scope.newevent.modified = Firebase.ServerValue.TIMESTAMP;
        $scope.newevent.starttime = $scope.dt.getTime();
        console.log($scope.newevent);

        if($stateParams.eventID != "new"){
            $scope.newevent.$save().then(function(){
                appFactory.modified.$ref().child("Events").child($scope.newevent.$id).set($scope.newevent.modified, function(){
                    GeoEvents.set($scope.newevent.$id + "," + appFactory.user.$id, [$scope.newevent.latitude, $scope.newevent.longitude]).then(function() {
                        console.log("Provided key has been added to GeoFire");

                        var events = $localstorage.getObject("Events");
                        events[$scope.newevent.$id] = $scope.newevent;
                        console.log(events);
                        $localstorage.setObject("Events", events);

                        alert("event saved");
                        $ionicSlideBoxDelegate.next();
                    });
                });
            });
        } else {
            $scope.newevent.created = Date.now();
            var newEventRef = Events.ref().child(appFactory.user.$id).push($scope.newevent, function(){
                newEventRef.setPriority(appFactory.user.$id);
                appFactory.modified.$ref().child("Events").child(newEventRef.key()).set($scope.newevent.modified, function(){
                    GeoEvents.set(newEventRef.key() + "," + appFactory.user.$id, [$scope.newevent.latitude, $scope.newevent.longitude]).then(function() {
                        console.log("Provided key has been added to GeoFire");
                        $scope.newevent = $firebaseObject(Events.ref().child(appFactory.user.$id).child(newEventRef.key()));

                        var events = $localstorage.getObject("Events");
                        events[newEventRef.key()] = $scope.newevent;
                        console.log(events);
                        $localstorage.setObject("Events", events);

                        $ionicSlideBoxDelegate.next();
                    });
                });
            });
        }
    };

    $scope.navSlide = function(index) {
        $ionicSlideBoxDelegate.slide(index);
    };

    $scope.slideStop = function(index) {
        $timeout(function(){
            $ionicSlideBoxDelegate.enableSlide(0);
        });
//        $ionicSlideBoxDelegate.enableSlide(false);


    }

    $scope.nextPressed = function(index) {
        $ionicSlideBoxDelegate.next();
    }

    $scope.currentIndex = function() {
        return $ionicSlideBoxDelegate.currentIndex();
    }
});
