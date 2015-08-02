var gymModule = angular.module('gymModule', ['ionic', 'accountModule', 'ui.bootstrap', 'starter', 'ui.bootstrap.datetimepicker']);

gymModule.factory('gymModuleFactory', function($resource, baseUrl, $http, appFactory){
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

    factory.findGym = function(name, callback){
        appFactory.gyms.forEach(function(item) {
            if (item.name == name) {
                return item;
                callback();
            }
        });
    }
    return factory;
});

gymModule.controller('GymsCtrl', function($scope, appFactory) {
    console.log(appFactory.gyms);
    $scope.gyms = appFactory.gyms;
});

gymModule.controller('GymDetailCtrl', function($scope, $firebase, User, appFactory, $timeout, mapFactory, $stateParams, Gyms, $rootScope) {
    console.log(appFactory.gyms);
    $scope.gyms = appFactory.gyms;
    $scope.newcomment = {};

    $scope.gymID = $stateParams.gymID;

    appFactory.gyms.forEach(function(item){
        if(item.$id == $scope.gymID){
            $timeout(function(){
                $scope.selectedGym = item;

//                var myRef = Gyms.ref().child($scope.selectedGym.$id).child("comments");
//                $scope.comments = $firebase(myRef);
////                $scope.comments = sync.$asArray();
//                console.log(myRef);
////                console.log(sync);
//                console.log($scope.comments);

                console.log(item);
                $scope.map = mapFactory.initialize([], "gym-detail-map", $scope.selectedGym, []);
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

gymModule.controller('CreateGymCtrl', function($firebaseObject, baseUrl, RepeatIntervals, $scope, $rootScope, $timeout, $stateParams, $ionicPopup, Trainers, gymModuleFactory, appFactory, $ionicSlideBoxDelegate, mapFactory, apikey, Gyms, GeoGyms, Categories, $window) {
    console.log('CreateGymCtrl');
    console.log($stateParams.gymID);
    var position = $rootScope.position;
    $scope.categories = Categories;
    $scope.repeatIntervals = RepeatIntervals;

    var href = "";
    if($stateParams.gymID != "new"){
        var myRef = Gyms.ref().child($stateParams.gymID);
        $scope.newgym = $firebaseObject(myRef).$asObject();
    } else {
        $scope.newgym = {};
    }

    console.log($scope.newgym);

    $scope.openMap = function(){
        console.log("open map");
        var marker;
        setTimeout(function(){
            console.log("ready to load map");
            console.log(appFactory.user);
//            $scope.map = mapFactory.initialize([], "create-gymModule", appFactory.user, []);
            var map = new google.maps.Map(document.getElementById('create-gymMap'), {
                zoom: 11,
                center: new google.maps.LatLng(position[0], position[1]),
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
            template: '<div id="create-gymMap" data-tap-disabled="true" style="width: 230px; height: 230px"></div>',
            title: "Choose Location",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        console.log(marker.getPosition());
                        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&key=" + apikey;
                        gymModuleFactory.getStreetAddress(url, function(data, status){
                            console.log(data);
                            $scope.newgym.address = data.results[0].formatted_address;
                        });
                    }
                }
            ]
        });
    }

    $scope.createGym = function(){
        console.log($scope.newgym);
        console.log($scope.newgym.address.replace(/ /g, "+"));
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newgym.address.replace(/ /g, "+") + "&key=" + apikey;
        gymModuleFactory.getStreetAddress(url, function(data, status){
            console.log(data);
            $scope.newgym.latitude = data.results[0].geometry.location.lat;
            $scope.newgym.longitude = data.results[0].geometry.location.lng;
            $scope.newgym.location = [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];
            $scope.newgym.userId = appFactory.user.$id;
            $scope.newgym.modified = Date.now();

            if($stateParams.gymID != "new"){
                $scope.newgym.modified = Date.now();
                $scope.newgym.$save().then(function(){
                    alert("Gym saved");
                    window.location.href = "#/menu/map";
                });
            } else {
                $scope.newgym.created = Date.now();
                var newGymRef = Gyms.ref().push($scope.newgym, function(){
                    console.log(newGymRef.key());
                    GeoGyms.set(newGymRef.key(), [$scope.newgym.latitude, $scope.newgym.longitude]).then(function() {
                        console.log("Provided key has been added to GeoFire");
                        alert("New Gym saved");
                        window.location.href = "#/menu/map";
                    });
                });
            }
        });
    }
});


