var userModule = angular.module('userModule', ['ionic', 'accountModule', 'mapModule', 'starter', 'timeAndDate']);

userModule.factory('userModuleFactory', function(appFactory){

});

userModule.controller("UserDetailCtrl", function($scope, Following, appFactory, $stateParams, Sizes, MyTransactions, $firebaseArray, $firebaseObject, Users, Followers){
    console.log($stateParams.userID);
    $scope.reviewRating = 0;
    $scope.numOfFollowers = 0;
    $scope.numOfFollowings = 0;

    $scope.selectedUser = $firebaseObject(Users.ref().child($stateParams.userID));

    $scope.transactions = $firebaseArray(Feeds.ref().child($stateParams.userID));

    $scope.sizes = $firebaseObject(Sizes.ref().child($scope.selectedTrainer.$id));

    $scope.followerMe = $firebaseObject(Followers.ref().child($scope.selectedTrainer.$id).child(appFactory.user.$id));

    $scope.moreActivities = function(){

    };

    $scope.follow = function(){
        console.log(appFactory.user);
        $scope.followerMe.username = appFactory.user.username;
        if(appFactory.user.profilepic){
            $scope.followerMe.profilepic = appFactory.user.profilepic;
        }
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

        var following = $firebaseObject(Following.ref().child(appFactory.user.$id).child($scope.selectedTrainer.$id));
        following.$loaded(function() {
            following.username = $scope.selectedTrainer.username;
            console.log($scope.selectedTrainer.profilepic);
            if($scope.selectedTrainer.profilepic){
                following.profilepic = $scope.selectedTrainer.profilepic;
            }
            if($scope.selectedTrainer.info){
                following.info = $scope.selectedTrainer.info;
            }
            console.log(following);
            following.$save().then(function(){
                if(appFactory.mysizes.numOfFollowing){
                    appFactory.mysizes.numOfFollowing++;
                } else {
                    appFactory.mysizes.numOfFollowing = 1;
                }
                appFactory.mysizes.$save();

                alert("Following user: " + $scope.selectedTrainer.username);
            });
        });
    };
});
