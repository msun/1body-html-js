var userModule = angular.module('userModule', ['ionic', 'accountModule', 'mapModule', 'starter', 'timeAndDate']);

userModule.factory('userModuleFactory', function(appFactory){

});

userModule.controller("UserDetailCtrl", function($scope, Following, appFactory, $stateParams, Sizes, MyTransactions, $firebaseArray, $firebaseObject, Users, Followers, Feeds, Notifications, appConfig){
    console.log($stateParams.userID);
    $scope.reviewRating = 0;
    $scope.numOfFollowers = 0;
    $scope.numOfFollowings = 0;

    $scope.selectedUser = $firebaseObject(Users.ref().child($stateParams.userID));

    $scope.feeds = $firebaseArray(Feeds.ref().child("Users").child($stateParams.userID).orderByPriority().endAt(Date.now()).limitToLast(appConfig.defaultItemsPerPage));

    $scope.sizes = $firebaseObject(Sizes.ref().child($stateParams.userID));

    $scope.followerMe = $firebaseObject(Followers.ref().child($stateParams.userID).child(appFactory.user.$id));

    $scope.moreFeeds = function(){
        $scope.feeds = $firebaseArray(Feeds.ref().child("Users").child($stateParams.userID).orderByPriority().endAt($scope.feeds[0].$priority).limitToLast(appConfig.defaultItemsPerPage));
    };

    $scope.follow = function(){
        console.log(appFactory.user);
        $scope.followerMe.username = appFactory.user.username;
        $scope.userID = $stateParams.userID;
        if(appFactory.user.info){
            $scope.followerMe.info = appFactory.user.info;
        }
        $scope.followerMe.$save().then(function(){
            if($scope.sizes.numOfFollowers){
                $scope.sizes.numOfFollowers++;
            } else {
                $scope.sizes.numOfFollowers = 1;
            }
            $scope.sizes.$save();
        });

        var following = $firebaseObject(Following.ref().child(appFactory.user.$id).child($stateParams.userID));
        following.$loaded(function() {
            following.username = $scope.selectedUser.username;
            following.modified = Firebase.ServerValue.TIMESTAMP;
            following.$priority = following.modified;
            if($scope.selectedUser.info){
                following.info = $scope.selectedUser.info;
            }
            following.userID = $stateParams.userID;
            console.log(following);
            following.$save().then(function(){
                if(appFactory.mysizes.numOfFollowing){
                    appFactory.mysizes.numOfFollowing++;
                } else {
                    appFactory.mysizes.numOfFollowing = 1;
                }
                appFactory.mysizes.$save();

                var notif = {
                    creatorID: appFactory.user.$id,
                    starttime: Firebase.ServerValue.TIMESTAMP,
                    url: "#/menu/Users/" + appFactory.user.$id,
                    receivers: [$scope.selectedUser.$id],
                    message: appFactory.user.username + " is following you."
                };
                Notifications.ref().push(notif);

                Feeds.push("Users",
                    $scope.selectedUser.$id,
                    $scope.selectedUser.username,
                    "You followed " + $scope.selectedUser.username,
                    appFactory.user.username + " followed you"
                );

                alert("Following user: " + $scope.selectedTrainer.username);
            });
        });
    };

    $scope.unfollow = function(){
        console.log(appFactory.user);
        $scope.followerMe.$remove().then(function(){
            if($scope.sizes.numOfFollowers){
                $scope.sizes.numOfFollowers--;
            } else {
                $scope.sizes.numOfFollowers = 0;
            }
            $scope.sizes.$save();
        });

        var following = $firebaseObject(Following.ref().child(appFactory.user.$id).child($stateParams.userID));
        following.$remove.then(function() {
            if(appFactory.mysizes.numOfFollowing){
                appFactory.mysizes.numOfFollowing--;
            } else {
                appFactory.mysizes.numOfFollowing = 0;
            }
            appFactory.mysizes.$save().then(function(){
                var notif = {
                    creatorID: appFactory.user.$id,
                    starttime: Firebase.ServerValue.TIMESTAMP,
                    url: "#/menu/Users/" + appFactory.user.$id,
                    receivers: [$scope.selectedUser.$id],
                    message: appFactory.user.username + " has stopped following you."
                };
                Notifications.ref().push(notif);

                Feeds.push("Users",
                    $scope.selectedUser.$id,
                    $scope.selectedUser.username,
                    "You unfollowed " + $scope.selectedUser.username,
                    appFactory.user.username + " followed you"
                );

                alert("unfollowed " + $scope.selectedUser.username);
            });

        });
    };
});

userModule.controller("ImagesCtrl", function($scope, $ionicModal, Following, appFactory, $stateParams, Sizes, MyTransactions, $firebaseArray, $firebaseObject, Users, Images, ImageUrls, $window, appConfig){
    console.log($stateParams.id);
    console.log($stateParams.type);
    $scope.id = $stateParams.id;
    $scope.userID = $stateParams.userID;
    $scope.myID = appFactory.user.$id;
    $scope.type = $stateParams.type;
    $scope.edit = false;

    $ionicModal.fromTemplateUrl('js/user/templates/image.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal){
        $scope.modal = modal;
    });


    $scope.images = $firebaseArray(ImageUrls.ref().child($stateParams.type).child($stateParams.id).orderByPriority().endAt(Date.now()).limitToLast(9));

    $scope.moreImages = function(){
        $scope.images = $firebaseArray(ImageUrls.ref().child($stateParams.type).child($stateParams.id).orderByPriority().endAt($scope.images[0].$priority).limitToLast(9));
    };

    $scope.delete = function(item){
        $scope.images.$remove(item);
    }

    $scope.edit = function(item){
        item.edit = item.message;
        item.toggle = true;
    }

    $scope.save = function(item){
        console.log(item);
        $scope.images.$save(item);
    }

    $scope.cancel = function(item){
        console.log(item);
        item.toggle = false;
    }

    $scope.back = function(){
        $window.history.back();
    }

    $scope.opendImageModal = function(item){
        $scope.image = item;
        $scope.modal.show();
    }

    $scope.closeImageModal = function(){
        $scope.modal.hide();
    }

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

});
