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

account.controller('LoginCtrl', function(GeoTrainers, $firebaseObject, $firebaseArray,Sizes, $ionicLoading, $ionicNavBarDelegate, Firebase, Trainers, UserAuth, Users, Events, $scope, accountFactory, appFactory, $state, mapstate, $rootScope, $localstorage) {
    var loadLocalUser = function(user){
        appFactory.user = user;
        $rootScope.user = appFactory.user;
        alert("loaded the user from localstorage");
        $ionicLoading.hide();
        $state.transitionTo(mapstate);
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
                $state.transitionTo(mapstate);
                appFactory.userRef = Users.ref();
            } else {
                appFactory.user = $firebaseObject(Trainers.ref().child(user.uid));
                appFactory.user.$loaded(function(){
                    $rootScope.user = appFactory.user;
                    console.log(appFactory.user);
                    $localstorage.setObject("user", appFactory.user);
                    $ionicLoading.hide();
                    $state.transitionTo(mapstate);
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

        console.log(UserAuth.$getAuth());
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

                    user.$priority = Date.now();
                    user.group = "Trainers";
                    user.username = $scope.newuser.username;
                    user.email = $scope.newuser.email;
                    if($scope.newuser.gym){
                        user.gym = $scope.newuser.gym;
                    }
                    user.tokens = 0;
                    user.$save().then(function (thing) {
                        console.log(thing);
                        alert("Registered Successfully!");
                        window.location.href = "#";
                    });
                } else {
                    var myRef = Users.ref().child(client.uid);
                    var user = $firebaseObject(myRef);
                    user.$priority = Date.now();
                    user.group = "Users";
                    user.username = $scope.newuser.username;
                    user.email = $scope.newuser.email;
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

account.controller('MyEventCtrl', function($scope, User, appFactory, baseUrl, $timeout){
    $scope.events = appFactory.user.events;

    $scope.edit = function(event){
        console.log(event);
        window.location.href = baseUrl + "#/menu/editevent/" + event.id;
    }

    $scope.delete = function(event){
        console.log(event);
    }

});

account.controller('ScanCtrl', function($scope, User, appFactory, $timeout, $firebaseObject, Transactions, MyTransactions){
    $scope.clientCode = "";
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
                    myTransaction.scanned = true;
                    myTransaction.$save().then(function(){
                        alert("Transaction processed");
                    });
                })
            }, function (error) {
                console.log("Scanning failed: ", error);
            });
        }
    }

    $scope.enterCode = function(){
        var transcation = $firebaseObject(Transactions.ref().child(appFactory.user.$id).child($scope.clientCode));
        transcation.$loaded(function () {
            console.log(transcation);
            var myTransaction = $firebaseObject(MyTransactions.ref().child(transcation.userID).child($scope.clientCode));
            myTransaction.scanned = true;
            myTransaction.$save().then(function(){
                alert("Transaction processed");
            });
        })
    }
});

account.controller('QRcodeCtrl', function($scope, Transaction, Users, Trainers, $firebaseObject, $firebaseArray, MyTransactions, appFactory, $timeout, $stateParams){
    if($stateParams.transactionID.length > 1){
        var element = document.getElementById("qrcode");

        var bodyElement = document.body;
        if(element.lastChild)
            element.replaceChild(showQRCode($stateParams.transactionID), element.lastChild);
        else
            element.appendChild(showQRCode($stateParams.transactionID));
    } else {
        $scope.transaction = "";
        $scope.transactions = $firebaseArray(MyTransactions.ref().child(appFactory.user.$id).orderByChild("scanned").equalTo(false));
        $scope.transactions.$loaded(function(){
            console.log($scope.transactions);
        });

        $scope.update = function(transaction){
            console.log(transaction);
            var element = document.getElementById("qrcode");

            var bodyElement = document.body;
            if(element.lastChild)
                element.replaceChild(showQRCode(transaction.$id), element.lastChild);
            else
                element.appendChild(showQRCode(transaction.$id));

        }
    }
});

account.controller('Set-dpCtrl', function($ionicModal, $scope, User, appFactory, baseUrl, $timeout, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout, mapstate, $ionicScrollDelegate, $ionicModal) {
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
                        var successCallback = function(result){
                            console.log(result);
                            image.src = result.uri;
                        }
                        var errorCallback = function(result){
                            console.log(result);
                        }

                        exec(successCallback, errorCallback, 'Card_io', 'rotate', [
                            {angle: angle, uri: image.src}
                        ]);
                        $scope.modal.hide();
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

        exec(successCallback, errorCallback, 'Card_io', 'rotate', [
            {angle: angle, uri: image.src}
        ]);
        $scope.modal.hide();
    }

    $scope.closemodal = function(){
        $scope.modal.hide();
    }

    $scope.fromstorage = function() {
        console.log("from storage");
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

    $scope.cropImage = function(){
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

        exec(
            function(result){
                scrollDelegate.zoomTo(1);
                image.src = result.uri;
                console.log(result.uri);
            }, function(result){
                console.log(result);
            }, 'Card_io', 'crop', [
                {"top": y, "left": x, "width": cropwidth, 'height': cropheight, 'uri': image.src, 'id': appFactory.user.$id}
            ]);
    }

    function onSuccess(imageURI) {
        image.src = imageURI;
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }

    $scope.useimg = function(){
//        uploadPhoto(image.src);
        exec(function(){
            alert("image saved");

        }, function(err){
            console.log(err);
        }, 'Card_io', 'useimg', [
            {'id': $scope.user.$id, 'uri': image.src}
        ]);
    }
});

