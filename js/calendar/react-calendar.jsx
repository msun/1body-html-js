
var Calendar = React.createClass({
    propTypes : {
        selected: React.PropTypes.object.isRequired,
        slotsopen: React.PropTypes.array.isRequired,
        slotsbooked: React.PropTypes.array.isRequired,
        type: React.PropTypes.oneOf(['my-schedule', 'trainer-schedule']),
        goto: React.PropTypes.func,
        previous: React.PropTypes.func,
        next: React.PropTypes.func
    },
    getInitialState: function() {
        console.log(this.props.selected);
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
        return <div>
            <div className="header">
                <i className="fa fa-angle-left" onClick={this.previous}></i>
							{this.renderMonthLabel()}
                <i className="fa fa-angle-right" onClick={this.next}></i>
            </div>
            <DayNames />
            {this.renderWeeks()}
        </div>;
    },

    renderWeeks: function() {
        var weeks = [],
            done = false,
            date = this.state.month.clone().startOf("month").add("w" -1).day("Sunday"),
            monthIndex = date.month(),
            count = 0;


        while (!done) {
            weeks.push(<Week slotsbooked={this.props.slotsbooked} type={this.props.type} next={this.next} previous={this.previous} slotsopen={this.props.slotsopen} goto={this.props.goto} key={date.toString()} date={date.clone()} month={this.state.month} select={this.select} selected={this.props.selected} />);
            date.add(1, "w");
            done = count++ > 2 && monthIndex !== date.month();
            monthIndex = date.month();
        }

        return weeks;
    },

    renderMonthLabel: function() {
        return <span>{this.state.month.format("MMMM, YYYY")}</span>;
    }
});

var DayNames = React.createClass({
    render: function() {
        return <div className="week names">
            <span className="day">Sun</span>
            <span className="day">Mon</span>
            <span className="day">Tue</span>
            <span className="day">Wed</span>
            <span className="day">Thu</span>
            <span className="day">Fri</span>
            <span className="day">Sat</span>
        </div>;
    }
});

var Week = React.createClass({
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
//        console.log(this.props);
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
            var goto = this.goto.bind(this, day);
            var change = this.change.bind(this, day);
            if(!day.isCurrentMonth){
                days.push(<span key={day.date.toString()} className={"day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : "")} onClick={change}>{day.number}<br/>-</span>);
            } else {
                console.log(this.props.type);
                if(this.props.type == "my-schedule"){
                    days.push(<span key={day.date.toString()} className={"day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : "")} onClick={goto}>{day.number}<br/>{this.props.slotsbooked[day.date.month()][day.number]}|{this.props.slotsopen[day.date.month()][day.number]} </span>);
                } else {
                    days.push(<span key={day.date.toString()} className={"day" + (day.isToday ? " today" : "") + (day.isCurrentMonth ? "" : " different-month") + (day.date.isSame(this.props.selected) ? " selected" : "")} onClick={goto}>{day.number}<br/>{this.props.slotsopen[day.date.month()][day.number]} </span>);
                }
            }

            date = date.clone();
            date.add(1, "d");

        }

        return <div className="week" key={days[0].toString()}>
						{days}
        </div>;
    }
});

//React.render(<Calendar selected={moment().startOf("day")} />, document.getElementById("calendar"));
		