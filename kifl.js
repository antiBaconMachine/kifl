if (Meteor.isClient) {

    Meteor.subscribe("cards");

    Template.page.helpers({
        getGrid: function () {
            //TODO: this should be dynamically fetched from
            Session.set('grid', 'dummy_grid');
            return Grids.find({_id: 'dummy_grid'}).fetch()[0];
        }
    });

    var interactable = function (interactWhilstEditing) {
        return ((Session.get('editingGrid') || false) === interactWhilstEditing) ? "draggable" : "";
    };

    Template.grid.helpers({
        cell: function () {
            var col = this._id,
                row = UI._parentData(1)._id,
                grid = UI._parentData(2),
                cellId = row + '_' + col,
                cell = _.extend({_id: cellId}, grid.cells[cellId]) || {_id: cellId, row: row, col: col};
//           console.log("returning cell %o with id %s for %o_%o ",cell,cell._id,row, col);
            return cell;
        },
        cols: function () {
            return _.map(this.cols, function (e) {
                return _.extend(e, {type: "updateCol"})
            });
        },
        rows: function () {
            return _.map(this.rows, function (e) {
                return _.extend(e, {type: "updateRow"})
            });
        },
        //Are we in general edit mode
        editing: function () {
            return Session.get('editingGrid');
        },
        addCol: function () {
            return Session.get('addCol');
        },
        addRow: function () {
            return Session.get('addRow');
        },
        interactable: function () {
            return interactable(true);
        }
    });

    Template.structHeader.helpers({
        //Are we editing the specific struct in context
        editingStruct: function () {
            return Session.get('editingStruct') === this._id;
        },
        type: function () {
            console.log(this);
        }
    });

    Template.grid.events({
        'click #editGrid': function (event) {
            event.preventDefault();
            Session.set('editingGrid', true);
            return false;
        },
        'click #doneEditingGrid': function (event) {
            event.preventDefault();
            Session.set('editingGrid', false);
            Session.set('editingStruct', false);
            return false;
        },
        'click #addCol': function (event) {
            event.preventDefault();
            Session.set('addCol', true);
            return false;
        },
        'click #addRow': function (event) {
            event.preventDefault();
            Session.set('addRow', true);
            return false;
        },
        'keyup .newStruct': function (e) {
            if (e.target.value && e.which === 13) {
                var $target = $(e.target);
                var operation = $target.data('operation'),
                    id = $target.closest('.structHeader').attr('id');
                console.log(operation, id);
                if (_.contains(['addRow', 'updateRow', 'addCol', 'updateCol'], operation)) {
                    Meteor.call(operation, Session.get('grid'), e.target.value, id);
                    Session.set(operation, false);
                    Session.set('editingStruct', false);
                }
            }
        },
        'click .editing--true .structHeader': function (e) {
            console.log('editing struct');
            var id = e.target.id;
            Session.set('editingStruct', id);
        },
        'click input': function() {
            return false;
        },
        'click .deleteStruct': function (e) {
            var $target = $(e.target),
                $structHeader = $target.closest('.structHeader'),
                structId = $structHeader.attr('id'),
                isCol = $structHeader.is('.grid__row__colHeader'),
                gridId = Session.get('grid');

            if ($('.' + structId + ' .card').length) {
                alert('Can not delete non-empty struct');
            } else {
                console.log('deleting struct for grid: %s with id: %s isCol:', gridId, structId, isCol);
                Meteor.call('deleteStruct', Session.get('grid'), structId, isCol);
            }
            return false;
        },
        'click .createCard': function (event, template) {
//            if (! Meteor.userId()) // must be logged in to create events
//                return;
            openCreateDialog();
            event.preventDefault();
            return false;
        },
        'click .card': function (event) {
            var card = Cards.findOne({_id: getDropRoot(event.target).attr("id")});
            if (card) {
                Session.set('editingCard', card);
                Session.set("createError", null);
                console.log('currently editing card %o', card);
                $('#createDialog').modal('show');
            }
        }
    });

    Template.card.helpers({
        card: function () {
            return Cards.findOne({_id: this.toString()});
        },
        interactable: function () {
            return interactable(false);
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
                var card = _.extend(existing,
                    {
                        title: title,
                        description: description,
                    });
                var id = createCard(Session.get('grid'), card);
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

    var getCardIdsForCell = function (cell) {
        return _.chain($(cell).find('.card')).pluck('id').uniq().value();
    };


    $(function () {
        var grid = $('.grid'),
            sourceCol;


        interact('.draggable')
            .draggable({
                onstart: function (event) {
                    sourceCol = getCell(event.target);
                },
                onmove: function (event) {
                    var target = event.target,
                    // keep the dragged position in the data-x/data-y attributes
                        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    // translate the element
                    target.style.webkitTransform =
                        target.style.transform =
                            'translate(' + x + 'px, ' + y + 'px)';

                    // update the posiion attributes
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            });

        var dropHandler = function (extras) {
            return _.extend(
                {
                    //overlap: 0.5,

                    // listen for drop related events:
                    ondropactivate: function (event) {
                        // add active dropzone feedback
                        event.target.classList.add('drop-active');
                    },
                    ondragenter: function (event) {
                        var draggableElement = event.relatedTarget,
                            dropzoneElement = event.target;

                        // feedback the possibility of a drop
                        dropzoneElement.classList.add('drop-target');
                        draggableElement.classList.add('can-drop');
                    },
                    ondragleave: function (event) {
                        // remove the drop feedback style
                        event.target.classList.remove('drop-target');
                        event.relatedTarget.classList.remove('can-drop');
                    },
                    ondropdeactivate: function (event) {
                        //If the target still exists it means it hasn't been moved by ondrop so reset it
                        var x = 0, y = 0;
                        event.relatedTarget.dataset.x = x;
                        event.relatedTarget.dataset.y = y;
                        event.relatedTarget.style.webkitTransform = event.relatedTarget.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                        // remove active dropzone feedback
                        event.target.classList.remove('drop-active');
                        event.target.classList.remove('drop-target');
                    }

                }, (extras || {})
            );
        }

        interact('.dropzone-card').dropzone(dropHandler({
            accept: '.card',
            ondrop: function (event) {
                console.log("Drop %o", event);
                var dropRoot = $(event.target);
                var dropCell = getCell(dropRoot);
                var sourceNode = $(event.relatedTarget);
                //
                if (dropCell && !dropRoot.is(sourceNode)) {

                    sourceNode.remove();
                    if (dropRoot.is(dropCell)) {
                        dropCell.append(sourceNode);
                    } else {
                        dropRoot.before(sourceNode);
                    }
                    var update = {};
                    update[dropCell.attr('id')] = getCardIdsForCell(dropCell);
                    if (!dropCell.is(sourceCol)) {
                        update[sourceCol.attr('id')] = getCardIdsForCell(sourceCol);
                    }
                    updateCells(Session.get('grid'), update);
                }
            }
        }));

        interact('.dropzone-col').dropzone(dropHandler({
            accept: '.grid__row__colHeader',
            ondrop: function (event) {
                var moveCell = $(event.relatedTarget),
                    dropCell = $(event.target);
                if (moveCell != dropCell) {
                    moveCell.remove();
                    dropCell.before(moveCell);
                    var structIds = _.pluck($(".grid__row__colHeader"), "id");
                    sortCols(Session.get('grid'), structIds);
                }
            }
        }));

        interact('.dropzone-row').dropzone(dropHandler({
            accept: '.grid__row__rowHeader',
            ondrop: function (event) {
                var moveRow = $(event.relatedTarget).closest('tr'),
                    dropRow = $(event.target).closest('tr');
                if (moveRow != dropRow) {
                    moveRow.remove();
                    dropRow.before(moveRow);
                    var structIds = _.pluck($(".grid__row__rowHeader"), "id");
                    sortRows(Session.get('grid'), structIds);
                }
            }
        }));
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
