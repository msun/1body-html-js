var map = angular.module('mapModule', ['ionic', 'accountModule', 'starter', 'leaflet-directive']);

map.factory('mapFactory', function($http, $compile){
    var factory = {};
    factory.initialize = function(items, tab, user, infoCompile) {
        var map = new google.maps.Map(document.getElementById(tab+'map'), {
            zoom: 10,
            center: new google.maps.LatLng(user.latitude, user.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: false,
            panControl: false
        });
        return map;
    }

    factory.centerOnMe = function(map, callback){
        navigator.geolocation.getCurrentPosition(function(pos) {
            map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            callback();
        }, function(error) {
            alert('Unable to get location: ' + error.message);
        });
    }

    factory.calculateDistance = function(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var radlon1 = Math.PI * lon1/180;
        var radlon2 = Math.PI * lon2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344 }
        if (unit=="N") { dist = dist * 0.8684 }
        return dist
    }

    return factory;
});

var coordinatesAreEquivalent = function(coord1, coord2, diff) {
    return (Math.abs(coord1 - coord2) < diff);
};

map.directive('trainerInfoWindow', function(){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/trainer-info-window.html',
        scope: {item: '='},
        link: function(scope, element, attrs) {
        }
    }
});

map.directive('eventInfoWindow', function(){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/event-info-window.html',
        scope: {item: '='},
        link: function(scope, element, attrs) {
        }
    }
});

map.directive('classInfoWindow', function(){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/class-info-window.html',
        scope: {item: '='},
        link: function(scope, element, attrs) {
        }
    }
});

map.directive('gymInfoWindow', function($rootScope){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/gym-info-window.html',
        scope: {gym: '='},
        link: function(scope, element, attrs) {
            if($rootScope.header == "Users"){
                console.log(scope.gym);
                scope.items = scope.gym.items;
                scope.gym.tab = "Trainers";
            } else {
                scope.gym.tab = "Classes";
                scope.items = scope.gym["Classes"];
            }



            scope.gym.type = $rootScope.header;
        }
    }
});

