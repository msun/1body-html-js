angular.module('starter.services', ["firebase"])
    .factory('User', function($resource, baseUrl){
        return $resource(baseUrl + "user/:id");
    })

//    .factory('Event', function($resource, baseUrl){
//        return $resource(baseUrl + "event/:id");
//    })

    .factory("Firebase", function() {
        var ref = new Firebase('https://amber-heat-8595.firebaseio.com/');

        return ref;
    })

    .factory('$localstorage', ['$window', function($window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                var cache = [];
                $window.localStorage[key] = JSON.stringify(value, function(a, b) {
//                    console.log(a);
                    if(a == "$$conf"){
                        return;
                    }
                    if (typeof b === 'object' && b !== null) {
                        if (cache.indexOf(b) !== -1) {
                            return;
                            // Circular reference found, discard key
                        }
                        // Store value in our collection
                        cache.push(b);
                    }
                    return b;
                });
                cache = null;
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            },
            clear: function(){
                $window.localStorage.clear();
            }
        }
    }])

    .factory("GeoTrainers", function(Firebase) {
        var ref = new GeoFire(Firebase.child("geoTrainers"));
        return ref;
    })

    .factory("GeoEvents", function(Firebase) {
        var ref = new GeoFire(Firebase.child("geoEvents"));
        return ref;
    })

    .factory("GeoEvents", function(Firebase) {
        var ref = new GeoFire(Firebase.child("geoEvents"));
        return ref;
    })

    .factory("GeoRequests", function(Firebase) {
        var ref = new GeoFire(Firebase.child("geoRequests"));
        return ref;
    })

    .factory("Requests", function(Firebase) {
        var ref = Firebase.child("requests");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("IncomingRequests", function(Firebase) {
        var ref = Firebase.child("incomingRequests");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Events", function(Firebase) {
        var ref = Firebase.child("events");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Reviews", function(Firebase) {
        var ref = Firebase.child("reviews");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyReviews", function(Firebase) {
        var ref = Firebase.child("myReviews");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Schedule", function(Firebase) {
        var ref = Firebase.child("schedule");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Sizes", function(Firebase, $firebaseObject) {
        var ref = Firebase.child("sizes");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("GeoClasses", function(Firebase) {
        var ref = new GeoFire(Firebase.child("geoClasses"));
        return ref;
    })

    .factory("Classes", function(Firebase) {
        var ref = Firebase.child("classes");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("GeoGyms", function(Firebase) {
        var ref = new GeoFire(Firebase.child("geoGyms"));
        return ref;
    })

    .factory("Gyms", function(Firebase) {
        var ref = Firebase.child("gyms");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Users", function(Firebase) {
        var ref = Firebase.child("users");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Trainers", function(Firebase) {
        var ref = Firebase.child("trainers");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Images", function(Firebase) {
        var ref = Firebase.child("images");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Following", function(Firebase) {
        var ref = Firebase.child("following");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Followers", function(Firebase) {
        var ref = Firebase.child("followers");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Transactions", function($firebase, Firebase) {
        var ref = Firebase.child("transactions");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyTransactions", function(Firebase) {
        var ref = Firebase.child("userTransactions");

        return {
            ref: function(){
                return ref;
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

    .factory("Review", function($firebase, Firebase, Users, Trainers, appFactory) {
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

    .factory("UserAuth", function($firebaseAuth, Firebase) {
        var loginObj = $firebaseAuth(Firebase);
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

    .factory('appFactory', function($http, baseUrl, User, Event, Gyms, GeoTrainers, Trainers, GeoEvents, Events, GeoGyms, Classes, $firebaseObject, $firebaseArray, $localstorage, Sizes) {
        var factory = {};
        factory.user = {};
        factory.userRef = undefined;
        factory.users = [];
        factory.trainers = {};
        factory.events = {};
        factory.position = null;
        factory.state = "Trainers";
        factory.mysizes = {};

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

        factory.getObjsWithinRadius = function(source, center, radius){
            var sources = {
                trainers : {
                    pinSource : GeoTrainers,
                    firebaseSource : Trainers
                },
                events : {
                    pinSource : GeoEvents,
                    firebaseSource : Events
                },
                classes : {
                    pinSource : GeoGyms,
                    firebaseSource : Gyms
                }
            }

            factory[source] = [];
            var geoQuery = sources[source].pinSource.query({
                center: center,
                radius: radius
            });

            geoQuery.on("key_entered", function(key, location, distance) {
                var obj = $firebaseObject(sources[source].firebaseSource.ref().child(key));
                obj.$loaded().then(function () {
                    obj.distance = distance;
                    obj.location = location;
                    factory[source] = $localstorage.getObject(source);
                    console.log(factory[source]);
                    factory[source][key] = obj;
                    $localstorage.setObject(source, factory[source]);
                    factory.trainers[key] = obj;
                    factory.trainers[key].refreshed = true;
                });
            });

        }

        return factory;
    })



