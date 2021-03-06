Cards = new Mongo.Collection("cards");
Grids = new Mongo.Collection("grids");

Cards.allow({
    insert: function (userId, card) {
        return false; // no cowboy inserts -- use createParty method
    },
    update: function (userId, card, fields, modifier) {
        if (userId !== cards.owner)
            return false; // not the owner
//        var allowed = ["title", "description"];
//        if (_.difference(fields, allowed).length)
//            return false; // tried to write to forbidden field
        return true;
    },
    remove: function (userId, card) {
        return true;
    }
});

createCard = function (gridId, card) {
    card._id = card._id || Random.id();
    return Meteor.call('createCard', gridId, card);
};
updateCard = function (options) {
    Meteor.call('updateCard', options);
    return options._id;
};
updateCells = function (gridId, cells) {
    Meteor.call('updateCells', gridId, cells);
};
sortCols = function (gridId, colIds) {
    return Meteor.call('sortCols', gridId, colIds);
};
sortRows = function (gridId, rowIds) {
    return Meteor.call('sortRows', gridId, rowIds);
};

//can either be a row or col
var createStruct = function (name) {
    return {
        title: name,
        _id: Random.id()
    };
}

var NonEmptyString = Match.Where(function (x) {
    check(x, String);
    return x.length !== 0;
});

var validateCard = function (options) {
    check(options, {
        title: NonEmptyString,
        description: Match.Optional(String),
        col: Match.Optional(NonEmptyString),
        _id: Match.Optional(NonEmptyString),
        color: Match.Optional(NonEmptyString),
        owner: Match.Any
    });

    //        if (options.title.length > 100)
//            throw new Meteor.Error(413, "Title too long");
//        if (options.description.length > 1000)
//            throw new Meteor.Error(413, "Description too long");
//        if (! this.userId)
//            throw new Meteor.Error(403, "You must be logged in");
}

Meteor.methods({
    // options should include: title, description, x, y, public
    createCard: function (gridId, card) {
        console.log('create card ', card);
        if (typeof card.owner === "undefined") {
            card.owner = this.userId;
        }
        //validateCard(options);
        var id = card._id || Random.id();
        console.log("upsert id %s", id);
        var existing = Cards.findOne({_id: id});
        Cards.update({
                _id: id
            },
            {
                $set: {
                    owner: card.owner,
                    title: card.title,
                    description: card.description,
                    col: card.col,
                    color: card.color || '#' + (Math.floor(Math.random() * Math.pow(16, 5)) + Math.pow(16, 5)).toString(16)
                }
            }, {
                upsert: true
            });
        var grid = Grids.findOne({_id: gridId});
        if (!existing && grid) {
            var cell1 = [grid.rows[0]._id, grid.cols[0]._id].join("_");
            var update = {};
            update["cells." + cell1 + ".cards"] = id;
            Grids.update({_id: gridId}, {$push: update});
            return id;
        }
    },
    updateCells: function (gridId, cells) {
        var updateObj = {};
        _.each(cells, function (v, k) {
            updateObj['cells.' + k + '.cards'] = v;
        });
        console.log(updateObj);
        Grids.update({_id: gridId}, {$set: updateObj});
    },
    deleteCard: function (id) {
        Cards.remove({_id: id});
    },
    addCol: function (gridId, colName) {
        Grids.update({
            _id: gridId
        }, {
            $push: {
                cols: createStruct(colName)
            }
        })
    },
    addRow: function (gridId, rowName) {
        Grids.update({
            _id: gridId
        }, {
            $push: {
                rows: createStruct(rowName)
            }
        });
    },
    updateCol: function (gridId, colName, colId) {
        Grids.update({_id: gridId, cols: {$elemMatch: {_id: colId}}}, {$set: {"cols.$.title": colName}});
    },
    sortCols: function (gridId, colIds) {
        var grid = Grids.findOne({_id: gridId});
        if (grid) {
            var cols = _.sortBy(grid.cols, function (col) {
                return colIds.indexOf(col._id);
            });
            Grids.update({_id: gridId}, {$set: {cols: cols}});
        }
    },
    sortRows: function (gridId, rowIds) {
        var grid = Grids.findOne({_id: gridId});
        if (grid) {
            var rows = _.sortBy(grid.rows, function (row) {
                return rowIds.indexOf(row._id);
            });
            Grids.update({_id: gridId}, {$set: {rows: rows}});
        }
    },
    deleteStruct: function (gridId, structId, isCol) {
        var type = isCol ? 'cols' : 'rows';
        var update = {};
        update[type] = {_id: structId};
        Grids.update({_id: gridId}, {$pull: update});
    }

});