map.controller('MapCtrl', function($rootScope, $scope, $compile, leafletData, $timeout, $firebase, $ionicLoading, GeoTrainers, GeoEvents, mapFactory, appFactory, Trainers, Users, Sizes, Events, $ionicPopover, $ionicPopup, Categories, GeoGyms, Gyms, Classes, $localstorage, $firebaseObject, $firebaseArray, $ionicModal) {
    $scope.header = $rootScope.header;
    var searchKeys = ["firstname", "lastname", "info", "group", "gym", "username", "email", "name"];
    $scope.categories = Categories;
    var pinSource = GeoTrainers;
    var firebaseSource = Trainers;
    var clone = [];
    $scope.markers = {};
    $scope.mapItems = {};
    $scope.array = {};
    $scope.trainerCircles = [];
    $scope.searchContainer = {};
    $scope.searchContainer.redo_search = true;
    var position;

    $ionicLoading.show({
        content: '<i class="icon ion-looping"></i> Loading location data',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    if ($rootScope.position) {
        $ionicLoading.hide();
        console.log($rootScope.position);
        position = $rootScope.position;
        console.log(position);
        setmap();
//        dropPins(appFactory.state);
//        dropGymPins(appFactory.state);
        appFactory.user.position = $rootScope.position;
        $localstorage.setObject("user", appFactory.user);
    } else {
        $ionicLoading.hide();
        if (appFactory.user.curlocation) {
            console.log("appFactory.user.curlocation");
            position = appFactory.user.curlocation;
            $rootScope.position = position;
            appFactory.loadLocation();

            setmap();
//            dropPins(appFactory.state);
//            dropGymPins(appFactory.state);
        } else {
            position = [43.7000, 79.4000];
            $rootScope.position = position;
            appFactory.loadLocation();

            setmap();
        }
        $scope.$on('locationReady', function (event, data) {
            position = $rootScope.position;
            console.log(appFactory.user.curlocation);
            setmap();
//            dropPins(appFactory.state);
//            dropGymPins(appFactory.state);
            appFactory.user.curlocation = $rootScope.position;

            $localstorage.setObject("user", appFactory.user);
        });
    }

    $scope.doMapInit = function(){
        leafletData.getMap('dashmap').then(function(map) {
            $scope.map = map;

            console.log(map);

            if ($rootScope.header == "Events") {
                markEvents();
            } else if ($rootScope.header == "Users") {
                markTrainers();
                markGyms();
            } else {
//            markGyms();
            }

            $scope.$on('leafletDirectiveMap.dragend', function(event){
                appFactory.radius = mapFactory.calculateDistance($scope.map.getCenter().lat, $scope.map.getCenter().lng, $scope.map.getBounds().getSouthWest().lat, $scope.map.getBounds().getSouthWest().lng) + 5;
                appFactory.trainerQuery.updateCriteria({
                    center: [$scope.map.getCenter().lat, $scope.map.getCenter().lng],
                    radius: appFactory.radius
                });

                appFactory.eventQuery.updateCriteria({
                    center: [$scope.map.getCenter().lat, $scope.map.getCenter().lng],
                    radius: appFactory.radius
                });

                appFactory.gymQuery.updateCriteria({
                    center: [$scope.map.getCenter().lat, $scope.map.getCenter().lng],
                    radius: appFactory.radius
                });
            });

            $scope.$on('leafletDirectiveMap.zoomend', function(event){
                appFactory.radius = mapFactory.calculateDistance($scope.map.getCenter().lat, $scope.map.getCenter().lng, $scope.map.getBounds().getSouthWest().lat, $scope.map.getBounds().getSouthWest().lng) + 5;
                appFactory.trainerQuery.updateCriteria({
                    center: [$scope.map.getCenter().lat, $scope.map.getCenter().lng],
                    radius: appFactory.radius
                });

                appFactory.eventQuery.updateCriteria({
                    center: [$scope.map.getCenter().lat, $scope.map.getCenter().lng],
                    radius: appFactory.radius
                });

                appFactory.gymQuery.updateCriteria({
                    center: [$scope.map.getCenter().lat, $scope.map.getCenter().lng],
                    radius: appFactory.radius
                });
            });
        });


        $scope.defaults = {
//            tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
            tileLayerOptions: {
                opacity: 0.9,
                detectRetina: true,
                reuseTiles: true
            },
            attributionControl: false,
            zoomAnimation: false,
            zoomControl:false,
            minZoom: 8
        };
    };


    if(appFactory.searchTerms && appFactory.searchTerms.length > 0){
//        appFactory.onsearch = false;
        console.log(appFactory.searchTerms);
        $scope.searchContainer.searchTerms = appFactory.searchTerms;
        $timeout(function(){
            $scope.searchContainer.searchTerms = appFactory.searchTerms;
        });
    }

    $scope.clearSearch = function(){
        $timeout(function(){
            $scope.searchContainer.searchTerms = "";
            appFactory.searchTerms = "";
            clearpins();
            if ($rootScope.header == "Events") {
                markEvents();
            } else if ($rootScope.header == "Users") {
                markTrainers();
                markGyms();
            } else {
                markGyms();
            }
        })

    }

    function searchItem(t){
        console.log(t);
        console.log($scope.searchContainer.searchTerms);
        if(!$scope.searchContainer.searchTerms){
            return true;
        }
        if($scope.searchContainer.searchTerms.length <= 0){
            return true;
        }
        var searchTerms = $scope.searchContainer.searchTerms.split(" ");
        console.log(searchTerms);

        var foundTerms = {};
        for(var i=0; i<searchKeys.length; i++){
            if (!t.hasOwnProperty(searchKeys[i])) {
                console.log(t[searchKeys[i]]);
                continue;
            }

            for(var k=0; k<searchTerms.length; k++){
                console.log(searchTerms[k]);
                console.log(t[searchKeys[i]]);
                if(searchKeys[i] == "gym"){
                    if(t.gym && t.gym.gymName.toLowerCase().indexOf(searchTerms[k].toLowerCase()) >= 0){
                        if(!foundTerms[searchTerms[k]]){
                            foundTerms[searchTerms[k]] = 1;
                        } else {
                            foundTerms[searchTerms[k]]++;
                        }
                    }
                    continue;
                }
                if(t[searchKeys[i]] && t[searchKeys[i]].toLowerCase().indexOf(searchTerms[k].toLowerCase()) >= 0){
                    if(!foundTerms[searchTerms[k]]){
                        foundTerms[searchTerms[k]] = 1;
                    } else {
                        foundTerms[searchTerms[k]]++;
                    }
                    console.log(foundTerms);
                }
            }
        }

        console.log(foundTerms);
        for(var i=0; i<searchTerms.length; i++) {
            console.log(searchTerms[i]);
            console.log(foundTerms[i]);
            if (!foundTerms.hasOwnProperty(searchTerms[i])) {
                return false;
            }
        }
        console.log("found " + t.username);
        return true;
    };

    if (appFactory.trainerQuery) {
        appFactory.trainerQuery.updateCriteria({
            radius: 8
        });
    }

    if (appFactory.gymQuery) {
        appFactory.gymQuery.updateCriteria({
            radius: 8
        });
    }

    if (appFactory.eventQuery) {
        appFactory.eventQuery.updateCriteria({
            radius: 8
        });
    }

    $timeout(function () {
        console.log("timeout");
        if (!$rootScope.position) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: 'Network Error',
                template: 'Cannot retrieve location, please try again in a moment'
            });
            alertPopup.then(function (res) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    $rootScope.position = [position.coords.latitude, position.coords.longitude];
                    $rootScope.$broadcast('locationReady', 'locationReady');
                });
            });
        }
    }, 5000);

    $scope.clickontab = function (tab, $event) {
        $scope.array = {};

        $scope.header = tab;
        $rootScope.header = tab;
        appFactory.state = tab;
        $scope.searchContainer.searchRadius = 30;
        clearpins();
        console.log("pins cleared");
        if (tab == "Events") {
            markEvents();
        } else if (tab == "Users") {
            markTrainers();
            markGyms();
        } else {
            alert("Classes coming soon");
            $scope.clickontab("Users");
            markGyms();
        }
    };

    $ionicPopover.fromTemplateUrl('js/map/templates/search_popover.html', {
        scope: $scope
    }).then(function (search_popover) {
        $scope.searchContainer = {};

        $scope.search_popover = search_popover;
    });

    $ionicPopover.fromTemplateUrl('js/map/templates/mobile_popover.html', {
        scope: $scope
    }).then(function (mobile_popover) {
        $scope.searchContainer = {};
        $scope.searchContainer.mobile_trainers = false;
        $scope.mobile_popover = mobile_popover;
    });

    $scope.open_search_popover = function ($event) {
        console.log($event);
        console.log($scope.popover);
        $scope.search_popover.show($event);
    };

    $scope.open_mobile_popover = function ($event) {
        console.log($event);
        console.log($scope.popover);
        $scope.mobile_popover.show($event);
    };

    $scope.closePopover = function () {
        $scope.search_popover.hide();
        $scope.mobile_popover.hide();
    };

    $scope.$on('$destroy', function () {
        $scope.search_popover.remove();
        $scope.mobile_popover.remove();
    });

    $scope.cancelSearch = function () {
        $scope.searchContainer.searchTerms = "";
        $scope.searchContainer.searchRadius = 30;
        $scope.popover.hide();
    }

    $scope.searchMobileTrainers = function () {
        console.log($scope.searchContainer.mobile_trainers);
//        if ($scope.searchContainer.mobile_trainers) {

            clearpins();
            markTrainers();
            markGyms();
//        }
        $scope.closePopover();
    }

