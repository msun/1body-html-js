var classModule = angular.module('classModule', ['ionic', 'accountModule', 'mapModule', 'starter', 'timeAndDate']);

classModule.factory('classModuleFactory', function($resource, baseUrl, $http, appFactory){
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

    factory.findClass = function(name, callback){
        appFactory.classes.forEach(function(item) {
            if (item.name == name) {
                return item;
                callback();
            }
        });
    }
    return factory;
});

classModule.controller('ClassesCtrl', function($scope, User, appFactory) {
    console.log(appFactory.classes);
    $scope.classes = appFactory.classes;
});

classModule.controller('ClassDetailCtrl', function($scope, $localstorage, Gyms, $firebaseObject, GeoGyms, User, appFactory, $timeout, mapFactory, $stateParams, Classes) {
    console.log($stateParams.gymID);
    $scope.classes = appFactory.classes;
    $scope.newcomment = {};

    $scope.classID = $stateParams.classID;

    var classRef = Gyms.ref().child($stateParams.gymID);

    var modified = $firebaseObject(classRef.child("modified"));

    modified.$loaded(function(){
        console.log(modified);
        if(modified.$value && appFactory.classes[$stateParams.classID] && appFactory.classes[$stateParams.classID].modified >= modified.$value){
            $scope.selectedClass = appFactory.classes[$stateParams.classID];
        } else {
            $scope.selectedClass = $firebaseObject(classRef);
            $scope.selectedClass.$loaded(function(){
                appFactory.classes[$scope.selectedClass.$id] = $scope.selectedClass;
                appFactory.classes[$scope.selectedClass.$id].refreshed = false;
                $localstorage.setObject("Classes", appFactory.classes);
                appFactory.events[$scope.selectedEvent.$id].refreshed = true;
            });
            console.log($scope.selectedEvent);
        }
    });

    $scope.bookClass = function(){
        for(var i=0; i<$scope.selectedClass.repeat.length; i++){

        }
    }

//    appFactory.classes.forEach(function(item){
//        if(item.$id == $scope.classID){
//            $timeout(function(){
//                $scope.selectedClass = item;
//
//                var myRef = Classes.ref().child($scope.selectedClass.$id).child("comments");
//                $scope.comments = $firebase(myRef);
////                $scope.comments = sync.$asArray();
//                console.log(myRef);
////                console.log(sync);
//                console.log($scope.comments);
//
//                console.log(item);
//                $scope.map = mapFactory.initialize([], "class-detail-map", $scope.selectedClass, []);
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
            $scope.comments.$push($scope.newcomment).then(function(){
                $scope.newcomment.text = "";
            });

        }
    }
});

classModule.controller('CreateClassCtrl', function($firebaseObject, $ionicModal, $rootScope, appConfig, $scope, $timeout, $stateParams, $ionicPopup, Trainers, appFactory, Classes, Gyms, GeoGyms) {
    console.log('CreateClassCtrl');
    console.log($stateParams.classID);

    $scope.categories = appConfig.categories;
    $scope.repeatIntervals = appConfig.repeatIntervals;
    $scope.gym = {};
    $scope.newclass = {}
    $scope.newclass.repeat = [];

    $scope.dt = new Date();

    var href = "";
    if($stateParams.classID != "new"){
        $scope.newclass = $firebaseObject(Classes.ref().child($stateParams.classID));
    } else {
        $scope.newclass = {};
    }

    $ionicModal.fromTemplateUrl('js/account/templates/gym-select-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    $scope.showGymSelectionModal = function(){
        $scope.gyms = [];
        $scope.geoQuery = GeoGyms.query({
            center: [$rootScope.position.coords.latitude, $rootScope.position.coords.longitude],
            radius: 30
        });

        $scope.geoQuery.on("key_entered", function(key, location, distance) {
            var mgym = $firebaseObject(Gyms.ref().child(key));
            mgym.$loaded(function(){
                mgym.distance = distance;
                $scope.gyms.push(mgym);
                console.log($scope.gyms);
            })
        });
        $scope.modal.show();
    };

    $scope.hideGymSelectionModal = function(){
        $scope.modal.hide();
    };

    $scope.setGym = function(gym){
        $scope.gym = gym;
        $scope.newclass.gym = {};
        $scope.newclass.gym.name = gym.name;
        $scope.newclass.gym.gymID = gym.$id;
        $scope.newclass.location = gym.location;
        $scope.hideGymSelectionModal();
    };


    console.log($scope.newclass);
    $scope.newclass.duration = 30;



    $scope.createClass = function(){
        if(!$scope.gym.name){
            alert("please select a gym");
        }
        console.log($scope.newclass);
        $scope.newclass.userId = appFactory.user.$id;

        $scope.newclass.modified = Date.now();


        if($stateParams.classID != "new"){
            $scope.newclass.$save().then(function(){
                alert("class saved");
                window.location.href = "#/menu/map";
            });
        } else {
            $scope.newclass.created = Date.now();
            var classRef = Classes.ref().push($scope.newclass, function(){
                $scope.newclass.classID = classRef.key();
                console.log(classRef.key());
                if(!$scope.gym["Classes"]){
                    $scope.gym["Classes"] = {};
                }
                $scope.gym["Classes"][classRef.key()] = $scope.newclass;
                $scope.gym.modified = Date.now();
                $scope.gym.$save().then(function(){
                    alert("Class saved");
                    window.location.href = "#/menu/map";
                });
            });
        }
    }
});