account.controller('ProfileCtrl', function($ionicModal, $scope, Users, appFactory, baseUrl, $timeout, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $firebaseObject, mapstate) {
    console.log("ProfileCtrl");

    $scope.user = $firebaseObject(appFactory.userRef.child(appFactory.user.$id));
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
        $scope.user.lastModifiedDate = Date.now();
        console.log($scope.user);
        $scope.user.$save().then(function(){
            $state.transitionTo(mapstate);
        });
    }

    $scope.cancel = function(){
        $state.transitionTo(mapstate);
    }


    $scope.setdp = function(){
        $state.transitionTo("menu.account.set-dp");
    }

    $scope.addCertificate = function(){
        navigator.camera.getPicture(function(imageURI){
            var options = new FileUploadOptions();
            options.fileKey="file";
            options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
            options.mimeType="image/jpeg";

            var params = new Object();
            params.value1 = "test";
            params.value2 = "param";

            options.params = params;

            var ft = new FileTransfer();
            ft.upload(imageURI, "http://108.168.247.49:10355/fileupload", function(r){
                if(appFactory.user.certs){
                    appFactory.user.certs.push("http://108.168.247.49:10355/" + r.response);
                } else {
                    appFactory.user.certs = [];
                    appFactory.user.certs.push("http://108.168.247.49:10355/" + r.response);
                }
                alert("http://108.168.247.49:10355/" + r.response);
                $timeout(function(){
                    $scope.user.certs = appFactory.user.certs;
                })
                appFactory.user.$save();
            }, fail, options);
            alert(options.fileName);


        }, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
    }

    function onSuccess(imageURI) {
        $scope.url = imageURI;
        $timeout(function() {
            appFactory.user.imgLink = $scope.url;
        });
        alert(imageURI);
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }



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

    exec(successCallback, errorCallback, 'Card_io', 'paypalpayment', []);

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

account.controller('SetLocationCtrl', function($scope, User, appFactory, baseUrl, $timeout, accountFactory, GeoTrainers, $ionicPopup) {
    console.log("SetLocationCtrl ctrl");

    var mappopup = $ionicPopup.show({
        template: '<div id="set-location-map" data-tap-disabled="true" ></div>',
        title: "Choose location",
        scope: $scope,
        buttons: [
            { text: 'Cancel' },
            {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                    console.log($scope.marker.getPosition());
                    GeoTrainers.set(appFactory.user.$id, [$scope.marker.getPosition().lat(), $scope.marker.getPosition().lng()]).then(function() {
                        console.log("Provided key has been added to GeoFire");
                        appFactory.user.latitude = $scope.marker.getPosition().lat();
                        appFactory.user.longitude = $scope.marker.getPosition().lng();
                        console.log(appFactory.user);
                        appFactory.user.$save().then(function(){
                            console.log(appFactory.user);
                        })

                    }, function(error) {
                        $ionicLoading.hide();
                        console.log("Error: " + error);

                    });
                }
            }
        ]
    });

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

            google.maps.event.addListener(map, 'center_changed', function () {
                $scope.marker.setPosition(map.getCenter());
            });

            $scope.map = map;

        });
    }, 200);

});

account.controller('MyRequestsCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebaseArray, Requests, Trainers){
    $scope.requests = $firebaseArray(Requests.ref().child(appFactory.user.$id));
    var now = Date.now();
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

account.controller('BuyTokensCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebase, Requests, Trainers, $window){
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
//        var ref = $firebase(appFactory.userRef.child(appFactory.user.$id).child("payments"));
//        var payments = ref.$asArray();
//        payments.$loaded(function(){
//
//        });

        var exec = cordova.require("cordova/exec");

        var successCallback = function(result){
            console.log(result);
            alert($scope.totalTokens + " tokens purchased.");
            appFactory.user.tokens += $scope.totalTokens;
            $scope.totalTokens = 0;
            $scope.amount = 0;
            $window.history.back();
        }
        var errorCallback = function(result){
            console.log(result);
        }

        exec(successCallback, errorCallback, 'Card_io', 'paypalpayment', [{amount:$scope.amount, item: $scope.totalTokens + " Tokens"}]);

    }
});

account.controller('IncomingRequestsCtrl', function($scope, Users, appFactory, baseUrl, $timeout, $firebaseArray, $firebaseObject, Requests, IncomingRequests, Trainers){
    console.log(appFactory.user);
    $scope.requests = $firebaseArray(IncomingRequests.ref().child(appFactory.user.$id));
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

account.filter('parseTimestamp', function() {
    return function(timestamp) {
        return new Date(timestamp);
    };
});

account.controller('Test1Ctrl', function($scope, User, appFactory, baseUrl, $timeout, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout) {
});
