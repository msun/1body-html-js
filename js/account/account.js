var account = angular.module('accountModule', ['ionic', 'starter', 'mapModule', 'ngResource', 'angularPayments', "firebase", "trainerModule"]);
account.factory('accountFactory', function($http, baseUrl) {
    var factory = {};

    factory.addcard = function(cardInfo, callback){
        $http({
            url: baseUrl + 'addcard',
            method: "POST",
            data: cardInfo
        }).success(function(data, status){
            callback(data, status);
        }).error(function(data, status){
            console.log(data);
            console.log(status);
        });
    };

    factory.charge = function(cardInfo, callback){
        $http({
            url: baseUrl + 'charge',
            method: "POST",
            data: cardInfo
        }).success(function(data, status){
            callback(data, status);
        }).error(function(data, status){
            console.log(data);
            console.log(status);
        });
    };

    return factory;
});

account.controller('HomeCtrl', function($scope, FirebaseRef, UserAuth){
    if(UserAuth.$getAuth()){
        console.log(UserAuth.$getAuth());
        window.location.href = "#/login/login-main";
    }
    $scope.googleLogin = function(){
        console.log("google login");
        UserAuth.$authWithOAuthRedirect("google").then(function(authData) {
            console.log("Authenticated successfully with payload:", authData);
        }).catch(function(error) {
            console.error("Authentication failed:", error);
        });
    };

    $scope.passwordLogin = function(){

    };
});

account.controller('LoginCtrl', function($window, GeoTrainers, GcmID, $firebaseObject, $firebaseArray,Sizes, $ionicLoading, Firebase, Trainers, UserAuth, Users, Events, $scope, accountFactory, appFactory, $state, mapstate, $rootScope, $localstorage) {
    console.log(UserAuth.$getAuth());

    var checkUrl = function(){
        if (ionic.Platform.isAndroid()) {
            var exec = cordova.require("cordova/exec");
            exec(function(result){
                console.log(result);
//                alert("received url: " + result.url);
                window.location.href = result.url;
            }, function(err){
                console.log(err);
            }, 'Card_io', 'gcmpush', [{id: appFactory.user.$id}]);
        } else {
            $state.transitionTo(mapstate);
        }
//        document.addEventListener("deviceready", function(){
            console.log(device.uuid);
            var gcmID = $firebaseObject(GcmID.ref().child(device.uuid));
            gcmID.$loaded(function(){
                console.log(gcmID);
                if(!gcmID.gcmID){
                    if (ionic.Platform.isAndroid()) {
                        console.log("platform is android");
                        var exec = cordova.require("cordova/exec");
                        exec(function(result){
                            alert(result["regid"]);
                            if(result["regid"] && result["regid"].length > 0){
                                gcmID.gcmID = result["regid"];
                                gcmID.userID = appFactory.user.$id;
                                gcmID.deviceID = device.uuid;
                                gcmID.$priority = appFactory.user.$id;
                                gcmID.$save().then(function(){
                                    alert(result["regid"] + " saved to db");
                                })
                            }
                        }, function(err){
                            console.log(err);
                        }, 'Card_io', 'gcminit', [{id: appFactory.user.$id}]);
                    }
                }
            })
//        }, false);
    }

    var loadLocalUser = function(user){
        console.log(user);
        appFactory.user = $firebaseObject(Users.ref().child(user.$id));
        appFactory.user.$loaded(function(){
            if(appFactory.user.username){
                if($rootScope.position){
                    appFactory.user.curlocation = $rootScope.position;
                    appFactory.loadLocation();
                    console.log(appFactory.user);
                }
                $rootScope.user = appFactory.user;
                $ionicLoading.hide();
                checkUrl();
            } else {
                alert("Login failed, please try again");
                $ionicLoading.hide();
            }
        });

    }

    var loadUserFromFirebase = function(user){
        appFactory.user = $firebaseObject(Users.ref().child(user.uid));
        appFactory.user.$loaded(function(){
            if(appFactory.user.username){
                $rootScope.user = appFactory.user;
                if($rootScope.position){
                    appFactory.user.curlocation = $rootScope.position;
                    appFactory.loadLocation();
                }

                console.log(appFactory.user);
                $localstorage.setObject("user", appFactory.user);
                $ionicLoading.hide();
                checkUrl();
            } else {
                alert("Login failed, please try again");
                $ionicLoading.hide();
            }
        });
    }

    $scope.user = {};
    $scope.signin = function(){
        $ionicLoading.show({
            content: '<i class="icon ion-looping"></i> Loading',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });

        if(UserAuth.$getAuth() && !$scope.user.email){
            appFactory.mysizes = $firebaseObject(Sizes.ref().child(UserAuth.$getAuth().uid));
            var user = $localstorage.getObject("user");
            if(user.$id && UserAuth.$getAuth().uid && user.$id === UserAuth.$getAuth().uid){
                loadLocalUser(user);
            } else {
                loadUserFromFirebase(UserAuth.$getAuth());
            }
        } else {
            UserAuth.$authWithPassword({
                email: $scope.user.email,
                password: $scope.user.password
            }).then(function (user) {
                appFactory.mysizes = $firebaseObject(Sizes.ref().child(user.uid));
                var localuser = $localstorage.getObject("user");
                if(localuser.$id && localuser.$id == user.uid){
                    loadLocalUser(localuser);
                } else {
                    loadUserFromFirebase(user);
                }

            }, function (error) {
                console.error("Login failed: ", error);
                alert("login failed, please try again");
                $ionicLoading.hide();
            });
        }
    }

    if(UserAuth.$getAuth()){
        $scope.signin();
    }

    $scope.back = function() {
        $window.history.back();
    };
});

