var assert = require('assert'),
	FileNode = require('../lib/TreeNode');

describe('FileNode', function () {
	describe('constructor', function () {
		it('returns populated TreeNode object', function () {
			var tn = new FileNode(undefined, 'path/to/file', undefined);
			assert.equal(tn.value, undefined);
			assert.equal(tn.path, 'path/to/file');
			assert.equal(tn.parent, undefined);
		});
	});
});
