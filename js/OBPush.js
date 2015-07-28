/*
This is a service module that provides push notification services

To use, inject the module "OBPushModule" / service "OBPush"
Available methods:
OBPush.register();
OBPush.unregister();
OBpush.setApplicationIconBadgeNumber(integer); // iOS only

This file uses the plugin https://github.com/phonegap-build/PushPlugin
This file is based on this file: https://github.com/phonegap-build/PushPlugin/blob/master/Example/www/index.html
*/

// OBPushApp needs to be in global scope because of pushNotification.register
var OBPushApp = {
    successHandler : function(result) {
        OBLog("OBPushApp.successHandler", 5);
    },

    errorHandler : function(result) {
        OBLog("OBPushApp.errorHandler", 5);
    },

    // This function is only called if the app is currently open
    onNotificationAPN : function (e) {
        if (e.alert) {
             OBLog("push-notification: " + e.alert, 5);
             // showing an alert also requires the org.apache.cordova.dialogs plugin
             navigator.notification.alert(e.alert);
        }

        if (e.sound) {
            // playing a sound also requires the org.apache.cordova.media plugin
            var snd = new Media(e.sound);
            snd.play();
        }

        if (e.badge) {
            pushNotification.setApplicationIconBadgeNumber(this.successHandler, this.errorHandler, e.badge);
        }
    },

    // handle GCM notifications for Android
    onNotification : function (e) {
        OBLog("EVENT -> RECEIVED: " + e.event, 5);

        switch( e.event ) {

            case 'registered':
                if ( e.regid.length > 0 ) {
                    OBLog("REGISTERED -> REGID: " + e.regid, 5);
                    // Your GCM push server needs to know the regID before it can push to this device
                    // here is where you might want to send it the regID for later use.
                    console.log("regID = " + e.regid);
                }
                break;
            case 'message':
                // if this flag is set, this notification happened while we were in the foreground.
                // you might want to play a sound to get the user's attention, throw up a dialog, etc.
                if (e.foreground) {
                    OBLog("--INLINE NOTIFICATION--", 5);

                    // on Android soundname is outside the payload.
                    // On Amazon FireOS all custom attributes are contained within payload
                    var soundfile = e.soundname || e.payload.sound;
                    // if the notification contains a soundname, play it.
                    // playing a sound also requires the org.apache.cordova.media plugin
                    //var my_media = new Media("/android_asset/www/"+ soundfile);
                    //my_media.play();
                } else {
	                // otherwise we were launched because the user touched a notification in the notification tray.
                    if (e.coldstart) {
                        OBLog("--COLDSTART NOTIFICATION--", 5);
                    } else {
                        OBLog("--BACKGROUND NOTIFICATION--", 5);
                    }
                }

                OBLog("MESSAGE -> MSG: " + e.payload.message + "\n" +
                       "MESSAGE -> MSGCNT: " + e.payload.msgcnt + "\n" + //android only
                       "MESSAGE -> TIMESTAMP: " + e.payload.timeStamp, //amazon-fireos only
                       5);
                break;

            case 'error':
                OBLog("ERROR -> MSG:" + e.msg, 5);
                break;

            default:
                OBLog("EVENT -> Unknown, an event was received and we do not know what it is", 5);
                break;
        }
    }
};

angular.module('OBPushModule', ['ionic'])
.factory('OBPush', [function() {
    var pushNotificationVar;

    var onDeviceReady = function () {
        // Only for Amazon Fire OS, Android, BlackBerry 10, Windows Phone 8
        // https://cordova.apache.org/docs/en/4.0.0/cordova_events_events.md.html#backbutton
        document.addEventListener("backbutton", function(e) {
            OBLog("backbutton event received", 5);
            navigator.app.backHistory();

            //if( $("#home").length > 0) {
                // call this to get a new token each time. don't call it to reuse existing token.
                //pushNotification.unregister(successHandler, errorHandler);
                //e.preventDefault();
                //navigator.app.exitApp();
            //} else {
                //navigator.app.backHistory();
            //}

            navigator.app.backHistory();
        }, false);

        try {
            pushNotification = window.plugins.pushNotification;
            OBLog("registering " + device.platform, 5);
            if (device.platform == 'android' ||
                device.platform == 'Android' ||
                device.platform == 'amazon-fireos' ) {
                pushNotification.register(successHandler,
                                          errorHandler,
                                          {"senderID" : "661780372179",
                                           "ecb" : "OBPushApp.onNotification"});
            } else {
                pushNotification.register(tokenHandler,
                                          errorHandler,
                                          {"badge" : "true",
                                           "sound" : "true",
                                           "alert" : "true",
                                           "ecb" : "OBPushApp.onNotificationAPN"});
            }
        } catch(err) {
            txt="There was an error on this page.\n\n";
            txt+="Error description: " + err.message + "\n\n";
            OBLog(txt);
        }
    };

    var tokenHandler = function (result) {
        OBLog("APNS token: " + result);

        // Your iOS push server needs to know the token before it can push to this device
        // here is where you might want to send it the token for later use.
    };

    var successHandler = function (result) {
        OBLog("OBPush successHandler", 5);
    };

    var errorHandler = function (error) {
        OBLog("OBPush errorHandler", 5);
    };

    var didRegister = false;
    var register = function() {
        if (didRegister) {
            return;
        }
        ionic.Platform.ready(function(){
            onDeviceReady();
            didRegister = true;
        });
    };

    var unregister = function() {
        ionic.Platform.ready(function(){
            pushNotification.unregister(function(result) {
                                          didRegister = false;
                                        },
                                        function(result) {
                                        });
        });
    };

    var setApplicationIconBadgeNumber = function(num) {
        if (!ionic.Platform.isWebView()) {
            // Do Nothing
        } else if (ionic.Platform.isIOS()) {
            ionic.Platform.ready(function(){
                pushNotification.setApplicationIconBadgeNumber(OBPushApp.successHandler,
                                                               OBPushApp.errorHandler,
                                                               num);
            });
        }
    }

    return {
        register : register,
        unregister : unregister,
        setApplicationIconBadgeNumber : setApplicationIconBadgeNumber
    };
}]);