//    console.log("map ctrl");


    $scope.searchCategory = function(){
        console.log($scope.searchContainer.selectedCategory);
        $scope.searchContainer.searchTerms = $scope.searchContainer.selectedCategory.name + $scope.searchContainer.searchTerms;
        clearpins();
        if ($rootScope.header == "Events") {
            markEvents();
        } else {
            markGyms();
        }
    };

    var compileDropMarker = function (obj, loaded) {
        if($rootScope.header == "Users") {
            var radius = 0;
            if (obj.type == "Users") {
                if (loaded.radius) {
                    radius = loaded.radius;
                }

            }
            if (obj.type == "Gyms") {
                angular.forEach(loaded.items, function (aobj, key) {
                    if (aobj.radius > radius) radius = aobj.radius;
                });
            }
            console.log(radius);
            if ($scope.searchContainer.mobile_trainers && radius <= 0) {
                return;
            }

            if ($scope.searchContainer.mobile_trainers && radius > 0) {
//                var populationOptions = {
//                    strokeColor: '#2861ff',
//                    strokeOpacity: 0.8,
//                    strokeWeight: 2,
//                    fillColor: '#2861ff',
//                    fillOpacity: 0.35,
//                    map: $scope.map,
//                    center: new google.maps.LatLng(obj.location[0], obj.location[1]),
//                    radius: radius
//                };
//                var trainerCircle = new google.maps.Circle(populationOptions);
//                $scope.trainerCircles.push(trainerCircle);
                var trainerCircle = L.circle([obj.location[0], obj.location[1]], radius);
                trainerCircle.addTo($scope.map);
                $scope.trainerCircles.push(trainerCircle);
            }

        }
//        var newmarker = new google.maps.Marker({
//            position: new google.maps.LatLng(obj.location[0], obj.location[1]),
//            optimized: true,
//            map: $scope.map
//        });


//        var newmarker = new L.Marker(new L.LatLng(obj.location[0], obj.location[1]));

//        console.log($scope.map);
//        $scope.map.addLayer(newmarker);

        var contentString;
        var infowindow;
        if (obj.type == "Users") {
            console.log($scope.array);
            contentString = '<trainer-info-window item=\'array["' + obj.key + '"]\'></trainer-info-window>';
            $scope.markers[obj.key.replace('-', "_")] = {
                lat: obj.location[0],
                lng: obj.location[1],
                message: contentString,
                focus: false,
                draggable: false,
                icon: {
                    type: 'div',
                    iconSize: [40, 40],
                    className: "div-icon-users",
                    html: '<img src="https://s3.amazonaws.com/com.onebody.profile/Users/' + obj.key + '/profilepic.jpg" class="map-icon-image" onerror="this.style.display=\'none\'" />',
                    popupAnchor:  [0, 0]
                },
                getMessageScope: function() {return $scope; }
            };
        } else if (obj.type == "Events") {
            console.log($scope.array);
            var keys = obj.key.split(",");
            contentString = '<event-info-window item=\'array["' + obj.key + '"]\'></event-info-window>';
            $scope.markers[obj.key.replace('-', "_")] = {
                lat: obj.location[0],
                lng: obj.location[1],
                message: contentString,
                focus: false,
                draggable: false,
                icon: {
                    type: 'div',
                    iconSize: [40, 40],
                    className: "div-icon-events",
                    html: '<img src="https://s3.amazonaws.com/com.onebody.profile/Events/' + keys[0] + '/profilepic.jpg" class="map-icon-image" onerror="this.style.display=\'none\'" />',
                    popupAnchor:  [0, 0]
                },
                getMessageScope: function() {return $scope; }
            };
//            infowindow = new google.maps.InfoWindow();
//            $scope.markers[obj.key] = {marker: newmarker, index: obj.key, infowindow: infowindow};
        } else {
            contentString = '<gym-info-window gym=\'array["' + obj.key + '"]\'></gym-info-window>';
            $scope.markers[obj.key.replace('-', "_")] = {
                lat: obj.location[0],
                lng: obj.location[1],
                message: contentString,
                focus: false,
                draggable: false,
                icon:{
                    iconUrl: 'img/gym-icon.png',
                    iconSize:     [38, 38]
                },
                getMessageScope: function() {return $scope; }
            };
//            infowindow = new google.maps.InfoWindow({maxWidth: 250});
//            $scope.markers[obj.key] = {marker: newmarker, index: obj.key, infowindow: infowindow};
        }
        console.log(contentString);

//        console.log(infowindow);
//        console.log(compiled[0]);
//        newmarker.bindPopup(compiled);

//        google.maps.event.addListener(newmarker, 'click', (function (marker, content, infowindow) {
//            return function () {
//                infowindow.setContent(content);
//                infowindow.open($scope.map, marker);
//            };
//        })(newmarker, compiled[0], infowindow));
    }

    function addTrainerToGym(gym, obj){
        angular.forEach(gym['Trainers'], function(trainer, key){
            var trainerObj = {
                location: obj.location,
                distance: obj.distance,
                key: trainer.userID,
                type: "Gyms"
            };
            console.log(trainerObj);
            loadUser(trainerObj, function(foundItem){
                if(!$scope.array[obj.key].items){
                    $scope.array[obj.key].items = [];
                }
                console.log(foundItem);
                var shouldPush = true;
                for(var i=0; i<$scope.array[obj.key].items.length; i++){
                    console.log($scope.array[obj.key].items[i]);
                    if($scope.array[obj.key].items[i].$id == foundItem.$id){
                        shouldPush = false;
                        break;
                    }
                }
                if(shouldPush){
                    $scope.array[obj.key].items.push(foundItem);
                }
            });
        });
    }

    function loadGym(obj, callback){
        var loadFromFirebase = function(makeCall){
            var fobj = $firebaseObject(Gyms.ref().child(obj.key));
            fobj.$loaded(function () {
                fobj.distance = obj.distance;
                appFactory.gyms[obj.key] = fobj;
                console.log($scope.array);
                $localstorage.setObject("Gyms", appFactory.gyms);

                $scope.array[obj.key] = fobj;

                if($scope.header == "Users"){
                    addTrainerToGym(fobj, obj);
                }
                if(makeCall) callback(fobj);
            });
        };

        if (appFactory.gyms[obj.key]) {
            $scope.array[obj.key] = appFactory.gyms[obj.key];
            $scope.array[obj.key].distance = obj.distance;
            if($scope.header == "Users"){
                addTrainerToGym($scope.array[obj.key], obj);
            }
            callback($scope.array[obj.key]);

            var lastModified = $firebaseObject(Gyms.ref().child(obj.key).child("modified"));
            var savedModified = appFactory.gyms[obj.key]['modified'];
            lastModified.$loaded(function(){
                if (lastModified.$value > savedModified) {
                    loadFromFirebase(false);
                }
            })
        } else {
            loadFromFirebase(true);
        }

    };


    function loadUser(obj, callback){
        var loadFromFirebase = function(makeCall){
            var fobj = $firebaseObject(Users.ref().child(obj.key));
            fobj.$loaded(function () {
                fobj.distance = obj.distance;
                appFactory.users[obj.key] = fobj;
                $localstorage.setObject("Users", appFactory.users);

                fobj.sizes = $firebaseObject(Sizes.ref().child(obj.key));
                $scope.array[obj.key] = fobj;
                console.log(appFactory.users);
                if(makeCall) callback(fobj);
            });
        };

        if (appFactory.users[obj.key]) {
            $scope.array[obj.key] = appFactory.users[obj.key];
            $scope.array[obj.key].sizes = $firebaseObject(Sizes.ref().child(obj.key));
            $scope.array[obj.key].distance = obj.distance;
            callback($scope.array[obj.key]);

            var lastModified = $firebaseObject(Users.ref().child(obj.key).child("modified"));
            var savedModified = appFactory.users[obj.key]['modified'];
            lastModified.$loaded(function(){
                if (lastModified.$value > savedModified) {
                    loadFromFirebase(false);
                }
            })
        } else {
            loadFromFirebase(true);
        }
    }


    var loadEvent = function (obj, callback) {
        var keys = obj.key.split(",");

        var loadFromFirebase = function(makeCall){
            var fobj = $firebaseObject(Events.ref().child(keys[1]).child(keys[0]));
            fobj.$loaded(function () {
                console.log(fobj);
                fobj.distance = obj.distance;
                appFactory.events[keys[0]] = fobj;
                $localstorage.setObject("Events", appFactory.events);
                $scope.array[obj.key] = fobj;
                if(makeCall) callback(fobj);
            });
        };

        if (appFactory.events[keys[0]]) {
            $scope.array[obj.key] = appFactory.events[keys[0]];
            $scope.array[obj.key].distance = obj.distance;
            callback($scope.array[obj.key]);

            var lastModified = $firebaseObject(Events.ref().child(keys[1]).child(keys[0]).child("modified"));
            var savedModified = appFactory.events[keys[0]]['modified'];
            lastModified.$loaded(function(){
                if (lastModified.$value > savedModified) {
                    loadFromFirebase(false);
                }
            })
        } else {
            loadFromFirebase(true);
        }
    };




    var calculateRadius = function () {
        var bounds = $scope.map.getBounds();

        var center = bounds.getCenter();
        var ne = bounds.getNorthEast();

// r = radius of the earth in statute miles
        var r = 3963.0;

// Convert lat or lng from decimal degrees into radians (divide by 57.2958)
        var lat1 = center.lat() / 57.2958;
        var lon1 = center.lng() / 57.2958;
        var lat2 = ne.lat() / 57.2958;
        var lon2 = ne.lng() / 57.2958;

// distance = circle radius from center to Northeast corner of bounds
        return r * Math.acos(Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)) + 3;
    }

    function markTrainers() {
        angular.forEach(appFactory.geoTrainers, function(obj, key){
            loadUser(obj, function(foundItem){
                console.log(foundItem);
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            });
        });

        appFactory.onKeyEnter = function (obj) {
            console.log("onKeyEnter");
            console.log(obj);
            loadUser(obj, function(foundItem){
                if(searchItem(foundItem)) {
//                    console.log(foundItem);
                    compileDropMarker(obj, foundItem);
                }
            });
        };

        appFactory.onKeyExit = function (key) {
            console.log("onKeyExit");
            console.log(key);
            if($scope.markers[key]) {
                delete $scope.markers[key];
//                $scope.markers[key].marker.setMap(null);
//                $scope.markers[key] = undefined;
            }
        };

        appFactory.onKeyMove = function (obj) {
            console.log("onKeyExit");
            console.log(obj);
            if($scope.markers[key]) {
                $scope.markers[obj.key].marker.setMap(null);
                $scope.markers[obj.key] = undefined;
            }

            loadUser(obj, function(foundItem){
                console.log(foundItem);
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            });
        };
    };

    function markGyms() {
        angular.forEach(appFactory.geoGyms, function(obj, key){
            loadGym(obj, function(foundItem){
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            })
        });

        appFactory.onGymEnter = function (obj) {
            console.log("onKeyEnter");
            console.log(obj);
//            dropMapMarker(obj);
            loadGym(obj, function(foundItem){
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            })
        };

        appFactory.onGymExit = function (key) {
            console.log("onKeyExit");
            console.log(key);

            if($scope.markers[key]){
                delete $scope.markers[key];
//                $scope.markers[key].marker.setMap(null);
//                $scope.markers[key] = undefined;
            }
        };

        appFactory.onGymMove = function (obj) {
            console.log("onKeyExit");
            console.log(obj);
            if($scope.markers[key]) {
                delete $scope.markers[obj.key];
//                $scope.markers[obj.key].marker.setMap(null);
//                $scope.markers[obj.key] = undefined;
            }

//            dropMapMarker(obj);
            loadGym(obj, function(foundItem){
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            })
        };
    };

    function markEvents() {
        angular.forEach(appFactory.geoEvents, function(obj, key) {
            loadEvent(obj, function (foundItem) {
                console.log(foundItem);
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            });
        });

        appFactory.onKeyEnter = function (obj) {
            console.log("onKeyEnter");
            console.log(obj);
            loadEvent(obj, function (foundItem) {
                console.log(foundItem);
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            });
        };

        appFactory.onKeyExit = function (key) {
            console.log("onKeyExit");
            console.log(key);
            if($scope.markers[key]){
                $scope.markers[key].marker.setMap(null);
                $scope.markers[key] = undefined;
            }
        };

        appFactory.onKeyMove = function (obj) {
            console.log("onKeyExit");
            console.log(obj);
            if($scope.markers[key]) {
                delete $scope.markers[obj.key]
//                $scope.markers[obj.key].marker.setMap(null);
//                $scope.markers[obj.key] = undefined;
            }
            loadEvent(obj, function (foundItem) {
                console.log(foundItem);
                if(searchItem(foundItem)) {
                    compileDropMarker(obj, foundItem);
                }
            });
        };
    };


    function setmap() {
        $scope.center = {
            lat: position[0],
            lng: position[1],
            zoom: 13
        };
        console.log($scope.center.lat + " " + $scope.center.lng);

//        leafletData.getMap('dashmap').then(function(map) {
//            $scope.map = map;
//            console.log(map);
//        });
        $scope.defaults = {
            attributionControl: false,
            zoomControl:false,
            minZoom: 8
        };
//        var map = new google.maps.Map(document.getElementById('dashmap'), {
//            zoom: 12,
//            center: new google.maps.LatLng(position[0], position[1]),
//            mapTypeId: google.maps.MapTypeId.ROADMAP,
//            mapTypeControl: false,
//            streetViewControl: false,
//            zoomControl: false,
//            panControl: false
//        });
//        $scope.array = {};
//        $scope.map = {};
//        if ($rootScope.header == "Events") {
////            markEvents();
//        } else if ($rootScope.header == "Users") {
//            markTrainers();
////            markGyms();
//        } else {
////            markGyms();
//        }

//        var inprogress = false;
//        google.maps.event.addListener(map, 'dragend', function () {
//            $rootScope.position = [map.getCenter().lat(), map.getCenter().lng()];
//
//            var newRadius = calculateRadius();
//            appFactory.radius = newRadius;
////                if($scope.searchContainer.redo_search){
//            appFactory.trainerQuery.updateCriteria({
//                center: [map.getCenter().lat(), map.getCenter().lng()],
//                radius: newRadius
//            });
//
//            appFactory.eventQuery.updateCriteria({
//                center: [map.getCenter().lat(), map.getCenter().lng()],
//                radius: newRadius
//            });
//
//            appFactory.gymQuery.updateCriteria({
//                center: [map.getCenter().lat(), map.getCenter().lng()],
//                radius: newRadius
//            });
//        });
//
//        google.maps.event.addListener(map, 'zoom_changed', function () {
//            var newRadius = calculateRadius();
//            appFactory.radius = newRadius;
//            appFactory.trainerQuery.updateCriteria({
//                center: [map.getCenter().lat(), map.getCenter().lng()],
//                radius: newRadius
//            });
//
//            appFactory.eventQuery.updateCriteria({
//                center: [map.getCenter().lat(), map.getCenter().lng()],
//                radius: newRadius
//            });
//
//            appFactory.gymQuery.updateCriteria({
//                center: [map.getCenter().lat(), map.getCenter().lng()],
//                radius: newRadius
//            });
//        });
//
//        google.maps.event.addListener(map, 'click', function () {
//            console.log("on map click");
//            clearinfowindows();
//        });
    }

    $scope.onSearch = function () {
        appFactory.onsearch = true;
        window.location.href = "#/menu/list";
    };

    $scope.$on('$destroy', function() {
        console.log("scope destroy, clear on key events");

        appFactory.onKeyEnter = undefined;

        appFactory.onKeyExit = undefined;

        appFactory.onKeyMove = undefined;
    });

    function clearpins() {
        for (var key in $scope.markers) {
            if (!$scope.markers.hasOwnProperty(key)) {
                continue;
            }

            delete $scope.markers[key];
//            (function (id) {
//                console.log($scope.markers[id]);
//                if ($scope.markers[id]) {
//                    $scope.markers[id].marker.setVisible(false);
//                    $scope.markers[id].marker.setMap(null);
//                    $scope.markers[id].marker = null;
//
//                }
//            }(key));

        }

        $scope.markers = {};

        for (var i = 0; i < $scope.trainerCircles.length; i++) { //clear markers
            $scope.map.removeLayer($scope.trainerCircles[i]);
//            $scope.trainerCircles[i].setMap(null);
        }
        $scope.trainerCircles = [];
    }

    function clearinfowindows() {
        console.log($scope.markers);
        for (var key in $scope.markers) {
            if (!$scope.markers.hasOwnProperty(key)) {
                continue;
            }
            if ($scope.markers[key]) {
                $scope.markers[key].infowindow.close();
            }
        }
    }

    $scope.centerOnMe = function () {
        if (!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });

        navigator.geolocation.getCurrentPosition(function(pos) {
            $scope.center = {
                lat: pos[0],
                lng: pos[1],
                zoom: 13
            };

//            mapFactory.centerOnMe($scope.map, function () {
            $ionicLoading.hide();
        })

    };

    $scope.switchView = function () {
        alert("switch to list view");
    }

});
//    var dropGymMarker = function (key, radius, center, searchTerms, mobile, tab) {
//        (function (index) {
//            $scope.gyms[index].type = tab;
//            if (tab == "Users") {
//                tab = "Trainers";
//            }
//
//            $scope.gyms[index].tab = tab;
//            var obj = $scope.gyms[index];
//            console.log($scope.gyms);
//            console.log(obj);
//            if (obj[tab]) {
//                var newmarker = new google.maps.Marker({
//                    position: new google.maps.LatLng(obj.location[0], obj.location[1]),
//                    optimized: true,
//                    map: $scope.map
//                });
//                var contentString;
//                var infowindow;
//
//                contentString = '<gym-info-window gym=\'gyms["' + index + '"]\'></gym-info-window>';
//                console.log(contentString);
//                infowindow = new google.maps.InfoWindow({maxWidth: 250});
//                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
//
//                var compiled = $compile(contentString)($scope);
//
//                google.maps.event.addListener(newmarker, 'click', (function (marker, content, infowindow) {
//                    return function () {
//                        infowindow.setContent(content);
//                        infowindow.open($scope.map, marker);
//                    };
//                })(newmarker, compiled[0], infowindow));
//            }
//        }(key));
//    };
//
//    var dropMarker = function (key, radius, center, searchTerms, mobile, tab) {
//        (function (index) {
//            var obj = $scope.array[index];
//            var found = true;
//            if (searchTerms != undefined && searchTerms.length > 0) {
//                var terms = searchTerms.split(" ");
//                for (var i = 0; i < terms.length; i++) {
//                    var foundOneTerm = false;
//                    if (terms[i].indexOf("$cate") == 0) {
//                        console.log(obj.category.name);
//                        console.log(terms[i].substring(5));
//                        if (obj.category.name == terms[i].substring(5)) {
//                            continue;
//                        } else {
//                            found = false;
//                            continue;
//                        }
//                    }
//                    for (var j = 0; j < searchKeys.length; j++) {
//                        var searchKey = searchKeys[j];
//                        console.log(obj[searchKey]);
//                        if (obj[searchKey] != undefined && obj[searchKey].indexOf(terms[i]) >= 0) {
//                            foundOneTerm = true;
//                        }
//                    }
//                    if (!foundOneTerm) {
//                        found = false;
//                        continue;
//                    }
//                }
//            }
//            if (!found) {
//                console.log("not found");
//                return;
//            }
//
//            if (mobile) {
//                if (!obj.mobile) {
//                    return;
//                }
//            }
//
//            var newmarker = new google.maps.Marker({
//                position: new google.maps.LatLng(obj.location[0], obj.location[1]),
//                optimized: true,
//                map: $scope.map
//            });
//
//            if (mobile) {
//                if (obj.mobile) {
//                    var populationOptions = {
//                        strokeColor: '#2861ff',
//                        strokeOpacity: 0.8,
//                        strokeWeight: 2,
//                        fillColor: '#2861ff',
//                        fillOpacity: 0.35,
//                        map: $scope.map,
//                        center: new google.maps.LatLng(obj.location[0], obj.location[1]),
//                        radius: obj.radius
//                    };
//                    // Add the circle for this city to the map.
//                    var trainerCircle = new google.maps.Circle(populationOptions);
//                    $scope.trainerCircles.push(trainerCircle);
//                }
//            }
//
//            var contentString;
//            var infowindow;
//            if (tab == "Users") {
//                contentString = '<trainer-info-window item=\'array["' + index + '"]\'></trainer-info-window>';
//                console.log(contentString);
//                infowindow = new google.maps.InfoWindow();
//                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
//            } else if (tab == "Events") {
//                contentString = '<event-info-window item=\'array["' + index + '"]\'></event-info-window>';
//                infowindow = new google.maps.InfoWindow();
//                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
//            } else {
//                contentString = '<class-info-window item=\'array["' + index + '"]\'></class-info-window>';
//                infowindow = new google.maps.InfoWindow({maxWidth: 250});
//                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
//            }
//            console.log(contentString);
//            var compiled = $compile(contentString)($scope);
//
//            console.log(infowindow);
//            console.log(compiled[0]);
//            google.maps.event.addListener(newmarker, 'click', (function (marker, content, infowindow) {
//                return function () {
//                    infowindow.setContent(content);
//                    infowindow.open($scope.map, marker);
//                };
//            })(newmarker, compiled[0], infowindow));
//        }(key));
//    };
//
//    function dropGymPins(tab, radius, searchTerms, center, fitBounds, mobile, recalculateDistance) {
//        if ($scope.gymGeoQuery) {
//            $scope.gymGeoQuery.cancel();
//        }
//
//        console.log("dropGymPins");
//
//        if (center == undefined) {
//            center = [position.coords.latitude, position.coords.longitude];
//        }
//
//        if (radius == undefined || radius == "") {
//            radius = 20;
//        }
//
//        if (fitBounds == undefined) {
//            fitBounds = true;
//        }
//
//        if (typeof radius == "string") {
//            radius = parseInt(radius);
//        }
//
//        $scope.gymGeoQuery = GeoGyms.query({
//            center: center,
//            radius: radius
//        });
//
//        $scope.gyms = appFactory.gyms;
//
//        $scope.gymGeoQuery.on("key_entered", function (key, location, distance) {
//            if ($scope.gyms[key] && appFactory.modified["Gyms"][key] && $scope.gyms[key].modified >= appFactory.modified["Gyms"][key]) {
//                $scope.gyms[key].location = location;
//                $scope.gyms[key].distance = distance;
//                if ($scope.markers[key]) {
//                    $scope.markers[key].marker.setMap(null);
//                }
//                $scope.gyms[key].refreshed = false;
//                $localstorage.setObject("Gyms", $scope.gyms);
//                $scope.gyms[key].refreshed = true;
//                dropGymMarker(key, radius, center, searchTerms, mobile, tab);
//            } else {
//                var obj = $firebaseObject(Gyms.ref().child(key));
//
//                obj.$loaded().then(function () {
//                    obj.distance = distance;
//                    obj.location = location;
//                    obj.refreshed = false;
//                    $scope.gyms[key] = obj;
//                    $localstorage.setObject("Gyms", $scope.gyms);
//                    $scope.gyms[key].refreshed = true;
//                    if ($scope.markers[key]) {
//                        $scope.markers[key].marker.setMap(null);
//                    }
//                    dropGymMarker(key, radius, center, searchTerms, mobile, tab);
//                });
//            }
//        });
//
//        $scope.gymGeoQuery.on("key_moved", function (key, location, distance) {
//            $scope.gyms[key].distance = distance;
//            console.log(location);
//            $scope.gyms[key].location = location;
//            if ($scope.markers[key]) {
//                $scope.markers[key].marker.setMap(null);
//            }
//            dropGymMarker(key, radius, center, searchTerms, mobile, tab);
//            $localstorage.setObject("Gyms", $scope.gyms);
//        });
//
////        var map = $scope.map;
//        var bounds = new google.maps.LatLngBounds();
//        if (!$scope.markers) {
//            $scope.markers = {};  //group elements at the same distance to one infowindow
//        }
//    };
//});
//    function dropPins(tab, radius, searchTerms, center, fitBounds, mobile, recalculateDistance){
//        if($scope.geoQuery){
//            $scope.geoQuery.cancel();
//        }
//
//        if (center == undefined){
//            center = [position.coords.latitude, position.coords.longitude];
//        }
//
//        if(radius == undefined || radius == ""){
//            radius = 20;
//        }
//
//        if(fitBounds == undefined){
//            fitBounds = true;
//        }
//
//        if(typeof radius == "string"){
//            radius = parseInt(radius);
//        }
//
////        appFactory.getObjsWithinRadius(tab, [center[0], center[1]], radius);
//
//        var pinSource = GeoTrainers;
//        var firebaseSource = Trainers;
//        var source;
//        if(tab == "Users"){
//            $scope.array = appFactory.users;
//            pinSource = GeoTrainers;
//            firebaseSource = Trainers;
//        } else if(tab == "Events") {
//            $scope.array = appFactory.events;
//            pinSource = GeoEvents;
//            firebaseSource = Events;
//        } else {
//            return;
////            $scope.array = appFactory.gyms;
////            pinSource = GeoGyms;
////            firebaseSource = Gyms;
//        }
//        console.log(tab);
//        console.log($scope.array);
//
//        $scope.geoQuery = pinSource.query({
//            center: center,
//            radius: radius
//        });
//
//        $scope.geoQuery.on("key_entered", function(key, location, distance) {
//            var userID;
//            if(tab == "Events"){
//                var keys = key.split(",");
//                key = keys[0];
//                userID = keys[1];
//            }
//
//            console.log($scope.array[key]);
//            if($scope.array[key] && appFactory.modified[tab][key] && $scope.array[key].modified >= appFactory.modified[tab][key]){
//                $scope.array[key].location = location;
//                $scope.array[key].distance = distance;
//                if($scope.markers[key]){
//                    $scope.markers[key].marker.setMap(null);
//                }
//                $scope.array[key].refreshed = false;
//                $localstorage.setObject(tab, $scope.array);
//                $scope.array[key].refreshed = true;
//                dropMarker(key, radius, center, searchTerms, mobile, tab);
//            } else {
//                var obj;
//                if(tab == "Events"){
//                    obj = $firebaseObject(firebaseSource.ref().child(userID).child(key));
//                } else {
//                    obj = $firebaseObject(firebaseSource.ref().child(key));
//                }
//                obj.$loaded().then(function () {
//                    obj.distance = distance;
//                    obj.location = location;
//                    obj.refreshed = false;
//                    $scope.array[key] = obj;
//                    $localstorage.setObject(tab, $scope.array);
//                    $scope.array[key].refreshed = true;
//                    console.log($scope.array[key]);
//                    if($scope.markers[key]){
//                        $scope.markers[key].marker.setMap(null);
//                    }
//                    dropMarker(key, radius, center, searchTerms, mobile, tab);
//                });
//            }

