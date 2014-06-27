var assert = require('assert'),
	gulp = require('gulp'),
	gulpFileTree = require('../gulp-file-tree');

describe('gulp-file-tree', function () {

	describe('default', function () {
		it('outputs file tree of passed in files', function () {
			var gft = gulpFileTree();
			gft.on('data', function (){
				assert.equals(true, false, 'data');
			});
			gft.on('end', function () {
				console.log('end');
			});

			gulp.src('test/fixture/path/to/folder/**/*')
				.pipe(gft);
		});
	});
});
