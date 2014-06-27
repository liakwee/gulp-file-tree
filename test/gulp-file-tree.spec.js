var assert = require('assert'),
	gulp = require('gulp'),
	TreeNode = require('../lib/TreeNode'),
	gulpFileTree = require('../gulp-file-tree');

describe('gulp-file-tree', function () {

	it('handles being passed no files', function (done) {
		var treeObject= {},
			gft = gulpFileTree({
				output: treeObject
			}),
			files = [];
		gft.on('data', function (file){
			files.push(file);
		});
		gft.on('end', function () {
			assert.equal(files.length, 0);
			assert.deepEqual(treeObject, {});
			done();
		});

		gulp.src('no/such/folder/**/*')
			.pipe(gft);
	});

	describe('options', function () {

		describe('default', function () {
			it('outputs a file tree representing passed in files in \'json\' style', function (done) {
				var gft = gulpFileTree(),
					files = [];
				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					var tree = JSON.parse(files[0].contents.toString());
					assert.equal(files.length, 1);
					assert.equal(files[0].path, 'tree.json');
					assert.deepEqual(tree['.']['a.html'], {'relative' : 'a.html'});
					assert.deepEqual(tree['.']['one']['c.json'], {'relative' : 'one/c.json'});
					assert.deepEqual(tree['.']['two']['three']['a.html'], {'relative' : 'two/three/a.html'});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});
		});
	
		describe('options.output', function () {
				it('saves output as json file to given file path if options.output is a string', function (done) {
				var gft = gulpFileTree({output: 'path/to/tree'}),
					files = [];
				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					var tree = JSON.parse(files[0].contents.toString());
					assert.equal(files.length, 1);
					assert.equal(files[0].path, 'path/to/tree.json');
					assert.deepEqual(tree['.']['a.html'], {'relative' : 'a.html'});
					assert.deepEqual(tree['.']['one']['c.json'], {'relative' : 'one/c.json'});
					assert.deepEqual(tree['.']['two']['three']['a.html'], {'relative' : 'two/three/a.html'});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('sets output on object if output.options is an object', function (done) {
				var treeObject = {},
					gft = gulpFileTree({output: treeObject}),
					files = [];
				gft.on('data', function (file){
					files.push(file);
				});
				gft.on('end', function () {
					assert.equal(files.length, 0);
					assert.deepEqual(treeObject['.']['a.html']['relative'], 'a.html');
					assert.deepEqual(treeObject['.']['one']['c.json']['relative'], 'one/c.json');
					assert.deepEqual(treeObject['.']['two']['three']['a.html']['relative'], 'two/three/a.html');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('does not output tree if output.options is set to \'none\'', function (done) {
				var gft = gulpFileTree({output: 'none'}),
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
			it('does not emits files used to build the tree if output.emitFiles is false', function (done) {
				var gft = gulpFileTree({output: {}, emitFiles: false}),
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
				var gft = gulpFileTree({output: {}, emitFiles: true}),
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
					gft = gulpFileTree({
								output: treeObject, 
								properties: ['cwd', 'relative'], 
								emitFiles: true}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd;
				});
				gft.on('end', function () {
					assert.equal(treeObject['.']['b.css']['cwd'], cwd); 
					assert.equal(treeObject['.']['b.css']['relative'], 'b.css'); 
					assert.equal(treeObject['.']['two']['f.txt']['cwd'], cwd); 
					assert.equal(treeObject['.']['two']['f.txt']['relative'], 'two/f.txt');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
			it('reduces the value by assigning property values to different keys if object is passed in within array', function (done){
				var treeObject = {},
					gft = gulpFileTree({
							output: treeObject, 
							properties: [{'projectDir' : 'cwd'}, 'relative'], 
							emitFiles: true}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd;
				});
				gft.on('end', function () {
					assert.equal(treeObject['.']['b.css']['projectDir'], cwd); 
					assert.equal(treeObject['.']['b.css']['relative'], 'b.css'); 
					assert.equal(treeObject['.']['two']['f.txt']['projectDir'], cwd); 
					assert.equal(treeObject['.']['two']['f.txt']['relative'], 'two/f.txt');
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
					gft = gulpFileTree({
							output: treeObject, 
							properties: [{'cwdLength' : cwdLength}, 'relative'], 
							emitFiles: true}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd.length;
				});
				gft.on('end', function () {
					assert.equal(treeObject['.']['b.css']['cwdLength'], cwd); 
					assert.equal(treeObject['.']['b.css']['relative'], 'b.css'); 
					assert.equal(treeObject['.']['two']['f.txt']['cwdLength'], cwd); 
					assert.equal(treeObject['.']['two']['f.txt']['relative'], 'two/f.txt');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
	
		});
	
		describe('options.outputFormat', function () {
			it('outputs the json tree if options.outputFormat is neither \'json\' or \'raw\'', function (done) {
				var treeObject = {},
					gft = gulpFileTree({
							output: treeObject,
							outputTransform: 'wrong'});
				gft.on('data', function (file) {
				});
				gft.on('end', function () {
					var keys = [];
					function checkNode(node) {
						for (key in node) {
							if (node.hasOwnProperty(key)) {
								if (node[key].isNull && !node[key].isNull()) {
									assert(!!node[key].relative);
								} else {
									checkNode(node[key]);
								}
							}
						}
					}
					checkNode(treeObject);
					done();
				});
				
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});
			
			it('outputs a formatted version of the tree if options.outputFormat is \'json\'', function (done) {
				var treeObject = {},
					gft = gulpFileTree({
								output: treeObject,
								outputTransform: 'json'});
				gft.on('data', function (file) {
				});
				gft.on('end', function () {
					function checkNode(node, path) {
						for (key in node) {
							if (node.hasOwnProperty(key)) {
								if (node[key].isNull && !node[key].isNull()) {
									assert.equal(node[key].relative, path + key);
								} else {
									checkNode(node[key], path + key + '/');
								}
							}
						}
					}
					checkNode(treeObject['.'], '');
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});	
	
			it('outputs the raw tree if options.outputFormat is \'raw\'', function (done) {
				var treeObject = {},
					gft = gulpFileTree({
								output: treeObject,
								outputTransform: 'raw'});
				gft.on('data', function (file) {
				});
				gft.on('end', function () {
					function checkNode(node) {
						assert(node instanceof TreeNode);
						node.children.forEach(checkNode);
					}
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
							return node.isFile
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
					gft = gulpFileTree({
								emitFiles: true,
								output: treeObject,
								outputTransform: formatFunction}),
					cwd;
				gft.on('data', function (file) {
					cwd = file.cwd;
				});
				gft.on('end', function () {
					assert.equal(treeObject.title, cwd + '/test/fixture/path/to/folder');
					assert.equal(treeObject.files.length, 2);
					assert.equal(treeObject.folders.length, 2);
					assert.equal(treeObject.folders[0].title, 'one');
					assert.equal(treeObject.folders[0].files.length, 3)
					assert.equal(treeObject.folders[1].title, 'two')
						assert.equal(treeObject.folders[1].files.length, 2);
					assert.equal(treeObject.folders[1].folders.length, 1);
					assert.equal(treeObject.folders[1].folders[0].files.length, 1);
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
			});		
		});

		describe('options.appendProperty', function () {
			it ('appends the tree (post transform) to each file passed in on the given property - (RAW)', function (done) {
					var treeObject = {},
					gft = gulpFileTree({
								emitFiles: true,
								output: treeObject,
								outputTransform: 'raw',
								appendProperty: 'tree'}),
					files = [];
				gft.on('data', function (file) {
					files.push(file);
								});
				gft.on('end', function () {
					files.forEach(function (file) {
						assert(file.tree instanceof TreeNode);
						assert.equal(file.tree.path, treeObject.path);
						assert.equal(file.tree.children[2].path, treeObject.children[2].path);
						assert.equal(file.tree.children[3].children[0].path, treeObject.children[3].children[0].path);
					});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);
	
			});
			
			it ('appends the tree (post transform) to each file passed in on the given property - (JSON)', function (done) {
				var treeObject = {},
					gft = gulpFileTree({
								emitFiles: true,
								output: treeObject,
								outputTransform: 'json',
								appendProperty: 'file-tree-struct'}),
					files = [];
				gft.on('data', function (file) {
					files.push(file);
				});
				gft.on('end', function () {
					function checkNode(node, testNode) {
						for (key in node) {
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
						checkNode(file['file-tree-struct']['.'], treeObject['.']);
	
					});
					done();
				});
	
				gulp.src('test/fixture/path/to/folder/**/*')
					.pipe(gft);

			});	
		});		
	});
});
