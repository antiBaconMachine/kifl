if (Meteor.isClient) {

    Meteor.subscribe("cards");

    Template.page.helpers({
        getGrid: function () {
            //TODO: this should be dynamically fetched from
            Session.set('grid', 'dummy_grid');
            return Grids.find({_id: 'dummy_grid'}).fetch()[0];
        }
    });

    Template.grid.helpers({
       cell: function() {
           var  col = this._id,
                row = UI._parentData(1)._id,
                grid = UI._parentData(2),
                cellId = row + '_' + col,
                cell = grid.cells[cellId] || {_id: cellId, row: row, col: col};
//           console.log("returning cell %o for %o_%o ",cell,row, col);
           return cell;
       },
       editing: function() {
           return Session.get('editingGrid');
       },
       addCol: function() {
           return Session.get('addCol');
       },
       addRow: function() {
           return Session.get('addRow');
       }
    });

    Template.grid.events({
        'click #editGrid': function(event) {
            event.preventDefault();
            Session.set('editingGrid', true);
            return false;
        },
        'click #doneEditingGrid': function(event) {
            event.preventDefault();
            Session.set('editingGrid', false);
            return false;
        },
        'click #addCol': function(event) {
            event.preventDefault();
            Session.set('addCol', true);
            return false;
        },
        'click #addRow': function(event) {
            event.preventDefault();
            Session.set('addRow', true);
            return false;
        },
        'keyup .newStruct': function(e) {
            if (e.target.value && e.which === 13) {
                var operation = $(e.target).data('operation');
                if (operation === 'addRow' || operation === 'addCol') {
                    Meteor.call(operation, Session.get('grid'), e.target.value);
                    Session.set(operation, false);
                }
            }
        }
    });

    Template.column.helpers({
        cards: function (col) {
            //OMG. Better join and sort pls
            //http://stackoverflow.com/questions/20375111/mongo-sort-documents-by-array-of-ids
            //https://www.discovermeteor.com/blog/reactive-joins-in-meteor/
            //https://jira.mongodb.org/browse/SERVER-7528
            var cards = Cards.find({"col": col}).fetch();
            var order = Cells.find({name: col}).fetch()[0].cards;
            return _.sortBy(cards, function (card) {
                return order.indexOf(card._id);
            });
        }
    });

    Template.column.events({
        'click .createCard': function (event, template) {
//            if (! Meteor.userId()) // must be logged in to create events
//                return;
            openCreateDialog();
            event.preventDefault();
            return false;
        },
        'click .card': function (event) {
            var card = Cards.find({_id: getDropRoot(event.target).id}).fetch()[0];
            Session.set('editingCard', card);
            Session.set("createError", null);
            console.log('currently editing card %o', card);
            $('#createDialog').modal('show');
        }
    });

    /////////////////////////CREATE CARD//////////////////////
    var openCreateDialog = function () {
        Session.set('editingCard', null);
        Session.set("createError", null);
        $('#createDialog').modal('show');
    };
    var closeCreateDialog = function () {
        $('#createDialog').modal('hide');
    };

    Template.page.helpers({
        showCreateDialog: function () {
            return Session.get("showCreateDialog");
        }
    });

    Template.createDialog.events({
        'click .save': function (event, template) {
            var title = template.find(".title").value;
            var description = template.find(".description").value;
            var existing = Session.get('editingCard') || {};
            if (title.length) {
                var card = _.extend({
                        col: 'backlog'
                    },
                    existing,
                    {
                        title: title,
                        description: description,
                    });
                var id = createCard(card);
                Session.set("selected", id);
                closeCreateDialog();
            } else {
                Session.set("createError",
                    "It needs a title and a description, or why bother?");
            }
        },
        'click .delete': function (event, template) {
            var existing = Session.get('editingCard');
            if (confirm('Srsly?')) {
                Meteor.call('deleteCard', existing._id);
            }
        }
    });

    Template.createDialog.helpers({
        error: function () {
            return Session.get("createError");
        },
        editCard: function () {
            return Session.get("editingCard") || {};
        },
        isEditing: function () {
            return Session.get("editingCard");
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

    var getCell = function (el) {
        return $(el).closest('.grid__row__cell');
    };

    //get the card or column we dropped on
    var getDropRoot = function (el) {
        return $(el).closest('.card, .grid__row__cell');
    };

    var clearDragOverStyles = function () {
        [].forEach.call(document.querySelectorAll('.over'), function (el) {
            el.classList.remove('over');
//            console.log(el.classList);
        });
    };

    var getCardIdsForCol = function (col) {
        return _.chain($(col).find('.card')).pluck('id').uniq().value();
    };

    var sourceCol;
    $(function () {
        var grid = $('.grid');

        grid.on('dragstart', '.card', function (e) {
            var target = e.target;
            target.classList.add('dragging');
            var dataTransfer = e.originalEvent.dataTransfer;
            dataTransfer.effectAllowed = 'move';
            dataTransfer.setData('text', target.id);
            sourceCol = getCell(target);
        }).on('dragend','.card', function (e) {
            e.target.classList.remove('dragging');
        }).on('dragenter', '.card, .grid__row__cell', function (e) {
            console.log('Drag enter ', e.target);
            clearDragOverStyles();
            e.target.classList.add('over');
            return false;
        }).on('dragenter', '.card *', false)
            .on('dragover', '*', function (e) {
            //console.log('drag over', e.target);
            return false;
        }).on('drop', '*', function (e) {
            var id = e.originalEvent.dataTransfer.getData('text');
            console.log('drop id: %s event: ', id, e);
            var dropRoot = getDropRoot(e.target);
            var dropCell = getCell(dropRoot);
            var node = $('#'+id);

            if (dropCell && dropRoot !== node) {
                node.classList.remove('dragging');
                node.parentNode.removeChild(node);
                if (dropRoot == dropCell) {
                    dropCell.append(node);
                } else {
                    dropRoot.before(node);
                }
                updateCard({
                    col: dropCell.id,
                    _id: node.id
                });
                updateCell(dropCell.id, getCardIdsForCol(dropCell));
                if (dropCell != sourceCol) {
                    updateCell(sourceCol.id, getCardIdsForCol(sourceCol));
                }
            }

            clearDragOverStyles();

            return false;
        });
        $('html').on('dragenter', 'body, .container', function (e) {
//            console.log('Drag enter doc ', e.target);
            clearDragOverStyles();
            return false;
        });

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
