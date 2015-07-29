
function OBLog(msg) {
    msg = typeof msg !== 'undefined' ? msg : '';

    var priority, alertType;
    priority = (arguments.length >= 2) ? arguments[1] : 1; // Lower number is higher priority
    alertType = (arguments.length >= 3) ? arguments[2]: 3;

    var priorityLimit = 1;
    if (priority > priorityLimit) {
        return;
    }

    if (alertType == 0) {
        // Do nothing
    } else if (alertType == 1) {
        console.log(msg);
    } else if (alertType == 2) {
        alert(msg);
    } else if (alertType == 3) {
        console.log(msg);
        alert(msg);
    }
};
