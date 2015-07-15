var list = angular.module('listModule', ['ionic', 'mapModule', 'starter']);

list.factory('listFactory', function($http, $compile){

});

list.controller('ListCtrl', function($rootScope, $scope, $compile, appConfig, $timeout, $stateParams, $ionicLoading,
                                     GeoTrainers, GeoEvents, mapFactory, appFactory, Users, Events, $ionicPopover,
                                     $ionicPopup, Categories, GeoGyms, Gyms, Classes, $localstorage, $firebaseObject,
                                     $firebaseArray, $ionicModal, Sizes, $ionicHistory) {
    $scope.array = [];
    var clone = [];
    $scope.searchContainer = {};
    $scope.searchContainer.radius = appFactory.radius || 8;

    var searchKeys = appConfig.searchKeys;

    $scope.header = $rootScope.header;

    if($rootScope.header == "Users"){
        listUsers();
        listGyms();
    } else if($rootScope.header == "Events") {
        listEvents();
    } else {
        listGyms();
    }

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
        $scope.array = [];
        clone = [];

        $scope.header = tab;
        $rootScope.header = tab;
        if (tab == "Events") {
            listEvents();
        } else if (tab == "Users") {
            listUsers();
            listGyms();

        } else {
            alert("Classes coming soon");
            $scope.clickontab("Users");
            listGyms();
        }
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

    function searchItem(t){
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
        //$ionicHistory.nextViewOptions({ disableAnimate: true, disableBack: true, historyRoot: true });
        //$ionicHistory.nextViewOptions({ disableAnimate: true });
        appFactory.onsearch = true;
        appFactory.searchTerms = $scope.searchContainer.searchTerms;
        window.location.href = "#/menu/map";
    };

    $scope.searchTrainers = function(event){
        $scope.array = clone.slice(0);
        appFactory.searchTerms = $scope.searchContainer.searchTerms;
        var i = $scope.array.length;
        console.log($scope.array);
        while(i--){
            if(!searchItem($scope.array[i])){
                $scope.array.splice(i, 1);
            }
        }
        return;
    };

    function findUser(obj, callback){
        var loadFromFirebase = function(){
            var fobj = $firebaseObject(Users.ref().child(obj.key));
            fobj.$loaded(function(){
                fobj.distance = obj.distance;
                appFactory.users[obj.key] = fobj;

                $localstorage.setObject("Users", appFactory.users);
                fobj.sizes = $firebaseObject(Sizes.ref().child(obj.key));
                fobj.href = "#/menu/Trainers/" + fobj.$id + "/";
                callback(fobj);
            });
        };

        if (appFactory.users[obj.key]) {
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
        appFactory.onKeyEnter = function (obj) {
            console.log("onKeyEnter");
            console.log(obj);
            findUser(obj, function(foundItem){
                if(searchItem(foundItem)){
                    $scope.array.push(foundItem);
                }

                clone.push(foundItem);
            });
        };

        appFactory.onKeyExit = function (key) {
            console.log("onKeyExit");
            console.log(key);
            for(var i=0; i < $scope.array.length; i++){
                if($scope.array[i].$id == key){
                    $scope.array.splice(i, 1);
                    break;
                }
            }

            for(var i=0; i < clone.length; i++){
                if(clone[i].$id == key){
                    clone.splice(i, 1);
                    break;
                }
            }
        };

        appFactory.onKeyMove = function (obj) {
            console.log("onKeyMove");
            console.log(key);
            for(var i=0; i < $scope.array.length; i++){
                if($scope.array[i].key == obj.key){
                    $scope.array[i].distance = obj.distance;
                    break;
                }
            }

            for(var i=0; i < clone.length; i++){
                if(clone[i].$id == obj.key){
                    clone[i].distance = obj.distance;
                    break;
                }
            }
        };

        console.log(appFactory.geoTrainers);
        angular.forEach(appFactory.geoTrainers, function(obj, key){
            findUser(obj, function(foundItem){
                console.log(foundItem);
                if(searchItem(foundItem)) {
                    $scope.array.push(foundItem);
                }
                clone.push(foundItem);
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
                appFactory.events[keys[0]] = fobj;

                $localstorage.setObject("Events", appFactory.events);
                fobj.href = "#/menu/Events/" + keys[1] + "/" + keys[0];
                callback(fobj);
            });
        };

        if(appFactory.events[keys[0]]){
            appFactory.events[keys[0]].distance = obj.distance;
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
        appFactory.onKeyEnter = function (obj) {
            console.log("onKeyEnter");
            console.log(obj);
            findEvent(obj, function(foundItem){
                if(searchItem(foundItem)) {
                    $scope.array.push(foundItem);
                }
                clone.push(foundItem);
            });
        };

        appFactory.onKeyExit = function (key) {
            console.log("onKeyExit");
            console.log(key);
            console.log($scope.array);
            for(var i=0; i < $scope.array.length; i++){
                if(key.indexOf($scope.array[i].$id) >= 0){
                    $scope.array.splice(i, 1);
                    break;
                }
            }

            for(var i=0; i < clone.length; i++){
                if(key.indexOf(clone[i].$id) >= 0){
                    clone.splice(i, 1);
                    break;
                }
            }
        };

        appFactory.onKeyMove = function (obj) {
            console.log("onKeyMove");
            console.log(key);
            for(var i=0; i < $scope.array.length; i++){
                if(obj.key.indexOf($scope.array[i].$id) >= 0){
                    $scope.array[i].distance = obj.distance;
                    break;
                }
            }

            for(var i=0; i < clone.length; i++){
                if(clone[i].$id == key){
                    clone[i].distance = obj.distance;
                    break;
                }
            }
        };

        angular.forEach(appFactory.geoEvents, function(obj, key){
            findEvent(obj, function(foundItem){
                if(searchItem(foundItem)) {
                    $scope.array.push(foundItem);
                }
                clone.push(foundItem);
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
                        if(searchItem(foundItem)){
                            $scope.array.push(foundItem);
                        }
                        clone.push(foundItem);
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
                    if(searchItem(gym.Classes[key])) {
                        $scope.array.push(gym.Classes[key]);
                    }
                    clone.push(gym.Classes[key]);
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
        appFactory.onGymEnter = function (obj) {
            console.log("onKeyEnter");
            console.log(obj);
            findGym(obj);
        };

        appFactory.onGymExit = function (key) {
            console.log("onKeyExit");
            console.log(key);
            var i = $scope.array.length;
            while (i--) {
                if ($scope.array[i].gym && $scope.array[i].gym.gymID == key) {
                    $scope.array.splice(i, 1);
                }
            }

            i = clone.length;
            while(i--){
                if(clone[i].gym && clone[i].gym.gymID == key){
                    clone.splice(i, 1);
                }
            }
        };

        appFactory.onGymMove = function (obj) {
            console.log("onKeyMove");
            console.log(key);
            for(var i=0; i < $scope.array.length; i++){
                if($scope.array[i].gym && $scope.array[i].gym.gymID == obj.key){
                    $scope.array[i].distance = obj.distance;
                }
            }

            for(var i=0; i < clone.length; i++){
                if(clone[i].gym && clone[i].gym.gymID == obj.key){
                    clone[i].distance = obj.distance;
                    break;
                }
            }
        };



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
