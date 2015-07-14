(function main(argv){

    // Sanity check
    if(argv._.length == 0) {
        console.error("You need to supply input files.");
        process.exit(1);
    }

    var fs = require("fs");
    var compiler = require("../");
    compiler.use("pre-compile", compiler.preprocessor());

    var files = [];
    for(var i in argv._) {
        var filename = argv._[i];
        files.push({
            path: filename,
            contents: fs.readFileSync(filename).toString("utf8")
        });
    }

    // This way, all OJ options are simply long-opts.
    var options = argv;
    options.files = files;

    // get the defines
    options.preprocessor = {defines:{}, include_path:[]};
    if(typeof argv.D == "string") {
        var parts = argv.D.split("=",1);
        options.preprocessor.defines[parts[0]] = parts[1];
    } else if(typeof argv.D == "object" && argv.D.prototype == Array.prototype) {
        argv.D.forEach(function(v,i){
            var parts = v.split("=",1);
            options.preprocessor.defines[parts[0]] = parts[1];
        });
    }

    // Include path
    if(typeof argv.I == "string") {
        options.preprocessor.include_path.push(argv.I);
    } else if(typeof argv.I == "object" && argv.I.prototype == Array.prototype) {
        argv.I.forEach(function(v,i){
            options.preprocessor.include_path.push(v);
        });
    }

    compiler.compile(options, function(err,res){
        if(err) return console.error(err);
        fs.writeFileSync(argv.o || "./a.out", res.code);
    });

})(require("minimist")(process.argv.splice(2)));
