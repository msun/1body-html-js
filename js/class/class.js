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

classModule.controller('ClassDetailCtrl', function($scope, Notifications, $localstorage, $ionicModal, Gyms, $firebaseObject, GeoGyms, User, appFactory, $timeout, mapFactory, $stateParams, Classes, MyTransactions, Transactions) {
    console.log($stateParams.gymID);
    $scope.classes = appFactory.classes;
    $scope.newcomment = {};

    $scope.classID = $stateParams.classID;

    $scope.dt = new Date();

//    $ionicModal.fromTemplateUrl('js/class/templates/class-schedule-modal.html', {
//        scope: $scope,
//        animation: 'slide-in-up'
//    }).then(function(modal){
//        $scope.modal = modal;
//    });

    var loadSchedule = function() {
        $scope.openClasses = [];
        $scope.$watch('dt', function () {
            console.log($scope.selectedClass.repeat);
            $scope.openClasses = [];
            for (var i in $scope.selectedClass.repeat) {
                if($scope.selectedClass.repeat.hasOwnProperty(i)){
                    (function (repeat) {
                        console.log(repeat);
                        if (repeat.day && repeat.day == $scope.dt.getDay()) {
                            var classtime = $scope.dt.getFullYear() + "-" + $scope.dt.getMonth() + "-" + $scope.dt.getDate() + "-" + repeat.starttime;
                            console.log(classtime);
                            var schedule = $firebaseObject(Classes.ref().child($scope.selectedClass.$id).child(classtime));
                            schedule.$loaded(function () {
                                if (!schedule.classtime) {
                                    schedule.classtime = repeat.starttime;
                                }
                                if (!schedule.slotsopen) {
                                    schedule.slotsopen = $scope.selectedClass.slotsopen;
                                }
                                if (!schedule.instructor) {
                                    schedule.instructor = $scope.selectedClass.instructor;
                                }
                                if (!schedule.tokens) {
                                    schedule.tokens = $scope.selectedClass.tokens;
                                }
                                if (!schedule.duration) {
                                    schedule.duration = $scope.selectedClass.duration;
                                }
                                $scope.openClasses.push(schedule);
                            });
                        }
                    }($scope.selectedClass.repeat[i]))
                }
            }
        }, true);
    };

    $scope.user = $firebaseObject(appFactory.userRef.child(appFactory.user.$id));
    $scope.user.$loaded(function(){
        appFactory.user = $scope.user;
        $localstorage.setObject("user", $scope.user);
    });

    var classRef = Gyms.ref().child($stateParams.gymID).child("Classes").child($stateParams.classID);

    var modified = $firebaseObject(classRef.child("modified"));

    modified.$loaded(function(){
        console.log(modified);
        if(modified.$value && appFactory.classes[$stateParams.classID] && appFactory.classes[$stateParams.classID].modified >= modified.$value){
            $scope.selectedClass = appFactory.classes[$stateParams.classID];
            loadSchedule();
        } else {
            $scope.selectedClass = $firebaseObject(classRef);
            $scope.selectedClass.$loaded(function(){
                appFactory.classes[$scope.selectedClass.$id] = $scope.selectedClass;
                $localstorage.setObject("Classes", appFactory.classes);
                loadSchedule();
            });
        }
    });

    $scope.bookClass = function(schedule){
        if(schedule.slotsopen <= 0){
            alert("this class is full");
            return;
        }
        schedule.slotsopen--;
        if(!schedule.attending){
            schedule.attending = {};
        }
        if(schedule.attending[appFactory.user.$id]){
            alert("You have already booked this class");
            return;
        }

        var obj = {
            userID: appFactory.user.$id,
            created: Firebase.ServerValue.TIMESTAMP,
            tokens: schedule.tokens,
            duration: schedule.duration
        };

        schedule.attending[appFactory.user.$id] = obj;
        console.log(schedule);

//        if(appFactory.user.tokens - schedule.tokens < 0){
//            alert("Not enough tokens");
//        } else {
//            appFactory.user.tokens -= schedule.tokens;
//            appFactory.user.$save().then(function(){
//            })
//        }

        schedule.$save().then(function(){
            obj.classID = $stateParams.classID;
            obj.className = $scope.selectedClass.name;
            obj.schedule = schedule.$id;
            console.log($scope.dt);
            var starttime = new Date($scope.dt.getTime());
            var splits = schedule.classtime.split("-");
            starttime.setHours(splits[0]);
            starttime.setMinutes(splits[1]);
            console.log(starttime);
            obj.starttime = starttime.getTime();
            obj.type = "class";
            var transactionRef = Transactions.ref().child("simplelogin:37").push(obj, function(){
                obj.scanned = false;
                obj.reviewed = false;
                if($scope.selectedClass.profilepic){
                    obj.profilepic = $scope.selectedClass.profilepic;
                }
                console.log(obj);
                console.log(transactionRef.key());
                MyTransactions.ref().child(appFactory.user.$id).child(transactionRef.key()).set(obj, function(){
                    MyTransactions.ref().child(appFactory.user.$id).child(transactionRef.key()).setPriority(starttime.getTime(), function(){

                        var notif = {
                            creatorID: appFactory.user.$id,
                            starttime: obj.starttime,
                            notifyPeriod: 30 * 60 * 1000,
                            url: "#/menu/Classes/" + obj.classID + "/" + $stateParams.gymID,
                            receivers: [appFactory.user.$id],
                            message: "Your class is starting: " + obj.className
                        };
                        Notifications.ref().push(notif, function(){
                            alert("Class booked");
                        });


                    });
                })
            });
        });
    };

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
    $scope.newclass = {};
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
        $scope.newclass.repeat[0].starttime = $scope.dt.getHours() + "-" + $scope.dt.getMinutes();
        $scope.newclass.repeat[0].slotsopen = $scope.newclass.slotsopen;
        $scope.newclass.repeat[0].tokens = $scope.newclass.tokens;
        $scope.newclass.repeat[0].instructor = $scope.newclass.instructor;
        console.log($scope.newclass);

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


