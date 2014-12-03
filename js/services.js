angular.module('starter.services', ["firebase"])
    .factory('User', function($resource, baseUrl){
        return $resource(baseUrl + "user/:id");
    })

//    .factory('Event', function($resource, baseUrl){
//        return $resource(baseUrl + "event/:id");
//    })

    .factory("Firebase", function($firebase) {
        var ref = new Firebase('https://amber-heat-8595.firebaseio.com/');
//        var sync = $firebase(ref);

        return ref;
    })

    .factory("GeoTrainers", function($firebase, Firebase) {
        var ref = new GeoFire(Firebase.child("geoTrainers"));
        return ref;
    })

    .factory("GeoEvents", function($firebase, Firebase) {
        var ref = new GeoFire(Firebase.child("geoEvents"));
        return ref;
    })

    .factory("Events", function($firebase, Firebase) {
        var ref = Firebase.child("events");
        var sync = $firebase(ref);

        var list = sync.$asArray();
        var obj = sync.$asObject();

        return {
            ref: function(){
                return ref;
            },
            sync: function(){
                return sync;
            },
            list: function(){
                return list;
            },
            obj: function(){
                return obj;
            }
        };
    })

    .factory("GeoClasses", function($firebase, Firebase) {
        var ref = new GeoFire(Firebase.child("geoClasses"));
        return ref;
    })

    .factory("Classes", function($firebase, Firebase) {
        var ref = Firebase.child("classes");
        var sync = $firebase(ref);

        var list = sync.$asArray();
        var obj = sync.$asObject();

        return {
            ref: function(){
                return ref;
            },
            sync: function(){
                return sync;
            },
            list: function(){
                return list;
            },
            obj: function(){
                return obj;
            }
        };
    })

    .factory("Users", function($firebase, Firebase) {
        var ref = Firebase.child("users");
        var sync = $firebase(ref);
        var list = sync.$asArray();
        var obj = sync.$asObject();

        return {
            ref: function(){
                return ref;
            },
            sync: function(){
                return sync;
            },
            list: function(){
                return list;
            },
            obj: function(){
                return obj;
            }
        };
    })

    .factory("Trainers", function($firebase, Firebase) {
        var ref = Firebase.child("trainers");
        var sync = $firebase(ref);
        var list = sync.$asArray();
        var obj = sync.$asObject();

        return {
            ref: function(){
                return ref;
            },
            sync: function(){
                return sync;
            },
            list: function(){
                return list;
            },
            obj: function(){
                return obj;
            }
        };
    })

    .factory("Transactions", function($firebase, Firebase) {
        var ref = Firebase.child("transactions");
        var sync = $firebase(ref);
        var list = sync.$asArray();
        var obj = sync.$asObject();

        return {
            ref: function(){
                return ref;
            },
            sync: function(){
                return sync;
            },
            list: function(){
                return list;
            },
            obj: function(){
                return obj;
            }
        };
    })

    .factory("Categories", function(){
        return [
            {name: "Winter", type: "sports"},
            {name: "Workout", type: "sports"},
            {name: "Cycling", type: "sports"},
            {name: "In-door", type: "sports"},
            {name: "Out-door", type: "sports"},
            {name: "Water", type: "sports"},
            {name: "Others", type: "others"}
        ]
    })

    .factory("RepeatIntervals", function(){
        return [
            {interval: "Daily"},
            {interval: "Weekly"},
            {interval: "Monthly"},
            {interval: "Once"}
        ]
    })

    .factory("Transaction", function($firebase, Firebase, Users, Trainers, Transactions, appFactory) {
        var transaction = function() {
            if(arguments.length == 0){
                this.user = appFactory.user.username;
                this.userID = appFactory.user.$id;
            } else if(arguments.length == 1){
                console.log(arguments[0].user);
                if(arguments[0].user){
                    this.$id = arguments[0].$id;
                    this.user = arguments[0].user;
                    this.userID = arguments[0].userID;
                    this.trainer = arguments[0].trainer;
                    this.trainerID = arguments[0].trainerID;
                    this.creation = arguments[0].creation;
                    this.schedule = arguments[0].schedule;
                    this.amount = arguments[0].amount;
                    this.scanned = arguments[0].scanned;
                    this.duration = arguments[0].duration;
                    this.leftreview = arguments[0].leftreview;
                    console.log(this);
                } else {
                    var self = this;
                    this.$id = arguments[0];
                    this.user = appFactory.user.username;
                    this.userID = appFactory.user.$id;
                    console.log(this);
                    var ts = this.getTransactionObj();
                    console.log(ts);
                    ts.$loaded(function(){
                        self.trainer = ts.trainer;
                        self.trainerID = ts.trainerID;
                        self.creation = ts.creation;
                        self.schedule = ts.schedule;
                        self.amount = ts.amount;
                        self.scanned = ts.scanned;
                        self.duration = ts.duration;
                        self.leftreview = ts.leftreview;
                        console.log(this);
                    })
                }
            } else {
                this.user = arguments[0].username;
                this.userID = arguments[0].$id;
                this.trainer = arguments[1].username;
                this.trainerID = arguments[1].$id;
                this.creation = Date.now();
                this.amount = arguments[2];
                this.duration = arguments[3];
                this.schedule = arguments[4];
                this.scanned = false;
                this.leftreview = false;
            }
        };

        transaction.prototype.getTransactionObj = function(){
            return $firebase(Transactions.ref().child(this.$id)).$asObject();
        };

        transaction.prototype.getUserTransactionObj = function(){

            var name = this.userID;
            console.log(appFactory.userRef);
            console.log($firebase(appFactory.userRef.child(this.userID)).$asObject());

            return $firebase(appFactory.userRef.child(this.userID).child("transactions").child(this.$id)).$asObject();
        };

        transaction.prototype.getTrainerTransactionObj = function(){
            console.log(this);
            return $firebase(Trainers.ref().child(this.trainerID).child("transactions").child(this.$id)).$asObject();
        };

        transaction.prototype.getTrainerTransactions = function(){
            return $firebase(Trainers.ref().child(this.trainerID).child("transactions")).$asObject();
        };

        transaction.prototype.getUserTransactions = function(){
            return $firebase(appFactory.userRef.child(this.userID).child("transactions")).$asObject();
        };

        transaction.prototype.add = function(callback){
            var self = this;
            console.log(self);
            Transactions.sync().$push(self).then(function(ref){
                var tsct = $firebase(ref).$asObject();
                tsct.$loaded(function(){
                    var trainerTscts = self.getTrainerTransactions();
                    trainerTscts.$loaded(function(){
                        trainerTscts[tsct.$id] = self;
                        console.log(trainerTscts);
                        trainerTscts.$save();
                    });
                    var userTscts = self.getUserTransactions();
                    userTscts.$loaded(function(){
                        userTscts[tsct.$id] = self;
                        userTscts.$save();
                    });
                });
            });
            if(callback){
                callback();
            }
        };

        transaction.prototype.disableReview = function(){
            var tran = this.getTransactionObj();
            var userTsct = this.getUserTransactionObj();
            var trainerTsct = this.getTrainerTransactionObj();

            tran.$loaded(function(){
                tran.leftreview = true;
                tran.$save();
            });
            userTsct.$loaded(function(){
                userTsct.leftreview = true;
                userTsct.$save();
            });
            trainerTsct.$loaded(function() {
                trainerTsct.leftreview = true;
                trainerTsct.$save();
            });
        };

        transaction.prototype.scan = function(){
            console.log(this);
            var tran = this.getTransactionObj()
            var userTsct = this.getUserTransactionObj();
            var trainerTsct = this.getTrainerTransactionObj();

            tran.$loaded(function(){
                tran.scanned = true;
                tran.$save();
            });
            userTsct.$loaded(function(){
                userTsct.scanned = true;
                userTsct.$save();
            });
            trainerTsct.$loaded(function() {
                trainerTsct.scanned = true;
                trainerTsct.$save();
            });
        };

        return transaction;
    })

    .factory("Review", function($firebase, Firebase, Users, Trainers, Transactions, appFactory) {
        var review = function() {
            if(arguments.length == 0){

            } else if(arguments.length == 1){
                this.$id = arguments[0].$id;
                this.user = arguments[0].user;
                this.userID = arguments[0].userID;
                this.trainer = arguments[0].trainer;
                this.trainerID = arguments[0].trainerID;
                this.creation = arguments[0].creation;
                this.text = arguments[0].text;
                this.transactionID = arguments[0].transactionID;
            } else {
                this.user = arguments[0].username;
                this.userID = arguments[0].$id;
                this.trainer = arguments[1].username;
                this.trainerID = arguments[1].$id;
                this.creation = Date.now();
                this.text = arguments[2];
                this.transactionID = arguments[3];
            }
        };

        review.prototype.getReviewObj = function(){
            return $firebase(Trainers.ref().child(this.trainerID).child("reviews"));
        };

        review.prototype.getUserReviewObj = function(){
            return $firebase(appFactory.userRef.child(this.userID).child("reviews").child(this.$id)).$asObject();
        };

        review.prototype.getTrainerReviewObj = function(id){
            return $firebase(Trainers.ref().child(this.trainerID).child("reviews").child(this.$id)).$asObject();
        };

        review.prototype.getTrainerReviews = function(id){
            return $firebase(Trainers.ref().child(this.trainerID).child("reviews")).$asObject();
        };

        review.prototype.getUserReviews = function(id){
            return $firebase(appFactory.userRef.child(this.userID).child("reviews")).$asObject();
        };

        review.prototype.add = function(){
            var self = this;
            console.log(self);
            this.getReviewObj().$push(self).then(function(ref){
                var _review = $firebase(ref).$asObject();
                _review.$loaded(function(){
//                    var uReviews = self.getUserReviews();
//                    uReviews[_review.$id] = self;
//                    uReviews.$save();
                })
            });
        };

        return review;
    })

    .factory("UserAuth", function($firebaseSimpleLogin, Firebase) {
        var loginObj = $firebaseSimpleLogin(Firebase);
        return loginObj;
    })

    .factory('Event', function() {
        var Event = function(name) {
            this.name = name;
        };

        Event.prototype.getName = function() {
            console.log(this.name);
        };
        return Event;
    })

    .factory('appFactory', function($http, baseUrl, User, Event) {
        var factory = {};
        factory.user = {};
        factory.userRef = {};
        factory.users = [];
        factory.trainers = [];
        factory.events = [];
        factory.position = null;
        factory.state = "Trainers";

        factory.getDistance = function(lat1,lon1,lat2,lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2-lat1);  // deg2rad below
            var dLon = deg2rad(lon2-lon1);
            var a =
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                    Math.sin(dLon/2) * Math.sin(dLon/2)
                ;
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c; // Distance in km
            return d;
        }

        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }

        factory.init = function() {
            if(!factory.user.username){
                window.location.href = baseUrl;
                return;
            }

            if(!factory.position) {
                factory.getLocation(function (position) {
                    factory.position = position;
                    console.log(factory.position);
                    return position;
                });
            } else {
                return factory.position;
            }
        };

        factory.getLocation = function(showPosition) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition);
            } else {
                $scope.support = "Geolocation is not supported by this browser.";
                showPosition();
            }
        }
        return factory;
    })



