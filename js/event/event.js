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
                $scope.events.$remove(index);
            }
        }
    })
});

event.controller('EventDetailCtrl', function($scope, $firebaseObject, User, appFactory, $timeout, mapFactory, $stateParams, Events, Following) {
    console.log(appFactory.events);
    console.log($stateParams.userID);
    console.log($stateParams.eventID);
    var eventRef = Events.ref().child($stateParams.userID).child($stateParams.eventID);
    $scope.newcomment = {};

    if(appFactory.events[$stateParams.eventID]){
        $scope.selectedEvent = appFactory.events[$stateParams.eventID];
    } else {
        $scope.selectedEvent = $firebaseObject(eventRef);
        console.log($scope.selectedEvent)
    }

//    appFactory.events.forEach(function(item){
//        if(item.$id == $scope.eventID){
//            $timeout(function(){
//                $scope.selectedEvent = item;
//
//                var myRef = Events.ref().child($scope.selectedEvent.$id).child("comments");
//                $scope.comments = $firebase(myRef);
////                $scope.comments = sync.$asArray();
//                console.log(myRef);
////                console.log(sync);
//                console.log($scope.comments);
//
//                console.log(item);
//                $scope.map = mapFactory.initialize([], "event-detail-", $scope.selectedEvent, []);
//                var marker;
//
//                marker = new google.maps.Marker({
//                    position: $scope.map.getCenter(),
//                    map: $scope.map
//                });
//            })
//        }
//    });

    $scope.addcomment = function(){
        if(!$scope.newcomment.text || $scope.newcomment.text.length <=0){
            alert("comment cannot be empty");
        } else {
            $scope.newcomment.creation = Date.now();
            $scope.newcomment.username = appFactory.user.username;
            $scope.newcomment.userID = appFactory.user.$id;
            if(appFactory.user.profilepic){
                $scope.newcomment.profilepic = appFactory.user.profilepic;
            }
            eventRef.child("comments").push($scope.newcomment, function(){
                $timeout(function(){
                    $scope.newcomment.text = "";
                });
                alert("comment added");
            });
        }
    }
});

event.controller('CreateEventCtrl', function($firebaseArray, $firebaseObject, baseUrl, $scope, $timeout, $stateParams, $ionicPopup, Trainers, Event, eventFactory, appFactory, $ionicSlideBoxDelegate, mapFactory, appConfig, Events, GeoEvents, Categories, Following, Invites, $localstorage) {
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
                center: new google.maps.LatLng(appFactory.user.latitude, appFactory.user.longitude),
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

        $scope.newevent.modified = Date.now();
        $scope.newevent.starttime = $scope.dt;
        console.log($scope.newevent);

        if($stateParams.eventID != "new"){
            $scope.newevent.$save().then(function(){
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
        } else {
            $scope.newevent.created = Date.now();
            var newEventRef = Events.ref().child(appFactory.user.$id).push($scope.newevent, function(){
                newEventRef.setPriority(appFactory.user.$id);

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
