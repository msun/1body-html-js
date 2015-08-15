var list = angular.module('listModule', ['ionic', 'mapModule', 'starter']);

list.factory('listFactory', function($http, $compile){

});

list.controller('ListCtrl', function($rootScope, $scope, $compile, appConfig, $timeout, $stateParams, $ionicLoading,
                                     GeoTrainers, GeoEvents, mapFactory, appFactory, Users, Events, $ionicPopover,
                                     $ionicPopup, Categories, GeoGyms, Gyms, Classes, $state, $localstorage, $firebaseObject,
                                     $firebaseArray, $ionicModal, Sizes, $ionicHistory) {
    console.log("list ctrl");
    $scope.array = [];
    var clone = [];
    $scope.searchContainer = {};
    $scope.searchContainer.radius = appFactory.radius || 15;

    var searchKeys = appConfig.searchKeys;

    $scope.header = $rootScope.header;

    listUsers();
    listGyms();
    listEvents();

    if(appFactory.searchTerms && appFactory.searchTerms.length > 0){
//        appFactory.onsearch = false;
        console.log(appFactory.searchTerms);
        $scope.searchContainer.searchTerms = appFactory.searchTerms;
        $timeout(function(){
            $scope.searchContainer.searchTerms = appFactory.searchTerms;
        });
    }

    $scope.clearSearch = function(){
        $scope.searchContainer.searchTerms = "";
        appFactory.searchTerms = "";
        $scope.array = [];
        clone = [];

        if ($rootScope.header == "Events") {
            listEvents();
        } else if ($rootScope.header == "Users") {
            listUsers();
            listGyms();

        } else {
            listGyms();
        }
    };

    $scope.clickontab = function (tab, $event) {
        $scope.header = tab;
        $rootScope.header = tab;
    };

    $scope.radiusChange = function(){
        console.log($scope.searchContainer.radius);

        appFactory.trainerQuery.updateCriteria({
            radius: parseInt($scope.searchContainer.radius)
        });

        appFactory.gymQuery.updateCriteria({
            radius: parseInt($scope.searchContainer.radius)
        });

        appFactory.eventQuery.updateCriteria({
            radius: parseInt($scope.searchContainer.radius)
        });
    };

    $scope.searchFilter = function(t){
        if(t.type != $rootScope.header){
            return false;
        }
        console.log(t);
        if(!$scope.searchContainer.searchTerms){
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

    $scope.searchOnMap = function(){
        appFactory.onsearch = true;
        appFactory.searchTerms = $scope.searchContainer.searchTerms;
        $state.go("menu.map", {}, {reload: true});
    };

    $scope.searchTrainers = function(event){
        $scope.array = clone.slice(0);
        appFactory.searchTerms = $scope.searchContainer.searchTerms;
        var i = $scope.array.length;
        console.log($scope.array);
        while(i--){
            $scope.array.splice(i, 1);
        }
        return;
    };

    function findUser(obj, callback){
        var loadFromFirebase = function(){
            var fobj = $firebaseObject(Users.ref().child(obj.key));
            fobj.$loaded(function(){
                fobj.distance = obj.distance;
                fobj.type = "Users";
                appFactory.users[obj.key] = fobj;

                $localstorage.setObject("Users", appFactory.users);
                fobj.sizes = $firebaseObject(Sizes.ref().child(obj.key));
                fobj.href = "#/menu/Trainers/" + fobj.$id + "/";
                callback(fobj);
            });
        };

        if (appFactory.users[obj.key]) {
            appFactory.users[obj.key].type = "Users";
            appFactory.users[obj.key].distance = obj.distance;
            appFactory.users[obj.key].sizes = $firebaseObject(Sizes.ref().child(obj.key));
            appFactory.users[obj.key].href = "#/menu/Trainers/" + appFactory.users[obj.key].$id + "/";

            var lastModified = $firebaseObject(Users.ref().child(obj.key).child("modified"));
            var savedModified = appFactory.users[obj.key]['modified'];
            lastModified.$loaded(function(){
                if (lastModified.$value > savedModified) {
                    loadFromFirebase(false);
                } else {
                    callback(appFactory.users[obj.key]);
                }
            });

        } else {
            loadFromFirebase();
        }
    }

    function listUsers(){
        $scope.$on('onKeyEnterUser', function (event, obj) {
            console.log(obj);
            findUser(obj, function(foundItem){
                $scope.array.push(foundItem);
            });
        });

        $scope.$on('onKeyExitUser', function (event, key) {
            for(var i=0; i < $scope.array.length; i++){
                if($scope.array[i].$id == key){
                    $scope.array.splice(i, 1);
                    break;
                }
            }
        });

        $scope.$on('onKeyMoveUser', function (event, obj) {
            console.log("onKeyMove");
            console.log(key);
            for(var i=0; i < $scope.array.length; i++){
                if($scope.array[i].key == obj.key){
                    $scope.array[i].distance = obj.distance;
                    break;
                }
            }
        });

        console.log(appFactory.geoTrainers);
        angular.forEach(appFactory.geoTrainers, function(obj, key){
            findUser(obj, function(foundItem){
                console.log(foundItem);
                $scope.array.push(foundItem);
            });
        });
    }

    function findEvent(obj, callback){
        var keys = obj.key.split(",");
        var loadFromFirebase = function(){
            var fobj = $firebaseObject(Events.ref().child(keys[1]).child(keys[0]));
            fobj.$loaded(function(){
                console.log(fobj);
                fobj.distance = obj.distance;
                fobj.type = "Events";
                appFactory.events[keys[0]] = fobj;

                $localstorage.setObject("Events", appFactory.events);
                fobj.href = "#/menu/Events/" + keys[1] + "/" + keys[0];
                callback(fobj);
            });
        };

        if(appFactory.events[keys[0]]){
            appFactory.events[keys[0]].distance = obj.distance;
            appFactory.events[keys[0]].type = "Events";
            appFactory.events[keys[0]].href = "#/menu/Events/" + keys[1] + "/" + keys[0];

            var lastModified = $firebaseObject(Events.ref().child(keys[1]).child(keys[0]).child("modified"));
            var savedModified = appFactory.events[keys[0]]['modified'];
            lastModified.$loaded(function(){
                if (lastModified.$value > savedModified) {
                    loadFromFirebase(false);
                } else {
                    callback(appFactory.events[keys[0]]);
                }
            })

        } else {
            loadFromFirebase();
        }
    }

    function listEvents(){
        $scope.$on('onKeyEnterEvent', function (event, obj) {
            console.log("onKeyEnter");
            console.log(obj);
            findEvent(obj, function(foundItem){
                $scope.array.push(foundItem);
            });
        });

        $scope.$on('onKeyExitEvent', function (event, key) {
            for(var i=0; i < $scope.array.length; i++){
                if(key.indexOf($scope.array[i].$id) >= 0){
                    $scope.array.splice(i, 1);
                    break;
                }
            }
        });

        $scope.$on('onKeyMoveEvent', function (event, obj) {
            for(var i=0; i < $scope.array.length; i++){
                if(obj.key.indexOf($scope.array[i].$id) >= 0){
                    $scope.array[i].distance = obj.distance;
                    break;
                }
            }
        });

        angular.forEach(appFactory.geoEvents, function(obj, key){
            findEvent(obj, function(foundItem){
                $scope.array.push(foundItem);
            });
        });
    }

    function addUsers(gym, obj){
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
                    findUser(gym.Trainers[key], function(foundItem){
                        console.log(foundItem);
                        $scope.array.push(foundItem);
                    });
                }
            }
        }
    };

    function addClasses(gym, obj){
        console.log(gym.Classes);
        console.log(obj);
        if(gym.Classes) {
            for (var key in gym.Classes) {
                if (!gym.Classes.hasOwnProperty(key)) {
                    continue;
                }
                if (gym.Classes[key]) {
                    gym.Classes[key].distance = obj.distance;
                    gym.Classes[key].href = "#/menu/Classes/" + gym.Classes[key].classID + "/" + obj.key;
                    $scope.array.push(gym.Classes[key]);
                }
            }
        }
    };

    function findGym(obj){
            var fobj = $firebaseObject(Gyms.ref().child(obj.key));
            fobj.$loaded(function(){
                fobj.distance = obj.distance;
                appFactory.gyms[obj.key] = fobj;
                $localstorage.setObject("Gyms", appFactory.gyms);

                if($scope.header == "Users"){
                    addUsers(fobj, obj);
                } else if ($scope.header == "Classes"){
                    addClasses(fobj, obj);
                }

            });
    };

    function listGyms(){
        $scope.$on('onKeyEnterGym', function (event, obj) {
            console.log("onKeyEnter");
            console.log(obj);
            findGym(obj);
        });

        $scope.$on('onKeyExitGym', function (event, key) {
            console.log("onKeyExit");
            console.log(key);
            var i = $scope.array.length;
            while (i--) {
                if ($scope.array[i].gym && $scope.array[i].gym.gymID == key) {
                    $scope.array.splice(i, 1);
                }
            }
        });

        $scope.$on('onKeyEnterGym', function (event, obj) {
            console.log("onKeyMove");
            console.log(key);
            for(var i=0; i < $scope.array.length; i++){
                if($scope.array[i].gym && $scope.array[i].gym.gymID == obj.key){
                    $scope.array[i].distance = obj.distance;
                }
            }
        });

        angular.forEach(appFactory.geoGyms, function(obj, key){
            findGym(obj);
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