account.controller('RegisterCtrl', function($ionicSlideBoxDelegate, $ionicNavBarDelegate, appFactory, $firebaseObject, UserAuth, $scope, Users, Trainers, $state, mapstate) {
    $scope.newuser = {};
    $scope.newuser.group = "Users";
    console.log(UserAuth);
    UserAuth.$unauth(); //FOR TESTING

    $scope.register = function(){
        console.log($scope.newuser);

        UserAuth.$createUser({email: $scope.newuser.email, password: $scope.newuser.password}).then(function (authUser) {
            console.log(authUser);
            UserAuth.$authWithPassword({
                email: $scope.newuser.email,
                password: $scope.newuser.password
            }).then(function (client) {
                var myRef = Users.ref().child(client.uid);
                var user = $firebaseObject(myRef);

                user.$priority = Firebase.ServerValue.TIMESTAMP;
                user.group = "Trainers";
                user.username = $scope.newuser.username;
                user.email = $scope.newuser.email;
                user.modified = Firebase.ServerValue.TIMESTAMP;
//                user.profilepic = "https://s3.amazonaws.com/com.onebody.profile/Users/" + client.uid + "/profilepic.jpg";
                user.tokens = 0;
                user.$save().then(function (thing) {
                    console.log(thing);
                    alert("Registered Successfully!");
                    window.location.href = "#";
                });
            }, function (error) {
                console.error("Login failed: ", error);
            });
        }).catch(function(error) {
            console.error("Error: ", error);
            alert(error);
        });

//        $state.transitionTo(mapstate);
    }

    $scope.back = function() {
        if ($ionicSlideBoxDelegate.currentIndex() >= 1) {
            $ionicSlideBoxDelegate.previous();
        } else {
            window.location.href = "#";
        }
    };

    $scope.navSlide = function(index) {
        $ionicSlideBoxDelegate.slide(index);
    }

    $scope.slideStop = function(index) {
        $ionicSlideBoxDelegate.enableSlide(false);
    }

    $scope.nextPressed = function(index) {
        if ($ionicSlideBoxDelegate.currentIndex() == 0 && $scope.newuser.group != 'Trainers') {
            $scope.register();
        } else if ($ionicSlideBoxDelegate.currentIndex() == $ionicSlideBoxDelegate.slidesCount() - 1) {
            $scope.register();
        } else {
            $ionicSlideBoxDelegate.next();
        }
    }

});

account.controller('ScanCtrl', function($scope, User, appFactory, $timeout, ScanQueue, $firebaseObject, Transactions, MyTransactions, Notifications){
    $scope.clientCode = {};

    var processTransaction = function(text){
        var list = text.split(":::");
        console.log(list);
        ScanQueue.ref().child(list[1]).set({
            userTransactionID: list[1],
            scannerID: appFactory.user.$id,
            userID: list[0],
            scanTime: Firebase.ServerValue.TIMESTAMP,
            processed: false
        });

        console.log();
        var scanObj = $firebaseObject(ScanQueue.ref().child(list[1]));
        var unwatch = scanObj.$watch(function(){
            if(scanObj.processed){
                if(!scanObj.error){
                    alert("transaction processed");
                } else {
                    alert(scanObj.error);
                }
                unwatch();
            }
        });

//        var transcationRef = Transactions.ref().child(appFactory.user.$id);
//        transcationRef.on("child_changed", function(childSnapshot, prevChild){
//            if(childSnapshot.val().processed){
//                alert("Transaction processed");
//                transcationRef.off();
//            }
//        });
//
//        var transcation = $firebaseObject(Transactions.ref().child(appFactory.user.$id).child(text));
//        transcation.$loaded(function () {
//            console.log(transcation);
//            if(transcation.trainerID == appFactory.user.$id || transcation.type == 'class' && appFactory.user.admin){
//                var myTransaction = $firebaseObject(MyTransactions.ref().child(transcation.userID).child(text));
//                myTransaction.$loaded(function(){
//                    myTransaction.scanned = true;
//                    myTransaction.scanTime = Firebase.ServerValue.TIMESTAMP;
//                    myTransaction.$save().then(function(){
//                        var notif = {
//                            creatorID: appFactory.user.$id,
//                            starttime: Date.now() + transcation.duration * 30 * 1000 * 60,
//                            url: "#/menu/Trainers/" + appFactory.user.$id,
//                            receivers: [transcation.userID],
//                            message: "Please leave a review for " + appFactory.user.username
//                        };
//                        Notifications.ref().push(notif, function(){
//                            alert("Transaction processed");
//                        });
//                    });
//                })
//            } else {
//                alert("This is not your training");
//            }
//        })
    };

    $scope.scanClient = function() {
//        document.addEventListener("deviceready", onDeviceReady, false);
//        function onDeviceReady() {
            var scanner = cordova.require("com.phonegap.plugins.barcodescanner.BarcodeScanner");
//            var scanner = cordova.require("cordova/plugin/BarcodeScanner");
            scanner.scan(function (result) {

                alert("We got a barcode\n" +
                    "Result: " + result.text + "\n" +
                    "Format: " + result.format + "\n" +
                    "Cancelled: " + result.cancelled);

                console.log("Scanner result: \n" +
                    "text: " + result.text + "\n" +
                    "format: " + result.format + "\n" +
                    "cancelled: " + result.cancelled + "\n");

                processTransaction(result.text);
            }, function (error) {
                console.log("Scanning failed: ", error);
            });
//        }
    }

    $scope.enterCode = function(){
        processTransaction($scope.clientCode.key);
    }
});

//account.controller('QRcodeCtrl', function($scope, Transaction, Users, Trainers, $firebaseObject, $firebaseArray, MyTransactions, appFactory, $timeout, $stateParams){
//    $scope.update = function(transactionID){
//        console.log(transactionID);
//        $scope.transactionID = transactionID;
//        var element = document.getElementById("qrcode");
//
//        var bodyElement = document.body;
//        if(element.lastChild)
//            element.replaceChild(showQRCode(transactionID), element.lastChild);
//        else
//            element.appendChild(showQRCode(transactionID));
//
//    }
//
//    if($stateParams.transactionID.length > 1){
//        var element = document.getElementById("qrcode");
//        $scope.transactionID = $stateParams.transactionID;
//        $scope.update($stateParams.transactionID);
//    }
//
//    $scope.transaction = "";
//    $scope.transactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("scanned").equalTo(false));
//    $scope.transactions.$loaded(function(){
//        console.log($scope.transactions);
//    });
//
//});

