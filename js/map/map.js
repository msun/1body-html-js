var map = angular.module('mapModule', ['ionic', 'accountModule', 'starter']);

map.factory('mapFactory', function($http, $compile){
    var factory = {};
    factory.initialize = function(items, tab, user, infoCompile) {
        var map = new google.maps.Map(document.getElementById(tab+'map'), {
            zoom: 10,
            center: new google.maps.LatLng(user.latitude, user.longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        var marker, i;
        for (i = 0; i < items.length; i++) {
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(items[i].latitude, items[i].longitude),
                map: map
            });

            var infowindow = new google.maps.InfoWindow({
                content: infoCompile[i][0]
            });
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(map, marker);
            });
        }
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
    return factory;
});

var coordinatesAreEquivalent = function(coord1, coord2, diff) {
    return (Math.abs(coord1 - coord2) < diff);
}

map.controller('TrainerMapCtrl', function($rootScope, $scope, $compile, $timeout, $firebase, $ionicLoading, GeoTrainers, GeoEvents, mapFactory, appFactory, Trainers, Events, $ionicPopover, $ionicPopup, Categories, GeoClasses, Classes) {
    $scope.header = appFactory.state;
    var searchKeys = ["firstname", "lastname", "info", "group", "gym", "username", "email", "name"];
    $scope.categories = Categories;
    var pinSource = GeoTrainers;
    var firebaseSource = Trainers;
    $scope.clickontab = function(tab){
        $scope.header = tab;
        appFactory.state = tab;
        $scope.searchContainer.searchTerms = "";
        $scope.searchContainer.searchRadius = "";
        clearpins();
        dropPins(tab);
    }

//    $ionicPopover.fromTemplate('<ion-popover-view><ion-content>hello</ion-content></ion-popover-view>', function(popover) {
//        $scope.popover = popover;
//    });

    $ionicPopover.fromTemplateUrl('js/map/templates/popover.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.searchContainer = {};
        $scope.popover = popover;
    });
    $scope.openPopover = function($event) {
        console.log($event);
        console.log($scope.popover);
        $scope.popover.show($event);
    };
    $scope.closePopover = function() {
        $scope.popover.hide();
    };
    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });

    $scope.searchMap = function(){
        if($scope.searchContainer.selectedCategory && $scope.searchContainer.selectedCategory.name){
            $scope.searchContainer.searchTerms = $scope.searchContainer.searchTerms + " $cate" + $scope.searchContainer.selectedCategory.name;
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

    console.log("map ctrl");
    $ionicLoading.show({
        content: '<i class="icon ion-looping"></i> Loading location data',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

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


    var position;
    if($rootScope.position){
        position = $rootScope.position;
        setmap();
        dropPins(appFactory.state);
    } else {
        $scope.$on('locationReady', function (event, data) {
            position = $rootScope.position;
            console.log(position);
            setmap();
            dropPins(appFactory.state);
        });
    }

    function setmap(){
        var map = new google.maps.Map(document.getElementById('dashmap'), {
            zoom: 8,
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
                clearpins();
                dropPins($scope.header, undefined, undefined, [map.getCenter().k, map.getCenter().B], false);
            }
        });
    }

    function clearpins(){
        for (var i = 0; i < $scope.markers.length; i++) { //clear markers
            $scope.markers[i].marker.setMap(null);
        }
        $scope.markers = [];
    }

    function dropPins(tab, radius, searchTerms, center, fitBounds){
        if(tab == "Trainers"){
            pinSource = GeoTrainers;
            firebaseSource = Trainers;
        } else if(tab == "Events") {
            pinSource = GeoEvents;
            firebaseSource = Events;
        } else {
            pinSource = GeoClasses;
            firebaseSource = Classes;
        }

        if (center == undefined){
            center = [position.coords.latitude, position.coords.longitude];
        }
        if(fitBounds == undefined){
            fitBounds = true;
        }
        if(radius == undefined || radius == ""){
            radius = 10;
        }
        console.log(typeof radius);
        if(typeof radius == "string"){
            radius = parseInt(radius);
            console.log(radius);
        }
        console.log(center);
        var geoQuery = pinSource.query({
            center: center,
            radius: radius
        });

        var map = $scope.map;
        var bounds = new google.maps.LatLngBounds();
        $scope.markers = [];  //group elements at the same distance to one infowindow
        var objs = [];

        geoQuery.on("key_entered", function(key, location, distance) {
            var ref = $firebase(firebaseSource.ref().child(key));
            var obj = ref.$asObject();
            console.log(obj);
            obj.$loaded().then(function() {
                if(searchTerms!=undefined && searchTerms.length > 0){
                    var found = true;
                    var terms = searchTerms.split(" ");
                    console.log(terms[1]);
                    for (var i = 0; i < terms.length; i++) {
                        var foundOneTerm = false;
                        console.log(terms[i]);
                        if(terms[i].indexOf("$cate") == 0){
                            console.log(obj.category.name);
                            console.log(terms[i].substring(5));
                            if(obj.category.name == terms[i].substring(5)){
                                break;
                            } else {
                                found = false;
                                break;
                            }
                        }
                        for (var j = 0; j < searchKeys.length; j++) {
                            var searchKey = searchKeys[j];
                            if(obj[searchKey] != undefined && obj[searchKey].indexOf(terms[i]) >= 0){
                                foundOneTerm = true;
                            }
                        }
                        if (!foundOneTerm) {
                            found = false;
                            break;
                        }
                    }
                    if (!found) {
                        console.log("not found");
                        return;
                    }
                }

                console.log(key + " found at " + location + " (" + distance + " km away)");
                bounds.extend(new google.maps.LatLng (location[0],location[1]));
                if(fitBounds){
                    map.fitBounds(bounds);
                    if(map.getZoom()> 15){
                        map.setZoom(15);
                    }
                }


                var addNewMarker = true;

                for(var i=0; i<objs.length; i++){
                    console.log(coordinatesAreEquivalent(objs[i].latitude, obj.latitude, 0.0005) && coordinatesAreEquivalent(objs[i].longitude, obj.longitude, 0.0005));
                    if(coordinatesAreEquivalent(objs[i].latitude, obj.latitude, 0.0005) && coordinatesAreEquivalent(objs[i].longitude, obj.longitude, 0.0005)){
                        console.log(objs[i]);
                        //loop through all elements in the group, find a matching one and add the current item to that list
                        for(var j=0; j<$scope.markers.length; j++){
                            for(var k=0; k<$scope.markers[j].items.length; k++){
                                console.log($scope.markers[j].items[k]);
                                if($scope.markers[j].items[k].$id == objs[i].$id){
                                    $scope.markers[j].items.push(obj);
                                }
                            }
                        }
                        console.log(obj);
                        addNewMarker = false;
                        console.log($scope.markers);
                        break;
                    }
                }
                objs.push(obj);
                if(tab == "Trainers"){
                    appFactory.trainers = objs;
                } else if(tab == "Events") {
                    appFactory.events = objs;
                } else {
                    appFactory.classes = objs;
                }

                if(addNewMarker){
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(location[0], location[1]),
                        optimized: true,
                        map: map
                    });

                    var items = [];
                    items.push(obj);
                    $scope.markers.push({items: items, marker: marker});

                    var val = $scope.markers.length -1;
                    //items at same location are grouped together in ng-repeat

                    var contentString;
                    if(tab == "Trainers"){
                        contentString = '<div class="list infowindow-list"><a ng-repeat="item in markers[' + val + '].items" class="item item-avatar" href="#/menu/Trainers/{{item.$id}}"><img src="img/mcfly.jpg"><h2>{{item.username}}</h2><p>gym: {{item.gym}}</p></a></div>';
                    } else if(tab == "Events") {
                        contentString = '<div class="list infowindow-list"><a ng-repeat="item in markers[' + val + '].items" class="item item-avatar" href="#/menu/Events/{{item.$id}}"><img src="img/mcfly.jpg"><h2>{{item.name}}</h2><p>Info: {{item.information}}</p></a></div>';
                    } else {
                        contentString = '<div class="list infowindow-list"><a ng-repeat="item in markers[' + val + '].items" class="item item-avatar" href="#/menu/Classes/{{item.$id}}"><img src="img/mcfly.jpg"><h2>{{item.name}}</h2><p>Info: {{item.information}}</p></a></div>';
                    }
                    console.log(contentString);
                    var compiled = $compile(contentString)($scope);
                    var infowindow = new google.maps.InfoWindow({
                        content: compiled[0]
                    });

                    google.maps.event.addListener(marker, 'click', function() {
                        infowindow.open(map, marker);
                    });
                }
            });
            $ionicLoading.hide();
        });
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