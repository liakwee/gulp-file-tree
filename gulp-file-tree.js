var TreeNode = require('./lib/TreeNode.js'),
	FORMAT_OPTS = require('./lib/format-options.js'),
	util = require('util'),
	File = require('vinyl'),
	Transform = require('readable-stream').Transform;

util.inherits(gulpFileTree, Transform);


function gulpFileTree(options) {
	Transform.call(this, {objectMode: true});
	this.files = [];
	this.tree;
	
	//output to external file or object (no output if set to 'none')
	this.output = options.output || 'tree';						
	//format type - 'json', 'raw', a function can be passed to custom format
	this.outputFormat = this.setOutputFormat(options.outputFormat);	
	//property to use when appending tree to file
	this.appendProperty = options.appendProperty || null;		
	//whether or not to emit files used to build tree
	this.emitFiles = options.emitFiles || false;				
	//properties to take from each file node in tree	
	this.properties = options.properties || null;		
}

gulpFileTree.prototype.setOutputFormat = function (format) {
	if (typeof format === 'function') {
		 return format;
	}
	if (typeof format === 'string') {
		for (key in FORMAT_OPTS) {
			if (FORMAT_OPTS.hasOwnProperty(key)) {
				if (format === FORMAT_OPTS[key].title) {
					console.log(key);
					return FORMAT_OPTS[key];
					break;
				}
			}
		}
	}
	return FORMAT_OPTS.RAW;
}

gulpFileTree.prototype.outputFiles = function () {
	if (this.emitFiles) {
		var self = this;
		self.files.forEach(function (file) {
			if (self.appendTreeProperty) {
				file[self.appendTreeProperty] = self.tree.findNodeByPath(file.path);
			}
			self.push(file);
		});
	}
}

gulpFileTree.prototype.outputTree = function () {
	if (this.output && this.output !== 'none') {

		if (typeof this.output === 'object') {
			for (key in this.tree) {
				if (this.tree.hasOwnProperty(key)) {
					this.output[key] = this.tree[key];
				}
			} 
			return;
		}
		if (typeof this.output === 'string') {
		 	var contents = (this.tree instanceof TreeNode) ? this.tree.removeCircular() : this.tree;
			this.push(new File({
				base: '',
				path: this.output + '.json',
				contents: new Buffer(JSON.stringify(contents, null, '\t'))
			}))
		}
	}
}

gulpFileTree.prototype._transform = function (file, encoding, callback) {
	this.tree = this.tree || new TreeNode(file.cwd);
	this.files.push(file);
	this.tree.addNode(new TreeNode(file.path, file));
	callback();
}

gulpFileTree.prototype._flush = function (callback) {
	var self = this,
		treeNode;
	//self.tree = self.tree.removeRedundancy();
	self.tree = self.tree.pruneRoot();
	self.tree = self.tree.reduceValue(this.properties);
	self.tree = self.tree.map(this.outputFormat.formatFunction);
	self.outputFiles();
	self.outputTree();	
	callback();
}


module.exports = function (options) {
	options = options || {};
	return new gulpFileTree(options);
};