account.controller('Set-dpCtrl', function($ionicModal, $scope, $rootScope, User, appFactory, baseUrl, $ionicLoading, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout, $localstorage, $ionicScrollDelegate, Images) {
    $scope.user = appFactory.user;
    var exec = cordova.require("cordova/exec");

    var image = document.getElementById('displayPic');

//    exec(function(result){
//        image.src = result.uri;
//    }, function(err){
//        console.log(err);
//    }, 'Card_io', 'loadimg', [
//        {id: $scope.user.$id}
//    ]);
//    $scope.modal.hide();

    $ionicModal.fromTemplateUrl('js/account/templates/image-rotate.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    var angle = 0;

    $scope.rotatemodal = function(){
        var mappopup = $ionicPopup.show({
            template: '<img  id="rotateImage" src="' + image.src + '" width="100%"/>',
            title: "Image Rotate",
            scope: $scope,
            buttons: [
                {
                    text: '<a class="button button-assertive icon-right ion-arrow-return-right"></a>',
                    onTap: function(e) {
                        e.preventDefault();
                        var rotateimg = document.getElementById('rotateImage');
                        angle = (angle+90)%360;
                        rotateimg.className = "rotate"+angle;
                    }
                },
                { text: 'Cancel' },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: function(e) {
                        e.preventDefault();

                        var pluginName = '';
                        if (ionic.Platform.isAndroid()) {
                            pluginName = 'Card_io';
                        } else if (ionic.Platform.isIOS()) {
                            pluginName = 'OBImageEditor';
                        }

                        exec(function(result){
                            console.log(result);
                            alert("image rotate successful");
                            image.src = result.uri;
                            mappopup.close();
                        }, function(result){
                            console.log(result);
                            alert("image rotate failed");
                        }, pluginName, 'rotate', [
                            {angle: angle, uri: image.src}
                        ]);
                    }
                }
            ]
        });
    }

    $scope.rotateright = function(){
        var rotateimg = document.getElementById('rotateImage');
        angle = (angle+90)%360;
        rotateimg.className = "rotate"+angle;

    }

    $scope.setRotation = function(){
        var successCallback = function(result){
            console.log(result);
        }
        var errorCallback = function(result){
            console.log(result);
        }

        var pluginName = '';
        if (ionic.Platform.isAndroid()) {
            pluginName = 'Card_io';
        } else if (ionic.Platform.isIOS()) {
            pluginName = 'OBImageEditor';
        }

        exec(successCallback, errorCallback, pluginName, 'rotate', [
            {angle: angle, uri: image.src}
        ]);

        $scope.modal.hide();
    }

    $scope.closemodal = function(){
        $scope.modal.hide();
    }

    $scope.fromstorage = function() {
        // Retrieve image file location from specified source
        navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: 0 });
    };

    $scope.takeimg = function(){
        navigator.camera.getPicture(onSuccess, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
    };

    var scrollDelegate;
    var view;
    setTimeout(function() {
        scrollDelegate = $ionicScrollDelegate.$getByHandle('mainScroll');
        view = scrollDelegate.getScrollView();
    }, 100);
    var img = document.getElementById('displayPic');

    var zoomfactor = 1;


    $scope.scrolling = function(){
        scrollDelegate.resize();

        console.log("left: " + $('#displayPic').position().left);
        console.log("top: " + $('#displayPic').position().top);
        console.log("zoom: " + view.__zoomLevel);
        zoomfactor = view.__zoomLevel;
        console.log("width: " + $('#displayPic').width()*view.__zoomLevel);
        console.log("height: " + $('#displayPic').height()*view.__zoomLevel);
    }

    $scope.zoomin = function(){
        zoomfactor+=0.2;
        scrollDelegate.zoomTo(zoomfactor);
    }

    $scope.zoomout = function(){
        zoomfactor-=0.2;
        scrollDelegate.zoomTo(zoomfactor);
    }

    $scope.cropImage = function(useimg){
        var screenWidth = $('ion-content').width();

        var left = $('#displayPic').position().left;
        var top = $('#displayPic').position().top;

        var imageWidth = $('#displayPic').width()*view.__zoomLevel;
        var imageHeight = $('#displayPic').height()*view.__zoomLevel;

        var croptop = $('ion-content').width() * 0.15;
        var cropleft = $('ion-content').width() * 0.15;

        var x, y;
        x = cropleft - left;
        y = croptop - top;

        console.log(imageWidth);
        console.log(imageHeight);
        console.log(croptop);
        console.log(screenWidth);

        var cropwidth = (screenWidth * 0.7/imageWidth).toFixed(4);
        var cropheight = (screenWidth * 0.7/imageHeight).toFixed(4);

        x = (x/imageWidth).toFixed(4);
        y = (y/imageHeight).toFixed(4);
        console.log('x: ' + x + ' y: ' + y + ' width: ' + cropwidth + ' height: ' + cropheight + 'uri: ' + image.src);

        var pluginName = '';
        if (ionic.Platform.isAndroid()) {
            pluginName = 'Card_io';
        } else if (ionic.Platform.isIOS()) {
            pluginName = 'OBImageEditor';
        }

        exec(
            function(result){
                scrollDelegate.zoomTo(1);
                image.src = result.uri;
                console.log(result.uri);
                if(useimg) {
                    exec(function (result) {
                        var bigimg = {
                            data: result.big,
                            id: appFactory.user.$id,
                            name: "profilepic_hd.jpg",
                            type: "Users"
                        };

                        var smallimg = {
                            data: result.small,
                            id: appFactory.user.$id,
                            name: "profilepic.jpg",
                            type: "Users"
                        };

                        Images.ref().push(smallimg, function(){
                            Images.ref().push(bigimg, function(){
                                $scope.user.modified = Firebase.ServerValue.TIMESTAMP;
                                $scope.user.$save().then(function(){
                                    alert("Your profile picture is saved");
                                    window.location.href = "#/menu/account/my-profile";
                                });
                            });
                        });

//                        appFactory.user.profilepic = image.src;
//                        appFactory.user.$save().then(function(){
//                            $localstorage.setObject("user", appFactory.user);
//                            alert("image saved");
//                            $rootScope.user = appFactory.user;
//                            window.location.href = "#/menu/account/my-profile";
//                        })
                    }, function (err) {
                        console.log(err);
                    }, pluginName, 'useimg', [
                        {'id': $scope.user.$id, 'uri': image.src}
                    ]);
                }
            }, function(result){
                console.log(result);
            }, pluginName, 'crop', [
                {"top": y, "left": x, "width": cropwidth, 'height': cropheight, 'uri': image.src, 'id': appFactory.user.$id}
        ]);
    }

    function onSuccess(imageURI) {
        image.src = imageURI;
    }

    function onFail(message) {
        console.log('Failed because: ' + message);
    }
});

