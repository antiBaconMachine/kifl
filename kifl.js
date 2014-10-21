if (Meteor.isClient) {

    Template.column.helpers({
        cards: function(prefix) {
            return "123".split('').map(function(i) {
                var id = Math.ceil(Math.random() * 10000000);
                return {
                        title: i +' dummy ' + id,
                        id: id
                };
            });
        }
    });

    var filterEvent = function(selector, callback) {
        return function(e) {

            if (e.target.matches(selector)) {
                callback(e);
                e.stopPropagation();
            }
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        var grid = document.querySelector('.grid');
        grid.addEventListener('dragstart', filterEvent('.card', function(e) {
            var target = e.target;
            target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text', target.id);
        }), false);
        grid.addEventListener('dragend', filterEvent('.card', function(e) {
            e.target.classList.remove('dragging');
        }), false);
        grid.addEventListener('dragenter', filterEvent('.grid__column, .card', function(e) {
//            console.log('Drag enter ', e.target);
            e.preventDefault();
            e.target.classList.add('over');
        }), false);
        grid.addEventListener('dragover', filterEvent('.grid__column', function(e) {
            e.preventDefault();
        }), false);
        grid.addEventListener('dragleave', filterEvent('.grid__column, .card', function(e) {
//            console.log('Drag leave ', e.target);
            e.target.classList.remove('over');
        }), false);
        grid.addEventListener('drop', filterEvent('.grid__column, .card', function(e) {
            console.log('drop ', e);
            var col = e.target.matches('.grid__column') ? e.target : e.target.parentNode;
            var node = document.getElementById(e.dataTransfer.getData('text'));
            node.classList.remove('dragging');
            col.appendChild(node.cloneNode(true));
            node.parentNode.removeChild(node);

            [].forEach.call(document.querySelectorAll('.over'), function(el) {
                el.classList.remove('over'); console.log(el.classList);
            });
        }), false);

    });
}


if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
