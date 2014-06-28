[gulp](https://github.com/wearefractal/gulp)-file-tree [![Build Status](https://travis-ci.org/iamcdonald/gulp-file-tree.svg?branch=master)](https://travis-ci.org/iamcdonald/gulp-file-tree)
==============

Create a file tree from files passed in via [gulp](https://github.com/wearefractal/gulp).

## Install

```sh
$ npm install --save-dev gulp-file-tree
```

## Usage

```js
var gulp = require('gulp'),
    gft = require('gulp-file-tree');

gulp.task('default', function () {
	return gulp.src('src/pages/*.html')
		.pipe(gft())
		.pipe(gulp.dest('dist'));
});
```
The default created tree (saved as 'tree.json') would look like this:
```
{
  '.': {
    'one.html': {'relative' : 'one.html'},
    'two.html': {'relative' : 'two.html'},
    'three' : {
      'four.html': {'relative' : 'four.html'},
      'five.html': {'relative' : 'five.html'}
    }
  }
}
```

for the following file structure: 
```
* src/
  * pages/
    * one.html
    * two.html
    * three/
      * four.html
      * five.html
```

## API

### gulp-file-tree(options)

#### options.output (default: 'tree')
Type: `String|Object`

If an object is supplied the resulting file tree is placed on that object under the property 'tree'.

If a string is supplied the resulting file tree is saved as a .json file using the string as a relative file path.

#### options.properties (default: ['relative'])
Type: `Array`

An array of Strings and Objects used to decode the passed in vinyl File objects to the objects found in the resulting file tree.

Strings simply transplant the property of the passed in [vinyl](https://github.com/wearefractal/vinyl) File on to the new object under the same property.

An object like:
`
{'point' : 'cwd'}
`
will pull the property `cwd` from the [vinyl](https://github.com/wearefractal/vinyl) File and place it on the new object under the property `point`.

An object like:
`
{'cwdLength' : function (file) {
  return file.cwd.length;
}}
`
will place the returned value of the function on the new object under the property `cwdLength`.

#### options.outputTransform (default: 'json')
Type: `String|Function`

Allows custom post processing of the resulting file tree.

A string can be used to select either 'raw' (unadulterated file tree) or 'json' (a cut down version sutiable for saving as a.json file).

Alternatively a custom function can be passed in which will be ran on every node (in order from the leaf-nodes back to the root-node) before the file tree is output. (As a starting point the function used when the string 'json' is supplied can be found in lib/transform-options.js).


#### options.emitFiles (default: false)
Type: `Boolean`

Indicates whether files passed in should be emitted.

#### options.appendProperty (default: null)
Type: `String`

A property under which the resulting file tree will be placed on each file object passed through the plugin.
(Only of use when emitFiles is true).
