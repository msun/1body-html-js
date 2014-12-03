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

account.controller('LoginCtrl', function(GeoTrainers, $firebase,$ionicLoading, Firebase, Trainers, UserAuth, Users, Events, $scope, accountFactory, appFactory, $state, mapstate) {
    // if ref points to a data collection
    var successCallback = function(result){
        console.log(result);
        if(result.uid){
            appFactory.uid = result.uid;
            if (Users.obj()[result.uid]) {
                var sync = $firebase(Users.ref().child(result.uid));
                appFactory.user = sync.$asObject();
                appFactory.userRef = Users.ref();
            } else if (Trainers.obj()[result.uid]) {
                var sync = $firebase(Trainers.ref().child(result.uid));
                appFactory.user = sync.$asObject();
                appFactory.userRef = Trainers.ref();
            } else {
                appFactory.uid = result.uid;
                window.location.href = "#/register";
            }
            $state.transitionTo(mapstate);
        }
    }
    var errorCallback = function(result){
        console.log(result);
    }

    $scope.googleLogin = function(){
        var exec = cordova.require("cordova/exec");
        exec(successCallback, errorCallback, 'Card_io', 'googlelogin', []);
    }

    $scope.facebookLogin = function(){
        var exec = cordova.require("cordova/exec");
        exec(successCallback, errorCallback, 'Card_io', 'facebooklogin', []);
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

        console.log(UserAuth);
        if(UserAuth.user){
            if (Users.obj()[UserAuth.user.uid]) {
                var sync = $firebase(Users.ref().child(UserAuth.user.uid));
                appFactory.user = sync.$asObject();
                appFactory.userRef = Users.ref();
            } else {
                var sync = $firebase(Trainers.ref().child(UserAuth.user.uid));
                appFactory.user = sync.$asObject();
                appFactory.userRef = Trainers.ref();
            }
            $ionicLoading.hide();
//            window.location.href = "#/tab/dash/map";
            $state.transitionTo(mapstate);
        } else {
            UserAuth.$login("password", {
                email: $scope.user.email,
                password: $scope.user.password
            }).then(function (user) {
                if (Users.obj()[user.uid]) {
                    var sync = $firebase(Users.ref().child(user.uid));
                    appFactory.user = sync.$asObject();
                    appFactory.userRef = Users.ref();
                } else {
                    var sync = $firebase(Trainers.ref().child(user.uid));
                    appFactory.user = sync.$asObject();
                    appFactory.userRef = Trainers.ref();
                }
                $ionicLoading.hide();
//            window.location.href = "#/tab/dash/map";
                $state.transitionTo(mapstate);
            }, function (error) {
                console.error("Login failed: ", error);
                alert("login failed, please try again");
                $ionicLoading.hide();
            });
        }
    }

});

account.controller('RegisterCtrl', function(appFactory, $firebase, UserAuth, $scope, Users, Trainers, $state, mapstate) {
    $scope.newuser = {};
    $scope.newuser.group = "";
    console.log(UserAuth);
    UserAuth.$logout(); //FOR TESTING

    $scope.groups = [{name: "user"}, {name: "trainer"}];

    $scope.register = function(){
        if(appFactory.uid){
            if($scope.newuser.group.name == "trainer"){
                var myRef = Trainers.ref().child(appFactory.uid);
                var sync = $firebase(myRef);
                var user = sync.$asObject();

                user.$priority = appFactory.uid;
                user.group = $scope.newuser.group.name;
                user.username = $scope.newuser.username;
                user.email = $scope.newuser.email;
                user.gym = $scope.newuser.gym;
                user.token = $scope.newuser.token;
                user.$save().then(function(thing){
                    console.log(thing);
                });
            } else {
                var myRef = Users.ref().child(appFactory.uid);
                var sync = $firebase(myRef);
                var user = sync.$asObject();
                user.$priority = appFactory.uid;
                user.group = $scope.newuser.group.name;
                user.username = $scope.newuser.username;
                user.email = $scope.newuser.email;
                user.$save().then(function(thing){
                    console.log(thing);
                });
            }
        } else {
            UserAuth.$createUser($scope.newuser.email, $scope.newuser.password).then(function (authUser) {
                UserAuth.$login("password", {
                    email: $scope.newuser.email,
                    password: $scope.newuser.password
                }).then(function (client) {
                    if ($scope.newuser.group.name == "trainer") {
                        var myRef = Trainers.ref().child(client.uid);
                        var sync = $firebase(myRef);
                        var user = sync.$asObject();

                        user.md5_hash = authUser.user.md5_hash;
                        user.$priority = authUser.user.uid;
                        user.group = $scope.newuser.group.name;
                        user.username = $scope.newuser.username;
                        user.email = $scope.newuser.email;
                        user.gym = $scope.newuser.gym;
                        user.token = $scope.newuser.token;
                        user.$save().then(function (thing) {
                            console.log(thing);
                        });
                    } else {
                        var myRef = Users.ref().child(client.uid);
                        var sync = $firebase(myRef);
                        var user = sync.$asObject();
                        user.md5_hash = authUser.user.md5_hash;
                        user.$priority = authUser.user.uid;
                        user.group = $scope.newuser.group.name;
                        user.username = $scope.newuser.username;
                        user.email = $scope.newuser.email;
                        user.$save().then(function (thing) {
                            console.log(thing);
                        });
                    }


                    if ($scope.newuser.group.name == "trainer") {
                    }
                    console.log(user);

                }, function (error) {
                    console.error("Login failed: ", error);
                });
            });
        }
        $state.transitionTo(mapstate);
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

account.controller('ScanCtrl', function($scope, User, appFactory, $timeout, $firebase, Transactions, Transaction){
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

                var obj = $firebase(Transactions.ref().child(result.text)).$asObject();
                obj.$loaded(function () {
                    var transaction = new Transaction(obj);
                    console.log(transaction);
                    transaction.scan();

                })
            }, function (error) {
                console.log("Scanning failed: ", error);
            });
        }
    }

    $scope.enterCode = function(){
        var obj = $firebase(Transactions.ref().child($scope.clientCode)).$asObject();
        obj.$loaded(function () {
            var transaction = new Transaction(obj);
            console.log(transaction);
            transaction.scan();
        })
    }

});

