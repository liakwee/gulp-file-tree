/* global describe, it, beforeEach */

'use strict';

var assert = require('assert'),
	gulp = require('gulp'),
	TreeNode = require('../src/TreeNode'),
	GulpFileTree = require('../src/gulp-file-tree');

describe('gulp-file-tree', function () {

	var defaultOptions;
	beforeEach(function () {
		defaultOptions = {
			output: 'tree',
			outputTransform: 'json',
			appendProperty: null,
			emitFiles: false,
			properties: ['relative']
		};
	});

	it('handles being passed no files', function (done) {
		var treeObject= {},
			gft = new GulpFileTree({
				output: treeObject,
				outputTransform: null
			}),
			files = [];
		
		gft.on('data', function (file){
			files.push(file);
		});
		gft.on('end', function () {
			assert.equal(files.length, 0);
			assert.deepEqual(treeObject, {tree: {}});
			done();
		});

		gulp.src('no/such/folder/**/*')
			.pipe(gft);
	});

	describe('correctly builds file tree', function () {

		var allFiles, gft, files, treeObject;
		beforeEach(function (done) {
			allFiles = [];
			gulp.src('test/fixture/path/to/folder/**/*')
				.on('data', function (file) {
					if (!file.isNull()) {
						allFiles.push(file);
					}
				})
				.on('end', function () {
					done();
				});
			
			files = [];
			treeObject = {};
			gft = new GulpFileTree({
				output: treeObject,
				outputTransform: null,
				emitFiles: true,
				appendProperty: null,
				properties: ['relative']
			});

			
		});

		function checkTree(files, tree) {
			//files = files.slice(1);
			var shouldExist = allFiles.filter(function (file) {
					return files.some(function (f) {
						return f.path === file.path;
					});
				}),
				shouldNotExist = allFiles.filter(function (file) {
					return files.every(function (f) {
						return f.path !== file.path;
					});
				}),
				foundNode;
				
			shouldExist.forEach(function (file) {
				foundNode = tree.findNodeByPath(file.path);
				assert(foundNode instanceof TreeNode);
				assert.equal(foundNode.path, file.path);
			});

			shouldNotExist.forEach(function (file) {
				assert(tree.findNodeByPath(file.path) === null);					
			});
		}
	
		it('correctly outputs tree for passed in files - I', function (done) {
			gft.on('data', function (file){
				files.push(file);
			});
			gft.on('end', function () {
				checkTree(files, treeObject.tree);
				done();
			});

			gulp.src(['test/fixture/path/to/folder/**/*.json',
					'test/fixture/path/to/folder/**/*.css'])
				.pipe(gft);
		});

		it('correctly outputs tree for passed in files - II', function (done) {
			gft.on('data', function (file){
				files.push(file);
			});
			gft.on('end', function () {
				checkTree(files, treeObject.tree);
				done();
			});
		
			gulp.src(['test/fixture/path/to/folder/two/**/*.html'])
				.pipe(gft);
		});

		it('correctly outputs tree for passed in files - III', function (done) {
			gft.on('data', function (file){
				files.push(file);
			});
			gft.on('end', function () {
				checkTree(files, treeObject.tree);
				done();
			});
		
			gulp.src(['test/fixture/**/*.scss'])
				.pipe(gft);
		});
	});

	it('disregards redundant nodes at the root of the tree', function (done) {
		var treeObject = {},
			gft = new GulpFileTree({
				output: treeObject,
				outputTransform: null,
				emitFiles: true,
				appendProperty: null,
				properties: ['relative']
			}),
			cwd;

		
		gft.on('data', function (file){
			cwd = file.cwd;
		});
		gft.on('end', function () {
			assert.notEqual(treeObject.tree.path, cwd);
			assert.equal(treeObject.tree.path, cwd + '/test/fixture/path/to/folder');
			done();
		});

		gulp.src(['test/fixture/**/*'])
			.pipe(gft);
	});

	describe('options', function () {

		describe('default', function () {
			it('outputs a file tree representing passed in files in \'json\' style', function (done) {
				var gft = new GulpFileTree({
						output: 'tree',
						outputTransform: 'json',
						emitFiles: false,
						appendProperty: null,
						properties: ['relative']
					}),
					files = [];

				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					var tree = JSON.parse(files[0].contents.toString());
					assert.equal(files.length, 1);
					assert.equal(files[0].path, 'tree.json');
					assert.deepEqual(tree['.']['a.html'], {'relative' : 'a.html'});
					assert.deepEqual(tree['.'].one['c.json'], {'relative' : 'one/c.json'});
					assert.deepEqual(tree['.'].two.three['a.html'], {'relative' : 'two/three/a.html'});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});
		});
	
		describe('options.output', function () {
				it('saves output as json file to given file path if options.output is a string', function (done) {
				var gft = new GulpFileTree({
						output: 'path/to/tree',
						outputTransform: 'json',
						emitFiles: false,
						appendProperty: null,
						properties: ['relative']
					}),
					files = [];

				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					var tree = JSON.parse(files[0].contents.toString());
					assert.equal(files.length, 1);
					assert.equal(files[0].path, 'path/to/tree.json');
					assert.deepEqual(tree['.']['a.html'], {'relative' : 'a.html'});
					assert.deepEqual(tree['.'].one['c.json'], {'relative' : 'one/c.json'});
					assert.deepEqual(tree['.'].two.three['a.html'], {'relative' : 'two/three/a.html'});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('sets output on object if options.output is an object', function (done) {
				var treeObject = {},
					gft,
					files = [];

				defaultOptions.output = treeObject;
				gft = new GulpFileTree(defaultOptions);

				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					assert.equal(files.length, 0);
					assert.equal(treeObject.tree['.']['a.html'].relative, 'a.html');
					assert.equal(treeObject.tree['.'].one['c.json'].relative, 'one/c.json');
					assert.equal(treeObject.tree['.'].two.three['a.html'].relative, 'two/three/a.html');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('does not output tree if options.output is null', function (done) {
				var gft = new GulpFileTree({
						output: null,
						outputTransform: null,
						emitFiles: false,
						appendProperty: null,
						properties: ['relative']
					}),
					files = [];

				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					assert.equal(files.length, 0);
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			
			});

			it('does not output tree if output.options is undefined', function (done) {
				var gft = new  GulpFileTree({
						output: undefined,
						outputTransform: null,
						emitFiles: false,
						appendProperty: null,
						properties: ['relative']
					}),
					files = [];

				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					assert.equal(files.length, 0);
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			
			});

		});
	
		describe('options.emitFiles', function () {
			it('does not emit files used to build the tree if output.emitFiles is false', function (done) {
				var gft = new GulpFileTree({
						output: {}, 
						outputTransform: null,
						emitFiles: false,
						appendProperty: null,
						properties: ['relative']}),
					files = [];
				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					assert.equal(files.length, 0);
					done();
					});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('emits files used to build the tree if output.emitFiles is true', function (done) {
				var gft = new GulpFileTree({
						output: {},
					   	outputTransform: null,	
						emitFiles: true,
						appendProperty: null,
						properties: ['relative']}),
					files = [];
					gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					assert.equal(files.length, 11);
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
		});
	
		describe('options.properties', function () {
			it('reduces the value for each node in the tree to the given properties', function (done) {
				var treeObject = {},
					gft = new GulpFileTree({
								output: treeObject,
							   	outputTransform: 'json',
								appendProperty: null,	
								properties: ['cwd', 'relative'], 
								emitFiles: true}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd;
				});
				gft.on('end', function () {
					assert.equal(treeObject.tree['.']['b.css'].cwd, cwd); 
					assert.equal(treeObject.tree['.']['b.css'].relative, 'b.css'); 
					assert.equal(treeObject.tree['.'].two['f.txt'].cwd, cwd); 
					assert.equal(treeObject.tree['.'].two['f.txt'].relative, 'two/f.txt');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('reduces the value by assigning property values to different keys if object is passed in within array', function (done){
				var treeObject = {},
					gft = new GulpFileTree({
							output: treeObject,
						    outputTransform: 'json',	
							properties: [{'projectDir' : 'cwd'}, 'relative'], 
							emitFiles: true,
							appendProperty: null}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd;
				});
				gft.on('end', function () {
					assert.equal(treeObject.tree['.']['b.css'].projectDir, cwd); 
					assert.equal(treeObject.tree['.']['b.css'].relative, 'b.css'); 
					assert.equal(treeObject.tree['.'].two['f.txt'].projectDir, cwd); 
					assert.equal(treeObject.tree['.'].two['f.txt'].relative, 'two/f.txt');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('reduces the value by assigning the return of a function to a given key if object with a function as a value is passed in within array', function (done){
				var treeObject = {},
					cwdLength = function (value) {
						return value.cwd.length;
					},
					gft = new GulpFileTree({
							output: treeObject,
						    outputTransform: 'json',	
							properties: [{'cwdLength' : cwdLength}, 'relative'], 
							emitFiles: true,
							appendProperty: null}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd.length;
				});
				gft.on('end', function () {
					assert.equal(treeObject.tree['.']['b.css'].cwdLength, cwd); 
					assert.equal(treeObject.tree['.']['b.css'].relative, 'b.css'); 
					assert.equal(treeObject.tree['.'].two['f.txt'].cwdLength, cwd); 
					assert.equal(treeObject.tree['.'].two['f.txt'].relative, 'two/f.txt');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
		});
	
		describe('options.outputFormat', function () {
			it('outputs the raw tree if options.outputFormat is string and not found in transform-options', function (done) {
				var treeObject = {},
					gft = new GulpFileTree({
							output: treeObject,
							outputTransform: 'wrong',
							emitFiles: false,
							appendProperty: null,
							properties: ['relative']});
				gft.on('data', function () {
				});
				gft.on('end', function () {
					function checkNode(node) {
						assert(node instanceof TreeNode);
						node.children.forEach(checkNode);
					}
					checkNode(treeObject.tree);
					done();
				});
				
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});
			
			it('outputs a formatted version of the tree if options.outputFormat is \'json\'', function (done) {
				var treeObject = {},
					gft = new GulpFileTree({
								output: treeObject,
								outputTransform: 'json',
								emitFiles: false,
								appendProperty: null,
								properties: ['relative']});
				gft.on('data', function () {
				});
				gft.on('end', function () {
					function checkNode(node, path) {
						for (var key in node) {
							if (node.hasOwnProperty(key)) {
								if (node[key].isNull && !node[key].isNull()) {
									assert.equal(node[key].relative, path + key);
								} else {
									checkNode(node[key], path + key + '/');
								}
							}
						}
					}
					checkNode(treeObject.tree['.'], '');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});	
	
			it('outputs the raw tree if options.outputTransform is null', function (done) {
				var treeObject = {},
					gft = new GulpFileTree({
								output: treeObject,
								outputTransform: null,
								emitFiles: false,
								appendProperty: null,
								properties: ['relative']});
				gft.on('data', function () {
				});
				gft.on('end', function () {
					
					function checkNode(node) {
						assert(node instanceof TreeNode);
						node.children.forEach(checkNode);
					}
					checkNode(treeObject.tree);
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});	
	
			it('outputs a custom formatted version of the tree if options.outputFormat is function', function (done) {
				var treeObject = {},
					formatFunction = function (node) {
						var obj = {};
						obj.title = node.path;
							if (node.parent) {
							obj.title = node.getName();
							obj.isFile = node.isFile;
						}
						obj.files = node.children.filter(function (node) {
							return node.isFile;
						}).map(function (node) {
							return node.title;
						});
						obj.folders = node.children.filter(function (node) {
							return !node.isFile;
						}).map(function (node) {
							delete node.isFile;
							return node;
						});
						return obj;
					},
					gft = new GulpFileTree({
								emitFiles: true,
								output: treeObject,
								outputTransform: formatFunction,
								appendProperty: null,
								properties: ['relative']}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd;
				});
				gft.on('end', function () {
					var tree = treeObject.tree;
					assert.equal(tree.title, cwd + '/test/fixture/path/to/folder');
					assert.equal(tree.files.length, 2);
					assert.equal(tree.folders.length, 2);
					assert.equal(tree.folders[0].title, 'one');
					assert.equal(tree.folders[0].files.length, 3);
					assert.equal(tree.folders[1].title, 'two');
					assert.equal(tree.folders[1].files.length, 2);
					assert.equal(tree.folders[1].folders.length, 1);
					assert.equal(tree.folders[1].folders[0].files.length, 1);
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});		
		});

		describe('options.appendProperty', function () {
			it ('appends the tree (post transform) to each file passed in on the given property - (RAW)', function (done) {
					var treeObject = {},
					gft = new GulpFileTree({
								emitFiles: true,
								output: treeObject,
								outputTransform: 'raw',
								appendProperty: 'tree',
								properties: ['relative']}),
					files = [];
				gft.on('data', function (file) {
					files.push(file);
								});
				gft.on('end', function () {
					files.forEach(function (file) {
						assert(file.tree instanceof TreeNode);
						assert.equal(file.tree.path, treeObject.tree.path);
						assert.equal(file.tree.children[2].path, treeObject.tree.children[2].path);
						assert.equal(file.tree.children[3].children[0].path, treeObject.tree.children[3].children[0].path);
					});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
			
			it ('appends the tree (post transform) to each file passed in on the given property - (JSON)', function (done) {
				var treeObject = {},
					gft = new GulpFileTree({
								emitFiles: true,
								output: treeObject,
								outputTransform: 'json',
								appendProperty: 'file-tree-struct',
								properties: ['relative']}),
					files = [];
				gft.on('data', function (file) {
					files.push(file);
				});
				gft.on('end', function () {
					function checkNode(node, testNode) {
						for (var key in node) {
							if (node.hasOwnProperty(key)) {
								if (node[key].isNull && !node[key].isNull()) {
									assert.equal(node[key].relative, testNode[key].relative);
								} else {
									checkNode(node[key], testNode[key]);
								}
							}
						}
					}
					files.push(function (file) {
						checkNode(file['file-tree-struct']['.'], treeObject.tree['.']);
	
					});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);

			});	
		});		
	});
});
