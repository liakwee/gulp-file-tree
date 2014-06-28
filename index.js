'use strict';

var TreeNode = require('./lib/TreeNode.js'),
	TRANSFORM_OPTS = require('./lib/transform-options.js'),
	util = require('util'),
	File = require('vinyl'),
	Transform = require('readable-stream').Transform;

function gulpFileTree(options) {
	/*jshint validthis:true */
	Transform.call(this, {objectMode: true});
	this.files = [];
	
	//output to external file or object (no output if set to 'none')
	this.output = options.output || 'tree';						
	//format type - 'json', 'raw', a function can be passed to custom format
	this.outputTransform = this.setOutputTransform(options.outputTransform);	
	//property to use when appending tree to file
	this.appendProperty = options.appendProperty || null;		
	//whether or not to emit files used to build tree
	this.emitFiles = options.emitFiles || false;				
	//properties to take from each file node in tree	
	this.properties = options.properties || ['relative'];		
}


util.inherits(gulpFileTree, Transform);

gulpFileTree.prototype.setOutputTransform = function (format) {
	if (typeof format === 'function') {
		 return format;
	}
	if (typeof format === 'string') {
		for (var key in TRANSFORM_OPTS) {
			if (TRANSFORM_OPTS.hasOwnProperty(key)) {
				if (format === TRANSFORM_OPTS[key].title) {
					return TRANSFORM_OPTS[key].transformFunction;
				}
			}
		}
	}
	return TRANSFORM_OPTS.JSON.transformFunction;
};

gulpFileTree.prototype.outputFiles = function () {
	if (this.emitFiles) {
		var self = this;
		self.files.forEach(function (file) {
			if (self.appendProperty) {
				file[self.appendProperty] = self.tree;
			}
			self.push(file);
		});
	}
};

gulpFileTree.prototype.outputTree = function () {
	if (this.output && this.output !== 'none') {

		if (typeof this.output === 'object') {
			/*for (var key in this.tree) {
				if (this.tree.hasOwnProperty(key)) {
					this.output[key] = this.tree[key];
				}
			} */
			this.output.tree = this.tree;
			return;
		}
		if (typeof this.output === 'string') {
		 	var contents = (this.tree instanceof TreeNode) ? this.tree.removeCircular() : this.tree;
			this.push(new File({
				base: '',
				path: this.output + '.json',
				contents: new Buffer(JSON.stringify(contents, null, '\t'))
			}));
		}
	}
};

gulpFileTree.prototype._transform = function (file, encoding, callback) {
	this.tree = this.tree || new TreeNode(file.cwd);
	this.files.push(file);
	this.tree.addChildNode(new TreeNode(file.path, file));
	callback();
};

gulpFileTree.prototype._flush = function (callback) {
	if (this.tree) {
		this.tree = this.tree.pruneRoot();
		this.tree = this.tree.reduceValue(this.properties);
		this.tree = this.tree.map(this.outputTransform);
	} else {
		this.tree = {};
	}
	this.outputFiles();
	this.outputTree();	
	callback();
};


module.exports = function (options) {
	options = options || {};
	return new gulpFileTree(options);
};
