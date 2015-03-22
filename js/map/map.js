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

map.controller('TrainerMapCtrl', function($rootScope, $scope, $compile, $timeout, $firebase, $ionicLoading, GeoTrainers, GeoEvents, mapFactory, appFactory, Trainers, Events, $ionicPopover, $ionicPopup, Categories, GeoGyms, Gyms, Classes, $localstorage, $firebaseObject, $firebaseArray) {
    $scope.header = appFactory.state;
    var searchKeys = ["firstname", "lastname", "info", "group", "gym", "username", "email", "name"];
    $scope.categories = Categories;
    var pinSource = GeoTrainers;
    var firebaseSource = Trainers;
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
                position: new google.maps.LatLng(obj.latitude, obj.longitude),
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
                        center: new google.maps.LatLng(obj.latitude, obj.longitude),
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
                $scope.markers.push({marker: newmarker, index: index, infowindow: infowindow});
            } else if(tab == "Events") {
                contentString = '<event-info-window item=\'array["' + index + '"]\'></event-info-window>';
                infowindow = new google.maps.InfoWindow();
                $scope.markers.push({marker: newmarker, index: index, infowindow: infowindow});
            } else {
                contentString = '<class-info-window item=\'array["' + index + '"]\'></class-info-window>';
                infowindow = new google.maps.InfoWindow({maxWidth: 250});
                $scope.markers.push({marker: newmarker, index: index, infowindow: infowindow});
            }
            console.log(contentString);
            var compiled = $compile(contentString)($scope);

            console.log(infowindow);
            console.log(compiled[0]);
            google.maps.event.addListener(newmarker, 'click', (function(marker,content,infowindow){
                return function() {
                    infowindow.setContent(content);
                    infowindow.open($scope.map,marker);
                };
            })(newmarker,compiled[0],infowindow));
        }(key));
    }

    var position;
    if($rootScope.position){
        console.log($rootScope.position);
        position = $rootScope.position;
        setmap();
        dropPins(appFactory.state);
        appFactory.user.position = $rootScope.position;
        $localstorage.setObject("user", appFactory.user);
    } else {
        if(appFactory.user.position){
            position = appFactory.user.position;
            setmap();
            dropPins(appFactory.state);
        }
        $scope.$on('locationReady', function (event, data) {
            position = $rootScope.position;
            console.log(appFactory.user.position);
            setmap();
            dropPins(appFactory.state);
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
                }
            }
        });
    }

    function clearpins(){
        for (var i = 0; i < $scope.markers.length; i++) { //clear markers
            $scope.markers[i].marker.setMap(null);
        }
        $scope.markers = [];

        for (var i = 0; i < $scope.trainerCircles.length; i++) { //clear markers
            $scope.trainerCircles[i].setMap(null);
        }
        $scope.trainerCircles = [];
    }

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
            $scope.array = appFactory.classes;
            pinSource = GeoGyms;
            firebaseSource = Gyms;
        }


        $scope.geoQuery = pinSource.query({
            center: center,
            radius: radius
        });

        $scope.geoQuery.on("key_entered", function(key, location, distance) {
            if(!$scope.array[key]){

                var obj = $firebaseObject(firebaseSource.ref().child(key));
                obj.$loaded().then(function () {
                    obj.distance = distance;
                    obj.location = location;
                    obj.refreshed = false;
                    $scope.array[key] = obj;
                    $scope.array[key].refreshed = true;
                    $localstorage.setObject(tab, $scope.array);
                    dropMarker(key, radius, center, searchTerms, mobile, tab);
                });
            }
        });

//        var map = $scope.map;
        var bounds = new google.maps.LatLngBounds();
        $scope.markers = [];  //group elements at the same distance to one infowindow
        var objs = [];

        console.log($scope.array);

        for(var key in $scope.array){
            if(!$scope.array.hasOwnProperty(key)){
                continue;
            }
            var obj = $scope.array[key];
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
                dropMarker(key,radius, center, searchTerms, mobile, tab);
            }

            console.log("loading ready");
            $ionicLoading.hide();
        }

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

});