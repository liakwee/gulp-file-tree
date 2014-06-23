 var TreeNode = function (value, path, parent) {
	var self = this;
	self.path = path;
	self.children = [];
	self.parent = parent;
	this.setValue(value)
}

TreeNode.prototype.setValue = function (value) {
	this.value = value;
	this.isFile = !!(this.value && !this.value.isNull());
	this.isFolder = !!(!this.value || this.value.isNull());
	if (value) {
		this.path = value.path;
	}
}

TreeNode.prototype.getName = function () {
	var label = '.';
	if (this.parent) {
		label = this.path.replace(this.parent.path + '/', '');
	}
	return label;
}

TreeNode.prototype.addChild = function (child) {
	var found = this.findChildByPath(child.path);
	if (found) {
		found.setValue(child.value ? child.value : found.value);
		return;
	}

	var path = child.path,
		folderPath = path.replace(/\/?[^\/]*\/?$/, ''),
		parent;

 	if (folderPath === '') {
		//folderPath = child
	}	
	parent = this.label === folderPath ? this : this.findChildByPath(folderPath);

	if (!parent) {
		parent = this.addChild(new TreeNode(undefined, folderPath));
	}
	parent.children.push(child);
	child.parent = parent; 
	return child;
}

TreeNode.prototype.findChildByPath = function (path) {
	var node;
	if (this.path === path) {
		return this;
	}

	for (var i = 0; i < this.children.length; i++) {
		node = this.children[i].findChildByPath(path);
		if (node) {
			break;
		}
	}
	return node;
}

//surplus to requirements

TreeNode.prototype.pruneRoot = function () {
	var temp = this;
	while (temp.children.length === 1) {
		temp = temp.children[0];
	}
	return temp;
}

TreeNode.prototype.map = function (func) {
	var self = new TreeNode(this.value, this.path, this.parent);
	
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
				if (typeof property === 'object') {
					var prop;
					for (key in property) {
						if (property.hasOwnProperty(key)) {
							prop = key;
						}
					}
					valueObj[prop] = property[prop](node.value);
				} else {
					var val = node.value[property];
					//if it's a buffer get get the contents rather than the buffer itself
					val = Buffer.isBuffer(val) ? val.toString() : val;
					valueObj[property] = val; 
				}
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
		if (node.isFolder) {
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
