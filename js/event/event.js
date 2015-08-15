var event = angular.module('eventModule', ['ionic', 'accountModule', 'starter', 'timeAndDate']);

event.factory('eventFactory', function($http, appFactory){
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

event.controller('EventsCtrl', function($scope, appFactory) {
    console.log(appFactory.events);
    $scope.events = appFactory.events;
});

event.controller('MyEventsCtrl', function($scope, Events, appFactory, $firebaseArray, $ionicHistory){
    console.log("MyEventsCtrl");
    console.log($ionicHistory);
    console.log($ionicHistory.viewHistory());
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

event.controller('EventDetailCtrl', function($scope, $localstorage, $ionicModal, $firebaseArray, $firebaseObject,
                                             EventGoers, appFactory, $timeout, mapFactory, $stateParams, Events,
                                             Following, Notifications, EventComments, MyTransactions, Feeds, $rootScope,
                                             $ionicPopup) {
    console.log(appFactory.events);
    console.log($stateParams.userID);
    $scope.eventID = $stateParams.eventID;
    console.log($stateParams.eventID);
    $ionicModal.fromTemplateUrl('js/event/templates/whos-going.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });
    $scope.inEvent = -1;
    var transactionID = "";
    $scope.tabIndex = 0;

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

    $scope.newcomment = {};
    $scope.commentTitle = "Leave a comment:";

    var loadFromFirebase = function(){
        var eventFromFirebase = $firebaseObject(eventRef);
        eventFromFirebase.$loaded(function(){
            $scope.selectedEvent = eventFromFirebase;
            appFactory.events[$scope.selectedEvent.$id] = $scope.selectedEvent;
            $localstorage.setObject("Events", appFactory.events);
            showMap();
        });
    };

//    if(appFactory.events[$stateParams.eventID]){
//        $scope.selectedEvent = appFactory.events[$stateParams.eventID];
//        showMap();
//        var modified = $firebaseObject(Events.ref().child($stateParams.userID).child($stateParams.eventID).child("modified"));
//        modified.$loaded(function(){
//            if(appFactory.events[$stateParams.eventID].modified >= modified.$value){
//                loadFromFirebase();
//            }
//        });
//    } else {
        loadFromFirebase();
//    }

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
            eventID: $scope.selectedEvent.$id,
            sessionID: $scope.selectedEvent.$id,
            eventName: $scope.selectedEvent.name,
            type: "Events",
            eventUserID: $scope.selectedEvent.userID,
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
                    Feeds.push("Events",
                        $stateParams.eventID,
                        $scope.selectedEvent.name,
                        "You joined event " + $scope.selectedEvent.name,
                        appFactory.user.username + " joined this event."
                    );

                    if (ionic.Platform.isAndroid()) {
                        var myPopup = $ionicPopup.show({
                            template: 'Would you like to save this event to your calendar?',
                            title: 'Save to calendar',
                            scope: $scope,
                            buttons: [
                                { text: 'Cancel' },
                                {
                                    text: '<b>Okay</b>',
                                    type: 'button-positive',
                                    onTap: function (e) {
                                        e.preventDefault();
                                        var jsonData = {
                                            'title': "1Body Event: " + $scope.selectedEvent.name,
                                            'location': $scope.selectedEvent.address,
                                            'starttime': $scope.selectedEvent.starttime,
                                            'endtime': $scope.selectedEvent.starttime + $scope.selectedEvent.duration * 30 * 60 * 1000

                                        };
                                        if ($scope.selectedEvent.commentlocation) {
                                            jsonData.description = $scope.selectedEvent.commentlocation;
                                        }
                                        console.log(jsonData);
                                        var exec = cordova.require("cordova/exec");

                                        exec(function (result) {
                                            alert("You have joined this event");
                                        }, function (err) {
                                            console.log(err);
                                        }, 'Card_io', 'addToCalendar', [
                                            jsonData
                                        ]);
                                    }
                                }
                            ]
                        });
                        myPopup.then(function (res) {
                            console.log('Tapped!', res);
                        });
                    } else {
                        alert("You have joined this event");
                    }
                });
            });
        });
    };

    $scope.leaveEvent = function(){
        var notif = {
            creatorID: appFactory.user.$id,
            eventId: $scope.selectedEvent.$id,
            starttime: new Date().getTime(),
            url: "#/menu/Events/" + $stateParams.userID + "/" + $stateParams.eventID,
            receivers: [$stateParams.userID],
            message: appFactory.user.username + " has left your event: " + $scope.selectedEvent.name
        };

        $firebaseObject(MyTransactions.ref().child(appFactory.user.$id).child(transactionID)).$remove().then(function(){
            $scope.goers.$remove($scope.inEvent).then(function(){
                Notifications.ref().push(notif, function(){
                    Feeds.push("Events",
                        $stateParams.eventID,
                        $scope.selectedEvent.name,
                        "You left event " + $scope.selectedEvent.name,
                        appFactory.user.username + " left event."
                    );

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

        if($scope.marker){
            $scope.marker.setMap(null);
        }

        $scope.marker = new google.maps.Marker({
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

event.controller('CreateEventCtrl', function($firebaseArray, $firebaseObject, $rootScope, $scope, $timeout, appConfig,
                                             $stateParams, $ionicPopup, Trainers, Event, eventFactory, appFactory,
                                             $ionicSlideBoxDelegate, mapFactory, Events, GeoEvents, Categories, Feeds,
                                             Following, Invites, $localstorage, Images, Notifications, $ionicHistory) {
    console.log('CreateEventCtrl');
    console.log($stateParams.eventID);
    $scope.eventID = $stateParams.eventID;
    $scope.privacy = "Public";

    $scope.categories = Categories;
    var href = "";
    if($stateParams.eventID != "new"){
        var myRef = Events.ref().child(appFactory.user.$id).child($stateParams.eventID);
        $scope.newevent = $firebaseObject(myRef);
//        $scope.newevent.$loaded(function(){
//            console.log($scope);
//            $scope.loadtime(new Date($scope.newevent.starttime));
//        });

    } else {
        $scope.dt = new Date();
        $scope.newevent = {};
    }

    console.log($scope.newevent);
    $scope.newevent.duration = 30;

    // Called each time the slide changes
    $scope.slideChanged = function(index) {
        ionic.DomUtil.blurAll();

        $scope.slideIndex = index;
        console.log(index);
        if(index == 1){
            if($scope.eventID != "new"){
                $scope.createEvent();
            }
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
                center: new google.maps.LatLng($rootScope.position[0], $rootScope.position[1]),
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


            }
        } else if(index == -10){
            var exec;
            if (ionic.Platform.isAndroid()) {
                exec = cordova.require("cordova/exec");
            }

            var image = document.getElementById('displayPic');

            var onSuccess = function(imageURI) {
                image.src = imageURI;

            }

            var onFail = function(message) {
                alert('Failed because: ' + message);
            }

            $scope.fromstorage = function() {
                alert("from storage");
                // Retrieve image file location from specified source
                navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType: 0 });
            };

            $scope.fromcamera = function(){
                navigator.camera.getPicture(onSuccess, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
            };

            $scope.skipImgUpload = function(){
                $ionicSlideBoxDelegate.next();
            };

            $scope.useimg = function(){
                var pluginName = '';
                if (ionic.Platform.isAndroid()) {
                    pluginName = 'Card_io';
                } else if (ionic.Platform.isIOS()) {
                    pluginName = 'OBImageEditor';
                }

                exec(function (result) {
                    var bigimg = {
                        data: result.big,
                        id: $scope.newevent.$id,
                        name: "profilepic_hd.jpg",
                        type: "Events"
                    };

                    var smallimg = {
                        data: result.small,
                        id: $scope.newevent.$id,
                        name: "profilepic.jpg",
                        type: "Events"
                    };

                    Images.ref().push(smallimg, function(){
                        Images.ref().push(bigimg, function(){
                            alert("Your event picture is saved");
                            $ionicSlideBoxDelegate.next();
                        });
                    });
                }, function (err) {
                    console.log(err);
                }, pluginName, 'useimg', [
                    {'id': $scope.user.$id, 'uri': image.src}
                ]);
            }

        } else if(index == 2){
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
                    };

                    var notif = {
                        creatorID: appFactory.user.$id,
                        starttime: new Date().getTime(),
                        url: "#/menu/Events/" + appFactory.user.$id + "/" + $scope.newevent.$id,
                        receivers: [targetUser.$id],
                        message: appFactory.user.username + " has invited you to join his event: " + $scope.newevent.name
                    };

                    Notifications.ref().push(notif);

                    if($scope.newevent.description){
                        invite.description = $scope.newevent.description;
                    }
                    var inviteRef = Invites.ref().child(targetUser.$id).push(invite, function(err){
                        inviteRef.setPriority(appFactory.user.$id);

                        var eventInvite = {
                            userID: targetUser.$id,
                            inviteCreated: Date.now()
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
        $ionicHistory.goBack();
    };

    $scope.createEvent = function(){
        $scope.newevent.userID = appFactory.user.$id;

        $scope.newevent.modified = Firebase.ServerValue.TIMESTAMP;
        console.log($scope.newevent);

        if($scope.newevent.address){
            console.log($scope.newevent.address.replace(/ /g, "+"));
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newevent.address.replace(/ /g, "+") + "&key=" + appConfig.apikey;
            eventFactory.getStreetAddress(url, function(data, status){
                console.log(data);
                $scope.newevent.latitude = data.results[0].geometry.location.lat;
                $scope.newevent.longitude = data.results[0].geometry.location.lng;
                $scope.newevent.location = [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];

                if($stateParams.eventID != "new"){
                    $scope.newevent.$save().then(function(){
                        Feeds.push("Events",
                            $scope.newevent.$id,
                            $scope.newevent.name,
                            "You modifed event " + $scope.newevent.name,
                            appFactory.user.username + " modified event information"
                        );

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
                    $scope.newevent.starttime = $scope.dt.getTime();
                    $scope.newevent.created = Date.now();
                    var newEventRef = Events.ref().child(appFactory.user.$id).push($scope.newevent, function(){
                        newEventRef.setPriority($scope.newevent.starttime);

                        Feeds.push("Events",
                            newEventRef.key(),
                            $scope.newevent.name,
                            "You created event " + $scope.newevent.name,
                            appFactory.user.username + " created this event."
                        );

                        GeoEvents.set(newEventRef.key() + "," + appFactory.user.$id, [$scope.newevent.latitude, $scope.newevent.longitude]).then(function() {
                            console.log("Provided key has been added to GeoFire");
                            $scope.newevent = $firebaseObject(Events.ref().child(appFactory.user.$id).child(newEventRef.key()));

                            var events = $localstorage.getObject("Events");
                            events[newEventRef.key()] = $scope.newevent;
                            console.log(events);
                            $localstorage.setObject("Events", events);
                            alert("new event saved");
                            $ionicSlideBoxDelegate.next();
                        });
                    });
                }
            });
        } else {
            alert("address cannot be empty");
        }
    };

    //$ionicSlideBoxDelegate.enableSlide(false);

    $scope.navSlide = function(index) {
        $ionicSlideBoxDelegate.slide(index);
    };

    $scope.nextPressed = function(index) {
        $ionicSlideBoxDelegate.next();
    }

    $scope.currentIndex = function() {
        return $ionicSlideBoxDelegate.currentIndex();
    }
});
