Cards = new Mongo.Collection("cards");

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
        return false;
    }
});

createCard = function (options) {
    var id = Random.id();
    Meteor.call('createCard', _.extend({ _id: id }, options));
    return id;
};

var NonEmptyString = Match.Where(function (x) {
    check(x, String);
    return x.length !== 0;
});

Meteor.methods({
    // options should include: title, description, x, y, public
    createCard: function (options) {
        check(options, {
            title: NonEmptyString,
            description: NonEmptyString,
            _id: Match.Optional(NonEmptyString)
        });

//        if (options.title.length > 100)
//            throw new Meteor.Error(413, "Title too long");
//        if (options.description.length > 1000)
//            throw new Meteor.Error(413, "Description too long");
//        if (! this.userId)
//            throw new Meteor.Error(403, "You must be logged in");

        var id = options._id || Random.id();
        Cards.insert({
            _id: id,
            owner: this.userId,
            title: options.title,
            description: options.description
        });
        return id;
    }
});