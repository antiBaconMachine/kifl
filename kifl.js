if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault("counter", 0);

//    Template.hello.helpers({
//        counter: function () {
//            return Session.get("counter");
//        }
//    });
//
//    Template.hello.events({
//        'click button': function () {
//            // increment the counter when button is clicked
//            Session.set("counter", Session.get("counter") + 1);
//        }
//    });

    Template.column.helpers({
        cards: function() {
            return [{
                title: 'dummy'
            }]
        }
    });

    var filterEvent = function(selector, callback) {
        return function(e) {
            if (e.target.matches(selector)) {
                callback(e);
                e.stopPropagation();
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        var grid = document.querySelector('.grid');
        grid.addEventListener('dragstart', filterEvent('.card', function(e) {
            e.target.style.opacity = '0.4';
        }), false);
        grid.addEventListener('dragend', filterEvent('.card', function(e) {
            e.target.style.opacity = '1';
        }), false);
    });
}


if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
