# OJ with middlewares

[oj](https://github.com/musictheory/oj) is a subset of JavaScript (ES5) with Objective-C syntax. This is a layer ontop of the original compiler that allows you to add middlewares.

## What is this useful for?

There is an example included: a basic preprocessor. It allows you to include other OJ files within your file. This feels more natural in comparsion to Objective-C/Objective-C++ and allows you to build a foundation and include the parts you need from it.

Example:

```objective-c++
#include "Foo.oj"

@implementation Bar : Foo
// Your code
@end
```

As you can see, you can include another file that holds the implementation for another class. You can extend from it or anything else. It will be included in your source code.


## How to use
There is a small command line program (juicy) that allows you to run the OJ compiler underneath the middleware layer, with the preprocessor included. The options are:

| Option       | Effect                                                             |
|--------------|--------------------------------------------------------------------|
| `-o`         | Where the output file should go. Default: `a.out`                  |
| `-I`         | Add a path to the include path.                                    |
| `-D foo=bar` | Define `foo` to be `bar`. This works like a traditional `#define`. |

There are other options that can be used with OJ itself:

- `--warn-unused-ivars`: Warn when an instance variable is not used.
- `--warn-unknown-ivars`: Warn when an unknown instance variable is attempted to be used.
- `--warn-unknown-selector`: Warn when trying to access an unknown selector.
- `--warn-this-in-methods`: Warn when `this` is being used in a method.
- `--source-map-file`: Produce a sourcemap file.
- `--source-map-root`: Define the root path for the sourcemap.

An example execution would be:

    $ juicy app.oj -o app.js

Any file given that does not stick to an option will be treatened as an input file.

## How to use in code

```JavaScript
var juicy = require("juicy");

// Use the preprocessor
juicy.use("pre-compile", juicy.preprocessor());

// Add your own transformation
juicy.use("pre-compile", function(ctx, next){
    // ...
    next();
});

// Or, after.
juicy.use("post-compile", function(ctx, next){
    // ...
    next();
});

// Run the compiler
juicy.compile({
    files: [...{...}...],
    preprocessor: {
        include_path: [],
        defines: {}
    }
}, function(err, res){
    // this is equivalent to OJ's original callback.
});
```
