module.exports = {
	JSON: {
		title: 'json',
		formatFunction: function (node) {
			var newNode = {}
			if (node.isFolder) {
				newNode[node.getName()] = node.children;
				return newNode
			}
			newNode[node.getName()] = node.value;
			return newNode;
		}
	},
	RAW: {
		title: 'raw',
		formatFunction: null
	}
};
