(function($) {

	"use strict";

	// Setup the calendar with the current date
$(document).ready(function(){
        var date = new Date();
        var today = date.getDate();
        var visibility = getEventVisibility();
        if (visibility === "hidden") {
            $("#dialog").hide();
        }
    // Set click handlers for DOM elements
    $(".right-button").click({date: date}, next_year);
    $(".left-button").click({date: date}, prev_year);
    $(".month").click({date: date}, month_click);
    $("#add-button").click({date: date}, new_event);
    // Set current month as active
    $(".months-row").children().eq(date.getMonth()).addClass("active-month");
    loadEventData(); // Load event data from localStorage
    init_calendar(date);
    var events = check_events(today, date.getMonth()+1, date.getFullYear());
    show_events(events, months[date.getMonth()], today);
});

// Menyimpan data event ke localStorage
function saveEventData() {
    localStorage.setItem("event_data", JSON.stringify(event_data));
}

// Memuat kembali data event dari localStorage
function loadEventData() {
    var eventData = localStorage.getItem("event_data");
    if (eventData) {
        event_data = JSON.parse(eventData);
    }
}

// Initialize the calendar by appending the HTML dates
function init_calendar(date) {
    $(".tbody").empty();
    $(".events-container").empty();
    var calendar_days = $(".tbody");
    var month = date.getMonth();
    var year = date.getFullYear();
    var day_count = days_in_month(month, year);
    var row = $("<tr class='table-row'></tr>");
    var today = date.getDate();
    // Set date to 1 to find the first day of the month
    date.setDate(1);
    var first_day = date.getDay();
    // 35+firstDay is the number of date elements to be added to the dates table
    // 35 is from (7 days in a week) * (up to 5 rows of dates in a month)
    for(var i=0; i<35+first_day; i++) {
        // Since some of the elements will be blank, 
        // need to calculate actual date from index
        var day = i-first_day+1;
        // If it is a sunday, make a new row
        if(i%7===0) {
            calendar_days.append(row);
            row = $("<tr class='table-row'></tr>");
        }
        // if current index isn't a day in this month, make it blank
        if(i < first_day || day > day_count) {
            var curr_date = $("<td class='table-date nil'>"+"</td>");
            row.append(curr_date);
        }   
        else {
            var curr_date = $("<td class='table-date'>"+day+"</td>");
            var events = check_events(day, month+1, year);
            if(today===day && $(".active-date").length===0) {
                curr_date.addClass("active-date");
                show_events(events, months[month], day);
            }
            // If this date has any events, style it with .event-date
            if(events.length!==0) {
                curr_date.addClass("event-date");
            }
            // Set onClick handler for clicking a date
            curr_date.click({events: events, month: months[month], day:day}, date_click);
            row.append(curr_date);
        }
    }
    // Append the last row and set the current year
    calendar_days.append(row);
    $(".year").text(year);
}

// Get the number of days in a given month/year
function days_in_month(month, year) {
    var monthStart = new Date(year, month, 1);
    var monthEnd = new Date(year, month + 1, 1);
    return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);    
}

// Event handler for when a date is clicked
function date_click(event) {
    $(".events-container").show(250);
    $("#dialog").hide(250);
    $(".active-date").removeClass("active-date");
    $(this).addClass("active-date");
    show_events(event.data.events, event.data.month, event.data.day);
    setEventVisibility("visible");
};

// Event handler for when a month is clicked
function month_click(event) {
    $(".events-container").show(250);
    $("#dialog").hide(250);
    var date = event.data.date;
    $(".active-month").removeClass("active-month");
    $(this).addClass("active-month");
    var new_month = $(".month").index(this);
    date.setMonth(new_month);
    init_calendar(date);
}

// Event handler for when the year right-button is clicked
function next_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()+1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    init_calendar(date);
}

// Event handler for when the year left-button is clicked
function prev_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()-1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    init_calendar(date);
}

// Event handler for clicking the new event button
function new_event(event) {
    // if a date isn't selected then do nothing
    if($(".active-date").length===0)
        return;
    // remove red error input on click
    $("input").click(function(){
        $(this).removeClass("error-input");
    })
    // empty inputs and hide events
    $("#dialog input[type=text]").val('');
    $(".events-container").hide(250);
    $("#dialog").show(250);
    // Event handler for cancel button
    $("#cancel-button").click(function() {
        $("#name").removeClass("error-input");
        $("#dialog").hide(250);
        $(".events-container").show(250);
        setEventVisibility("hidden");
    });
    // Event handler for ok button
    $("#ok-button").unbind().click({date: event.data.date}, function() {
        var date = event.data.date;
        var name = $("#name").val().trim();
        var day = parseInt($(".active-date").html());
        // Basic form validation
        if(name.length === 0) {
            $("#name").addClass("error-input");
        }
        else {
            $("#dialog").hide(250);
            console.log("new event");
            new_event_json(name, date, day);
            setEventVisibility("visible");
            date.setDate(day);
            init_calendar(date);
        }
    });
}

function setEventVisibility(status) {
    localStorage.setItem("eventVisibility", status);
}

