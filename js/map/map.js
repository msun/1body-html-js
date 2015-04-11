var map = angular.module('mapModule', ['ionic', 'accountModule', 'starter']);

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
            console.log(scope.item);
        }
    }
});

map.directive('eventInfoWindow', function(){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/event-info-window.html',
        scope: {item: '='},
        link: function(scope, element, attrs) {
            console.log(scope.item);
        }
    }
});

map.directive('classInfoWindow', function(){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/class-info-window.html',
        scope: {item: '@'},
        link: function(scope, element, attrs) {
        }
    }
});

map.directive('gymInfoWindow', function($firebaseArray){
    return{
        restrict: 'E',
        templateUrl: 'js/map/templates/gym-info-window.html',
        scope: {gym: '='},
        link: function(scope, element, attrs) {

            scope.items = scope.gym[scope.gym.tab];
            console.log(scope.gym);
        }
    }
});

map.controller('MapCtrl', function($rootScope, $scope, $compile, $timeout, $firebase, $ionicLoading, GeoTrainers, GeoEvents, mapFactory, appFactory, Trainers, Events, $ionicPopover, $ionicPopup, Categories, GeoGyms, Gyms, Classes, $localstorage, $firebaseObject, $firebaseArray, $ionicModal) {
    $scope.header = appFactory.state;
    var searchKeys = ["firstname", "lastname", "info", "group", "gym", "username", "email", "name"];
    $scope.categories = Categories;
    var pinSource = GeoTrainers;
    var firebaseSource = Trainers;
    $scope.markers = {};
    $scope.trainerCircles = [];

    $scope.clickontab = function(tab, $event){
        console.log($event);
        console.log(tab);
        $scope.header = tab;
        $rootScope.header = tab;
        appFactory.state = tab;
        $scope.searchContainer.searchTerms = "";
        $scope.searchContainer.searchRadius = "";
        clearpins();
        dropPins(tab);
        dropGymPins(tab);
    }

    $ionicPopover.fromTemplateUrl('js/map/templates/search_popover.html', {
        scope: $scope
    }).then(function(search_popover) {
        $scope.searchContainer = {};
        $scope.search_popover = search_popover;
    });

    $ionicPopover.fromTemplateUrl('js/map/templates/mobile_popover.html', {
        scope: $scope
    }).then(function(mobile_popover) {
        $scope.searchContainer = {};
        $scope.searchContainer.mobile_trainers = false;
        $scope.mobile_popover = mobile_popover;
    });

    $scope.open_search_popover = function($event) {
        console.log($event);
        console.log($scope.popover);
        $scope.search_popover.show($event);
    };

    $scope.open_mobile_popover = function($event) {
        console.log($event);
        console.log($scope.popover);
        $scope.mobile_popover.show($event);
    };

    $scope.closePopover = function() {
        $scope.search_popover.hide();
        $scope.mobile_popover.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.search_popover.remove();
        $scope.mobile_popover.remove();
    });

    $scope.searchMap = function(){
        if($scope.searchContainer.selectedCategory && $scope.searchContainer.selectedCategory.name){
            $scope.searchContainer.searchTerms = $scope.searchContainer.searchTerms + " $cate" + $scope.searchContainer.selectedCategory.name;
        }
        if(!$scope.searchContainer.searchRadius){
            $scope.searchContainer.searchRadius = 30;
        }
        console.log($scope.searchContainer.selectedCategory);
        console.log($scope.searchContainer.searchTerms);
        console.log($scope.searchContainer.searchRadius);
        clearpins();
        dropPins($scope.header, $scope.searchContainer.searchRadius, $scope.searchContainer.searchTerms);
    }

    $scope.cancelSearch = function(){
        $scope.searchContainer.searchTerms = "";
        $scope.searchContainer.searchRadius = "";
        $scope.popover.hide();
    }

    $scope.searchMobileTrainers = function(){
        console.log($scope.searchContainer.mobile_trainers);
        if($scope.searchContainer.mobile_trainers){
            clearpins();
            dropPins($scope.header, $scope.searchContainer.searchRadius, $scope.searchContainer.searchTerms, undefined, true, $scope.searchContainer.mobile_trainers);
        }
    }

    $scope.redoSearch = function(){
        console.log("redo search");
        clearpins();
        dropPins($scope.header, $scope.map.getCenter());
    }

    console.log("map ctrl");
//    $ionicLoading.show({
//        content: '<i class="icon ion-looping"></i> Loading location data',
//        animation: 'fade-in',
//        showBackdrop: true,
//        maxWidth: 200,
//        showDelay: 0
//    });

    $timeout(function(){
        console.log("timeout");
        if(appFactory.trainers.length <= 0){
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: 'Network Error',
                template: 'Cannot retrieve information from server, please try again in a moment'
            });
            alertPopup.then(function(res) {
                navigator.geolocation.getCurrentPosition(function(position){
                    $rootScope.position = position;
                    $rootScope.$broadcast('locationReady', 'locationReady');
                });
            });
        }
    }, 5000);

    var dropGymMarker = function(key, radius, center, searchTerms, mobile, tab){
        (function(index){
            $scope.gyms[index].tab = tab;
            var obj = $scope.gyms[index];
            console.log($scope.gyms);
            console.log(obj);
            if(obj[tab]) {
                var newmarker = new google.maps.Marker({
                    position: new google.maps.LatLng(obj.location[0], obj.location[1]),
                    optimized: true,
                    map: $scope.map
                });
                var contentString;
                var infowindow;

                contentString = '<gym-info-window gym=\'gyms["' + index + '"]\'></gym-info-window>';
                console.log(contentString);
                infowindow = new google.maps.InfoWindow({maxWidth: 250});
                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};

                var compiled = $compile(contentString)($scope);

                google.maps.event.addListener(newmarker, 'click', (function (marker, content, infowindow) {
                    return function () {
                        infowindow.setContent(content);
                        infowindow.open($scope.map, marker);
                    };
                })(newmarker, compiled[0], infowindow));
            }
        }(key));
    };

    var dropMarker = function(key, radius, center, searchTerms, mobile, tab){
        (function(index){
            var obj = $scope.array[index];
            var found = true;
            if(searchTerms!=undefined && searchTerms.length > 0){
                var terms = searchTerms.split(" ");
                for (var i = 0; i < terms.length; i++) {
                    var foundOneTerm = false;
                    if(terms[i].indexOf("$cate") == 0){
                        console.log(obj.category.name);
                        console.log(terms[i].substring(5));
                        if(obj.category.name == terms[i].substring(5)){
                            continue;
                        } else {
                            found = false;
                            continue;
                        }
                    }
                    for (var j = 0; j < searchKeys.length; j++) {
                        var searchKey = searchKeys[j];
                        console.log(obj[searchKey]);
                        if(obj[searchKey] != undefined && obj[searchKey].indexOf(terms[i]) >= 0){
                            foundOneTerm = true;
                        }
                    }
                    if (!foundOneTerm) {
                        found = false;
                        continue;
                    }
                }
            }
            if (!found) {
                console.log("not found");
                return;
            }

            if(mobile){
                if(!obj.mobile){
                    return;
                }
            }

            var newmarker = new google.maps.Marker({
                position: new google.maps.LatLng(obj.location[0], obj.location[1]),
                optimized: true,
                map: $scope.map
            });

            if(mobile){
                if(obj.mobile){
                    var populationOptions = {
                        strokeColor: '#2861ff',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#2861ff',
                        fillOpacity: 0.35,
                        map: $scope.map,
                        center: new google.maps.LatLng(obj.location[0], obj.location[1]),
                        radius: obj.radius
                    };
                    // Add the circle for this city to the map.
                    var trainerCircle = new google.maps.Circle(populationOptions);
                    $scope.trainerCircles.push(trainerCircle);
                }
            }

            var contentString;
            var infowindow;
            if(tab == "Trainers"){
                contentString = '<trainer-info-window item=\'array["' + index + '"]\'></trainer-info-window>';
                console.log(contentString);
                infowindow = new google.maps.InfoWindow();
                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
            } else if(tab == "Events") {
                contentString = '<event-info-window item=\'array["' + index + '"]\'></event-info-window>';
                infowindow = new google.maps.InfoWindow();
                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
            } else {
                contentString = '<class-info-window item=\'array["' + index + '"]\'></class-info-window>';
                infowindow = new google.maps.InfoWindow({maxWidth: 250});
                $scope.markers[index] = {marker: newmarker, index: index, infowindow: infowindow};
            }
            console.log(contentString);
            var compiled = $compile(contentString)($scope);

            console.log(infowindow);
            console.log(compiled[0]);
            google.maps.event.addListener(newmarker, 'click', (function(marker,content,infowindow){
                return function() {
//                    var pinSource = GeoTrainers;
//                    var objKey = key;
//                    if(tab == "Events") {
//                        pinSource = GeoEvents;
//                        objKey = key + "," + obj.userID;
//                    }
//
//                    pinSource.get(objKey).then(function(location) {
//                        if (location === null) {
//                            console.log("Provided key is not in GeoFire");
//                            newmarker.setMap(null);
//                            $scope.array[key] = obj;
//                            $localstorage.setObject(tab, $scope.array);
//                        }
//                    }, function(error) {
//                        console.log("Error: " + error);
//                    });

                    infowindow.setContent(content);
                    infowindow.open($scope.map,marker);
                };
            })(newmarker,compiled[0],infowindow));
        }(key));
    };

    var position;
    if($rootScope.position){
        console.log($rootScope.position);
        position = $rootScope.position;
        setmap();
        dropPins(appFactory.state);
        dropGymPins(appFactory.state);
        appFactory.user.position = $rootScope.position;
        $localstorage.setObject("user", appFactory.user);
    } else {
        if(appFactory.user.position){
            position = appFactory.user.position;
            setmap();
            dropPins(appFactory.state);
            dropGymPins(appFactory.state);
        }
        $scope.$on('locationReady', function (event, data) {
            position = $rootScope.position;
            console.log(appFactory.user.position);
            setmap();
            dropPins(appFactory.state);
            dropGymPins(appFactory.state);
            appFactory.user.position = $rootScope.position;
            $localstorage.setObject("user", appFactory.user);
        });
    }

    function setmap(){
        var map = new google.maps.Map(document.getElementById('dashmap'), {
            zoom: 11,
            center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: false,
            panControl: false
        });

        $scope.map = map;
        var inprogress = false;
        google.maps.event.addListener(map, 'dragend', function() {
            if($scope.searchContainer.searchTerms && $scope.searchContainer.searchTerms != ""){
                console.log("In search, no re-search at dragend");
            } else {
                if($scope.searchContainer.redo_search){
                    clearpins();
                    dropPins($scope.header, undefined, undefined, [map.getCenter().lat(), map.getCenter().lng()], false, $scope.searchContainer.mobile_trainers, false);
                    dropGymPins($scope.header, undefined, undefined, [map.getCenter().lat(), map.getCenter().lng()], false, $scope.searchContainer.mobile_trainers, false);
                }
            }
        });

        google.maps.event.addListener(map, 'click', function() {
            clearinfowindows();
        });
    }

    function clearpins(){
        for(var key in $scope.markers) {
            if (!$scope.markers.hasOwnProperty(key)) {
                continue;
            }
            console.log(key);
            $scope.markers[key].marker.setMap(null);
        }

        $scope.markers = {};

        for (var i = 0; i < $scope.trainerCircles.length; i++) { //clear markers
            $scope.trainerCircles[i].setMap(null);
        }
        $scope.trainerCircles = [];
    }

    function clearinfowindows(){
        for(var key in $scope.markers) {
            if (!$scope.markers.hasOwnProperty(key)) {
                continue;
            }
            $scope.markers[key].infowindow.close();
        }
    }

    function dropGymPins(tab, radius, searchTerms, center, fitBounds, mobile, recalculateDistance){
        if($scope.gymGeoQuery){
            $scope.gymGeoQuery.cancel();
        }

        console.log("dropGymPins");

        if (center == undefined){
            center = [position.coords.latitude, position.coords.longitude];
        }

        if(radius == undefined || radius == ""){
            radius = 20;
        }

        if(fitBounds == undefined){
            fitBounds = true;
        }

        if(typeof radius == "string"){
            radius = parseInt(radius);
        }

        $scope.gymGeoQuery = GeoGyms.query({
            center: center,
            radius: radius
        });

        $scope.gyms = appFactory.gyms;

        $scope.gymGeoQuery.on("key_entered", function(key, location, distance) {
            var modified = $firebaseObject(Gyms.ref().child(key).child("modified"));
            modified.$loaded(function(){
                console.log(modified);
                if($scope.gyms[key] && $scope.gyms[key].modified >= modified.$value){
                    $scope.gyms[key].location = location;
                    $scope.gyms[key].distance = distance;
                    if($scope.markers[key]){
                        $scope.markers[key].marker.setMap(null);
                    }
                    $scope.gyms[key].refreshed = false;
                    $localstorage.setObject("Gyms", $scope.gyms);
                    $scope.gyms[key].refreshed = true;
                    dropGymMarker(key, radius, center, searchTerms, mobile, tab);
                } else {
                    var obj = $firebaseObject(Gyms.ref().child(key));
                    obj.$loaded().then(function () {
                        obj.distance = distance;
                        obj.location = location;
                        obj.refreshed = false;
                        $scope.gyms[key] = obj;
                        $localstorage.setObject("Gyms", $scope.gyms);
                        $scope.gyms[key].refreshed = true;
                        alert($scope.gyms[key].name);
                        if($scope.markers[key]){
                            $scope.markers[key].marker.setMap(null);
                        }
                        dropGymMarker(key, radius, center, searchTerms, mobile, tab);
                    });
                }
            })
        });

        $scope.gymGeoQuery.on("key_moved", function(key, location, distance) {
            $scope.gyms[key].distance = distance;
            console.log(location);
            $scope.gyms[key].location = location;
            if($scope.markers[key]){
                $scope.markers[key].marker.setMap(null);
            }
            dropGymMarker(key, radius, center, searchTerms, mobile, tab);
            $localstorage.setObject("Gyms", $scope.gyms);
        });

//        var map = $scope.map;
        var bounds = new google.maps.LatLngBounds();
        if(!$scope.markers){
            $scope.markers = {};  //group elements at the same distance to one infowindow
        }
        var objs = [];

        console.log($scope.gyms);

        for(var key in $scope.gyms){
            if(!$scope.gyms.hasOwnProperty(key)){
                continue;
            }
            var obj = $scope.gyms[key];
            var distance;
            if(recalculateDistance){
                distance = mapFactory.calculateDistance(center[0], center[1], obj.location[0], obj.location[1]);
            } else {
                distance = mapFactory.calculateDistance(position.coords.latitude, position.coords.longitude, obj.location[0], obj.location[1]);
            }

            obj.distance = distance;
            console.log(radius);
            console.log(distance);
            if(distance < radius){
                dropGymMarker(key, radius, center, searchTerms, mobile, tab);
            }

            console.log("loading ready");
            $ionicLoading.hide();
        }

    };

    function dropPins(tab, radius, searchTerms, center, fitBounds, mobile, recalculateDistance){
        if($scope.geoQuery){
            $scope.geoQuery.cancel();
        }

        if (center == undefined){
            center = [position.coords.latitude, position.coords.longitude];
        }

        if(radius == undefined || radius == ""){
            radius = 20;
        }

        if(fitBounds == undefined){
            fitBounds = true;
        }

        if(typeof radius == "string"){
            radius = parseInt(radius);
        }

//        appFactory.getObjsWithinRadius(tab, [center[0], center[1]], radius);

        var pinSource = GeoTrainers;
        var firebaseSource = Trainers;
        var source;
        if(tab == "Trainers"){
            $scope.array = appFactory.trainers;
            pinSource = GeoTrainers;
            firebaseSource = Trainers;
        } else if(tab == "Events") {
            $scope.array = appFactory.events;
            pinSource = GeoEvents;
            firebaseSource = Events;
        } else {
            return;
//            $scope.array = appFactory.gyms;
//            pinSource = GeoGyms;
//            firebaseSource = Gyms;
        }
        console.log(tab);
        console.log($scope.array);

        $scope.geoQuery = pinSource.query({
            center: center,
            radius: radius
        });

        $scope.geoQuery.on("key_entered", function(key, location, distance) {
            var userID;
            if(tab == "Events"){
                var keys = key.split(",");
                key = keys[0];
                userID = keys[1];
            }
            var modified = $firebaseObject(firebaseSource.ref().child(key).child("modified"));
            modified.$loaded(function() {
                console.log(modified);
                if($scope.array[key] && $scope.array[key].modified >= modified.$value){
                    $scope.array[key].location = location;
                    $scope.array[key].distance = distance;
                    if($scope.markers[key]){
                        $scope.markers[key].marker.setMap(null);
                    }
                    $scope.array[key].refreshed = false;
                    $localstorage.setObject(tab, $scope.array);
                    $scope.array[key].refreshed = true;
                    dropMarker(key, radius, center, searchTerms, mobile, tab);
                } else {
                    var obj;
                    if(tab == "Events"){
                        obj = $firebaseObject(firebaseSource.ref().child(userID).child(key));
                    } else {
                        obj = $firebaseObject(firebaseSource.ref().child(key));
                    }
                    obj.$loaded().then(function () {
                        obj.distance = distance;
                        obj.location = location;
                        obj.refreshed = false;
                        $scope.array[key] = obj;
                        $localstorage.setObject(tab, $scope.array);
                        $scope.array[key].refreshed = true;
                        console.log($scope.array[key]);
                        if($scope.markers[key]){
                            $scope.markers[key].marker.setMap(null);
                        }
                        dropMarker(key, radius, center, searchTerms, mobile, tab);
                    });
                }
            });

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

        });

        $scope.geoQuery.on("key_moved", function(key, location, distance) {
            $scope.array[key].distance = distance;
            console.log(location);
            $scope.array[key].location = location;
            $scope.markers[key].marker.setMap(null);
            dropMarker(key, radius, center, searchTerms, mobile, tab);
            $localstorage.setObject(tab, $scope.array);
        });

//        var map = $scope.map;
        var bounds = new google.maps.LatLngBounds();
        if(!$scope.markers){
            $scope.markers = {};  //group elements at the same distance to one infowindow
        }
        var objs = [];

        console.log($scope.array);

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

    };

    $scope.centerOnMe = function() {
        if(!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });

        mapFactory.centerOnMe($scope.map, function(){
            $ionicLoading.hide();
        })

    };

    $scope.switchView = function(){
        alert("switch to list view");
    }

    $ionicModal.fromTemplateUrl('js/map/templates/list-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.listModal = modal;
    });

    $scope.$on('$destroy', function() {
        $scope.listModal.remove();
    });

    $scope.showListModal = function(){
        $scope.listModal.show();
    }

    $scope.closeListModal = function(){
        $scope.listModal.hide();
    }
});

map.filter('toArray', function () {
    return function (obj, addKey) {
        if (!(obj instanceof Object)) {
            return obj;
        }

        if ( addKey === false ) {
            return Object.values(obj);
        } else {
            return Object.keys(obj).map(function (key) {
                return Object.defineProperty(obj[key], '$key', { enumerable: false, value: key});
            });
        }
    };
});

//map.controller('ListCtrl', function($scope, appFactory, $timeout, $stateParams, $firebase, Events) {
//    $scope.clickontab = function(tab, $event){
//        console.log($event);
//        console.log(tab);
//        $scope.header = tab;
//        $rootScope.header = tab;
//        appFactory.state = tab;
//        $scope.searchContainer.searchTerms = "";
//        $scope.searchContainer.searchRadius = "";
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