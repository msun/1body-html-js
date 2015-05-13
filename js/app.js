// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'accountModule', 'mapModule', 'trainerModule', 'ui.bootstrap', 'starter.services', 'eventModule', 'classModule', 'gymModule', 'userModule', 'listModule'])
//    .value("baseUrl", "http://108.168.247.49:10355/")
    .constant('appConfig', {
        baseUrl: "http://localhost:8888/",
        apikey: "AIzaSyA8QpUf-wkAJKi4_zHNvPHgI-CUEjZpPjc",
        mapstate: "menu.map",
        defaultItemsPerPage: 5,
        maxReviewCount: 100000,
        radius: 15,
        maxFollowerCount: 100000,
        categories: [
            {name: "Winter", type: "sports"},
            {name: "Workout", type: "sports"},
            {name: "Cycling", type: "sports"},
            {name: "In-door", type: "sports"},
            {name: "Out-door", type: "sports"},
            {name: "Water", type: "sports"},
            {name: "Others", type: "others"}],
        repeatIntervals: [
            {interval: "Daily"},
            {interval: "Weekly"},
//            {interval: "Monthly"},
            {interval: "Once"}
        ]
    })
    .value("baseUrl", "http://localhost:8888/")
    .value("apikey", "AIzaSyA8QpUf-wkAJKi4_zHNvPHgI-CUEjZpPjc")
    .value("mapstate", "menu.map")
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if(window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if(window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }
        });
    })

    .config(function($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('menu', {
                url: "/menu",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'MenuCtrl'
            })

//            .state('menu.tab', {
//                url: "/tab",
//                abstract: true,
//                templateUrl: "templates/tabs.html",
//                controller: 'TabCtrl'
//            })

            .state('home', {
                url: "/home",
                templateUrl: "js/account/templates/home.html",
                controller: 'LoginCtrl'
            })

            .state('login', {
                url: '/login',
                abstract: true,
                templateUrl: 'js/account/templates/login.html',
                controller: 'LoginCtrl'
            })


            .state('login.login-main', {
                url: "/login-main",
                views: {
                    'login': {
                        templateUrl: "js/account/templates/login-main.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('login.forgot-password', {
                url: "/forgot-password",
                views: {
                    'login': {
                        templateUrl: "js/account/templates/forgot-password.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('register', {
                url: "/register",
                abstract: true,
                templateUrl: "js/account/templates/register.html",
                controller: 'RegisterCtrl'
            })

            .state('register.register-main', {
                url: "/register-main",
                views: {
                    'register': {
                        templateUrl: "js/account/templates/register-main.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('register.tos', {
                url: "/tos",
                views: {
                    'register': {
                        templateUrl: "js/account/templates/tos.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('account.tos', {
                url: "/tos",
                views: {
                    'account': {
                        templateUrl: "js/account/templates/tos.html",
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('menu.map', {
                url: '/map',
                views: {
                    'menu': {
                        templateUrl: 'js/map/templates/tab-map.html',
                        controller: 'MapCtrl'
                    }
                }
            })

            .state('menu.list', {
                url: '/list',
                views: {
                    'menu': {
                        templateUrl: 'js/list/templates/list.html',
                        controller: 'ListCtrl'
                    }
                }
            })

            .state('menu.trainer-detail', {
                url: '/Trainers/:trainerID/:gymID',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/trainer-detail.html',
                        controller: 'TrainerDetailCtrl'
                    }
                }
            })

            .state('menu.trainer-schedule', {
                url: '/trainer-schedule/:trainerID/:trainerName',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/trainer-schedule.html',
                        controller: 'TrainerScheduleCtrl'
                    }
                }
            })

            .state('menu.user', {
                url: '/Users/:userID',
                views: {
                    'menu': {
                        templateUrl: 'js/user/templates/user-detail.html',
                        controller: 'UserDetailCtrl'
                    }
                }
            })

            .state('menu.trainer-request', {
                url: '/Mobile-Trainer-Request',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/mobile-trainer-request.html',
                        controller: 'MobileTrainerRequestCtrl'
                    }
                }
            })

            .state('menu.trainer-following', {
                url: '/Following-Trainers',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/following.html',
                        controller: 'FollowingTrainerCtrl'
                    }
                }
            })

            .state('menu.followers', {
                url: '/Followers',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/followers.html',
                        controller: 'FollowersCtrl'
                    }
                }
            })

            .state('menu.event', {
                url: '/Events',
                views: {
                    'menu': {
                        templateUrl: 'js/event/templates/events.html',
                        controller: 'EventsCtrl'
                    }
                }
            })

            .state('menu.event-detail', {
                url: '/Events/:userID/:eventID',
                views: {
                    'menu': {
                        templateUrl: 'js/event/templates/event-detail.html',
                        controller: 'EventDetailCtrl'
                    }
                }
            })

            .state('menu.my-events', {
                url: '/my-events',
                views: {
                    'menu': {
                        templateUrl: 'js/event/templates/my-events.html',
                        controller: 'MyEventsCtrl'
                    }
                }
            })

            .state('menu.my-training', {
                url: '/my-events',
                views: {
                    'menu': {
                        templateUrl: 'js/event/templates/my-events.html',
                        controller: 'MyEventsCtrl'
                    }
                }
            })

            .state('menu.create-event', {
                url: '/editevent/:eventID',
                views: {
                    'menu': {
                        templateUrl: 'js/event/templates/create-event.html',
                        controller: 'CreateEventCtrl'
                    }
                }
            })

            .state('menu.conversations', {
                url: '/conversations/:userID',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/conversation.html',
                        controller: 'ConversationCtrl'
                    }
                }
            })

            .state('menu.class', {
                url: '/Classes',
                views: {
                    'menu': {
                        templateUrl: 'js/class/templates/classes.html',
                        controller: 'ClassesCtrl'
                    }
                }
            })

            .state('menu.class-detail', {
                url: '/Classes/:classID/:gymID',
                views: {
                    'menu': {
                        templateUrl: 'js/class/templates/class-detail.html',
                        controller: 'ClassDetailCtrl'
                    }
                }
            })

            .state('menu.add-class', {
                url: '/editclass/:classID',
                views: {
                    'menu': {
                        templateUrl: 'js/class/templates/create-class.html',
                        controller: 'CreateClassCtrl'
                    }
                }
            })

            .state('menu.gym', {
                url: '/Gyms',
                views: {
                    'menu': {
                        templateUrl: 'js/gym/templates/gyms.html',
                        controller: 'GymsCtrl'
                    }
                }
            })

            .state('menu.images', {
                url: '/images/:type/:id/:userID',
                views: {
                    'menu': {
                        templateUrl: 'js/user/templates/images.html',
                        controller: 'ImagesCtrl'
                    }
                }
            })

            .state('menu.gym-detail', {
                url: '/Gyms/:gymID',
                views: {
                    'menu': {
                        templateUrl: 'js/gym/templates/gym-detail.html',
                        controller: 'GymDetailCtrl'
                    }
                }
            })

            .state('menu.add-gym', {
                url: '/editgym/:gymID',
                views: {
                    'menu': {
                        templateUrl: 'js/gym/templates/create-gym.html',
                        controller: 'CreateGymCtrl'
                    }
                }
            })

            .state('menu.account', {
                url: '/account',
                abstract: true,
                views: {
                    'menu': {
                        templateUrl: 'js/account/templates/tab-account.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('menu.account.payment-method', {
                url: '/payment-method',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/payment.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('menu.account.add-image', {
                url: '/add-image/:type/:id',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/add-image.html',
                        controller: 'AddImageCtrl'
                    }
                }
            })

            .state('menu.account.my-profile', {
                url: '/my-profile',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/myinfo.html',
                        controller: 'ProfileCtrl'
                    }
                }
            })

            .state('menu.account.set-dp', {
                url: '/set-dp',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/set-dp.html',
                        controller: 'Set-dpCtrl'
                    }
                }
            })

            .state('menu.account.my-schedule', {
                url: '/my-schedule',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/my-schedule.html',
                        controller: 'ProfileCtrl'
                    }
                }
            })

            .state('menu.account.settings', {
                url: '/settings',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/settings.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            .state('menu.account.my-trainings', {
                url: '/my-trainings',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/my-trainings.html',
                        controller: 'MyTrainingsCtrl'
                    }
                }
            })

            .state('menu.account.my-money', {
                url: '/my-money',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/scan.html',
                        controller: 'MoneyCtrl'
                    }
                }
            })

