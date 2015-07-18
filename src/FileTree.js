'use strict';

var Forestry = require('forestry'),
    File = require('vinyl'),
    path = require('path'),
    parentRegEx = /\/?[^\/]*\/?$/;

function findExistingFile (file, tree) {
    return tree.find(function (n) {
        return n.data.path === file.path;
    });
}

function findParentFolder (file, tree) {
    var path = file.path.replace(parentRegEx, '');
    return tree.find(function (n) {
        return n.data.path === path;
    });
}

function createInitialTree() {
    var dirs = process.cwd().split(path.sep),
        base = path.sep + dirs[1];
    return new Forestry.Node(new File({
        cwd: base,
        base: base,
        path: base
    }));
}

function decodeNode(node) {
    if (node.data.stat && node.data.stat.isFile) {
        return {
            cwd: node.data.cwd,
            base: node.data.base,
            path: node.data.path,
            relative: node.data.relative,
            name: node.data.path.replace(/.*\//, ''),
            isFile: node.data.stat ? node.data.stat.isFile() : false,
            isDirectory: node.data.stat ? node.data.stat.isDirectory() : true
        };
    }
    return node.data;
}

function FileTree(transform) {
    this._tree = null;
    this._transform = transform;
}

FileTree.prototype = {
    addFileToTree: function (file) {
        this._tree = this._tree || createInitialTree();
        var found = findExistingFile(file, this._tree),
            newNode;
        if (found) {
            found.data = file;
            return;
        }
        found = findParentFolder(file, this._tree) ||
                    this.addFileToTree(new File({
                        cwd: file.cwd,
                        base: file.base,
                        path: file.path.replace(parentRegEx, '')
                    }));
        newNode = new Forestry.Node(file);
        found.addChild(newNode);
        return newNode;
    },
    getTree: function () {
        var self = this,
            args = Array.prototype.slice.call(arguments);
        if (!this._tree) {
            return null;
        }
        var treeFrag = this._tree;
        while (treeFrag.children.length === 1) {
            treeFrag = treeFrag.children[0];
        }
        treeFrag = treeFrag.clone(function (file) {
            return file.clone();
        });
        if (self._transform) {
            treeFrag = self._transform.apply(null, [treeFrag].concat(args));
        }
        return treeFrag;
    },
    getNonCircularTree: function () {
        var tree = this.getTree();
        if (tree) {
            return tree.map(decodeNode);
        }
        return null;
    }
};

module.exports = FileTree;