// Get the event visibility status from local storage
function getEventVisibility() {
    return localStorage.getItem("eventVisibility") || "visible";
}

// Event handler for clicking the edit button
function edit_event(event) {
    var name = $(this).siblings('.event-name').text().trim();
    $("#name").val(name);
    $("#dialog").show(250);

    $("#cancel-button").click(function() {
        $("#name").removeClass("error-input");
        $("#dialog").hide(250);
        $(".events-container").show(250);
        setEventVisibility("hidden");
    });

    $("#ok-button").unbind().click({date: event.data.date}, function() {
        var date = event.data.date;
        var day = parseInt($(".active-date").html());
        var newName = $("#name").val().trim();
        // Basic form validation
        if(newName.length === 0) {
            $("#name").addClass("error-input");
        }
        else {
            $("#dialog").hide(250);
            edit_event_json(name, newName, date, day);
            setEventVisibility("visible");
            date.setDate(day);
            init_calendar(date);
        }
    });
}

// Adds a json event to event_data
function new_event_json(name, date, day) {
    var event = {
        "occasion": name,
        "year": date.getFullYear(),
        "month": date.getMonth()+1,
        "day": day
    };
    event_data["events"].push(event);
    saveEventData(); // Save event data to localStorage
}

// Edits a json event in event_data
function edit_event_json(oldName, newName, date, day) {
    for (var i = 0; i < event_data["events"].length; i++) {
        var event = event_data["events"][i];
        if (event["occasion"] === oldName && event["day"] === day && event["month"] === date.getMonth() + 1 && event["year"] === date.getFullYear()) {
            event["occasion"] = newName;
            break;
        }
    }
    saveEventData(); // Save event data to localStorage
}

// Event handler for clicking the delete button
function delete_event(event) {
    var name = $(this).siblings('.event-name').text().trim();
    var date = event.data.date;
    var day = parseInt($(".active-date").html());
    for (var i = 0; i < event_data["events"].length; i++) {
        var event = event_data["events"][i];
        if (event["occasion"] === name && event["day"] === day && event["month"] === date.getMonth() + 1 && event["year"] === date.getFullYear()) {
            event_data["events"].splice(i, 1);
            break;
        }
    }
    saveEventData(); // Save event data to localStorage
    date.setDate(day);
    init_calendar(date);
}

// Display all events of the selected date in card views
function show_events(events, month, day) {
    // Clear the dates container
    $(".events-container").empty();
    $(".events-container").show(250);
    console.log(event_data["events"]);
    // If there are no events for this date, notify the user
    if(events.length===0) {
        var event_card = $("<div class='event-card'></div>");
        var event_name = $("<div class='event-name'>There are no events planned for <b style='color: #2846A7;'>"+month+" "+day+".</b></div>");
        $(event_card).css({ "border-left": "10px solid #FF1744" });
        $(event_card).append(event_name);
        $(".events-container").append(event_card);
    }
    else {
        // Go through and add each event as a card to the events container
        for(var i=0; i<events.length; i++) {
            var event_card = $("<div class='event-card'></div>");
            var event_name = $("<div class='event-name'><b style='color: #2846A7; text-transform: uppercase;'>"+events[i]["occasion"]+"</b></div>"); // Remove "invited_count" from here
            if(events[i]["cancelled"]===true) {
                $(event_card).css({
                    "border-left": "10px solid #FF1744"
                });
                event_name = $("<div class='event-cancelled'>"+events[i]["occasion"]+"</div>"); // Remove "invited_count" from here
            }
            $(event_card).append(event_name);
            $(".events-container").append(event_card);
        }
    }
    if (events.length !== 0) {
        $(".event-card").each(function() {
            var editButton = $("<span class='edit-button'>✎</span>");
            var deleteButton = $("<span class='delete-button'>×</span>");
            $(this).append(editButton).append(deleteButton);
        });

        // Event handler for clicking the edit button
        $(".edit-button").click({date: new Date()}, edit_event);

        // Event handler for clicking the delete button
        $(".delete-button").click({date: new Date()}, delete_event);
    } else {
        $(".edit-button").remove();
        $(".delete-button").remove();
    }
}

// Checks if a specific date has any events
function check_events(day, month, year) {
    var events = [];
    for(var i=0; i<event_data["events"].length; i++) {
        var event = event_data["events"][i];
        if(event["day"]===day &&
            event["month"]===month &&
            event["year"]===year) {
                events.push(event);
            }
    }
    return events;
}

// Given data for events in JSON format
var event_data = {
    "events": [
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
        {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10,
        "cancelled": true
    },
    {
        "occasion": " Repeated Test Event ",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 10
    },
    {
        "occasion": " Test Event",
        "invited_count": 120,
        "year": 2020,
        "month": 5,
        "day": 11
    }
    ]
};

const months = [ 
    "January", 
    "February", 
    "March", 
    "April", 
    "May", 
    "June", 
    "July", 
    "August", 
    "September", 
    "October", 
    "November", 
    "December" 
];

})(jQuery);
