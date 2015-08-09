
var Calendar = React.createClass({displayName: "Calendar",
    propTypes : {
        selected: React.PropTypes.object.isRequired,
        slotsopen: React.PropTypes.array,
        rulesopen: React.PropTypes.array,
        slotsbooked: React.PropTypes.array,
        type: React.PropTypes.oneOf(['my-schedule', 'trainer-schedule']),
        goto: React.PropTypes.func,
        previous: React.PropTypes.func,
        next: React.PropTypes.func
    },
    getInitialState: function() {
        console.log(this.props);
        return {
            month: this.props.selected.clone()
        };
    },

    previous: function() {
        var month = this.state.month;
        if(this.props.selected.month() < month.month()){
            month.add(-1, "M");
            this.setState({ month: month });
            this.props.previous(month.month());
        }
    },

    next: function() {
        var month = this.state.month;
        month.add(1, "M");
        this.setState({ month: month });
        this.props.next(month.month());
    },

    select: function(day) {
        this.props.selected = day.date;
        this.forceUpdate();

    },

    render: function() {
        console.log(this.props);
        return React.createElement("div", null,
            React.createElement("div", {className: "header"},
                React.createElement("i", {className: "fa fa-angle-left", onClick: this.previous}),
                this.renderMonthLabel(),
                React.createElement("i", {className: "fa fa-angle-right", onClick: this.next})
            ),
            React.createElement(DayNames, null),
            this.renderWeeks()
        );
    },

    renderWeeks: function() {
        var weeks = [],
            done = false,
            date = this.state.month.clone().startOf("month").add("w" -1).day("Sunday"),
            monthIndex = date.month(),
            count = 0;

        console.log(this.props);
        while (!done) {
            weeks.push(React.createElement(Week, {rulesopen: this.props.rulesopen, slotsbooked: this.props.slotsbooked, type: this.props.type, next: this.next, previous: this.previous, slotsopen: this.props.slotsopen, goto: this.props.goto, key: date.toString(), date: date.clone(), month: this.state.month, select: this.select, selected: this.props.selected}));
            date.add(1, "w");
            done = count++ > 2 && monthIndex !== date.month();
            monthIndex = date.month();
        }

        return weeks;
    },

    renderMonthLabel: function() {
        return React.createElement("span", null, this.state.month.format("MMMM, YYYY"));
    }
});

var DayNames = React.createClass({displayName: "DayNames",
    render: function() {
        return React.createElement("div", {className: "week names"},
            React.createElement("span", {className: "day"}, "Sun"),
            React.createElement("span", {className: "day"}, "Mon"),
            React.createElement("span", {className: "day"}, "Tue"),
            React.createElement("span", {className: "day"}, "Wed"),
            React.createElement("span", {className: "day"}, "Thu"),
            React.createElement("span", {className: "day"}, "Fri"),
            React.createElement("span", {className: "day"}, "Sat")
        );
    }
});

var Week = React.createClass({displayName: "Week",
    goto: function(day){
        console.log(this);
        this.props.goto(day);
    },
    change: function(day){
        if(day.date < this.props.month){
            this.props.previous();
        } else if(day.date > this.props.month){
            this.props.next();
        }
    },
    render: function() {
        var days = [],
            date = this.props.date,
            month = this.props.month;

        for (var i = 0; i < 7; i++) {
            var day = {
                name: date.format("dd").substring(0, 1),
                number: date.date(),
                isCurrentMonth: date.month() === month.month(),
                isToday: date.isSame(new Date(), "day"),
                beforeToday: date < new Date(),
                date: date
            };
            if(this.props.slotsopen[day.date.month()][day.number]){
                day.slotsopen = this.props.slotsopen[day.date.month()][day.number];
            } else {
                day.slotsopen = this.props.rulesopen[day.date.month()][day.number];
            }
            var goto = this.goto.bind(this, day);
            var change = this.change.bind(this, day);
            if(!day.isCurrentMonth){
                days.push(React.createElement("span", {key: day.date.toString(), className: "day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : ""), onClick: change}, day.number, React.createElement("br", null), "-"));
            } else {
                if(this.props.type == "my-schedule"){
                    days.push(React.createElement("span", {key: day.date.toString(), className: "day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : ""), onClick: goto}, day.number, React.createElement("br", null), this.props.slotsbooked[day.date.month()][day.number], "|", day.slotsopen, " "));
                } else {
                    days.push(React.createElement("span", {key: day.date.toString(), className: "day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : ""), onClick: goto}, day.number, React.createElement("br", null), day.slotsopen, " "));
                }
            }

            date = date.clone();
            date.add(1, "d");

        }

        return React.createElement("div", {className: "week", key: days[0].toString()},
            days
        );
    }
});

//React.render(<Calendar selected={moment().startOf("day")} />, document.getElementById("calendar"));
		