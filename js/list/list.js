var list = angular.module('listModule', ['ionic', 'mapModule', 'starter']);

list.factory('listFactory', function($http, $compile){

});

list.controller('ListCtrl', function($rootScope, $scope, $compile, $timeout, $stateParams, $ionicLoading, GeoTrainers, GeoEvents, mapFactory, appFactory, Users, Events, $ionicPopover, $ionicPopup, Categories, GeoGyms, Gyms, Classes, $localstorage, $firebaseObject, $firebaseArray, $ionicModal) {
    $scope.array = [];

    $scope.header = $rootScope.header;

    if($rootScope.header == "Users"){
        $scope.baseurl = "Users"
        listUsers();
        listGyms();
    } else if($rootScope.header == "Events") {
        listEvents();
    } else {
        listGyms();
    }

    $scope.clickontab = function (tab, $event) {
        console.log($event);
        console.log(tab);
        $scope.array = [];

        $scope.header = tab;
        $rootScope.header = tab;
        if (tab == "Events") {
            listEvents();
        } else if (tab == "Users") {
            listUsers();
            listGyms();
        } else {
            listGyms();
        }
    };

    function findUser(obj){
        var lastModified = appFactory.modified["Users"][obj.key];
        var savedModified = 0;
        var loadFromFirebase = true;
        if(appFactory.users[obj.key]){
            savedModified = appFactory.users[obj.key]['modified'];
            loadFromFirebase = false;
        }
        if(lastModified <= savedModified){
            loadFromFirebase = false;
        }

        if(loadFromFirebase){
            var fobj = $firebaseObject(Users.ref().child(obj.key));
            fobj.$loaded(function(){
                fobj.distance = obj.distance;
                appFactory.users[obj.key] = fobj;
                $localstorage.setObject("Events", appFactory.events);
                appFactory.users[obj.key].href = "#/menu/Trainers/" + fobj.$id + "/";
                $scope.array.push(fobj);
            });
        } else {
            console.log(appFactory.users[obj.key]);
            console.log(obj);
            appFactory.users[obj.key].distance = obj.distance;
            appFactory.users[obj.key].href = "#/menu/Trainers/" + appFactory.users[obj.key].$id + "/";
            $scope.array.push(appFactory.users[obj.key]);
        }
    }

    function listUsers(){
        console.log(appFactory.geoTrainers);
        angular.forEach(appFactory.geoTrainers, function(obj, key){
            findUser(obj);
        });
    }

    function listEvents(){
        angular.forEach(appFactory.geoEvents, function(obj, key){
            var keys = obj.key.split(",");
            console.log(keys);
            var lastModified = appFactory.modified["Events"][keys[0]];
            var savedModified = 0;
            var loadFromFirebase = true;
            if(appFactory.events[keys[0]]){
                savedModified = appFactory.events[keys[0]].modified;
                loadFromFirebase = false;
            }
            if(lastModified <= savedModified){
                loadFromFirebase = false;
            }

            if(loadFromFirebase){
                var fobj = $firebaseObject(Users.ref().child(keys[1]).child(keys[0]));
                fobj.$loaded(function(){
                    console.log(fobj);
                    fobj.distance = obj.distance;
                    appFactory.events[keys[0]] = fobj;
                    $localstorage.setObject("Events", appFactory.events);
                    fobj.href = "#/menu/Events/" + keys[1] + "/" + keys[0];
                    $scope.array.push(fobj);
                });
            } else {
                console.log(appFactory.events[keys[0]]);
                console.log(obj);
                appFactory.events[keys[0]].distance = obj.distance;
                appFactory.events[keys[0]].href = "#/menu/Events/" + keys[1] + "/" + keys[0];
                $scope.array.push(appFactory.events[keys[0]]);
            }
        });
    }

    function listGyms(){
        var addUsers = function(gym, obj){
            console.log(gym.Trainers);
            if(gym.Trainers){
                for (var key in gym.Trainers) {
                    if (!gym.Trainers.hasOwnProperty(key)) {
                        continue;
                    }

                    if (gym.Trainers[key]) {
                        console.log(gym.Trainers[key]);
                        gym.Trainers[key].key = key;
                        gym.Trainers[key].distance = obj.distance;
                        findUser(gym.Trainers[key]);

//                        gym.Trainers[key].distance = obj.distance;
//                        $scope.array.push(gym.Trainers[key]);
                    }
                }
            }
        };

        var addClasses = function(gym, obj){
            console.log(gym.Classes);
            if(gym.Classes) {
                for (var key in gym.Classes) {
                    if (!gym.Classes.hasOwnProperty(key)) {
                        continue;
                    }
                    if (gym.Classes[key]) {
                        gym.Classes[key].distance = obj.distance;
                        gym.Classes[key].href = "#/menu/Classes/" + obj.key + "/" + gym.Classes[key].classID;
                        $scope.array.push(gym.Classes[key]);
                    }
                }
            }
        };

        angular.forEach(appFactory.geoGyms, function(obj, key){
            var lastModified = appFactory.modified["Gyms"][obj.key];
            var savedModified = 0;
            var loadFromFirebase = true;

            if (appFactory.gyms[obj.key]) {
                savedModified = appFactory.gyms[obj.key]['modified'];
                loadFromFirebase = false;
            }

            if (lastModified <= savedModified) {
                loadFromFirebase = false;
            }

            if(loadFromFirebase){
                var fobj = $firebaseObject(Gyms.ref().child(obj.key));
                fobj.$loaded(function(){
                    fobj.distance = obj.distance;
                    appFactory.gyms[obj.key] = fobj;
                    $localstorage.setObject("Gyms", appFactory.gyms);

                    if($scope.header == "Users"){
                        addUsers(fobj);
                    } else if ($scope.header == "Classes"){
                        addClasses(fobj);
                    }

                });
            } else {
                appFactory.gyms[obj.key].distance = obj.distance;
                if($scope.header == "Users"){
                    addUsers(appFactory.gyms[obj.key], obj);
                } else if ($scope.header == "Classes"){
                    addClasses(appFactory.gyms[obj.key], obj);
                }
            }

        });
    }
});

list.directive('focusMe', function($timeout, appFactory) {
    return {
        link: function(scope, element, attrs) {
            if(appFactory.onsearch){
                appFactory.onsearch = false;
                $timeout(function() {
                    element[0].focus();
                    if (ionic.Platform.isAndroid()) {
                        var exec = cordova.require("cordova/exec");

                        exec(function () {
                            console.log("show keyboard");
                        }, function (err) {
                            console.log(err);
                        }, 'Card_io', 'showkeyboard', [
                            {}
                        ]);
                    }
                }, 150);
            }
        }
    };
});
