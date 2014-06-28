/* global describe, it, beforeEach */

'use strict';

var assert = require('assert'),
	TreeNode = require('../src/TreeNode'),
	File = require('vinyl');

describe('TreeNode', function () {
	describe('constructor', function () {
		it('returns correctly populated TreeNode object when file passed in', function () {
			var file = new File({
					path: 'path/to/file',
					contents: new Buffer('a file')
				}),
				parent = new File({
					path: 'path/to',
					contents: null
				}),
				tn = new TreeNode(file.path, file, parent);

			assert.equal(tn.path, file.path);
			assert.equal(tn.value, file);
			assert.equal(tn.isFile, true);
			assert.equal(tn.parent, parent);
		});

		it('returns correctly populated TreeNode object when folder passed in', function () {
			var folder = new File({
					path: 'path/to/folder',
					contents: null
				}),
				parent = new File({
					path: 'path/to',
					contents: null
				}),
				tn = new TreeNode(folder.path, folder, parent);

			assert.equal(tn.path, folder.path);
			assert.equal(tn.value, folder);
			assert.equal(tn.isFile, false);
			assert.equal(tn.parent, parent);
		});
	});

	describe('prototype methods', function () {
		
		var root;
		beforeEach(function () {
			root = new TreeNode('a');
			root.addChildNode(new TreeNode('a/1'));
			root.addChildNode(new TreeNode('a/2'));
			root.addChildNode(new TreeNode('a/1/i'));
		});

		describe('setValue', function () {
			it('sets the value and isFile property correctly when file passed in', function () {
				var file = new File({
						path: 'path/to/file',
						contents: new Buffer('a file')	
					}),
					tn = new TreeNode(file.path);

				assert.equal(tn.value, undefined);
				assert.equal(tn.path, file.path);
				assert.equal(tn.isFile, false);

				tn.setValue(file);

				assert.equal(tn.isFile, true);
				assert.equal(tn.value, file);
			});

			it('sets value and isFile property correctly when folder passed in', function () {
				var file = new File({
						path: 'path/to/file',
						contents: new Buffer('a file')	
					}),
					folder = new File({
						path: 'path/to/file',
						contents: null
					}),
					tn = new TreeNode(file.path, file);

				assert.equal(tn.value, file);
				assert.equal(tn.path, file.path);
				assert.equal(tn.isFile, true);

				tn.setValue(folder);

				assert.equal(tn.isFile, false);
				assert.equal(tn.value, folder);
			});
		});

		describe('getName', function () {
			var file, 
				folder,
				folderII;
			
			beforeEach(function () {
				file = new File({
					path: 'path/to/file.html',
					contents: new Buffer('a file')
				});
				folder = new File({
					path: 'path/to',
					contents: null
				});
				folderII = new File({
					path: 'path',
					contents: null
				});
			});

			it('returns "." if TreeNode has no parent', function () {
				var tn = new TreeNode(file.path, file);
				assert.equal(tn.getName(), '.');				
			});

			it('returns difference between path and parent.path', function () {
				var tn = new TreeNode(file.path, file, folder);
				assert.equal(tn.getName(), 'file.html');
				tn = new TreeNode(folder.path, folder, folderII);
				assert.equal(tn.getName(), 'to');
			});
		});

		describe('updateTree', function () {

			it('updates node if it already exists', function () {
				assert.equal(root.children[1].path, 'a/2');
				assert.equal(root.children[1].value, undefined);
				assert.equal(root.children[1].isFile, false);
				var file = new File({
					path: root.children[1].path,
					contents: new Buffer('a file')
				});
				root.updateTree(new TreeNode(file.path, file));
				assert.equal(root.children[1].path, 'a/2');
				assert.equal(root.children[1].value, file);
				assert.equal(root.children[1].isFile, true);
			});

			it('adds the node to the tree if it does not already exist', function () {
				var tn = new TreeNode('a/6');
				root.updateTree(tn);
				assert.equal(root.children[2].path, 'a/6');
			});

			it('throws an error if node does not already exist and it cannot be added', function () {
				var tn = new TreeNode('b');
				assert.throws(function () {
					root.updateTree(tn);
				}, Error);
				
			});
		});

		describe('addChildNode', function () {

			it('has correct root before tests begin', function () {
				assert.equal(root.path, 'a');
				assert.equal(root.children[0].path, 'a/1');
				assert.equal(root.children[0].parent.path, 'a');
				assert.equal(root.children[0].children[0].path, 'a/1/i');
				assert.equal(root.children[0].children[0].parent.path, 'a/1');
				assert.equal(root.children[1].path, 'a/2');
				assert.equal(root.children[1].parent.path, 'a');
			});

			it('adds TreeNode at correct level in tree', function () {
				var tn = new TreeNode('a/3');
				root.addChildNode(tn);
				assert.equal(root.children[2], tn);
				tn = new TreeNode('a/1/ii');
				root.addChildNode(tn);
				assert.equal(root.children[0].children[1], tn);
				tn = new TreeNode('a/2/i');
				root.addChildNode(tn);
				assert.equal(root.children[1].children[0], tn);

			});

			it('creates supporting parent folders if they do not already exist', function () {
				var tn = new TreeNode('a/12/4/jello'),
					temp;
				root.addChildNode(tn);
				temp = root.children[2];
				assert.equal(temp.path, 'a/12');
				temp = temp.children[0];
				assert.equal(temp.path, 'a/12/4');
				temp = temp.children[0];
				assert.equal(temp.path, 'a/12/4/jello');
				assert.equal(temp.children.length, 0);
			});
			
			it('throws error if TreeNode cannot be added under current TreeNode', function () {
				var tn = new TreeNode('a/3');
				assert.throws(function () {
					root.children[0].children[0].addChildNode(tn);
				}, Error);
				
				tn = new TreeNode('a/1/ii');
				assert.throws(function () {
					root.children[1].addChildNode(tn);
				}, Error);
				
				tn = new TreeNode('a/2/i');
				assert.throws(function () {
					root.children[2].addChildNode(tn);
				}, Error);
			});	
		});

		describe('findNodeByPath', function () {
			
			it('returns node if found', function () {
				var found = root.findNodeByPath('a/2');
				assert.equal(found, root.children[1]);
				found = root.children[0].findNodeByPath('a/1/i');
				assert.equal(found, root.children[0].children[0]);
			});

			it('returns null if no node found', function () {
				var found = root.findNodeByPath('b');
				assert.equal(found, null);
				found = root.children[0].children[0].findNodeByPath('a/1');
				assert.equal(found, null);
			});

		});

		describe('pruneRoot', function () {
			
			beforeEach(function () {
				var temp = root.map(function (node) {
						node.path = 'some/fake/folders/' + node.path;
						return node;
					});
					 
				root = new TreeNode('some');
				root.addChildNode(new TreeNode('some/fake'));
				root.addChildNode(new TreeNode('some/fake/folders'));
				root.addChildNode(temp);
				assert.equal(root.children[0].children[0].children[0].path, 'some/fake/folders/a');
				assert.equal(root.children[0].children[0].children[0].children.length, 2);
			});

			
			it('removes TreeNodes with only one child from root of tree', function () {
				root = root.pruneRoot();
				assert.equal(root.path, 'some/fake/folders/a');
				assert.equal(root.parent, null);	
			});	
		});

		describe('map', function () {
			
			it('passes node and children through a function and returns the result', function () {
				function transform (node) {
					node.value = node.path.length;
					return node;
				}
				assert.equal(root.value, undefined);
				assert.equal(root.children[0].value, undefined);
				assert.equal(root.children[1].value, undefined);
				root = root.map(transform);
				assert.equal(root.value, root.path.length);
				assert.equal(root.children[0].value, root.children[0].path.length);
				assert.equal(root.children[1].value, root.children[1].path.length);
			});	
		});

		describe('reduceValue', function () {
			
			beforeEach(function () {
				root = root.map(function (node) {
					node.setValue(new File({
						path: node.path,
						contents: new Buffer('The path is ' + node.path)
					}));
					return node;
				});				
			});

			it('reduces the value of each node down to the given properties', function () {
				var properties = ['contents'];
				root = root.reduceValue(properties);

				assert.equal(root.value.path, undefined);
				assert.equal(root.value.contents, 'The path is ' + root.path);

				var node = root.children[0].children[0];
				assert.equal(node.value.path, undefined);
				assert.equal(node.value.contents, 'The path is ' + node.path);

			});

			it('accepts objects that to take a property and rename it', function () {
				var properties = ['contents', {'newProp': 'path'}];
				root = root.reduceValue(properties);

				assert.equal(root.value.newProp, root.path);
				assert.equal(root.value.contents, 'The path is ' + root.path);

				var node = root.children[0].children[0];
				assert.equal(node.value.newProp, node.path);
				assert.equal(node.value.contents, 'The path is ' + node.path);
			});
			
			it('accepts objects that use a function to derive a property', function () {
				var properties = [{
					'contentsLength' : function (val) {return val.contents.toString().length;}
				}, 'contents'];
				root = root.reduceValue(properties);

				assert.equal(root.value.contents, 'The path is ' + root.path);
				assert.equal(root.value.contentsLength, root.value.contents.length);

				var node = root.children[0].children[0];
				assert.equal(node.value.contents, 'The path is ' + node.path);
				assert.equal(node.value.contentsLength, node.value.contents.length);

			});	
		});

		describe('removeCircular', function () {
			it('replace circular links to parents with the parents path', function () {
				root = root.removeCircular();
				assert.equal(root.parent, null);
				assert.equal(root.children[0].parent, root.path);
				assert.equal(root.children[0].children[0].parent, root.children[0].path);
			});		
		});
	});
});
