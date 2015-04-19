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

account.controller('HomeCtrl', function($scope){
    $scope.googleLogin = function(){

    };

    $scope.passwordLogin = function(){

    };
});

account.controller('LoginCtrl', function(GeoTrainers, GcmID, $firebaseObject, $firebaseArray,Sizes, $ionicLoading, $ionicNavBarDelegate, Firebase, Trainers, UserAuth, Users, Events, $scope, accountFactory, appFactory, $state, mapstate, $rootScope, $localstorage) {
    console.log(UserAuth.$getAuth());



    var checkUrl = function(){
        if (ionic.Platform.isAndroid()) {
            var exec = cordova.require("cordova/exec");
            exec(function(result){
                console.log(result);
                alert("received url: " + result.url);
                window.location.href = result.url;
            }, function(err){
                console.log(err);
            }, 'Card_io', 'gcmpush', [{id: appFactory.user.$id}]);
        } else {
            $state.transitionTo(mapstate);
        }
        document.addEventListener("deviceready", function(){
            alert(device.uuid);
            var gcmID = $firebaseObject(GcmID.ref().child(appFactory.user.$id).child(device.uuid));
            gcmID.$loaded(function(){
                if(!gcmID.$value){
                    if (ionic.Platform.isAndroid()) {
                        if (ionic.Platform.isAndroid()) {
                            var exec = cordova.require("cordova/exec");
                            exec(function(result){
                                alert(result["regid"]);
                                if(result["regid"] && result["regid"].length > 0){
                                    gcmID.$value = result["regid"];
                                    gcmID.$save().then(function(){
                                        alert(result["regid"] + " saved to db");
                                    })
                                }
                            }, function(err){
                                console.log(err);
                            }, 'Card_io', 'gcminit', [{id: appFactory.user.$id}]);
                        }
                    }
                }
            })
        }, false);
    }

    var loadLocalUser = function(user){
        appFactory.user = user;
        $rootScope.user = appFactory.user;
//        alert("loaded the user from localstorage");
        $ionicLoading.hide();
        checkUrl();
        if(user.group == 'Trainers'){
            appFactory.userRef = Trainers.ref();
        } else {
            appFactory.userRef = Users.ref();
        }
    }

    var loadUserFromFirebase = function(user){
        appFactory.user = $firebaseObject(Users.ref().child(user.uid));
        appFactory.user.$loaded(function(){
            if(appFactory.user.username){
                $rootScope.user = appFactory.user;
                console.log(appFactory.user);
                $localstorage.setObject("user", appFactory.user);
                $ionicLoading.hide();
                checkUrl();
                appFactory.userRef = Users.ref();
            } else {
                appFactory.user = $firebaseObject(Trainers.ref().child(user.uid));
                appFactory.user.$loaded(function(){
                    $rootScope.user = appFactory.user;
                    console.log(appFactory.user);
                    $localstorage.setObject("user", appFactory.user);
                    $ionicLoading.hide();
                    checkUrl();
                    appFactory.userRef = Trainers.ref();
                });
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
            console.log(user);
            if(user.$id && user.$id === UserAuth.$getAuth().uid){
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
                console.log(localuser);
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

    $scope.back = function() {
        $ionicNavBarDelegate.back();
    };

    if(UserAuth.$getAuth()){
        $scope.signin();
    }
});

account.controller('RegisterCtrl', function($ionicSlideBoxDelegate, $ionicNavBarDelegate, appFactory, $firebaseObject, UserAuth, $scope, Users, Trainers, $state, mapstate) {
    $scope.newuser = {};
    $scope.newuser.group = "User";
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
                if ($scope.newuser.group == "Trainers") {
                    var myRef = Trainers.ref().child(client.uid);
                    var user = $firebaseObject(myRef);

                    user.$priority = Firebase.ServerValue.TIMESTAMP;;
                    user.group = "Trainers";
                    user.username = $scope.newuser.username;
                    user.email = $scope.newuser.email;
                    if($scope.newuser.gym){
                        user.gym = $scope.newuser.gym;
                    }
                    user.modified = Firebase.ServerValue.TIMESTAMP;;
                    user.tokens = 0;
                    user.$save().then(function (thing) {
                        console.log(thing);
                        alert("Registered Successfully!");
                        window.location.href = "#";
                    });
                } else {
                    var myRef = Users.ref().child(client.uid);
                    var user = $firebaseObject(myRef);
                    user.$priority = Firebase.ServerValue.TIMESTAMP;;
                    user.group = "Users";
                    user.username = $scope.newuser.username;
                    user.email = $scope.newuser.email;
                    user.modified = Firebase.ServerValue.TIMESTAMP;;
                    user.tokens = 0;
                    user.$save().then(function (thing) {
                        console.log(thing);
                        alert("Registered Successfully!");
                        window.location.href = "#";
                    });
                }


                if ($scope.newuser.group.name == "trainer") {
                }
                console.log(user);

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
//            $ionicNavBarDelegate.back();
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

account.controller('ScanCtrl', function($scope, User, appFactory, $timeout, $firebaseObject, Transactions, MyTransactions){
    $scope.clientCode = {};

    $scope.scanClient = function() {
        document.addEventListener("deviceready", onDeviceReady, false);
        function onDeviceReady() {
            var scanner = cordova.require("cordova/plugin/BarcodeScanner");
            scanner.scan(function (result) {

                alert("We got a barcode\n" +
                    "Result: " + result.text + "\n" +
                    "Format: " + result.format + "\n" +
                    "Cancelled: " + result.cancelled);

                console.log("Scanner result: \n" +
                    "text: " + result.text + "\n" +
                    "format: " + result.format + "\n" +
                    "cancelled: " + result.cancelled + "\n");

                var transcation = $firebaseObject(Transactions.ref().child(appFactory.user.$id).child(result.text));
                transcation.$loaded(function () {
                    console.log(transcation);
                    var myTransaction = $firebaseObject(MyTransactions.ref().child(transcation.userID).child(result.text));
                    myTransaction.$loaded(function(){
                        myTransaction.scanned = true;
                        myTransaction.$save().then(function(){
                            alert("Transaction processed");
                        });
                    })
                })
            }, function (error) {
                console.log("Scanning failed: ", error);
            });
        }
    }

    $scope.enterCode = function(){
        alert($scope.clientCode.key);
        var transcation = $firebaseObject(Transactions.ref().child(appFactory.user.$id).child($scope.clientCode.key));
        transcation.$loaded(function () {
            console.log(transcation);
            var myTransaction = $firebaseObject(MyTransactions.ref().child(transcation.userID).child($scope.clientCode.key));
            myTransaction.$loaded(function(){
                myTransaction.scanned = true;
                myTransaction.$save().then(function(){
                    alert("Transaction processed");
                });
            })
        })
    }
});

account.controller('QRcodeCtrl', function($scope, Transaction, Users, Trainers, $firebaseObject, $firebaseArray, MyTransactions, appFactory, $timeout, $stateParams){
    $scope.update = function(transactionID){
        console.log(transactionID);
        $scope.transactionID = transactionID;
        var element = document.getElementById("qrcode");

        var bodyElement = document.body;
        if(element.lastChild)
            element.replaceChild(showQRCode(transactionID), element.lastChild);
        else
            element.appendChild(showQRCode(transactionID));

    }

    if($stateParams.transactionID.length > 1){
        var element = document.getElementById("qrcode");
        $scope.transactionID = $stateParams.transactionID;
        $scope.update($stateParams.transactionID);
    }

    $scope.transaction = "";
    $scope.transactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("scanned").equalTo(false));
    $scope.transactions.$loaded(function(){
        console.log($scope.transactions);
    });

});

account.controller('Set-dpCtrl', function($ionicModal, $scope, $rootScope, User, appFactory, baseUrl, $ionicLoading, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout, $localstorage, $ionicScrollDelegate) {
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

                        if (ionic.Platform.isAndroid()) {
                            exec(function(result){
                                console.log(result);
                                alert("image rotate successful");
                                image.src = result.uri;
                                mappopup.close();
                            }, function(result){
                                console.log(result);
                                alert("image rotate failed");
                            }, 'Card_io', 'rotate', [
                                {angle: angle, uri: image.src}
                            ]);
                        }
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

        if (ionic.Platform.isAndroid()) {
            exec(successCallback, errorCallback, 'Card_io', 'rotate', [
                {angle: angle, uri: image.src}
            ]);
        }

        $scope.modal.hide();
    }

    $scope.closemodal = function(){
        $scope.modal.hide();
    }

    $scope.fromstorage = function() {
        alert("from storage");
        // Retrieve image file location from specified source
        navigator.camera.getPicture(onSuccess, onFail, { quality: 50,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: 0 });
    }

    $scope.takeimg = function(){
        navigator.camera.getPicture(onSuccess, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
    }

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

        if (ionic.Platform.isAndroid()) {
            exec(
                function(result){
                    scrollDelegate.zoomTo(1);
                    image.src = result.uri;
                    console.log(result.uri);
                    if(useimg) {
                        exec(function () {
                            appFactory.user.profilepic = image.src;
                            appFactory.user.$save().then(function(){
                                $localstorage.setObject("user", appFactory.user);
                                alert("image saved");
                                $rootScope.user = appFactory.user;
                                window.location.href = "#/menu/account/my-profile";
                            })
                        }, function (err) {
                            console.log(err);
                        }, 'Card_io', 'useimg', [
                            {'id': $scope.user.$id, 'uri': image.src}
                        ]);
                    }
                }, function(result){
                    console.log(result);
                }, 'Card_io', 'crop', [
                    {"top": y, "left": x, "width": cropwidth, 'height': cropheight, 'uri': image.src, 'id': appFactory.user.$id}
            ]);
        }
    }

    function onSuccess(imageURI) {
        image.src = imageURI;

    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
});

account.controller('ProfileCtrl', function($ionicModal, $scope, $rootScope, $localstorage, Users, appFactory, baseUrl, $timeout, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $firebaseObject, appConfig) {
    console.log("ProfileCtrl");

    $scope.user = $firebaseObject(appFactory.userRef.child(appFactory.user.$id));
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
        $state.transitionTo("menu.account.set-dp");
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

account.controller('SetLocationCtrl', function($scope, $firebaseObject, eventFactory, appConfig, Gyms, GeoGyms, $ionicModal, appFactory, $timeout, accountFactory, GeoTrainers, $localstorage, $window, $rootScope) {
    console.log("SetLocationCtrl ctrl");

    $scope.user = $firebaseObject(appFactory.userRef.child(appFactory.user.$id));
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
                            var modified = $firebaseObject(Gyms.ref().child($scope.user.gym.gymID).child("modified"));
                            console.log(modified);
                            $scope.user.gym = {};
                            modified.$value = Firebase.ServerValue.TIMESTAMP;
                            modified.$save().then(function(){
                                saveCustomer();
                            });
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
        console.log(gym);
        var allReady = 4;
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
            allReady += 2;
            Gyms.ref().child($scope.user.gym.gymID).child("Trainers").child($scope.user.$id).remove(function(){
                checkReady();
            });

            var modified2 = $firebaseObject(Gyms.ref().child($scope.user.gym.gymID).child("modified"));
            modified2.$value = Firebase.ServerValue.TIMESTAMP;
            modified2.$save().then(function(){
                checkReady();
            });
        }

        var gymTrainer = {
            username: $scope.user.username,
            userID: $scope.user.$id,
            information: $scope.user.info
        };

        if($scope.user.profilepic){
            gymTrainer.profilepic = $scope.user.profilepic;
        }

        $scope.user.gym = {
            gymID: gym.$id,
            gymName: gym.name
        };

        if(gym.profilepic){
            $scope.user.gym.profilepic = gym.profilepic;
        }

        $scope.user.modified = Firebase.ServerValue.TIMESTAMP;

        console.log($scope.user);
        $localstorage.setObject("user", $scope.user);
        $scope.user.modified = Firebase.ServerValue.TIMESTAMP;
        $scope.user.$save().then(function(){
            $rootScope.user = $scope.user;
            checkReady();
        });

        Gyms.ref().child(gym.$id).child('Trainers').child($scope.user.$id).set(gymTrainer, function(){
            checkReady();
            var modified1 = $firebaseObject(Gyms.ref().child(gym.$id).child("modified"));
//            modified.$loaded(function(){
                modified1.$value = Firebase.ServerValue.TIMESTAMP;
                modified1.$save().then(function(){
                    checkReady();
                });
                GeoTrainers.remove($scope.user.$id).then(function(){
                    checkReady();
                });
//            })

        });
    }

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
    $scope.requests = $firebaseArray(Requests.ref().child(appFactory.user.$id));
    var now = Firebase.ServerValue.TIMESTAMP;;
    $scope.requests.$loaded(function(){
        console.log(now);
        for(var j=0; j<$scope.requests.length; j++) {
            var req = $scope.requests[j];
            $scope.requests[j].profilepic = appFactory.trainers[req.trainerID].profilepic;

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

account.controller('BuyTokensCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebase, Requests, Trainers, $window, $localstorage){
    $scope.bundles = [
        {numberTokens: 20, price: 400},
        {numberTokens: 10, price: 220},
        {numberTokens: 5, price: 120}
    ];

    if(!appFactory.user.tokens){
        appFactory.user.tokens = 0;
    }
    $scope.currentTokens = appFactory.user.tokens;

    $scope.amount = 0;
    $scope.totalTokens = 0;

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

    $scope.confirm = function(){
        if(ionic.Platform.isIOS()){
            alert("ios paypal plugin here");

        } else {
            var exec = cordova.require("cordova/exec");

            var successCallback = function (result) {
                console.log(result);
                if (result["Result"] == "Cancelled") {
                    alert("Token purchase failed");
                } else {
                    alert($scope.totalTokens + " tokens purchased.");
                    appFactory.user.tokens += $scope.totalTokens;
                    $scope.totalTokens = 0;
                    $scope.amount = 0;
                    $localstorage.setObject("user", appFactory.user);
                    appFactory.user.$save().then(function () {
                        $window.history.back();
                    });

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

account.controller('IncomingRequestsCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebaseArray, $firebaseObject, Requests, IncomingRequests, Trainers){
    console.log(appFactory.user);
    $scope.requests = $firebaseArray(IncomingRequests.ref().child(appFactory.user.$id));
    $scope.requests.$loaded(function(){
        console.log($scope.requests);
        for(var j=0; j<$scope.requests.length; j++){
            $scope.requests[j].trainerAccepted = false;
            var now = Firebase.ServerValue.TIMESTAMP;;
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

        var center = new google.maps.LatLng(item.latitude, item.longitude);
        $scope.marker = new google.maps.Marker({
            position: center,
            map: map,
            draggable: true
        });

        map.setCenter(center);
    };

    $scope.acceptRequest = function(item){
        var reqRef = Requests.ref().child(item.userID);
        var reqs = $firebaseArray(reqRef.orderByPriority().equalTo(item.created));

        reqs.$loaded(function(){
            console.log(reqs);
            for(var i=0; i < reqs.length; i++){
                if(reqs[i].$id == item.$id){
                    if(!reqs[i].expired){
                        reqs[i].trainerAccecpted = true;
                        item.trainerAccecpted = true;
                        $scope.requests.$save(item);
                        (function(index){
                            reqs.$save(index);
                        }(i))
                    }
                } else {
                    if(!reqs[i].trainerAccecpted){
                        reqs[i].expired = true;
                        (function(index){
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

account.controller('MyTransactionsCtrl', function($scope, Users, appFactory, $firebaseArray, baseUrl, $timeout, Requests, MyTransactions, $window, $localstorage){
    $scope.dt = new Date();

    $scope.$watch('dt', function () {
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
    }, true);

    $scope.showAll = function(){
        $scope.myTransactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id));
    }
});

account.filter('parseTimestamp', function() {
    return function(timestamp) {
        return new Date(timestamp);
    };
});
