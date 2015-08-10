var defaultOptions = {
    include_path: [],
    defines: []
};

var rules = {
    strict_include: /^include\s<(.+)>$/i,
    relative_include: /^include\s"(.+)"$/i,
    define: /^define\s(.+)?\s(.+)$/i,
    undefine: /^undefine\s(.+)$/i,
    ifdef: /^ifdef\s(.+)$/i,
    ifndef: /^ifndef\s(.+)$/i,
    "if": /^if\s(.+)$/i,
    elif: /^elif\s(.+)$/i,
    else: /^else$/i,
    endif: /^endif$/i,
    pragma: /^pragma\s(.+)$/i
};

// Modules
var path = require("path");
var extend = require("util")._extend;
var fs = require("fs");

function Preprocess(source, filename, options, level, parts, state) {
    if(typeof options != "object") {
        throw new TypeError("Preprocessor expects options to be an object.");
    } else if(typeof options.include_path != "object" && options.include_path.prototype != Array.prototype) {
        var type = typeof(options.include_path);
        throw new TypeError("Preprocessor expects the options.include_path parameter to be an array. Got: "+type);
    } else if(typeof options.defines != "object") {
        throw new TypeError("Preprocessor expects options.defines to be an object.");
    }

    // For the stuff to work right, get the full filename.
    filename = path.resolve(filename);

    // Since we're going to run recursively, copy the current Options.
    var innerOpts = extend({
        stripEmpty: true,
    }, options);
    innerOpts.include_path.push(path.dirname(filename));

    // Process the file by it's source, line by line. Save parts to memory.
    var level = level || 0;
    var parts = parts || {filename:level};
    var outsrc = [];
    var state = state || { included: {} };
    var conditionStack = [];
    var allConditionsTrue = function() {
        for(var i in conditionStack) {
            if(!conditionStack[i]) return false;
        }
        return true;
    }

    // Sanity check: Prevent double inclusion
    if(filename in parts) return "// ...\n";

    var _src = source.split("\n");
    for(var i in _src) {
        var line = _src[i];
        if(line.charAt(0) == "#") {
            for(var r in rules) {
                var match = line.substr(1).match(rules[r]);
                if(match!=null) {
                    line = "// "+line;
                    switch(r) {
                        case "define":
                            // FIXME: Multi-line support. Traverse the line, encounter ' /\n' and find end.
                            //if(line.lastIndexOf("/\n") != -1) { Line continues } else { does not }
                            innerOpts.defines[match[1]] = match[2];
                        break;
                        case "undefine":
                            delete innerOpts.defines[match[1]];
                        break;
                        case "relative_include":
                        case "strict_include":
                            var nfile = match[1];
                            var rfile;
                            var found = false;
                            if(r == "relative_include") {
                                rfile = path.resolve( path.join(path.dirname(filename), nfile) );
                                if(fs.existsSync(rfile)) {
                                    found = true;
                                }
                            } else if(r == "strict_include") {
                                for(var p in innerOpts.include_path) {
                                    var pt = innerOpts.include_path[p];
                                    var jfile = path.join(pt, nfile);
                                    if(fs.existsSync(jfile)) {
                                        found = true;
                                        rfile = jfile;
                                        break;
                                    }
                                }
                            }
                            if(!found) {
                                // Not found.
                                // FIXME: Shouldn't throw, should likely call the error cb...
                                throw new Error("Requested file "+nfile+" could not be resolved.");
                            }
                            // If the file was #pragma once'd, then skip it.
                            if(rfile in state.included) {
                                line = "/*!--("+level+")> "+rfile+"*/";
                            } else {
                                // Process the file
                                var gsrc = fs.readFileSync(rfile).toString("utf8");
                                var nsrc = Preprocess(gsrc, rfile, innerOpts, level+1, parts, state);
                                line    = "/*--("+level+")> "+rfile+"*/"
                                        + nsrc
                                        + "/*<("+level+")--*/";
                            }
                        break;
                        case "ifdef":
                            conditionStack.push( match[1] in innerOpts.defines );
                        break;
                        case "ifndef":
                            conditionStack.push( !(match[1] in innerOpts.defines) );
                        break;
                        case "elif":
                            // need to implement proper if-ing.
                        break;
                        case "else":
                            conditionStack.push( !conditionStack.pop() );
                        break;
                        case "endif":
                            conditionStack.pop();
                        break;
                        case "pragma":
                            switch(match[1]) {
                                case "once":
                                    // This file should ONLY be included once.
                                    state.included[filename]=true;
                                break;
                                // Other pragmas to come.
                            }
                        break;
                    }
                }
            }
        }
        // Check for defines and put them in.
        if(line.substr(0,2) != "//") {
            for(var define in innerOpts.defines) {
                var value = innerOpts.defines[define];
                line = line.replace(define,value);
            }
            if(allConditionsTrue()) {
                outsrc.push(line);
            } else {
                if(!innerOpts.stripEmpty)
                    outsrc.push("//"+line);
                else
                    outsrc.push("");
            }
        } else {
            if(!innerOpts.stripEmpty)
                outsrc.push(line);
            else
                outsrc.push("");
        }
    }
    return outsrc.join("\n");
}

module.exports = Preprocess;