//
//            var modified = $firebaseObject(firebaseSource.ref().child(key).child("modified"));
//            modified.$loaded(function() {
//                console.log(modified);
//                if($scope.array[key] && $scope.array[key].modified >= modified.$value){
//                    $scope.array[key].location = location;
//                    $scope.array[key].distance = distance;
//                    if($scope.markers[key]){
//                        $scope.markers[key].marker.setMap(null);
//                    }
//                    $scope.array[key].refreshed = false;
//                    $localstorage.setObject(tab, $scope.array);
//                    $scope.array[key].refreshed = true;
//                    dropMarker(key, radius, center, searchTerms, mobile, tab);
//                } else {
//                    var obj;
//                    if(tab == "Events"){
//                        obj = $firebaseObject(firebaseSource.ref().child(userID).child(key));
//                    } else {
//                        obj = $firebaseObject(firebaseSource.ref().child(key));
//                    }
//                    obj.$loaded().then(function () {
//                        obj.distance = distance;
//                        obj.location = location;
//                        obj.refreshed = false;
//                        $scope.array[key] = obj;
//                        $localstorage.setObject(tab, $scope.array);
//                        $scope.array[key].refreshed = true;
//                        console.log($scope.array[key]);
//                        if($scope.markers[key]){
//                            $scope.markers[key].marker.setMap(null);
//                        }
//                        dropMarker(key, radius, center, searchTerms, mobile, tab);
//                    });
//                }
//            });

