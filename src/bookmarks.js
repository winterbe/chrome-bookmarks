$(function () {
    "use strict";

    // generate ui widgets
    var UiFactory = function () {

        function updateView(node, path) {
            updateTitlebar(path);
            updateContent(node.children);
        }

        function updateTitlebar(path) {
            var $titlebar = $('#wrap').find('.titlebar');
            var lastNode = path[path.length - 1];
            var title = 'Bookmarks';
            var parentId = '-1';
            if (lastNode) {
                title = lastNode.title;
                parentId = lastNode.parentId;
            }
            var html = '<span class="title">{{title}}</span>\n<span class="back-btn" data-parent-id="{{parentId}}">\n    <i class="icon-chevron-left"></i>\n</span>\n<div class="shadow"></div> ';
            html = html.replace('{{title}}', title);
            html = html.replace('{{parentId}}', parentId);
            $titlebar.html($(html));
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
            var html = '<a class="folder" href="#" data-bookmark-id="{{id}}">\n    {{title}}\n    <span class="caret">\n        <i class="icon-chevron-right"></i>\n    </span>\n</a>';
            html = html.replace('{{title}}', node.title);
            html = html.replace('{{id}}', node.id);
            return $(html);
        }

        function createLink(node) {
            var html = '<a class="link" href="{{url}}" data-bookmark-id="{{id}}">\n    <img class="favicon" src="{{faviconUrl}}"> {{title}}\n</a>';
            html = html.replace('{{title}}', node.title);
            html = html.replace('{{id}}', node.id);
            html = html.replace('{{url}}', node.url);
            html = html.replace('{{faviconUrl}}', 'chrome://favicon/' + node.url);
            return $(html);
        }

        return {
            updateView: updateView
        }
    }();


    // helper for traversing bookmarks tree
    var NodeHelper = function () {
        var findNode = function (node, id, path) {
            var result = findNodeRec(node, String(id), path);
            if (result == null) {
                throw new Error('bookmark does not exist: ' + id);
            }
            path.pop(); // remove special root node (id = 0)
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


    // register click handlers
    $('#wrap')
        .on('click', '.content .folder', function() {
            var bookmarkId = $(this).data('bookmarkId');
            updateView(bookmarkId);
        })
        .on('click', '.content .link', function() {
            var url = $(this).attr('href');
            chrome.tabs.update(null, {url: url});
            window.close();
        })
        .on('click', '.titlebar .back-btn', function() {
            var parentId = $(this).data('parentId');
            updateView(parentId);
        });


    // update view
    var updateView = function (bookmarkId) {
        chrome.bookmarks.getTree(function (nodes) {
            var root = nodes[0];
            var path = [];  // will be filled with nested paths (aka breadcrumbs)
            var node = NodeHelper.findNode(root, bookmarkId, path);
            UiFactory.updateView(node, path);
            localStorage.setItem("lastNode", bookmarkId);
        });
    };

    var startId = localStorage.getItem("lastNode") || 0;
    updateView(startId);

});