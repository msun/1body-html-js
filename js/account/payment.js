var payment = angular.module('paymentModule', ['angularPayments']);

payment.controller('PaymentController', function($scope){
    Stripe.setPublishableKey('pk_test_DBhUBAORKHi5IqZLUlMUex0Y')

    $scope.handleStripe = function(status, response){
        if(response.error) {
            // there was an error. Fix it.
            console.log(response.error);
        } else {
            // got stripe token, now charge it or smt
//            token = response.id;
            console.log(response.id);
        }
    }
});