var ware = require("ginga")();
var ojc = require("ojc");

// Prepare the middleware runner
["pre-compile", "post-compile"].forEach(function(v,i){
    ware.define(v,
        function(ctx,next){
            var args = ctx.args[0];
            for(var i in args) {
                ctx[i]=args[i];
            }
            delete ctx.args;
            next();
        },
        function(ctx,done){
            done(null,ctx);
        }
    );
});

module.exports.preprocessor = function(){
    return function(ctx, next){
        var pp = require("./lib/preprocessor");
        for(var i in ctx.files) {
            ctx.files[i].contents = pp(
                ctx.files[i].contents,
                ctx.files[i].path,
                ctx.preprocessor || {include_path:[], defines:{}}
            );
        }
        next();
    };
}
module.exports.use = ware.use.bind(ware);
module.exports.compile = function(options, cb) {
    ware["pre-compile"](options, function(err, newOpt){
        if(err) return cb(err);
        ojc.compile(newOpt, function(err2, res){
            if(err2) return cb(err2);
            ware["post-compile"](res,function(err3, final){
                cb(err3, final);
            });
        })
    });
}