account.controller('ProfileCtrl', function($ionicModal, $scope, $rootScope, $localstorage, Users, appFactory, baseUrl, $timeout, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $firebaseObject, appConfig) {
    console.log("ProfileCtrl");

    $scope.user = $firebaseObject(Users.ref().child(appFactory.user.$id));
    $scope.user.$loaded(function(){
        appFactory.user = $scope.user;
        $rootScope.user = appFactory.user;
        $localstorage.setObject("user", $scope.user);
    })
    console.log($scope.user);

    if(!$scope.user.firstname){
        $scope.user.firstname = "";
    }
    if(!$scope.user.lastname){
        $scope.user.lastname = "";
    }
    if(!$scope.user.info){
        $scope.user.info = "";
    }
    $scope.url = "";

    $ionicModal.fromTemplateUrl('js/account/templates/set-dp.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    $scope.save = function(){
        $scope.user.modified = Firebase.ServerValue.TIMESTAMP;
        console.log($scope.user);
        $localstorage.setObject("user", $scope.user);
        $scope.user.$save().then(function(){
            $rootScope.user = appFactory.user;
            $state.transitionTo(appConfig.mapstate);
        });
    }

    $scope.cancel = function(){
        $state.transitionTo(appConfig.mapstate);
    }


    $scope.setdp = function(){
        $state.transitionTo("menu.set-dp");
    }

    $scope.addCertificate = function(){
        alert("Feature coming soon");
//        navigator.camera.getPicture(function(imageURI){
//            var options = new FileUploadOptions();
//            options.fileKey="file";
//            options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
//            options.mimeType="image/jpeg";
//
//            var params = new Object();
//            params.value1 = "test";
//            params.value2 = "param";
//
//            options.params = params;
//
//            var ft = new FileTransfer();
//            ft.upload(imageURI, "http://108.168.247.49:10355/fileupload", function(r){
//                if(appFactory.user.certs){
//                    appFactory.user.certs.push("http://108.168.247.49:10355/" + r.response);
//                } else {
//                    appFactory.user.certs = [];
//                    appFactory.user.certs.push("http://108.168.247.49:10355/" + r.response);
//                }
//                alert("http://108.168.247.49:10355/" + r.response);
//                $timeout(function(){
//                    $scope.user.certs = appFactory.user.certs;
//                })
//                appFactory.user.$save();
//            }, fail, options);
//            alert(options.fileName);
//
//
//        }, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
    }

//    function onSuccess(imageURI) {
//        $scope.url = imageURI;
//        $timeout(function() {
//            appFactory.user.imgLink = $scope.url;
//        });
//        alert(imageURI);
//    }
//
//    function onFail(message) {
//        alert('Failed because: ' + message);
//    }



    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });


});

account.controller('MoneyCtrl', function($scope, User, appFactory, baseUrl, $timeout, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout) {
    console.log("money ctrl");
    var exec = cordova.require("cordova/exec");

    var successCallback = function(result){
        console.log(result);
        alert(result.id);
    }
    var errorCallback = function(result){
        console.log(result);
    }

    if (ionic.Platform.isAndroid()) {
        exec(successCallback, errorCallback, 'Card_io', 'paypalpayment', []);
    }

});

account.controller('AccountCtrl', function($scope, User, appFactory, baseUrl, $timeout, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout) {
    console.log("account ctrl");
//
//    var exec = cordova.require("cordova/exec");
//
//    var successCallback = function(result){
//        console.log(result);
//    }
//    var errorCallback = function(result){
//        console.log(result);
//    }
//
//    exec(successCallback, errorCallback, 'Card_io', 'scanCard', []);

    Stripe.setPublishableKey('pk_test_DBhUBAORKHi5IqZLUlMUex0Y');
    $scope.user = appFactory.user;


    $scope.handleStripe = function(status, response){
        if(response.error) {
            // there was an error. Fix it.
            console.log(response.error);
        } else {
            // got stripe token, now charge it or smt
//            token = response.id;
            console.log(response.id);
            accountFactory.addcard({stripeToken: response.id, id: appFactory.user._id}, function(data, status){
                console.log(data);
                appFactory.user = data;
                var alertPopup = $ionicPopup.alert({
                    title: 'Success',
                    template: 'Your credit card was successfully added to our system'
                });
                alertPopup.then(function(res) {
                    console.log('popup closed');
                    window.location.href = baseUrl + "#/tab/dash/map";
                });
            })
        }
    }

//    $scope.sideMenuController.toggleLeft();
//    $scope.toggleMenu = function() {
//        console.log("toggle left");
//        $ionicSideMenuDelegate.toggleLeft();
//    }
});

