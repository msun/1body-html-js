// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'accountModule', 'mapModule', 'trainerModule', 'ui.bootstrap', 'starter.services', 'eventModule', 'classModule', 'gymModule'])
//    .value("baseUrl", "http://108.168.247.49:10355/")
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
                StatusBar.styleDefault();
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

            .state('menu.home', {
                url: "/home",
                views: {
                    'menu': {
                        templateUrl: "js/account/templates/home.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('menu.old-home', {
                url: "/old-home",
                views: {
                    'menu': {
                        templateUrl: "js/account/templates/old-home.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('menu.login', {
                url: '/login',
                abstract: true,
                views: {
                    'menu': {
                        templateUrl: 'js/account/templates/login.html',
                        controller: 'LoginCtrl'
                    }
                }
            })


            .state('menu.login.login-main', {
                url: "/login-main",
                views: {
                    'login': {
                        templateUrl: "js/account/templates/login-main.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('menu.login.forgot-password', {
                url: "/forgot-password",
                views: {
                    'login': {
                        templateUrl: "js/account/templates/forgot-password.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('menu.old-login', {
                url: "/old-login",
                views: {
                    'menu': {
                        templateUrl: "js/account/templates/old-login.html",
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('menu.register', {
                url: "/register",
                abstract: true,
                views: {
                    'menu': {
                        templateUrl: "js/account/templates/register.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('menu.register.register-main', {
                url: "/register-main",
                views: {
                    'register': {
                        templateUrl: "js/account/templates/register-main.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('menu.register.register-professional-main', {
                url: "/register-professional-main",
                views: {
                    'register': {
                        templateUrl: "js/account/templates/register-professional-main.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('menu.register.register-professional-map', {
                url: "/register-professional-map",
                views: {
                    'register': {
                        templateUrl: "js/account/templates/register-professional-map.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('menu.register.tos', {
                url: "/tos",
                views: {
                    'register': {
                        templateUrl: "js/account/templates/tos.html",
                        controller: 'RegisterCtrl'
                    }
                }
            })

            .state('old-register', {
                url: "/old-register",
                templateUrl: "js/account/templates/old-register.html",
                controller: 'RegisterCtrl'
            })
            // Each  has its own nav history stack:

//            .state('menu.dash', {
//                url: '/dash',
//                abstract: true,
//                views: {
//                    'menu': {
//                        templateUrl: 'js/trainer/templates/menu.html'
//                    }
//                }
//            })

            .state('menu.map', {
                url: '/map',
                views: {
                    'menu': {
                        templateUrl: 'js/map/templates/tab-map.html',
                        controller: 'TrainerMapCtrl'
                    }
                }
            })
//
//            .state('menu.list', {
//                url: '/list',
//                views: {
//                    'menu': {
//                        templateUrl: 'js/trainer/templates/trainer.html',
//                        controller: 'ListCtrl'
//                    }
//                }
//            })

            .state('menu.trainer', {
                url: '/Trainers',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/trainer.html',
                        controller: 'ListCtrl'
                    }
                }
            })

            .state('menu.trainer-detail', {
                url: '/Trainers/:trainerName',
                views: {
                    'menu': {
                        templateUrl: 'js/trainer/templates/trainer-detail.html',
                        controller: 'TrainerDetailCtrl'
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
                url: '/Events/:eventID',
                views: {
                    'menu': {
                        templateUrl: 'js/event/templates/event-detail.html',
                        controller: 'EventDetailCtrl'
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
                url: '/Classes/:classID',
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

            .state('menu.account.old-payment-method', {
                url: '/old-payment-method',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/old-payment.html',
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

            .state('menu.account.my-money', {
                url: '/my-money',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/scan.html',
                        controller: 'MoneyCtrl'
                    }
                }
            })

            .state('menu.account.my-events', {
                url: '/my-events',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/my-events.html',
                        controller: 'MyEventCtrl'
                    }
                }
            })

            .state('menu.account.my-classes', {
                url: '/my-classes',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/my-classes.html',
                        controller: 'MyClassCtrl'
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

            .state('menu.account.qrcode', {
                url: '/qrcode/:transactionID',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/qrcode.html',
                        controller: 'QRcodeCtrl'
                    }
                }
            })

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

            .state('menu.account.old-buy-tokens', {
                url: '/old-buy-tokens',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/old-buy-tokens.html',
                        controller: 'BuyTokensCtrl'
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

            .state('menu.account.test1', {
                url: '/test1',
                views: {
                    'account': {
                        templateUrl: 'js/account/templates/test1.html',
                        controller: 'Test1Ctrl'
                    }
                }
            })

//            .state('menu.account.add-class', {
//                url: '/add-class',
//                views: {
//                    'account': {
//                        templateUrl: 'js/account/templates/add-class.html',
//                        controller: 'AddClassCtrl'
//                    }
//                }
//            })
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
        $urlRouterProvider.otherwise('/menu/home');

    })
    .controller("MenuCtrl", function($scope, $ionicSideMenuDelegate, appFactory, $rootScope, $firebase, $timeout, $ionicPopup, $state, $interval){
//        window.plugin.backgroundMode.enable();
        $rootScope.header = "Trainers";
        navigator.geolocation.getCurrentPosition(function(position){
            console.log("location ready");
            $rootScope.position = position;
            console.log(position);
            appFactory.getObjsWithinRadius("trainers", [position.coords.latitude, position.coords.longitude], 30);
            appFactory.getObjsWithinRadius("events", [position.coords.latitude, position.coords.longitude], 30);
            appFactory.getObjsWithinRadius("classes", [position.coords.latitude, position.coords.longitude], 30);

            $rootScope.$broadcast('locationReady', 'locationReady');
        });


        $rootScope.user = appFactory.user;
        $ionicSideMenuDelegate.toggleLeft();


//        var bm = cordova.require("cordova/plugin/BackgroundMode");


        $scope.toggleMenu = function() {
            console.log("toggle left");
            $ionicSideMenuDelegate.toggleLeft();

        }

        $scope.showWarning = false;

        $scope.warningClick = function(){
            $rootScope.offline = false;
        }

        var successCallback = function(result){
            console.log(result);
        }
        var errorCallback = function(result){
            console.log(result);
        }

        $scope.warningMsg = "";
//        console.log(appFactory.userRef.child('transactions'));
        $interval(function(){
            if(appFactory.userRef != undefined) {
                var myTransactions = $firebase(appFactory.userRef.child(appFactory.user.$id).child('transactions')).$asArray();
                myTransactions.$loaded(function () {
                    console.log(myTransactions);
                    if (myTransactions.length > 0) {
                        var closestScan = undefined;
                        var closestReview = undefined;
                        for (var i = 0; i < myTransactions.length; i++) {
                            if (!myTransactions[i].scanned) {
                                if (closestScan == undefined || (myTransactions[i].schedule < closestScan.schedule)) {
                                    closestScan = myTransactions[i];
                                }
                            }
                            if (!myTransactions[i].leftreview) {
                                if (closestReview == undefined || (myTransactions[i].schedule < closestReview.schedule)) {
                                    closestReview = myTransactions[i];
                                }
                            }
                        }
                        var timedifference = 0;
                        var message = "";
                        var trainerID = "";
                        if (closestReview != undefined) {
                            console.log(closestReview)
                            trainerID = closestReview.trainerID;
                            message = "Please leave a review for your last workout"
                        }

                        if (closestScan != undefined) {
                            console.log(closestScan)
                            var d = new Date().getTime();
                            timedifference = closestScan.schedule - d;
                            trainerID = closestScan.trainerID;
                            console.log(timedifference);
                            message = "Time to scan your qrcode";
                        }

                        $timeout(function () {
                            var mappopup = $ionicPopup.show({
                                template: '<p>' + message + '</p>',
                                title: "Alert",
                                scope: $scope,
                                buttons: [
                                    {
                                        text: '<b>Okay</b>',
                                        onTap: function (e) {
                                            window.location.href = "#/menu/Trainers/" + trainerID;
                                        }
                                    },
                                    { text: 'Cancel' }
                                ]
                            });
                        }, timedifference);
                    }
                });
            }
        }, 300000);
//            var exec = cordova.require("cordova/exec");
//            exec(successCallback, errorCallback, 'Card_io', 'timer', [{id: appFactory.user.$id}]);
    })
