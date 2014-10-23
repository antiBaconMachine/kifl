Cards = new Mongo.Collection("cards");
Cells = new Mongo.Collection("cells");

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
    var id = Random.id();
    Meteor.call('createCard', _.extend({ _id: id }, options));
    return id;
};
updateCard = function (options) {
    Meteor.call('updateCard', options);
    return options._id;
};
updateCell = function (cellId, cards) {
    Meteor.call('updateCell', cellId, cards);
};

var NonEmptyString = Match.Where(function (x) {
    check(x, String);
    return x.length !== 0;
});

var validateCard = function(options) {
    check(options, {
        title: NonEmptyString,
        description: Match.Optional(String),
        col: NonEmptyString,
        _id: Match.Optional(NonEmptyString)
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
        validateCard(options);
        var id = options._id || Random.id();
        Cards.insert({
            _id: id,
            owner: this.userId,
            title: options.title,
            description: options.description,
            col: options.col,
            color: '#' + (Math.floor(Math.random() * Math.pow(16,5)) + Math.pow(16, 5)).toString(16)
        });
        return id;
    },
    updateCard: function (options) {
        var id = options._id;
        if (!id) {
            throw new Meteor.Error(406, "Can not update without an id");
        }
        Cards.update({
            _id: id
        }, {
            $set: {
                col: options.col
            }
        })
    },
    updateCell: function(cellName, orderedCards) {
        console.log('update %s to %a',cellName, orderedCards);
        Cells.update({
            name: cellName
        }, {
            $set: {
                name: cellName,
                cards: orderedCards
            }
        }, {
            upsert: true
        });
    }
});