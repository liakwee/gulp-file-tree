'use strict';

var util = require('util'),
	File = require('vinyl'),
	objectMerge = require('object-merge'),
	FileTree = require('./FileTree'),
	Transform = require('readable-stream').Transform;

var GulpFileTree = function (opts) {

	var files = [],
		fileTree,
		gft;

	opts = objectMerge({
		emitTree: true,
		transform: null,
		emitFiles: false
	}, opts || {});

	if (opts.transform && typeof opts.transform !== 'function') {
		throw new TypeError('\'transform\' option must be of type \'function\'');
	}

	fileTree = new FileTree(opts.transform);

	function outputFiles () {
		for (var i = 0, len = files.length; i < len; i++) {
			files[i].tree = fileTree.getTree(files[i]);
			gft.push(files[i]);
		}
	}

	function outputTree () {
		var tree = fileTree.getNonCircularTree(),
			fileName =  typeof opts.emitTree === 'string' ? opts.emitTree : 'tree';
		gft.push(new File({
			cwd: '',
			base: '',
			path: fileName + '.json',
			contents: new Buffer(JSON.stringify(tree, null, '\t'))
		}));
	}

	var GulpFileTree = function () {
		/*jshint validthis:true */
		Transform.call(this, {objectMode: true});
		/*jshint validthis:false */
	};

	util.inherits(GulpFileTree, Transform);

	GulpFileTree.prototype._transform = function (file, encoding, callback) {
		files.push(file);
		fileTree.addFileToTree(file);
		callback();
	};

	GulpFileTree.prototype._flush = function (callback) {
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
