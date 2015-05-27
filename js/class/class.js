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

classModule.controller('ClassScheduleCtrl', function($scope, Notifications, $localstorage, $ionicModal, Gyms, $firebaseObject, GeoGyms, User, appFactory, $timeout, Sizes, $stateParams, Classes, MyTransactions, Transactions, Users, $ionicPopup) {
    $scope.classID = $stateParams.classID;
    $scope.gymID = $stateParams.gymID;
    console.log($scope.classID);
    console.log($scope.gymID);
    $scope.dt = new Date();

    var classRef = Gyms.ref().child($stateParams.gymID).child("Classes").child($stateParams.classID);
    $scope.selectedClass = $firebaseObject(classRef);
    $scope.selectedClass.$loaded(function(){
        loadSchedule();
        console.log($scope.selectedClass);
    });
    $scope.gym = $firebaseObject(Gyms.ref().child($stateParams.gymID));
    $scope.sizes = $firebaseObject(Sizes.ref().child($scope.classID));

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
                                var insert = true;
                                for(var i=0; i<$scope.openClasses.length; i++){
                                    if($scope.openClasses[i].classtime == schedule.classtime && $scope.openClasses[i].instructor == schedule.instructor){
                                        insert = false;
                                    }
                                }
                                if(insert){
                                    $scope.openClasses.push(schedule);
                                }
                            });
                        }
                    }($scope.selectedClass.repeat[i]))
                }
            }
        }, true);
    };


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
            duration: schedule.duration,
            location: $scope.gym.location
        };

        if($scope.gym.commentlocation){
            obj.commentlocation = $scope.gym.commentlocation;
        }

        if($scope.selectedClass.commentlocation){
            obj.commentlocation = obj.commentlocation + " " + $scope.selectedClass.commentlocation;
        }

        schedule.attending[appFactory.user.$id] = obj;
        console.log(schedule);

        schedule.$save().then(function(){
            obj.classID = $stateParams.classID;
            obj.sessionID = $stateParams.classID;
            obj.className = $scope.selectedClass.name;
            obj.schedule = schedule.$id;
            console.log($scope.dt);
            var starttime = new Date($scope.dt.getTime());
            var splits = schedule.classtime.split(":");
            starttime.setHours(splits[0]);
            starttime.setMinutes(splits[1]);
            console.log(starttime);
            obj.starttime = starttime.getTime();
            obj.type = "Classes";
            console.log(obj);
            var transactionRef = Transactions.ref().child(appFactory.user.$id).push(obj, function(){
                obj.scanned = false;
                obj.reviewed = false;
                obj.gymID = $stateParams.gymID;

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
                            if (ionic.Platform.isAndroid()) {
                                var myPopup = $ionicPopup.show({
                                    template: 'Would you like to save this event to your calendar?',
                                    title: 'Save to calendar',
                                    scope: $scope,
                                    buttons: [
                                        { text: 'Cancel' },
                                        {
                                            text: '<b>Okay</b>',
                                            type: 'button-positive',
                                            onTap: function (e) {
                                                e.preventDefault();
                                                var jsonData = {
                                                    'title': "Class " + obj.className,
                                                    'location': $scope.gym.address,
                                                    'starttime': obj.starttime,
                                                    'endtime': obj.starttime + obj.duration * 30 * 60 * 1000

                                                };
                                                if (obj.commentlocation) {
                                                    jsonData.description = obj.commentlocation;
                                                }

                                                console.log(jsonData);
                                                var exec = cordova.require("cordova/exec");

                                                exec(function (result) {
                                                    alert("You have booked this class");
                                                }, function (err) {
                                                    console.log(err);
                                                }, 'Card_io', 'addToCalendar', [
                                                    jsonData
                                                ]);
                                            }
                                        }
                                    ]
                                });
                                myPopup.then(function (res) {
                                    console.log('Tapped!', res);
                                });
                            } else {
                                alert("You have booked this class");
                            }
                        });


                    });
                })
            });
        });
    };
});

classModule.controller('ClassDetailCtrl', function($scope, Notifications, $localstorage, $ionicModal, Gyms, $firebaseObject, GeoGyms, User, appFactory, Reviews, $timeout, $firebaseArray, $stateParams, Classes, MyTransactions, Transactions, Users, $ionicPopup) {
    console.log($stateParams.gymID);
    $scope.newcomment = {};
    $scope.gymID = $stateParams.gymID;

    $scope.classID = $stateParams.classID;

    $ionicModal.fromTemplateUrl('js/class/templates/review.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.reviewModal = modal;
    });

    var classRef = Gyms.ref().child($stateParams.gymID).child("Classes").child($stateParams.classID);
    $scope.selectedClass = $firebaseObject(classRef);
    $scope.gym = $firebaseObject(Gyms.ref().child($stateParams.gymID));
    $scope.gym.$loaded(function(){
        showMap();
    });

    $scope.reviews = $firebaseArray(Reviews.ref().child($stateParams.eventID));

    function showMap(){
        $scope.map = new google.maps.Map(document.getElementById('class-detail-map'), {
            zoom: 12,
            center: new google.maps.LatLng($scope.gym.location[0], $scope.gym.location[1]),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        if($scope.marker){
            $scope.marker.setMap(null);
        }

        $scope.marker = new google.maps.Marker({
            position: $scope.map.getCenter(),
            map: $scope.map
        });
    }

    $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("sessionID").equalTo($stateParams.classID));

    $scope.myTransactions.$loaded(function () {
        console.log($scope.myTransactions);
        for (var i = 0; i < $scope.myTransactions.length; i++) {
            if ($scope.myTransactions[i].scanned && $scope.myTransactions[i].reviewed == false) {
                alert("Please leave a review");
                $scope.showReviewModal();
                $scope.transaction = $scope.myTransactions[i];
                break;
            }
        }
    });

    $scope.showReviewModal = function(){
        $scope.reviewModal.show();
    };

    $scope.closeReviewModal = function(){
        $scope.reviewModal.hide();
    };

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
            center: [$rootScope.position[0], $rootScope.position[1]],
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
        $scope.newclass.gym.gymName = gym.name;
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