account.controller('SetLocationCtrl', function($scope, $firebaseObject, Users, eventFactory, appConfig, Gyms, GeoGyms, $ionicModal, appFactory, $timeout, accountFactory, GeoTrainers, $localstorage, $window, $rootScope) {
    console.log("SetLocationCtrl ctrl");

    $scope.user = $firebaseObject(Users.ref().child(appFactory.user.$id));
    $scope.user.$loaded(function(){
        appFactory.user = $scope.user;
        $rootScope.user = appFactory.user;
        $localstorage.setObject("user", $scope.user);
    });

    $ionicModal.fromTemplateUrl('js/account/templates/gym-select-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    var saveCustomer = function(){
        $scope.user.modified = Firebase.ServerValue.TIMESTAMP;
        $localstorage.set("user", $scope.user);
        $scope.user.$save().then(function(){
            alert("Position saved");
            $window.history.back();
        });
    }

    $scope.confirm = function(){
        if($scope.user.address){
            console.log($scope.user.address.replace(/ /g, "+"));
            var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + $scope.user.address.replace(/ /g, "+") + "&key=" + appConfig.apikey;
            eventFactory.getStreetAddress(url, function(data, status){
                console.log(data);
                $scope.user.latitude = data.results[0].geometry.location.lat;
                $scope.user.longitude = data.results[0].geometry.location.lng;
                $scope.user.location = [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];

                GeoTrainers.set($scope.user.$id, [$scope.marker.getPosition().lat(), $scope.marker.getPosition().lng()]).then(function() {
                    console.log("Provided key has been added to GeoFire");
                    $scope.user.location = [$scope.marker.getPosition().lat(), $scope.marker.getPosition().lng()];
                    if($scope.user.gym && $scope.user.gym.gymID) {
                        Gyms.ref().child($scope.user.gym.gymID).child("Trainers").child($scope.user.$id).remove(function () {
                            $scope.user.gym = {};
                            saveCustomer();
                        });
                    } else {
                        saveCustomer();
                    }
                }, function(error) {
                    console.log("Error: " + error);

                });
            });
        } else {
            alert("address cannot be empty");
        }


    }

    var setLocation = function(){
        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + $scope.marker.getPosition().lat() + "," + $scope.marker.getPosition().lng() + "&key=" + appConfig.apikey;
        eventFactory.getStreetAddress(url, function(data, status){
            console.log(data);
            $scope.user.address = data.results[0].formatted_address;
        });
    };

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
        console.log(gym);
        var allReady = 2;
        var checkReady = function(){
            allReady--;
            if(allReady == 0){
                alert("Gym set successful");
                $scope.modal.hide();
                window.location.href = "#/menu/map";
            }
        }
        if(!gym.Trainers){
            gym.Trainers = [];
        }

        if($scope.user.gym && $scope.user.gym.gymID){
            console.log($scope.user.gym.gymID);
            allReady ++;
            Gyms.ref().child($scope.user.gym.gymID).child("Trainers").child($scope.user.$id).remove(function(){
                checkReady();
            });
        }

        var gymTrainer = {
            username: $scope.user.username,
            userID: $scope.user.$id,
            information: $scope.user.info | ""
        };
//
//        if($scope.user.profilepic){
//            gymTrainer.profilepic = $scope.user.profilepic;
//        }

        $scope.user.gym = {
            gymID: gym.$id,
            gymName: gym.name
        };

        $scope.user.address = gym.address;

//        if(gym.profilepic){
//            $scope.user.gym.profilepic = gym.profilepic;
//        }

        $scope.user.modified = Firebase.ServerValue.TIMESTAMP;

        console.log($scope.user);
        $localstorage.setObject("user", $scope.user);
        $scope.user.modified = Firebase.ServerValue.TIMESTAMP;
        $scope.user.$save().then(function(){
            $rootScope.user = $scope.user;
            checkReady();
        });

        Gyms.ref().child(gym.$id).child('Trainers').child($scope.user.$id).set(gymTrainer, function(){
            GeoTrainers.remove($scope.user.$id).then(function(){
                checkReady();
            });

        });
    };

    setTimeout(function() {
        appFactory.getLocation(function (position) {
            console.log(position);
            console.log(document.getElementById('set-location-map'));
            var map = new google.maps.Map(document.getElementById('set-location-map'), {
                zoom: 12,
                center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });
//            var marker;

            $scope.marker = new google.maps.Marker({
                position: map.getCenter(), //new google.maps.LatLng(appFactory.user.latitude, appFactory.users.longitude),
                map: map,
                draggable: true
            });

            google.maps.event.addListener(map, 'dragend', function () {
                $scope.marker.setPosition(map.getCenter());
                setLocation();
            });

            $scope.map = map;

        });
    }, 200);

});

account.controller('MyRequestsCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebaseArray, Requests, Trainers){
    $scope.requests = $firebaseArray(Requests.ref().orderByChild("userID").equalTo(appFactory.user.$id));
    var now = Date.now();
    $scope.requests.$loaded(function(){
        console.log(now);
        for(var j=0; j<$scope.requests.length; j++) {
            var req = $scope.requests[j];

            if (now - req.created > 86400000) {
                console.log("remove");
                (function (index) {
                    $scope.requests.$remove(index).then(function (ref) {
                        console.log(ref);
                    });
                }(j));
            } else if (now - req.created > 3600000) {
                $scope.requests[j].expired = true;
            }
        }
    });
});

