var baseUrl =  "https://cs.brown.edu/~sporncha/pyret-d3/";
requirejs.config({
    paths: {
        "my-project": baseUrl
    }
});
requirejs.undef("@js-http/" + baseUrl + "asd.js");
define(["js/runtime-util", "my-project/asd-lib"], function(util, lib) {
   return function(runtime, namespace) {
       return util.makeModuleReturn(runtime, {}, {
           "show-svg": runtime.makeFunction(lib.showSVG(runtime)),
           "getBBox": runtime.makeFunction(lib.getBBox(runtime))
       });
   };
});
