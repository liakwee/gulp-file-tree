'use strict';

var TreeNode = require('./TreeNode.js'),
	TRANSFORM_OPTS = require('./transform-options.js'),
	util = require('util'),
	File = require('vinyl'),
	Transform = require('readable-stream').Transform;

var GulpFileTree = function (opts) {

	var options,
		files = [],
		tree,
		gft,
		defaultOptions = {
			output: 'tree',
			outputTransform: null,
			emitFiles: false,
			appendProperty: null, 
			properties: ['relative']
		};
	
	function overlayDefaults(options) {
		for (var key in defaultOptions) {
			if (!options.hasOwnProperty(key)) {
				options[key] = defaultOptions[key];
			}
		}
		return options;
	}
	
	function decodeOuputTransform(format) {
		if (typeof format === 'function') {
			 return format;
		}
		if (typeof format === 'string') {
			return TRANSFORM_OPTS[format.toUpperCase()];
		}
		return null;
	}

	function reduceValueUsingProperties(node) {
		if (node.value) {
			var valueObj = {},
		   		isNull = node.value.isNull();
				valueObj.isNull = function () {
					return isNull;
				};
			if (!isNull) {
				options.properties.forEach(function (property) {
					var valueProp = property,
						newProp = property,
						val;
					if (typeof property === 'object') {
						for (var key in property) {
							if (property.hasOwnProperty(key)) {
								valueProp = key;
								newProp = property[key];
							}
						}
					}
					if (typeof newProp === 'object') {
						throw new Error();
					}
	
					if (typeof newProp === 'function') {
						val = newProp(node.value);
					} else {
						val = node.value[newProp];
					}
					valueObj[valueProp] = val; 
				});
			}
			
			node.value = valueObj;
		}
		
		return node;
	}

	function removeParentCircularReference(node) {
		node.parent = node.parent ? node.parent.path : node.parent;
		return node;
	}
	
	function outputFiles() {
		if (options.emitFiles) {
			files.forEach(function (file) {
				if (options.appendProperty) {
					file[options.appendProperty] = tree;
				}
				gft.push(file);
			});
		}
	}

	function outputTree() {
		if (options.output) {
	
			if (typeof options.output === 'object') {
				options.output.tree = tree;
				return;
			}
			if (typeof options.output === 'string') {
			 	var contents = (tree instanceof TreeNode) ? tree.map(removeParentCircularReference) : tree;
				gft.push(new File({
					base: '',
					path: options.output + '.json',
					contents: new Buffer(JSON.stringify(contents, null, '\t'))
				}));
			}
		}
	}

	var GulpFileTree = function (opts) {
		
		/*jshint validthis:true */
		Transform.call(this, {objectMode: true});
		if (opts.outputTransform) {
			opts.outputTransform = decodeOuputTransform(opts.outputTransform);
		}
		options = overlayDefaults(opts);
	};



	util.inherits(GulpFileTree, Transform);


	GulpFileTree.prototype._transform = function (file, encoding, callback) {
		tree = tree || new TreeNode(file.cwd);
		files.push(file);
		tree.addNodeToTree(new TreeNode(file.path, file));
		callback();
	};
	
	GulpFileTree.prototype._flush = function (callback) {
		if (tree) {
			tree = tree.pruneRoot();
			tree = options.properties ? tree.map(reduceValueUsingProperties) : tree;
			tree = tree.map(options.outputTransform);
		} else {
			tree = {};
		}
		outputFiles();
		outputTree();	
		callback();
	};

	gft = new GulpFileTree(opts);
	return gft;
};


module.exports = function (options) {
	return new GulpFileTree(options);
};