account.controller('BuyTokensCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebaseObject, Requests, Trainers, $window, $localstorage, MyTokens, Payments, $ionicPlatform){
    $scope.bundles = [
        {numberTokens: 20, price: 100},
        {numberTokens: 10, price: 50},
        {numberTokens: 5, price: 25}
    ];

    $scope.amount = 0;
    $scope.totalTokens = 0;

    $scope.mytokens = $firebaseObject(MyTokens.ref().child(appFactory.user.$id));
    $scope.mytokens.$loaded(function(){
        $scope.currentTokens = $scope.mytokens.tokens;
    });

    var paypalApp = {
        // Application Constructor
        initialize: function() {
            this.bindEvents();
        },
        // Bind Event Listeners
        //
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        bindEvents: function() {
            $ionicPlatform.ready(function() {
                paypalApp.onDeviceReady();
            });
            //document.addEventListener('deviceready', this.onDeviceReady, false);
        },
        // deviceready Event Handler
        //
        // The scope of 'this' is the event. In order to call the 'receivedEvent'
        // function, we must explicity call 'paypalApp.receivedEvent(...);'
        onDeviceReady: function() {
            paypalApp.receivedEvent('deviceready');
        },
        // Update DOM on a Received Event
        receivedEvent: function(id) {
            paypalApp.initPaymentUI();
        },
        initPaymentUI: function() {
            var clientIDs = {
              "PayPalEnvironmentProduction": "YOUR_PRODUCTION_CLIENT_ID",
              "PayPalEnvironmentSandbox": "AU5_WbaNzFJpWSJoeYWNhIpzDjMU-q-uxAgDImQ0AI8uF5ahQ32dS-PNjxjh-AIP71nuWfpRipZfuzOr"
            };
            var ppm = PayPalMobile;
            var ppmi = PayPalMobile.init;
            PayPalMobile.init(clientIDs, paypalApp.onPayPalMobileInit);
        },
        onSuccessfulPayment: function(payment) {
            alert("payment success");
            console.log("payment success: " + JSON.stringify(payment, null, 4));

            var response = payment.response;
            if(response.state == "approved") {
                Payments.ref().push({
                    payID: response.id,
                    paymentMade: response.create_time,
                    created: Date.now(),
                    userID: appFactory.user.$id,
                    totalTokens: $scope.totalTokens,
                    processed: false
                });

                var unwatch = $scope.mytokens.$watch(function(){
                    var delta = $scope.mytokens.tokens - $scope.currentTokens;
                    alert(delta + " tokens purchased");
                    unwatch();
                });
            }
        },
        onAuthorizationCallback: function(authorization) {
            alert("payment authorized");
            console.log("authorization: " + JSON.stringify(authorization, null, 4));
        },
        onUserCanceled: function(result) {
            alert("payment cancelled");
            console.log(result);
        },
        createPayment: function(amount, description) {
            var paymentDetails = new PayPalPaymentDetails(amount, "0.00", "0.00");
            var payment = new PayPalPayment(amount, "USD", description, "Sale", paymentDetails);
            return payment;
        },
        configuration: function() {
            // for more options see `paypal-mobile-js-helper.js`
            var config = new PayPalConfiguration({
              merchantName: "1Body",
              merchantPrivacyPolicyURL: "",
              merchantUserAgreementURL: ""
            });
            return config;
        },
        onPrepareRender: function() {
            /*
            buyNowBtn.onclick = function(e) {
              // single payment
              PayPalMobile.renderSinglePaymentUI(paypalApp.createPayment(),
                                                 paypalApp.onSuccessfulPayment,
                                                 paypalApp.onUserCanceled);
            };

            buyInFutureBtn.onclick = function(e) {
              // future payment
              PayPalMobile.renderFuturePaymentUI(paypalApp.onAuthorizationCallback,
                                                 paypalApp.onUserCanceled);
            };

            profileSharingBtn.onclick = function(e) {
              // profile sharing
              PayPalMobile.renderProfileSharingUI(["profile", "email", "phone",
                "address", "futurepayments", "paypalattributes"
              ], paypalApp.onAuthorizationCallback, paypalApp.onUserCanceled);
            };
            */
        },
        onPayPalMobileInit: function() {
            PayPalMobile.prepareToRender("PayPalEnvironmentSandbox",
                                         paypalApp.configuration(),
                                         paypalApp.onPrepareRender);
        }
    };
    paypalApp.initialize();

    $scope.addBundle = function(item) {
        $scope.amount = 0;
        $scope.totalTokens += item.numberTokens;
        var remainder = $scope.totalTokens;
        for (var i = 0; i < $scope.bundles.length; i++) {
            $scope.amount += Math.floor(remainder / $scope.bundles[i].numberTokens) * $scope.bundles[i].price;
            remainder = remainder % $scope.bundles[i].numberTokens;
        }
    }

    $scope.removeBundle = function(item) {
        $scope.amount = 0;
        $scope.totalTokens -= item.numberTokens;
        if($scope.totalTokens < 0){
            $scope.totalTokens = 0;
        }
        var remainder = $scope.totalTokens;
        for (var i = 0; i < $scope.bundles.length; i++) {
            $scope.amount += Math.floor(remainder / $scope.bundles[i].numberTokens) * $scope.bundles[i].price;
            remainder = remainder % $scope.bundles[i].numberTokens;
        }
    }

    $scope.clear = function(){
        $scope.totalTokens = 0;
        $scope.amount = 0;
        $window.history.back();
    }

    $scope.confirm = function() {
        if(ionic.Platform.isIOS()) {
            var payment = paypalApp.createPayment($scope.amount, $scope.totalTokens + " Tokens");
            PayPalMobile.renderSinglePaymentUI(payment,
                                               paypalApp.onSuccessfulPayment,
                                               paypalApp.onUserCanceled);
        } else if(ionic.Platform.isAndroid()) {
            var exec = cordova.require("cordova/exec");

            var successCallback = function (result) {
                console.log(result);
                if (result["Result"] == "Cancelled") {
                    alert("Token purchase failed");
                } else {
                    var json = JSON.parse(result.json);
                    var payment = JSON.parse(result.payment);
                    if(json.response.state == "approved"){
                        Payments.ref().push({
                            payID: json.response.id,
                            paymentMade: json.response.create_time,
                            created: Date.now(),
                            userID: appFactory.user.$id,
                            totalTokens: $scope.totalTokens,
                            processed: false
                        });

                        var unwatch = $scope.mytokens.$watch(function(){
                            var delta = $scope.mytokens.tokens - $scope.currentTokens;
                            alert(delta + " tokens purchased");
                            $timeout(function(){
                                $scope.currentTokens = $scope.mytokens.tokens;
                            });
                            unwatch();
                        });
                    }



//                    alert($scope.totalTokens + " tokens purchased.");
//                    appFactory.user.tokens += $scope.totalTokens;
//                    $scope.totalTokens = 0;
//                    $scope.amount = 0;
//                    $localstorage.setObject("user", appFactory.user);
//                    appFactory.user.$save().then(function () {
//                        $window.history.back();
//                    });

                }
            }
            var errorCallback = function (result) {
                console.log(result);
            }

            if (ionic.Platform.isAndroid()) {
                exec(successCallback, errorCallback, 'Card_io', 'paypalpayment', [
                    {amount: $scope.amount, item: $scope.totalTokens + " Tokens"}
                ]);
            }
        }
    }
});

