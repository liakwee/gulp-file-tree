'use strict';

function jsonTransform (node) {
	var newNode = {};
	if (node.isFile) {
		newNode[node.getName()] = node.value;
		return newNode;
	}
	newNode[node.getName()] = node.children.reduce(function (prev, curr) {
		for (var key in curr){
			if (curr.hasOwnProperty(key)) {
				prev[key] = curr[key];
			}
		}
		return prev;
	}, {});
	return newNode;
}


module.exports = {
	JSON: jsonTransform
};
