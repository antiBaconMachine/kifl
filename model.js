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

createCard = function (options) {
    var id = options._id || Random.id();
    Meteor.call('createCard', _.extend({ _id: id }, options));
    return id;
};
updateCard = function (options) {
    Meteor.call('updateCard', options);
    return options._id;
};
updateCells = function (gridId, cells) {
    Meteor.call('updateCells', gridId, cells);
};

//can either be a row or col
var createStruct = function(name) {
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
    createCard: function (options) {
        console.log('create card ', options);
        if (typeof options.owner === undefined) {
            options.owner = this.userId;
        }
        //validateCard(options);
        var id = options._id || Random.id();
        Cards.update({
                _id: id
            },
            {
                $set: {
                    owner: options.owner,
                    title: options.title,
                    description: options.description,
                    col: options.col,
                    color: options.color || '#' + (Math.floor(Math.random() * Math.pow(16, 5)) + Math.pow(16, 5)).toString(16)
                }
            }, {
                upsert: true
            });
        Cells.update({
                name: options.col
            },
            {
                $push: {
                    cards: id
                }
            });
        return id;
    },
    updateCells: function (gridId, cells) {
        var updateObj = {};
        _.each(cells, function(v, k) {
            updateObj['cells.' + k + '.cards'] = v;
        });
        console.log(updateObj);
        Grids.update({_id: gridId}, {$set: updateObj});
    },
    deleteCard: function (id) {
        Cards.remove({_id : id});
    },
    addCol: function(gridId, colName) {
        Grids.update({
            _id: gridId
        },{
            $push: {
                cols: createStruct(colName)
            }
        })
    },
    addRow: function(gridId, rowName) {
        Grids.update({
            _id: gridId
        }, {
            $push: {
                rows: createStruct(rowName)
            }
        })
    }

});