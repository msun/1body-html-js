/*
This is a service module that provides push notification services

To use, inject the module "OBPushModule" / service "OBPush"
Available methods:
OBPush.register();
OBPush.unregister();
OBPush.getIsRegistered();
OBpush.setApplicationIconBadgeNumber(integer); // iOS only

This file uses the plugin https://github.com/phonegap-build/PushPlugin
This file is based on this file: https://github.com/phonegap-build/PushPlugin/blob/master/Example/www/index.html
*/
angular.module('OBPushModule', ['ionic', 'starter', 'firebase'])
.factory('OBPush', function(PushID, $firebaseObject, appFactory) {
        var isRegistered = false;

        var successHandler = function(result) {
            OBLog("OBPushApp.successHandler", 5);
        };

        var errorHandler = function(result) {
            OBLog("OBPushApp.errorHandler", 5);
        };

        var init = function(){
            return PushNotification.init({
                "android": {
                    "senderID": "589457464686"
                },
                "ios": {"alert": "true", "badge": "true", "sound": "true"},
                "windows": {}
            });
        };

        var registerPushNotification = function(pushID, pushObj){
            if(pushID && pushID.length > 0){

                pushObj.pushID = pushID;
                pushObj.userID = appFactory.user.$id;
                pushObj.deviceID = device.uuid;
                if (ionic.Platform.isAndroid()) {
                    pushObj.platform = "android";
                }
                if (ionic.Platform.isIOS()) {
                    pushObj.platform = "ios";
                }
                pushObj.$priority = appFactory.user.$id;
                pushObj.$save().then(function(){
                    alert("saved to db" + pushID);
                })
            }
        };


    var register = function(pushObj) {
        var pushID = $firebaseObject(PushID.ref().child(device.uuid));
        pushID.$loaded(function(){
            console.log(pushID);
            if(!pushID.pushID){
                ionic.Platform.ready(function() {
                    var push = init();

                    push.on('registration', function(data) {
                        console.log("registration event");
                        console.log(JSON.stringify(data));

                        isRegistered = true;
                        OBLog("OBPush registerSuccess", 5);
                        registerPushNotification(data.registrationId, pushID);
                    });

                    push.on('notification', function(data) {
                        console.log("notification event");
                        console.log(JSON.stringify(data));

                        if (ionic.Platform.isIOS()) {
                            push.setApplicationIconBadgeNumber(successHandler,
                                errorHandler,
                                data.count);
                        }
                    });

                    console.log("registering " + device.platform);
                });
            } else {
                isRegistered = true;
            }
        });
    };

    var unregister = function() {
        ionic.Platform.ready(function(){
            var push = init();
            if (ionic.Platform.isIOS()) {
                push.setApplicationIconBadgeNumber(successHandler,
                    errorHandler,
                    0);
            }
            push.unregister(function(){
                var pushObject = $firebaseObject(PushID.ref().child(device.uuid));
                pushObject.$remove();
            }, function(error){
                 console.log(error);
            });
        });
    };

    var getIsRegistered = function() {
        return isRegistered;
    };

    return {
        register : register,
        unregister : unregister,
        getIsRegistered : getIsRegistered
    };
});
