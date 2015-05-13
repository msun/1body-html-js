var list = angular.module('listModule', ['ionic', 'mapModule', 'starter']);

list.factory('listFactory', function($http, $compile){

});

list.controller('ListCtrl', function($rootScope, $scope, $compile, $timeout, $stateParams, $ionicLoading, GeoTrainers, GeoEvents, mapFactory, appFactory, Users, Events, $ionicPopover, $ionicPopup, Categories, GeoGyms, Gyms, Classes, $localstorage, $firebaseObject, $firebaseArray, $ionicModal) {
    $scope.array = [];



    angular.forEach(appFactory.geoTrainers, function(obj, key){
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
                $scope.array.push(fobj);
            });
        } else {
            appFactory.users[obj.key].distance = obj.distance;
            $scope.array.push(appFactory.users[obj.key]);
        }
    });

});

list.directive('focusMe', function($timeout, appFactory) {
    return {
        link: function(scope, element, attrs) {
            if(appFactory.onsearch){
                appFactory.onsearch = false;
                $timeout(function() {
                    element[0].focus();
                }, 150);
            }
        }
    };
});
