if (Meteor.isClient) {

    Template.column.helpers({
        cards: function (prefix) {
            return "123".split('').map(function (i) {
                var id = Math.ceil(Math.random() * 10000000);
                return {
                    title: i + ' dummy ' + id,
                    id: id,
                    color: '#' + Math.floor(Math.random() * 16777215).toString(16)
                };
            });
        }
    });

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
    }

    document.addEventListener('DOMContentLoaded', function () {
        var grid = document.querySelector('.grid');

        [].forEach.call(document.querySelectorAll('.grid__column'), function(col) {
            new Dragster(col);
        });

        grid.addEventListener('dragstart', filterEvent('.card', function (e) {
            var target = e.target;
            target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text', target.id);
        }), false);
        grid.addEventListener('dragend', filterEvent('.card', function (e) {
            e.target.classList.remove('dragging');
        }), false);
        document.addEventListener('dragster:enter', filterEvent('.grid__column', function (e) {
            console.log('Drag enter ', e.target);
//            e.preventDefault();
            e.target.classList.add('over');
        }), false);
        grid.addEventListener('dragover', filterEvent('.grid *', function (e) {
            //console.log('drag over', e.target);
            e.preventDefault();
        }), false);
        document.addEventListener('dragster:leave', filterEvent('.grid__column', function (e) {
            console.log('Drag leave ', e.target);
            e.target.classList.remove('over');
        }), false);
        grid.addEventListener('drop', filterEvent('.grid *', function (e) {
            console.log('drop ', e.dataTransfer.getData('text'), e);
            var dropRoot = getDropRoot(e.target);
            var dropCol = getColumn(dropRoot);
            var node = document.getElementById(e.dataTransfer.getData('text'));

            if (dropCol && dropRoot !== node) {
                node.classList.remove('dragging');
                node.parentNode.removeChild(node);
                if (dropRoot == dropCol) {
                    dropCol.appendChild(node);
                } else {
                    dropCol.insertBefore(node, dropRoot);
                }
            }

            [].forEach.call(document.querySelectorAll('.over'), function (el) {
                el.classList.remove('over');
                console.log(el.classList);
            });

            e.stopPropagation();
            e.preventDefault();
        }), false);

    });
}


if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
