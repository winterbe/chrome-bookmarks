window.UiFactory = function() {

    function updateContent(nodes) {
        var $content = $('#content');
        $content.html('');

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.children) {
                $content.append(createFolder(node));
            } else {
                $content.append(createLink(node));
            }

        }
    }

    function createFolder(node) {
        var html = '<a class="folder" href="#" data-bookmark-id="{{id}}">{{title}}<span class="caret">&rarr;</span></a>';
        html = html.replace('{{title}}', node.title);
        html = html.replace('{{id}}', node.id);
        return $(html);
    }

    function createLink(node) {
        var html = '<a class="link" href="{{url}}" data-bookmark-id="{{id}}">{{title}}</a>';
        html = html.replace('{{title}}', node.title);
        html = html.replace('{{id}}', node.id);
        html = html.replace('{{url}}', node.url);
        return $(html);
    }

    return {
        updateContent: updateContent
    }
}();

$(function () {
    "use strict";

    var showError = function(message) {
        $('<div class="alert"></div>')
            .text(message)
            .prependTo($('#content'));
    };

    var findNode = function(node, id) {
        if (node && node.id === id) {
            return node;
        }

        var children = node.children;
        if (!children || children.length === 0) {
            return null;
        }

        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var found = findNode(child, id);
            if (found) {
                return found;
            }
        }

        return null;
    }

    var updateView = function(bookmarkId) {
        chrome.bookmarks.getTree(function (nodes) {
            var root = nodes[0];
            var node = findNode(root, bookmarkId);
            if (node) {
                UiFactory.updateContent(node.children);
            } else {
                showError("node not found: " + bookmarkId);
            }
        });
    };

    updateView("1");


    $('#content')
        .on('click', '.folder', function() {
            var bookmarkId = $(this).data('bookmarkId');
            updateView(String(bookmarkId));
        });

});