//            .state('menu.account.my-classes', {
//                url: '/my-classes',
//                views: {
//                    'account': {
//                        templateUrl: 'js/account/templates/my-classes.html',
//                        controller: 'MyClassCtrl'
//                    }
//                }
//            })

            .state('menu.account.my-transactions', {
                url: '/my-transactions',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/my-transactions.html',
                        controller: 'MyTransactionsCtrl'
                    }
                }
            })

            .state('menu.account.set-location', {
                url: '/set-location',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/set-location.html',
                        controller: 'SetLocationCtrl'
                    }
                }
            })

            .state('menu.account.scan', {
                url: '/scan',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/scan.html',
                        controller: 'ScanCtrl'
                    }
                }
            })

//            .state('menu.account.qrcode', {
//                url: '/qrcode/:transactionID',
//                views: {
//                    'account': {
//                        templateUrl: 'js/account/templates/qrcode.html',
//                        controller: 'QRcodeCtrl'
//                    }
//                }
//            })

            .state('menu.account.requested-sessions', {
                url: '/requested-sessions',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/incoming-requests.html',
                        controller: 'IncomingRequestsCtrl'
                    }
                }
            })

            .state('menu.account.my-requests', {
                url: '/my-requests',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/my-requests.html',
                        controller: 'MyRequestsCtrl'
                    }
                }
            })

            .state('menu.account.buy-tokens', {
                url: '/buy-tokens',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/buy-tokens.html',
                        controller: 'BuyTokensCtrl'
                    }
                }
            })



