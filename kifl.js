if (Meteor.isClient) {

    Meteor.subscribe("cards");

    Template.column.helpers({
        cell: function(options) {
            var cell = Cells.find({name: this.name});
            //console.log(options, options.hash.name, cell.fetch());
            return cell;
        },
        card: function(id) {
            return Cards.find({_id: id});
        },
        cards: function (col) {
//            return "123".split('').map(function (i) {
//                var id = Math.ceil(Math.random() * 10000000);
//                return {
//                    title: i + ' dummy ' + id,
//                    id: id,
//                    color: '#' + Math.floor(Math.random() * 16777215).toString(16)
//                };
//            });

            //OMG. Better join and sort pls
            //http://stackoverflow.com/questions/20375111/mongo-sort-documents-by-array-of-ids
            //https://www.discovermeteor.com/blog/reactive-joins-in-meteor/
            //https://jira.mongodb.org/browse/SERVER-7528
            return Cards.find({"_id" : {
                $in: (function() {
                    var arr = Cells.find({name: col}).fetch();
                    return arr.length ? arr[0]["cards"]: [];
                }())
            }});

        }
    });



    Template.column.events({
        'click .createCard': function (event, template) {
//            if (! Meteor.userId()) // must be logged in to create events
//                return;
            openCreateDialog();
            event.preventDefault();
            return false;
        }
    });

    /////////////////////////CREATE CARD//////////////////////
    var openCreateDialog = function () {
        Session.set("createError", null);
        $('#createDialog').modal('show');
    };
    var closeCreateDialog = function () {
        $('#createDialog').modal('hide');
    }

    Template.page.helpers({
        showCreateDialog: function () {
            return Session.get("showCreateDialog");
        }
    });

    Template.createDialog.events({
        'click .save': function (event, template) {
            var title = template.find(".title").value;
            var description = template.find(".description").value;
            if (title.length) {
                var id = createCard({
                    title: title,
                    description: description,
                    col: 'backlog'
                });
                Session.set("selected", id);
                closeCreateDialog();
            } else {
                Session.set("createError",
                    "It needs a title and a description, or why bother?");
            }
        },
        'click .cancel': closeCreateDialog
    });

    Template.createDialog.helpers({
        error: function () {
            return Session.get("createError");
        }
    });
    //////////////////////////////////


    var filterEvent = function (selector, callback) {
        return function (e) {

            if (e.target.matches(selector)) {
                callback(e);
//                e.stopPropagation();
            }
        }
    };

    var getColumn = function (el) {
        if (el) {
            return el.matches('.grid__column') ? el : getColumn(el.parentNode);
        } else {
            return null;
        }
    };

    //get the card or column we dropped on
    var getDropRoot = function (el) {
        if (el) {
            return el.matches('.grid__column, .card') ? el : getDropRoot(el.parentNode);
        } else {
            return null;
        }
    };

    var clearDragOverStyles = function() {
        [].forEach.call(document.querySelectorAll('.over'), function (el) {
            el.classList.remove('over');
            console.log(el.classList);
        });
    };

    var dragFrom;
    document.addEventListener('DOMContentLoaded', function () {
        var grid = document.querySelector('.grid');

        grid.addEventListener('dragstart', filterEvent('.card', function (e) {
            var target = e.target;
            target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text', target.id);
            dragFrom = getColumn(target);
        }), false);
        grid.addEventListener('dragend', filterEvent('.card', function (e) {
            e.target.classList.remove('dragging');
        }), false);
        document.addEventListener('dragenter', filterEvent('.grid__column', function (e) {
            //console.log('Drag enter ', e.target);
            clearDragOverStyles();
            e.target.classList.add('over');
        }), false);
        grid.addEventListener('dragover', filterEvent('.grid *', function (e) {
            //console.log('drag over', e.target);
            e.preventDefault();
        }), false);
        document.addEventListener('dragenter', filterEvent('body, .container', function (e) {
            console.log('Drag enter doc ', e.target);
            clearDragOverStyles();
        }), false);
        grid.addEventListener('drop', filterEvent('.grid *', function (e) {
            console.log('drop ', e.dataTransfer.getData('text'), e);
            var dropRoot = getDropRoot(e.target);
            var dropCol = getColumn(dropRoot);
            var id = e.dataTransfer.getData('text');
            var node = document.getElementById(id);

            if (dropCol && dropRoot !== node) {
                node.classList.remove('dragging');
                node.parentNode.removeChild(node);
                if (dropRoot == dropCol) {
                    dropCol.appendChild(node);
                } else {
                    dropCol.insertBefore(node, dropRoot);
                }
                updateCell(dropCol.id, _.pluck($(dropCol).find('.card'), 'id'));
                if (dropCol != dragFrom) {
                    updateCell(dragFrom.id, _.pluck($(dragFrom).find('.card'), 'id'));
                }
            }

            clearDragOverStyles();

            e.stopPropagation();
            e.preventDefault();
        }), false);

    });
}


if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });

    Meteor.publish("cards", function () {
        return Cards.find();
    });
}