//            if($scope.array){
//                if(!$scope.array[key]){
//                    var obj;
//                    if(tab == "Events"){
//                        obj = $firebaseObject(firebaseSource.ref().child(userID).child(key));
//                    } else {
//                        obj = $firebaseObject(firebaseSource.ref().child(key));
//                    }
//                    obj.$loaded().then(function () {
//                        obj.distance = distance;
//                        obj.location = location;
//                        obj.refreshed = false;
//                        $scope.array[key] = obj;
//                        $localstorage.setObject(tab, $scope.array);
//                        $scope.array[key].refreshed = true;
//                        dropMarker(key, radius, center, searchTerms, mobile, tab);
//                    });
//                } else {
//                    console.log(key);
//                    $scope.array[key].distance = distance;
//                    if (!$scope.array[key].location) {
//                        $scope.array[key].location = location;
//                        dropMarker(key, radius, center, searchTerms, mobile, tab);
//                    } else {
//                        if($scope.markers && $scope.markers[key]){
//                            if ($scope.array[key].location[0] != location[0] &&
//                                $scope.array[key].location[1] != location[1]) {
//                                console.log(location);
//                                $scope.array[key].location = location;
//                                $scope.markers[key].marker.setMap(null);
//                                dropMarker(key, radius, center, searchTerms, mobile, tab);
//                            }
//                        } else {
//                            dropMarker(key, radius, center, searchTerms, mobile, tab);
//                        }
//                    }
//
//
//                    $scope.array[key].refreshed = false;
//                    $localstorage.setObject(tab, $scope.array);
//                    $scope.array[key].refreshed = true;
//                }
//            }

