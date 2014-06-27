 var TreeNode = function (path, value, parent) {
	var self = this;
	self.path = path;
	self.children = [];
	self.parent = parent || null;
	this.setValue(value)
}

TreeNode.prototype.setValue = function (value) {
	this.value = value;
	this.isFile = !!(this.value && !this.value.isNull());
}

TreeNode.prototype.update = function (node) {
	this.setValue(node.value);
}

TreeNode.prototype.getName = function () {
	var label = '.';
	if (this.parent) {
		label = this.path.replace(this.parent.path + '/', '');
	}
	return label;
}

TreeNode.prototype.getRoot = function () {
	var root = this;
	while (this.parent) {
		root = this.parent;
	}
	return root;
}

TreeNode.prototype.updateTree = function (node) {
	var root = this.getRoot();
	if (existingNode = root.findNodeByPath(node.path)) {
		existingNode.update(node);
		return;
	}
	root.addNode(node);
}

TreeNode.prototype.addNode = function (node) {

	if (!node.path.match(this.path)) {
		//cannot add node under current node
		throw new Error();
		return;
	}

	//find folder and add file to it
	var path = node.path,
		folderPath = path.replace(/\/?[^\/]*\/?$/, ''),
		parent;

	parent = this.path === folderPath ? this : this.findNodeByPath(folderPath);

	if (!parent) {
		parent = this.addNode(new TreeNode(folderPath));
	}
	parent.children.push(node);
	node.parent = parent; 
	return node;
}

TreeNode.prototype.findNodeByPath = function (path) {
	var found = null;
	if (this.path === path) {
		return this;
	}

	this.children.some(function (node) {
		return found = node.findNodeByPath(path);
	});

	return found;
}

TreeNode.prototype.pruneRoot = function () {
	var temp = this;
	while (temp.children.length === 1) {
		temp = temp.children[0];
		temp.parent = null;
	}
	return temp;
}

TreeNode.prototype.map = function (func) {
	var self = new TreeNode(this.path, this.value, this.parent);
	
	this.children.forEach(function (node) {
		self.children.push(node.map(func));
	});

	if (typeof func !== 'function') {
		return self;
	}
	return func(self);
}

TreeNode.prototype.reduceValue = function (properties) {
	return this.map(function (node) {
		if (node.value) {
			var valueObj = {};
			properties.forEach(function (property) {
				var valueProp = property,
					newProp = property,
					val;
				if (typeof property === 'object') {
					var prop;
					for (key in property) {
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
				//if it's a buffer get get the contents rather than the buffer itself
				val = Buffer.isBuffer(val) ? val.toString() : val;
				valueObj[valueProp] = val; 
				
			});
			var isNull = node.value.isNull();
			valueObj.isNull = function () {
				return isNull;
			}
			node.value = valueObj;
		}
		return node;
	});
}

TreeNode.prototype.jsonStyle = function () {
	return this.map(function (node) {
		var newNode = {}
		if (!node.isFile) {
			newNode[node.getName()] = node.children;
			return newNode
		}
		newNode[node.getName()] = node.value;
		return newNode;
	});

}

TreeNode.prototype.removeCircular = function() {
	return this.map(function (node) {
		node.parent = node.parent ? node.parent.path : node.parent;
		return node;
	});	
}

TreeNode.prototype.asJSON = function () {
	var temp = this.removeCircular();
	return JSON.stringify(temp, null, '    ');
}


module.exports = TreeNode;
