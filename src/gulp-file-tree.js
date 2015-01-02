'use strict';

var Forestry = require('forestry'),
	util = require('util'),
	File = require('vinyl'),
	Transform = require('readable-stream').Transform;

var GulpFileTree = function (opts) {

	var files = [],
		tree = null,
		gft,
		defaultOptions = {
			emitTree: true,
			transform: null,
			emitFiles: false
		};
	
	function overlayDefaults(options) {
		for (var key in defaultOptions) {
			if (!options.hasOwnProperty(key)) {
				options[key] = defaultOptions[key];
			}
		}
		return options;
	}

	opts = opts || {};
	opts = overlayDefaults(opts);

	if (opts.transform && typeof opts.transform !== 'function') {
		throw new TypeError('\'transform\' option must be of type \'function\''); 
	}

	function isVinylFile(file) {
		return file &&
				typeof file.pipe === 'function' &&
				typeof file.isBuffer === 'function' &&
				typeof file.isStream === 'function' &&
				typeof file.inspect === 'function' &&
				typeof file.inspect() === 'string';
	}

	function transformTree (file) {
		if (opts.transform) {
			return opts.transform(tree.clone(), file);
		}
		return tree;
	}

	function outputFiles () {
		for (var i = 0, len = files.length; i < len; i++) {
			files[i].tree = transformTree(files[i]);
			gft.push(files[i]);
		}
	}

	function rawToJSON(tree) {
		if (tree instanceof Forestry.Node) {
			return tree.traverse(function (node) {
				var data;
				if (isVinylFile(node.data)) {
					data = {
						cwd: node.data.cwd,
						base: node.data.base,
						path: node.data.path,
						relative: node.data.relative,
						name: node.data.path.replace(/.*\//, ''),
						isFile: node.data.stat ? node.data.stat.isFile() : false,
						isDirectory: node.data.stat ? node.data.stat.isDirectory() : true
					};
				} else {
					data = node.data === Object(node.data) ? node.data : {data: node.data};
				}
				data.children = [];
				for (var i = 0, l = node.children.length; i < l; i++) {
					data.children[i] = node.children[i].data;
				}
				node.data = data;

			}, Forestry.TRAVERSAL_TYPES.DFS_POST).data;
		}
		return tree;
	}


	function outputTree () {
		if (tree) {
			tree = transformTree();
		}
		tree = rawToJSON(tree);
		gft.push(new File({
			cwd: '',
			base: '',
			path: 'tree.json',
			contents: new Buffer(JSON.stringify(tree, null, '\t'))
		}));
	}

	function updateNodeIfExists (file, tree) {
		var found = tree.find(function (n) {
			return n.data.path === file.path;
		});
		if (found) {
			found.data = file;
		}
		return !!found;
	}

	function addFileToTree (file, tree) {
		if (updateNodeIfExists(file, tree)) {
			return;
		}
		var path = file.path.replace(/\/?[^\/]*\/?$/, ''),
			found = tree.find(function (n) {
				return n.data.path === path;
			}),
			newNode;
		if (!found) {
			found = addFileToTree(new File({
				cwd: file.cwd,
				base: file.base,
				path: path
			}), tree);
		}
		newNode = new Forestry.Node(file);
		found.addChild(newNode);
		return newNode;
	}

	var GulpFileTree = function () {
		/*jshint validthis:true */
		Transform.call(this, {objectMode: true});
		/*jshint validthis:false */
	};

	util.inherits(GulpFileTree, Transform);

	GulpFileTree.prototype._transform = function (file, encoding, callback) {
		tree = tree || new Forestry.Node(new File({
			cwd: file.cwd,
			base: file.cwd,
			path: file.cwd
		}));
		files.push(file);
		addFileToTree(file, tree);
		callback();
	};
	
	GulpFileTree.prototype._flush = function (callback) {
		if (tree) {
			tree.traverse(function (n) {
				tree = n;
				if (n.children.length > 1) {
					return null;
				}
			});
			tree = tree.remove();
		}
		if (opts.emitFiles) {
			outputFiles();
		}
		if (opts.emitTree) {
			outputTree();
		}	
		callback();
	};

	gft = new GulpFileTree(opts);
	return gft;
};


module.exports = function (options) {
	return new GulpFileTree(options);
};

