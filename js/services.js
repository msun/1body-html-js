angular.module('starter.services', ["firebase"])
    .factory('User', function($resource, baseUrl){
        return $resource(baseUrl + "user/:id");
    })

//    .factory('Event', function($resource, baseUrl){
//        return $resource(baseUrl + "event/:id");
//    })

    .factory("FirebaseRef", function() {
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
                if(value == undefined){
                    return;
                }
                var cache = [];
                try {
                    $window.localStorage[key] = JSON.stringify(value, function (a, b) {
//                    console.log(a);
                        if (a == "$$conf") {
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
                } catch (err){
                    console.log(err);
                    window.localStorage.clear();
                }
                cache = null;
            },
            getObject: function(key) {
                console.log($window.localStorage[key]);
                return JSON.parse($window.localStorage[key] || '{}');
            },
            clear: function(){
                window.localStorage.clear();
            }
        }
    }])

    .factory("GeoTrainers", function(FirebaseRef) {
        var ref = new GeoFire(FirebaseRef.child("geoTrainers"));
        return ref;
    })

    .factory("GeoEvents", function(FirebaseRef) {
        var ref = new GeoFire(FirebaseRef.child("geoEvents"));
        return ref;
    })

    .factory("GeoRequests", function(FirebaseRef) {
        var ref = new GeoFire(FirebaseRef.child("geoRequests"));
        return ref;
    })

    .factory("Requests", function(FirebaseRef) {
        var ref = FirebaseRef.child("requests");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("GcmID", function(FirebaseRef) {
        var ref = FirebaseRef.child("gcmID");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Notifications", function(FirebaseRef) {
        var ref = FirebaseRef.child("notifications");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyLocations", function(FirebaseRef) {
        var ref = FirebaseRef.child("userLocations");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyNotifications", function(FirebaseRef) {
        var ref = FirebaseRef.child("userNotifications");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("IncomingRequests", function(FirebaseRef) {
        var ref = FirebaseRef.child("incomingRequests");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Events", function(FirebaseRef) {
        var ref = FirebaseRef.child("events");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("EventComments", function(FirebaseRef) {
        var ref = FirebaseRef.child("eventComments");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("EventGoers", function(FirebaseRef) {
        var ref = FirebaseRef.child("eventGoers");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Conversations", function(FirebaseRef) {
        var ref = FirebaseRef.child("conversations");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Reviews", function(FirebaseRef) {
        var ref = FirebaseRef.child("reviews");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("TransactionQueue", function(FirebaseRef) {
        var ref = FirebaseRef.child("transactionQueue");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyReviews", function(FirebaseRef) {
        var ref = FirebaseRef.child("myReviews");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyTokens", function(FirebaseRef) {
        var ref = FirebaseRef.child("userTokens");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("ImageUrls", function(FirebaseRef) {
        var ref = FirebaseRef.child("imageUrl");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Schedule", function(FirebaseRef) {
        var ref = FirebaseRef.child("schedule");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Sizes", function(FirebaseRef, $firebaseObject) {
        var ref = FirebaseRef.child("sizes");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("GeoClasses", function(FirebaseRef) {
        var ref = new GeoFire(FirebaseRef.child("geoClasses"));
        return ref;
    })

    .factory("Classes", function(FirebaseRef) {
        var ref = FirebaseRef.child("classes");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Invites", function(FirebaseRef) {
        var ref = FirebaseRef.child("invites");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("GeoGyms", function(FirebaseRef) {
        var ref = new GeoFire(FirebaseRef.child("geoGyms"));
        return ref;
    })

    .factory("Gyms", function(FirebaseRef) {
        var ref = FirebaseRef.child("gyms");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Payments", function(FirebaseRef) {
        var ref = FirebaseRef.child("payments");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("ScanQueue", function(FirebaseRef) {
        var ref = FirebaseRef.child("scanQueue");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Users", function(FirebaseRef) {
        var ref = FirebaseRef.child("users");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Trainers", function(FirebaseRef) {
        var ref = FirebaseRef.child("users");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Images", function(FirebaseRef) {
        var ref = FirebaseRef.child("images");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Following", function(FirebaseRef) {
        var ref = FirebaseRef.child("following");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Followers", function(FirebaseRef) {
        var ref = FirebaseRef.child("followers");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Feeds", function(FirebaseRef, appFactory) {
        var ref = FirebaseRef.child("history");
        return {
            ref: function(){
                return ref;
            },
            push: function(type, id, name, inboundMsg, outboundMsg, callback){
                var feed = {};
                feed.created = Firebase.ServerValue.TIMESTAMP;
                feed.type = type;
                feed.id = id;
                feed.message = inboundMsg;

                var feedToHim = {};
                feedToHim.created = Firebase.ServerValue.TIMESTAMP;
                feedToHim.type = "Users";
                feedToHim.id = appFactory.user.$id;
                feedToHim.message = outboundMsg;

                var feedRef = ref.child("Users").child(appFactory.user.$id).push(feed, function(){
                    feedRef.setPriority(feed.created, function(){
                        var trainerFeedRef = ref.child(type).child(id).push(feedToHim,function(){
                            trainerFeedRef.setPriority(feedToHim.created, function(){
                                if(callback){
                                    callback();
                                }
                            });
                        });
                    });
                });
            }
        };
    })

    .factory("Modified", function(FirebaseRef) {
        var ref = FirebaseRef.child("modified");
        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("Transactions", function($firebase, FirebaseRef) {
        var ref = FirebaseRef.child("transactions");

        return {
            ref: function(){
                return ref;
            }
        };
    })

    .factory("MyTransactions", function(FirebaseRef) {
        var ref = FirebaseRef.child("userTransactions");

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

    .factory("Transaction", function($firebase, FirebaseRef, Users, Trainers, Transactions, appFactory) {
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

    .factory("Review", function($firebase, FirebaseRef, Users, Trainers, appFactory) {
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

    .factory("UserAuth", function($firebaseAuth, FirebaseRef) {
        var loginObj = $firebaseAuth(FirebaseRef);
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

    .factory('appFactory', function($http, baseUrl, User, Event, Gyms, GeoTrainers, Trainers, Users, GeoEvents, Events, GeoGyms, Classes, $firebaseObject, $firebaseArray, $localstorage, Sizes, appConfig, $rootScope) {
        var factory = {};
        factory.user = {};
        factory.userRef = undefined;
        factory.users = [];
        factory.trainers = {};
        factory.events = {};
        factory.position = null;
        factory.state = "Users";
        factory.mysizes = {};
        factory.modified = {};
        factory.geoTrainers = [];
        factory.geoGyms = [];
        factory.geoEvents = [];

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
                showPosition();
            }
        }

        factory.getObjsWithinRadius = function(source, center, radius){
            var sources = {
                trainers : {
                    pinSource : GeoTrainers,
                    firebaseSource : Users
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

        };

        factory.updateLocation = function(){
            this.trainerQuery.updateCriteria({
                center: [$rootScope.position[0], $rootScope.position[1]]
            });

            this.eventQuery.updateCriteria({
                center: [$rootScope.position[0], $rootScope.position[1]]
            });

            this.gymQuery.updateCriteria({
                center: [$rootScope.position[0], $rootScope.position[1]]
            });
        };

        factory.loadLocation = function(){
            var user = this.user;

            console.log(user);
            factory.trainerQuery = GeoTrainers.query({
                center: [$rootScope.position[0], $rootScope.position[1]],
                radius: appConfig.radius
            });

            factory.trainerQuery.on("key_entered", function(key, location, distance) {
                var obj = {
                    location: location,
                    distance: GeoFire.distance(location, user.curlocation),
                    key: key,
                    type: "Users"
                };
                factory.geoTrainers.push(obj);
                if($rootScope.header == "Users" && factory.onKeyEnter){
                    factory.onKeyEnter(obj);
                }
                console.log(factory.geoTrainers);
            });

            factory.trainerQuery.on("key_exited", function(key, location, distance) {
                for(var i=0; i<factory.geoTrainers.length; i++){
                    if(factory.geoTrainers[i].key == key){
                        factory.geoTrainers.splice(i, 1);
                        if($rootScope.header == "Users" && factory.onKeyExit){
                            factory.onKeyExit(key);
                        }
                        break;
                    }
                }
                console.log(factory.geoTrainers);
            });

            factory.trainerQuery.on("key_moved", function(key, location, distance) {
                for(var i=0; i<factory.geoTrainers.length; i++){
                    if(factory.geoTrainers[i].key == key){
                        factory.geoTrainers[i].location = location;
                        factory.geoTrainers[i].distance = GeoFire.distance(location, user.curlocation);
                        if($rootScope.header == "Users" && factory.onKeyMove){
                            factory.onKeyMove(factory.geoTrainers[i]);
                        }
                        break;
                    }
                }
                console.log(factory.geoTrainers);
            });


            factory.eventQuery = GeoEvents.query({
                center: [$rootScope.position[0], $rootScope.position[1]],
                radius: appConfig.radius
            });

            factory.eventQuery.on("key_entered", function(key, location, distance) {
                var obj = {
                    location: location,
                    distance: GeoFire.distance(location, user.curlocation),
                    key: key,
                    type: "Events"
                };

                factory.geoEvents.push(obj);
                if($rootScope.header == "Events" && factory.onKeyEnter){
                    factory.onKeyEnter(obj);
                }
            });

            factory.eventQuery.on("key_exited", function(key, location, distance) {
                for(var i=0; i<factory.geoEvents.length; i++){
                    if(factory.geoEvents[i].key == key){
                        factory.geoEvents.splice(i, 1);
                        if($rootScope.header == "Events" && factory.onKeyExit){
                            factory.onKeyExit(key);
                        }
                        break;
                    }
                }
            });

            factory.eventQuery.on("key_moved", function(key, location, distance) {
                for(var i=0; i<factory.geoEvents.length; i++){
                    if(factory.geoEvents[i].key == key){
                        factory.geoEvents[i].location = location;
                        factory.geoEvents[i].distance = GeoFire.distance(location, user.curlocation);
                        if($rootScope.header == "Events" && factory.onKeyMove){
                            factory.onKeyMove(factory.geoEvents[i]);
                        }
                        break;
                    }
                }
            });

            factory.gymQuery = GeoGyms.query({
                center: [$rootScope.position[0], $rootScope.position[1]],
                radius: appConfig.radius
            });

            factory.gymQuery.on("key_entered", function(key, location, distance) {
                var obj = {
                    location: location,
                    distance: GeoFire.distance(location, user.curlocation),
                    key: key,
                    type: "Gyms"
                };
                console.log(obj);
                factory.geoGyms.push(obj);
                if($rootScope.header != "Events" && factory.onGymEnter){
                    factory.onGymEnter(obj);
                }

            });

            factory.gymQuery.on("key_exited", function(key, location, distance) {
                for(var i=0; i<factory.geoGyms.length; i++){
                    if(factory.geoGyms[i].key == key){
                        factory.geoGyms.splice(i, 1);
                        if($rootScope.header != "Events" && factory.onGymExit){
                            factory.onGymExit(key);
                        }
                        break;
                    }
                }
            });

            factory.gymQuery.on("key_moved", function(key, location, distance) {
                for(var i=0; i<factory.geoGyms.length; i++){
                    if(factory.geoGyms[i].key == key){
                        factory.geoGyms[i].location = location;
                        factory.geoGyms[i].distance = GeoFire.distance(location, user.curlocation);
                        if($rootScope.header != "Events" && factory.onGymMove){
                            factory.onGymMove(factory.geoGyms[i]);
                        }
                        break;
                    }
                }
            });
        };

        return factory;
    })