//        });

//        $scope.geoQuery.on("key_moved", function(key, location, distance) {
//            $scope.array[key].distance = distance;
//            console.log(location);
//            $scope.array[key].location = location;
//            $scope.markers[key].marker.setMap(null);
//            dropMarker(key, radius, center, searchTerms, mobile, tab);
//            $localstorage.setObject(tab, $scope.array);
//        });
//
////        var map = $scope.map;
//        var bounds = new google.maps.LatLngBounds();
//        if(!$scope.markers){
//            $scope.markers = {};  //group elements at the same distance to one infowindow
//        }
//        var objs = [];
//
//        console.log($scope.array);

//        for(var key in $scope.array){
//            if(!$scope.array.hasOwnProperty(key)){
//                continue;
//            }
//            var obj = $scope.array[key];
//            var distance;
//            if(recalculateDistance){
//                distance = mapFactory.calculateDistance(center[0], center[1], obj.location[0], obj.location[1]);
//            } else {
//                distance = mapFactory.calculateDistance(position.coords.latitude, position.coords.longitude, obj.location[0], obj.location[1]);
//            }
//
//            obj.distance = distance;
//            console.log(radius);
//            console.log(distance);
//            if(distance < radius){
//                dropMarker(key,radius, center, searchTerms, mobile, tab);
//            }
//
//            console.log("loading ready");
//            $ionicLoading.hide();
//        }

//    };

//});
//
//map.filter('toArray', function () {
//    return function (obj, addKey) {
//        if (!(obj instanceof Object)) {
//            return obj;
//        }
//
//        if ( addKey === false ) {
//            return Object.values(obj);
//        } else {
//            return Object.keys(obj).map(function (key) {
//                return Object.defineProperty(obj[key], '$key', { enumerable: false, value: key});
//            });
//        }
//    };
//});

//map.controller('ListCtrl', function($scope, appFactory, $timeout, $stateParams, $firebase, Events) {
//    $scope.clickontab = function(tab, $event){
//        console.log($event);
//        console.log(tab);
//        $scope.header = tab;
//        $rootScope.header = tab;
//        appFactory.state = tab;
//        $scope.searchContainer.searchTerms = "";
//        $scope.searchContainer.searchRadius = 30;
//        clearpins();
//        dropPins(tab);
//    }
//
//    for(var key in $scope.array) {
//        if (!$scope.array.hasOwnProperty(key)) {
//            continue;
//        }
//
//    }
//});
//>>>>>>> ui17e