account.controller('QRcodeCtrl', function($scope, Transaction, Users, Trainers, $firebase, appFactory, $timeout, $stateParams){
    if($stateParams.transactionID.length > 1){
        var element = document.getElementById("qrcode");

        var bodyElement = document.body;
        if(element.lastChild)
            element.replaceChild(showQRCode($stateParams.transactionID), element.lastChild);
        else
            element.appendChild(showQRCode($stateParams.transactionID));
    } else {
        $scope.transaction = "";
        var ref = $firebase(appFactory.userRef.child(appFactory.user.$id).child("transactions"));
        console.log(ref);
        $scope.transactions = ref.$asArray();

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
    image.src = $scope.user.imgLink;

    $ionicModal.fromTemplateUrl('js/account/templates/image-rotate.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });

    var angle = 0;

    $scope.rotatemodal = function(){
        var mappopup = $ionicPopup.show({
            template: '<img  id="rotateImage" src="' + $scope.user.imgLink + '" width="100%"/>',
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

        var successCallback = function(result){
            console.log(result);
            image.src = result.uri;
            $scope.useimg();
        }
        var errorCallback = function(result){
            console.log(result);
        }

        exec(successCallback, errorCallback, 'Card_io', 'crop', [
            {"top": y, "left": x, "width": cropwidth, 'height': cropheight, 'uri': image.src}
        ]);
    }

    function uploadPhoto(imageURI) {
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";

        var params = new Object();
        params.value1 = "test";
        params.value2 = "param";

        options.params = params;

        var ft = new FileTransfer();
        ft.upload(imageURI, "http://108.168.247.49:10355/fileupload", win, fail, options);
        alert(options.fileName);
    }

    function win(r) {
        console.log("Code = " + r.responseCode);
        $scope.imageLink = r.response;

        $timeout(function(){
            appFactory.user.imgLink =  "http://108.168.247.49:10355/" + r.response;
            alert(appFactory.user.imgLink);
            appFactory.user.$save();
        })
        $state.transitionTo("menu.account.my-profile");
        console.log("Sent = " + r.bytesSent);
    }

    function onSuccess(imageURI) {
        $scope.user.imgLink = imageURI;
        image.src = imageURI;
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }


    function fail(error) {
        console.log("An error has occurred: Code = " + error.code);
    }

    $scope.useimg = function(){
        uploadPhoto(image.src);
    }
});

account.controller('ProfileCtrl', function($ionicModal, $scope, User, appFactory, baseUrl, $timeout, $state, accountFactory, $ionicPopup, $ionicSideMenuDelegate, $timeout, mapstate) {
    console.log("ProfileCtrl");

    $scope.user = appFactory.user;
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

    exec(successCallback, errorCallback, 'Card_io', 'timer', {ms: 5000});

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
                    GeoTrainers.set(appFactory.user.$id, [$scope.marker.getPosition().k, $scope.marker.getPosition().B]).then(function() {
                        console.log("Provided key has been added to GeoFire");
                        appFactory.user.latitude = $scope.marker.getPosition().k;
                        appFactory.user.longitude = $scope.marker.getPosition().B;
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