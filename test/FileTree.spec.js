/* global describe, it, beforeEach, afterEach */

'use strict';

var assert = require('assert'),
    File = require('vinyl'),
    path = require('path'),
    sinon = require('sinon'),
    forestry = require('forestry'),
    FileTree = require('../src/FileTree');

describe('FileTree', function () {

    var testee,
        basePath = path.parse(process.cwd()).root;

    function getFileWithPath(path) {
        return new File({
            cwd: path,
            base: path,
            path: path
        });
    }

    beforeEach(function () {
        sinon.spy(forestry, 'Node');
        testee = new FileTree();
    });

    afterEach(function () {
        forestry.Node.restore();
    });

    describe('constructor', function () {

        it('returns a FileTree object with null _tree', function () {
            testee = new FileTree();
            assert.equal(testee._tree, null);
        });

        it('returns a FileTree with _transform set to passed in transform function', function () {
            testee = new FileTree('transform function');
            assert.equal(testee._transform, 'transform function');
        });
    });

    describe('addFileToTree', function () {

        var file;
        beforeEach(function () {
            file = getFileWithPath(path.resolve(basePath, 'a.js'));
        });

        it('should create tree if it does not already exist', function () {
            testee.addFileToTree(file);
            assert.deepEqual(forestry.Node.args[0][0] instanceof File, true);
            assert.equal(forestry.Node.args[0][0].cwd, basePath);
            assert.equal(forestry.Node.args[0][0].base, basePath);
            assert.equal(forestry.Node.args[0][0].path, basePath);
            assert.equal(testee._tree.data.cwd, basePath);
            assert.equal(testee._tree.data.base, basePath);
            assert.equal(testee._tree.data.path, basePath);
        });

        describe('file already exists in tree', function () {

            function findNode(path) {
                return testee._tree.find(function (x) {
                    return x.data.path === path;
                });
            }

            var file;
            beforeEach(function () {
                file = getFileWithPath(path.resolve(basePath, 'a.js'));
                file.x = 1;
                testee.addFileToTree(file);
            });

            it('should update existing node', function () {
                assert.equal(findNode(file.path).data.x, file.x);
                file.x = 10;
                testee.addFileToTree(file);
                assert.deepEqual(findNode(file.path).data.x, file.x);
            });
        });

        describe('file does not already exist', function () {

            it('should add file is a new node', function () {
                var newFile = getFileWithPath(path.resolve(basePath, 'file.js'));
                testee.addFileToTree(newFile);
                assert.equal(testee._tree.children.length, 1);
                assert.equal(testee._tree.children[0].data.path, newFile.path);
            });

            it('should add intermediate folders if file is a new node', function () {
                var newFile = getFileWithPath(path.resolve(basePath, 'inner/outer/file.js'));

                testee.addFileToTree(newFile);
                assert.equal(testee._tree.children.length, 1);
                assert.equal(testee._tree.children[0].data.path, path.resolve(basePath, 'inner'));
                assert.equal(testee._tree.children[0].children[0].data.path, path.resolve(basePath, 'inner/outer'));
                assert.equal(testee._tree.children[0].children[0].children[0].data.path, path.resolve(basePath, 'inner/outer/file.js'));
            });
        });
    });

    describe('getTree', function () {

        function reduceFunc (acc, node) {
            acc.push(node.data.path);
            return acc;
        }

        it('returns tree from first significant node I', function () {
            var file = getFileWithPath(path.resolve(basePath, 'inner/outer/file.js')),
                initial;
            testee.addFileToTree(file);
            initial = testee._tree.find(function (n) {
                return n.data.path === file.path;
            });

            assert.deepEqual(testee.getTree().reduce([], reduceFunc), initial.reduce([], reduceFunc));
        });

        it('returns tree from first significant node II', function () {

            testee.addFileToTree(getFileWithPath(path.resolve(basePath, 'inner/outer/file.js')));
            testee.addFileToTree(getFileWithPath(path.resolve(basePath, 'inner/outer/file2.js')));
            var initial = testee._tree.find(function (n) {
                return n.data.path === path.resolve(basePath, 'inner/outer');
            });
            assert.deepEqual(testee.getTree().reduce([], reduceFunc), initial.reduce([], reduceFunc));
        });

        describe('when transform function is passed into FileTree constructor', function () {

            beforeEach(function () {
                testee = new FileTree(function (tree, suffix) {
                    return tree.traverse(function (n) {
                        n.data.path += suffix;
                    });
                });
            });

            it('should transform the tree using the function', function () {
                testee.addFileToTree(getFileWithPath(path.resolve(basePath, 'inner/outer/file.js')));
                testee.addFileToTree(getFileWithPath(path.resolve(basePath, 'inner/outer/file2.js')));
                var initial = testee._tree.find(function (n) {
                    return n.data.path === path.resolve(basePath, 'inner/outer');
                });
                assert.deepEqual(testee.getTree('!!!').reduce([], reduceFunc),
                                initial.reduce([], reduceFunc).map(function (n) {
                                    return n + '!!!';
                                }));
            });

        });
    });

    describe('getNonCircularTree', function () {

        it('should return non-circular version of tree (removing parent links)', function () {
            testee.addFileToTree(getFileWithPath(path.resolve(basePath, '1/2/a.js')));
            testee.addFileToTree(getFileWithPath(path.resolve(basePath, '1/1/b.js')));
            testee.addFileToTree(getFileWithPath(path.resolve(basePath, '1/c.js')));
            var tree = testee.getNonCircularTree();
            assert.equal(tree.path, path.resolve(basePath, '1'));
            assert.equal(tree.children[0].path, path.resolve(basePath, '1/2'));
            assert.equal(tree.children[1].path, path.resolve(basePath, '1/1'));
            assert.equal(tree.children[2].path, path.resolve(basePath, '1/c.js'));
            assert.equal(tree.children[0].children[0].path, path.resolve(basePath, '1/2/a.js'));
            assert.equal(tree.children[1].children[0].path, path.resolve(basePath, '1/1/b.js'));

        });
    });

});
