var classModule = angular.module('classModule', ['ionic', 'accountModule', 'ui.bootstrap', 'starter', 'ui.bootstrap.datetimepicker']);

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

classModule.controller('ClassDetailCtrl', function($scope, $firebase, User, appFactory, $timeout, mapFactory, $stateParams, Classes) {
    console.log(appFactory.classes);
    $scope.classes = appFactory.classes;
    $scope.newcomment = {};

    $scope.classID = $stateParams.classID;

    appFactory.classes.forEach(function(item){
        if(item.$id == $scope.classID){
            $timeout(function(){
                $scope.selectedClass = item;

                var myRef = Classes.ref().child($scope.selectedClass.$id).child("comments");
                $scope.comments = $firebase(myRef);
//                $scope.comments = sync.$asArray();
                console.log(myRef);
//                console.log(sync);
                console.log($scope.comments);

                console.log(item);
                $scope.map = mapFactory.initialize([], "class-detail-map", $scope.selectedClass, []);
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

classModule.controller('CreateClassCtrl', function($firebase, baseUrl, RepeatIntervals, $scope, $timeout, $stateParams, $ionicPopup, Trainers, classModuleFactory, appFactory, $ionicSlideBoxDelegate, mapFactory, apikey, Classes, GeoClasses, Categories, Gyms) {
    console.log('CreateClassCtrl');
    console.log($stateParams.classID);

    $scope.categories = Categories;
    $scope.gyms = $firebase(Gyms.ref()).$asArray();
    $scope.repeatIntervals = RepeatIntervals;

    var href = "";
    if($stateParams.classID != "new"){
        var myRef = Classes.ref().child($stateParams.classID);
        $scope.newclass = $firebase(myRef).$asObject();
    } else {
        $scope.newclass = {};
    }

    console.log($scope.newclass);
    $scope.newclass.duration = 30;

    $scope.openDatePicker = function() {
        console.log('openDatePicker');
        $scope.tmp = {};
        $scope.tmp.newDate = {};

        var birthDatePopup = $ionicPopup.show({
            template: '<datetimepicker ng-model="tmp.newDate"></datetimepicker>',
            title: "Choose Start Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        $scope.newclass.starttime = $scope.tmp.newDate;
                        if(typeof $scope.tmp.newDate.getTime === 'undefined'){
                            alert("please select a valid time");
                        }
                    }
                }
            ]
        });
    }

    // Called each time the slide changes
    $scope.slideChanged = function(index) {
        $scope.slideIndex = index;
    };

    $scope.openMap = function(){
        var marker;
        setTimeout(function(){
            console.log("ready to load map");
            console.log(appFactory.user);
//            $scope.map = mapFactory.initialize([], "create-classModule", appFactory.user, []);
            var map = new google.maps.Map(document.getElementById('create-classMap'), {
                zoom: 11,
                center: new google.maps.LatLng(appFactory.user.latitude, appFactory.user.longitude),
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
            template: '<div id="create-classMap" data-tap-disabled="true" style="width: 230px; height: 230px"></div>',
            title: "Choose Start Time",
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        console.log(marker.getPosition());
                        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&key=" + apikey;
                        classModuleFactory.getStreetAddress(url, function(data, status){
                            console.log(data);
                            $scope.newclass.location = data.results[0].formatted_address;
                        });
                    }
                }
            ]
        });
    }

    $scope.createClass = function(){
        console.log($scope.newclass);
        console.log($scope.newclass.location.replace(/ /g, "+"));
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.newclass.location.replace(/ /g, "+") + "&key=" + apikey;
        classModuleFactory.getStreetAddress(url, function(data, status){
            console.log(data);
            $scope.newclass.latitude = data.results[0].geometry.location.lat;
            $scope.newclass.longitude = data.results[0].geometry.location.lng;
            console.log(Trainers.obj());
            console.log(appFactory.user);
            console.log(Trainers.obj()[appFactory.user.$id]);

            $scope.newclass.userId = appFactory.user.$id;

            $scope.newclass.modified = Date.now();

            if($stateParams.classID != "new"){
                $scope.newclass.$save().then(function(){
                    for(var num=0; num<appFactory.user.classModules.length; num++){
                        if(appFactory.user.classModules[num].id == $scope.newclass.$id){
                            appFactory.user.classModules[num].name = $scope.newclass.name;
                        }
                    }
                    window.location.href = "#/menu/account/my-classModules";
                });
            } else {
                $scope.newclass.created = Date.now();
                Classes.sync().$push($scope.newclass).then(function(ref){
                    console.log(ref.path.m[1]);
                    GeoClasses.set(ref.path.m[1], [$scope.newclass.latitude, $scope.newclass.longitude]).then(function() {
                        console.log("Provided key has been added to GeoFire");
                    });

                    if(!appFactory.user.classModules){
                        appFactory.user.classModules = [];
                    }
                    var tempClasses = [];
                    //remove $$hashkey from list
                    for(var num=0; num<appFactory.user.classModules.length; num++){
                        tempClasses.push(angular.copy(appFactory.user.classModules[num]));
                    }
                    appFactory.user.classModules = tempClasses;
                    var mClass = {
                        id: ref.path.m[1],
                        name: $scope.newclass.name
                    }

                    appFactory.user.classModules.push(mClass);
                    console.log(appFactory.user);
                    appFactory.user.$save().then(function(){
                        window.location.href = "#/menu/account/my-classes";
                    });
                });
            }
        });
    }
});