account.controller('IncomingRequestsCtrl', function($scope, Users, Transactions, MyTransactions, appFactory, baseUrl, $timeout, $firebaseArray, $firebaseObject, Requests, IncomingRequests, Trainers){
    console.log(appFactory.user);
    $scope.requests = $firebaseArray(Requests.ref().orderByChild("trainerID").equalTo(appFactory.user.$id));
    $scope.requests.$loaded(function(){
        console.log($scope.requests);
        for(var j=0; j<$scope.requests.length; j++){
            $scope.requests[j].trainerAccepted = false;
            var now = Date.now();
            if(now - $scope.requests[j].created > 3600000){
                $scope.requests[j].expired = true;
            }
            console.log(now - $scope.requests[j].created);
            if(now - $scope.requests[j].created > 86400000){
                console.log("remove");
                $scope.requests[j].remove = true;
                (function(req){
                    $scope.requests.$remove(req).then(function(ref){
                        console.log(ref);
                    });
                }($scope.requests[j]));

            }
        }
    })

    var map = new google.maps.Map(document.getElementById('request-location'), {
        zoom: 11,
        center: new google.maps.LatLng(appFactory.user.latitude, appFactory.user.longitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    $scope.showOnMap = function(item) {
        console.log(item);
        if($scope.marker){
            $scope.marker.setMap(null);
        }

        var center = new google.maps.LatLng(item.location[0], item.location[1]);
        $scope.marker = new google.maps.Marker({
            position: center,
            map: map,
            draggable: true
        });

        map.setCenter(center);
    };

    $scope.acceptRequest = function(item){

        var reqs = $firebaseArray(Requests.ref().orderByPriority().equalTo(item.created));

        var transactions = Transactions.ref().child(appFactory.user.$id);
        var myTransactions = MyTransactions.ref().child(item.userID);

        reqs.$loaded(function(){
            console.log(reqs);

            for(var i=0; i < reqs.length; i++){
                if(reqs[i].$id == item.$id){
                    if(!reqs[i].expired){
                        reqs[i].trainerAccecpted = true;
                        item.trainerAccecpted = true;
                        (function(index){
                            reqs.$save(index).then(function(){
                                var transaction = {
                                    userID: item.userID,
                                    trainerID: item.trainerID,
                                    trainerName: item.userName,
                                    tokens: 2,
                                    mobile: true,
                                    location: item.location,
                                    type: "Users",
                                    created: Firebase.ServerValue.TIMESTAMP,
                                    duration: item.duration,
                                    starttime: item.starttime
                                };
                                var transactionRef = transactions.push(transaction, function() {
                                    transactionRef.setPriority(item.starttime);

                                    transaction.reviewed = false;
                                    transaction.scanned = false;

                                    myTransactions.child(transactionRef.key()).set(transaction, function(){
                                        myTransactions.child(transactionRef.key()).setPriority(item.starttime);

                                    });

                                });
                            });
                        }(i));

                    }
                } else {
                    if(!reqs[i].trainerAccecpted){

//                        reqs.$save(i);
                        (function(index){
                            reqs[index].expired = true;
                            reqs.$save(index);
                        }(i))
                    }
                }
            }
        })


    };

    $scope.acceptRequests = function(){

        console.log($scope.requests);
        for(var k=0; k<$scope.requests.length; k++){
            var mRequest = $scope.requests[k];
            console.log(mRequest.accepted);

            if(!mRequest.accepted && mRequest.trainerAccepted) {
                console.log(mRequest);
                (function (req, num) {
                    $scope.requests.$save(num).then(function(){
                        console.log($scope.requests);
                        console.log(req);
                        var _req = $firebase(Requests.ref().child(req.$id)).$asObject();
                        _req.$loaded(function () {
                            console.log(_req);
                            _req.trainers[appFactory.user.$id].trainerAccecpted = true;
                            _req.$save().then(function(){
                                var acceptRequest = function(_user){
                                    console.log(_user);
                                    _user[appFactory.user.$id].trainerAccecpted = true;
                                    _user.$save().then(function(){
                                        console.log(_user);
                                    });
                                }

                                var mUser = $firebase(Users.ref().child(req.userID)).$asObject();
                                mUser.$loaded(function(){
                                    console.log(mUser);
                                    if(mUser.requests){
                                        mUser.requests[_req.$id][appFactory.user.$id].trainerAccecpted = true;
                                        mUser.$save().then(function(){
                                            console.log(mUser);
                                        });
                                    }
                                });
                                var mTrainer = $firebase(Trainers.ref().child(req.userID)).$asObject();
                                mTrainer.$loaded(function(){
                                    console.log(mTrainer);
                                    console.log(_req.$id);
                                    if(mTrainer.requests){
                                        mTrainer.requests[_req.$id][appFactory.user.$id].trainerAccecpted = true;
                                        mTrainer.$save().then(function(){
                                            console.log(mTrainer);
                                        });
                                    }
                                });
                            })
                        })
                    });
                }(mRequest, k));
            }
        }
    }

    $scope.delete = function(item){
        $scope.requests.splice($scope.requests.indexOf(item), 1);
        $scope.requests.$save();
    }
});

account.controller('MyTrainingsCtrl', function($scope, $ionicModal, Users, appFactory, $firebaseArray, baseUrl, $timeout, Requests, Transactions, $window, $localstorage){
    $scope.dt = new Date();
    $scope.showingAll = false;

    $scope.showCurrent = function(){
        $scope.showingAll = false;
        console.log($scope.dt.getFullYear());
        console.log($scope.dt.getMonth());
        console.log($scope.dt.getDate());
        console.log($scope.dt.getHours());
        console.log($scope.dt.getMinutes());
        console.log($scope.dt.getSeconds());

        var startDate = new Date();
        startDate.setFullYear($scope.dt.getFullYear());
        startDate.setMonth($scope.dt.getMonth());
        startDate.setDate($scope.dt.getDate());
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);
        console.log(startDate);
        console.log(startDate.getTime());

        var endDate = new Date();
        endDate.setFullYear($scope.dt.getFullYear());
        endDate.setMonth($scope.dt.getMonth());
        endDate.setDate($scope.dt.getDate());
        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(59);
        console.log(endDate);
        console.log(endDate.getTime());

        $scope.myTransactions = $firebaseArray(Transactions.ref().child(appFactory.user.$id).orderByPriority().startAt(startDate.getTime()).endAt(endDate.getTime()));
    }

    $scope.$watch('dt', $scope.showCurrent, true);

    $scope.showAll = function(){
        $scope.showingAll = true;
        $scope.myTransactions = $firebaseArray(Transactions.ref().child(appFactory.user.$id));

        $scope.myTransactions.$loaded(function(){
            for(var i=0; i<$scope.myTransactions.length; i++){
                console.log($scope.myTransactions.$priority);
            }
        });
    }

    $ionicModal.fromTemplateUrl('js/account/templates/qrcode.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    $scope.closeQRcodeModal = function(){
        console.log("hide");
        $scope.modal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
});

account.controller('AddImageCtrl', function($scope, $ionicModal, Users, appFactory, $firebaseArray, ImageUrls, $timeout, Images, $ionicLoading, $stateParams, $window){
    var exec;
    if (ionic.Platform.isAndroid()) {
        exec = cordova.require("cordova/exec");
    }

    $scope.newimage = {};

    var image = document.getElementById('displayPic');

    var onSuccess = function(imageURI) {
        image.src = imageURI;

    }

    var onFail = function(message) {
        alert('Failed because: ' + message);
    }

    $scope.fromstorage = function() {
        // Retrieve image file location from specified source
        navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: 0 });
    };

    $scope.fromcamera = function(){
        navigator.camera.getPicture(onSuccess, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
    };

    $scope.useimg = function(){
        var pluginName = '';
        if (ionic.Platform.isAndroid()) {
            pluginName = 'Card_io';
        } else if (ionic.Platform.isIOS()) {
            pluginName = 'OBImageEditor';
        }

        $ionicLoading.show({
            content: '<i class="icon ion-looping"></i> Saving image to server...',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });

        exec(function (result) {
            var bigimg = {
                data: result.big,
                id: $stateParams.id,
                name: $stateParams.id + "_" + Date.now() + "_hd.jpg",
                type: $stateParams.type
            };

            var smallimg = {
                data: result.small,
                id: $stateParams.id,
                name: $stateParams.id + "_" + Date.now() + ".jpg",
                type: $stateParams.type
            };

            $scope.newimage.hdurl = "https://s3.amazonaws.com/com.onebody.profile/" + $stateParams.type + "/" + $stateParams.id + "/" + bigimg.name;
            $scope.newimage.url = "https://s3.amazonaws.com/com.onebody.profile/" + $stateParams.type + "/" + $stateParams.id + "/" + smallimg.name;
            $scope.newimage.created = Firebase.ServerValue.TIMESTAMP;

            Images.ref().push(smallimg, function(){
                Images.ref().push(bigimg, function(){
                    var imgRef = ImageUrls.ref().child($stateParams.type).child($stateParams.id).push($scope.newimage, function(){
                        imgRef.setPriority($scope.newimage.created);
                        $ionicLoading.hide();
                        alert("Your event picture is saved");
                        $window.history.back();
                    });
                });
            });
        }, function (err) {
            console.log(err);
        }, pluginName, 'useimg', [
            {'id': $scope.user.$id, 'uri': image.src}
        ]);
    }
});

account.controller('MyTransactionsCtrl', function($scope,$firebaseObject, $ionicModal, Users, appFactory, $firebaseArray, baseUrl, $timeout, Requests, MyTransactions, $window, $localstorage){
    $scope.dt = new Date();
    $scope.showingAll = false;

    $scope.showCurrent = function(){
        $scope.showingAll = false;

        console.log($scope.dt.getFullYear());
        console.log($scope.dt.getMonth());
        console.log($scope.dt.getDate());
        console.log($scope.dt.getHours());
        console.log($scope.dt.getMinutes());
        console.log($scope.dt.getSeconds());

        var startDate = new Date();
        startDate.setFullYear($scope.dt.getFullYear());
        startDate.setMonth($scope.dt.getMonth());
        startDate.setDate($scope.dt.getDate());
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);
        console.log(startDate);
        console.log(startDate.getTime());

        var endDate = new Date();
        endDate.setFullYear($scope.dt.getFullYear());
        endDate.setMonth($scope.dt.getMonth());
        endDate.setDate($scope.dt.getDate());
        endDate.setHours(23);
        endDate.setMinutes(59);
        endDate.setSeconds(59);
        console.log(endDate);
        console.log(endDate.getTime());

        $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByPriority().startAt(startDate.getTime()).endAt(endDate.getTime()));
    }

    $scope.$watch('dt', $scope.showCurrent, true);

    $scope.showAll = function(){
        $scope.showingAll = true;
        $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id));
    }

    $ionicModal.fromTemplateUrl('js/account/templates/qrcode.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });



    $scope.showQRcode = function(transaction){
        $timeout(function(){
            $scope.map = new google.maps.Map(document.getElementById('modal-detail-map'), {
                zoom: 12,
                center: new google.maps.LatLng(transaction.location[0], transaction.location[1]),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });

//        $scope.map.setCenter(new google.maps.LatLng(transaction.location[0], transaction.location[1]));

            if($scope.marker){
                $scope.marker.setMap(null);
            }

            $scope.marker = new google.maps.Marker({
                position: $scope.map.getCenter(),
                map: $scope.map
            });
        }, 500);

//        MyTransactions.ref().child(appFactory.user.$id).child(transaction.$id).on("child_changed", function(childSnapshot){
        var obj = $firebaseObject(MyTransactions.ref().child(appFactory.user.$id).child(transaction.$id));
        var unwatch = obj.$watch(function(){
            console.log($scope.myTransactions);
            if(obj.scanned == true){
                alert("successfully scanned");
                unwatch();
                $scope.modal.hide();
            }
        });

        if(transaction.scanned == true){
            alert("Transaction is already scanned");
            $scope.modal.hide();
        }
        $scope.modal.show().then(function(){
            $scope.transactionID = appFactory.user.$id + ":::" + transaction.$id;
            var element = document.getElementById("qrcode");

            if(element.lastChild)
                element.replaceChild(showQRCode($scope.transactionID), element.lastChild);
            else
                element.appendChild(showQRCode($scope.transactionID));
        });
    }

    $scope.closeQRcodeModal = function(){
        console.log("hide");
        $scope.modal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
});
