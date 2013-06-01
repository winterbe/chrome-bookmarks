window.UiFactory = function() {

    function updateView(node, path) {
        updateBreadcrumb(path);
        updateContent(node.children);
    }

    function updateBreadcrumb(path) {
        var $breadcrumb = $('#wrap').find('.breadcrumbs');
        var text = '';
        for (var i = 0; i < path.length; i++) {
            var node = path[i];
            text += node.title;
            text += ' '
        }
        $breadcrumb.text(text || 'Bookmarks');
    }

    function updateContent(nodes) {
        var $content = $('#wrap').find('.content');
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
        updateView: updateView
    }
}();

window.NodeHelper = function() {
    var findNode = function (node, id, path) {
        var result = findNodeRec(node, String(id), path);
        if (result == null) {
            throw new Error('bookmark does not exist: ' + id);
        }
        path.pop(); // remove root node
        path.reverse();
        return result;
    };

    var findNodeRec = function (node, id, path) {
        if (node && node.id == id) {
            path.push(node);
            return node;
        }

        var children = node.children;
        if (!children || children.length === 0) {
            return null;
        }

        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var found = findNodeRec(child, id, path);
            if (found) {
                path.push(node);
                return found;
            }
        }

        return null;
    };

    return {
        findNode: findNode
    }
}();

$(function () {
    "use strict";

    var showError = function(message) {
        $('<div class="alert"></div>')
            .text(message)
            .prependTo($('#content'));
    };

    var updateView = function(bookmarkId) {
        chrome.bookmarks.getTree(function (nodes) {
            try {
                var root = nodes[0];
                var path = [];
                var node = NodeHelper.findNode(root, bookmarkId, path);
                UiFactory.updateView(node, path);
            } catch (e) {
                showError(e);
            }
        });
    };

    updateView(0);


    $('#wrap')
        .on('click', '.content .folder', function() {
            var bookmarkId = $(this).data('bookmarkId');
            updateView(bookmarkId);
        })
        .on('click', '.content .link', function() {
            var url = $(this).attr('href');
            chrome.tabs.update(null, {url: url});
            window.close();
        });

});