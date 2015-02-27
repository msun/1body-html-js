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

event.controller('EventDetailCtrl', function($scope, $firebase, User, appFactory, $timeout, mapFactory, $stateParams, Events) {
    console.log(appFactory.events);
    $scope.events = appFactory.events;
    $scope.newcomment = {};

    $scope.eventID = $stateParams.eventID;

    appFactory.events.forEach(function(item){
        if(item.$id == $scope.eventID){
            $timeout(function(){
                $scope.selectedEvent = item;

                var myRef = Events.ref().child($scope.selectedEvent.$id).child("comments");
                $scope.comments = $firebase(myRef);
//                $scope.comments = sync.$asArray();
                console.log(myRef);
//                console.log(sync);
                console.log($scope.comments);

                console.log(item);
                $scope.map = mapFactory.initialize([], "event-detail-", $scope.selectedEvent, []);
                var marker;

                marker = new google.maps.Marker({
                    position: $scope.map.getCenter(),
                    map: $scope.map
                });
            })
        }
    });

    $scope.addcomment = function(){
        if(!$scope.newcomment.text || $scope.newcomment.text.length <=0){
            alert("comment cannot be empty");
        } else {
            $scope.newcomment.creation = Date.now();
            $scope.newcomment.username = appFactory.user.username;
            $scope.newcomment.userID = appFactory.user.$id;
            $scope.comments.$push($scope.newcomment).then(function(){
                $scope.newcomment.text = "";
            });

        }
    }
});

event.controller('CreateEventCtrl', function($firebase, baseUrl, $scope, $timeout, $stateParams, $ionicPopup, Trainers, Event, eventFactory, appFactory, $ionicSlideBoxDelegate, mapFactory, apikey, Events, GeoEvents, Categories) {
    console.log('CreateEventCtrl');
    console.log($stateParams.eventID);

    $scope.categories = Categories;
    var href = "";
    if($stateParams.eventID != "new"){
        var myRef = Events.ref().child($stateParams.eventID);
        $scope.newevent = $firebase(myRef).$asObject();
    } else {
        $scope.newevent = {};
    }

    console.log($scope.newevent);
    $scope.newevent.duration = 30;


//    $scope.openDatePicker = function() {
//        console.log('openDatePicker');
//        $scope.tmp = {};
//        $scope.tmp.newDate = {};
//
//        var birthDatePopup = $ionicPopup.show({
//            template: '<datetimepicker ng-model="tmp.newDate"></datetimepicker>',
//            title: "Choose Start Time",
//            scope: $scope,
//            buttons: [
//                { text: 'Cancel' },
//                {
//                    text: '<b>Save</b>',
//                    type: 'button-positive',
//                    onTap: function(e) {
//                        $scope.newevent.starttime = $scope.tmp.newDate;
//                        if(typeof $scope.tmp.newDate.getTime === 'undefined'){
//                            alert("please select a valid time");
//                        }
//                    }
//                }
//            ]
//        });
//    }

    // Called each time the slide changes
    $scope.slideChanged = function(index) {
        $scope.slideIndex = index;
    };

    $scope.openMap = function(){
        var marker;
        setTimeout(function(){
            console.log("ready to load map");
            console.log(appFactory.user);
//            $scope.map = mapFactory.initialize([], "create-event", appFactory.user, []);
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

            google.maps.event.addListener(map, 'center_changed', function() {
                marker.setPosition(map.getCenter());
            });
        }, 500);

        var mappopup = $ionicPopup.show({
            template: '<div id="create-eventmap" data-tap-disabled="true"></div>',
            title: "Choose Start Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&key=" + apikey;
                        eventFactory.getStreetAddress(url, function(data, status){
                            console.log(data);
                            $scope.newevent.location = data.results[0].formatted_address;
                        });
                    }
                }
            ]
        });
    }

    $scope.createEvent = function(){
        console.log($scope.newevent);
        console.log($scope.newevent.location.replace(/ /g, "+"));
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newevent.location.replace(/ /g, "+") + "&key=" + apikey;
        eventFactory.getStreetAddress(url, function(data, status){
            console.log(data);
            $scope.newevent.latitude = data.results[0].geometry.location.lat;
            $scope.newevent.longitude = data.results[0].geometry.location.lng;
            console.log(Trainers.obj());
            console.log(appFactory.user);
            console.log(Trainers.obj()[appFactory.user.$id]);

            $scope.newevent.userId = appFactory.user.$id;

            $scope.newevent.modified = Date.now();

            if($stateParams.eventID != "new"){
                $scope.newevent.$save().then(function(){
                    for(var num=0; num<appFactory.user.events.length; num++){
                        if(appFactory.user.events[num].id == $scope.newevent.$id){
                            appFactory.user.events[num].name = $scope.newevent.name;
                        }
                    }
                    window.location.href = "#/menu/account/my-events";
                });
            } else {
                $scope.newevent.created = Date.now();
                Events.sync().$push($scope.newevent).then(function(ref){
                    console.log(ref.path.m[1]);
                    GeoEvents.set(ref.path.m[1], [$scope.newevent.latitude, $scope.newevent.longitude]).then(function() {
                        console.log("Provided key has been added to GeoFire");
                    });

                    if(!appFactory.user.events){
                        appFactory.user.events = [];
                    }
                    var tempEvents = [];
                    //remove $$hashkey from list
                    for(var num=0; num<appFactory.user.events.length; num++){
                        tempEvents.push(angular.copy(appFactory.user.events[num]));
                    }
                    appFactory.user.events = tempEvents;
                    var mEvent = {
                        id: ref.path.m[1],
                        name: $scope.newevent.name
                    }

                    appFactory.user.events.push(mEvent);
                    console.log(appFactory.user);
                    appFactory.user.$save().then(function(){
                        window.location.href = "#/menu/account/my-events";
                    });
                });
            }
        });
    }
});