//            .state('menu.account.qrcode.transactionID', {
//                url: '/qrcode/:transactionID',
//                views: {
//                    'tab-account': {
//                        templateUrl: 'js/account/templates/qrcode.html',
//                        controller: 'QRcodeCtrl'
//                    }
//                }
//            })
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/home');

    })
    .run(function($rootScope, appFactory, appConfig, GeoTrainers, GeoEvents){
        navigator.geolocation.getCurrentPosition(function(position){
            console.log("location ready");
            $rootScope.position = position;
            console.log(position);

            $rootScope.$broadcast('locationReady', 'locationReady');


            appFactory.trainerQuery = GeoTrainers.query({
                center: [$rootScope.position.coords.latitude, $rootScope.position.coords.longitude],
                radius: appConfig.radius
            });

            appFactory.trainerQuery.on("key_entered", function(key, location, distance) {
                var obj = {
                    location: location,
                    distance: distance,
                    key: key
                };
                appFactory.geoTrainers.push(obj);
                if($rootScope.header == "Trainers" && appFactory.onKeyEnter){
                    appFactory.onKeyEnter(obj);
                }
                console.log(appFactory.geoTrainers);
            });

            appFactory.trainerQuery.on("key_exited", function(key, location, distance) {
                for(var i=0; i<appFactory.geoTrainers.length; i++){
                    if(appFactory.geoTrainers[i].key == key){
                        appFactory.geoTrainers.splice(i, 1);
                        if($rootScope.header == "Trainers" && appFactory.onKeyExit){
                            appFactory.onKeyExit(key);
                        }
                        break;
                    }
                }
                console.log(appFactory.geoTrainers);
            });

            appFactory.trainerQuery.on("key_moved", function(key, location, distance) {
                for(var i=0; i<appFactory.geoTrainers.length; i++){
                    if(appFactory.geoTrainers[i].key == key){
                        appFactory.geoTrainers[i].location = location;
                        appFactory.geoTrainers[i].distance = distance;
                        if($rootScope.header == "Trainers" && appFactory.onKeyMove){
                            appFactory.onKeyMove(appFactory.geoTrainers[i]);
                        }
                        break;
                    }
                }
                console.log(appFactory.geoTrainers);
            });


            appFactory.eventQuery = GeoEvents.query({
                center: [$rootScope.position.coords.latitude, $rootScope.position.coords.longitude],
                radius: appConfig.radius
            });

            appFactory.eventQuery.on("key_entered", function(key, location, distance) {
                var obj = {
                    location: location,
                    distance: distance,
                    key: key
                };

                appFactory.geoEvents.push(obj);
                if($rootScope.header == "Events" && appFactory.onKeyEnter){
                    appFactory.onKeyEnter(obj);
                }
            });

            appFactory.eventQuery.on("key_exited", function(key, location, distance) {
                for(var i=0; i<appFactory.geoEvents.length; i++){
                    if(appFactory.geoEvents[i].key == key){
                        appFactory.geoEvents.splice(i, 1);
                        if($rootScope.header == "Events" && appFactory.onKeyExit){
                            appFactory.onKeyExit(key);
                        }
                        break;
                    }
                }
            });

            appFactory.eventQuery.on("key_moved", function(key, location, distance) {
                for(var i=0; i<appFactory.geoEvents.length; i++){
                    if(appFactory.geoEvents[i].key == key){
                        appFactory.geoEvents[i].location = location;
                        appFactory.geoEvents[i].distance = distance;
                        if($rootScope.header == "Events" && appFactory.onKeyMove){
                            appFactory.onKeyMove(appFactory.geoEvents[i]);
                        }
                        break;
                    }
                }
            });
        });



//        navigator.geolocation.watchPosition(function(position){
//            console.log("new location ready");
//            $rootScope.position = position;
//        }, function(error){
//
//        }, {timeout: 30000});
    })
    .filter('htmlEncode', function(){
        return function(html) {
            if(html == undefined){
                return "";
            }

            return html.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/:/g, "%3A");
//            var el = document.createElement("div");
//            el.innerText = el.textContent = html;
//            console.log(el.innerHTML);
//            return el.innerHTML;

//            var filtered = angular.element('<div>').html(html).text();
//            return filtered;
        }
    })
    .controller("MenuCtrl", function($scope,Users,Events,Gyms,GeoTrainers, appConfig, $ionicSideMenuDelegate, appFactory, $rootScope, $firebaseObject, $timeout, $ionicPopup, $state, $interval, UserAuth, $localstorage, $firebaseArray, GcmID, Notifications, Modified){
        $rootScope.header = "Trainers";
        $rootScope.goTo = function(url){
            console.log("goto " + url);
            window.location.href = url;
        };

//            appFactory.getObjsWithinRadius("trainers", [position.coords.latitude, position.coords.longitude], 30);
//            appFactory.getObjsWithinRadius("events", [position.coords.latitude, position.coords.longitude], 30);
//            appFactory.getObjsWithinRadius("classes", [position.coords.latitude, position.coords.longitude], 30);

        $scope.sendNotification = function(){
            var notifToTrainer = {
                creatorID: appFactory.user.$id,
                starttime: Date.now() + 10000,
                url: "#/menu/Trainers/" + appFactory.user.$id,
                receivers: ["simplelogin:37"],
                message: "A test notification " + appFactory.user.username
            }
            Notifications.ref().push(notifToTrainer);
        };

        $scope.logout = function(){
            UserAuth.$unauth();
            $localstorage.clear();
            if(ionic.Platform.isAndroid()){
                var gcmID = $firebaseObject(GcmID.ref().child(appFactory.user.$id).child(device.uuid));
                gcmID.$remove().then(function() {
                    $scope.toggleMenu();
                    alert("logged out");
                    window.location.href = "#";
                });
            } else {
                $scope.toggleMenu();
                alert("logged out");
                window.location.href = "#";
            }
        };

        $scope.registerGcm = function(){
//            var exec = cordova.require("cordova/exec");
//            exec(function(result){
//                if(result["regid"] && result["regid"].length > 0){
//                    var gcmID = $firebaseObject(GcmID.ref().child(appFactory.user.$id));
//                    gcmID.$value = result["regid"];
//                    gcmID.$save().then(function(){
//                        alert(result["regid"]);
//                    })
//                }
//            }, function(err){
//                console.log(err);
//            }, 'Card_io', 'gcminit', [{id: appFactory.user.$id}]);

            if (ionic.Platform.isAndroid()){
                var exec = cordova.require("cordova/exec");
                exec(function(result){
                    console.log(result);
                }, function(err){
                    console.log(err);
                }, 'Card_io', 'gcmpush', [{id: appFactory.user.$id}]);
            }
        };

        $rootScope.user = appFactory.user;
        $ionicSideMenuDelegate.toggleLeft();

//        try {
        console.log($localstorage.getObject("user"));
        appFactory.users = $localstorage.getObject("Users");
        console.log(appFactory.users);
        appFactory.events = $localstorage.getObject("Events");
        console.log(appFactory.events);
        appFactory.gyms = $localstorage.getObject("Gyms");
        console.log(appFactory.gyms);
//        } catch(err){
//            console.log(err);
//            alert("something went wrong when loading data from localstorage, please restart 1Body.");
//        }

        $scope.toggleMenu = function() {
            console.log("toggle left");
            $ionicSideMenuDelegate.toggleLeft();

        }

        $scope.showWarning = false;

        $scope.$on('locationReady', function (event, data) {
            console.log("location ready");

        });


//
//
//        appFactory.gymQuery = GeoTrainers.query({
//            center: [$rootScope.position.coords.latitude, $rootScope.position.coords.longitude],
//            radius: appConfig.radius
//        });
//
//        appFactory.gymQuery.on("key_entered", function(key, location, distance) {
//            appFactory.geoGyms[key] = {
//                location: location,
//                distance: distance
//            }
//        });
//
//        appFactory.gymQuery.on("key_exited", function(key, location, distance) {
//            appFactory.geoGyms[key] = undefined;
//        });
//
//        appFactory.gymQuery.on("key_moved", function(key, location, distance) {
//            appFactory.geoGyms[key] = {
//                location: location,
//                distance: distance
//            }
//        });

    });
