var baseUrl =  "https://cs.brown.edu/~sporncha/pyret-d3/";
requirejs.config({
    paths: {
        "my-project": baseUrl,
        d3: baseUrl + "d3.v3.min"
    }
});
requirejs.undef("@js-http/" + baseUrl + "main.js");
requirejs.undef("my-project/lib");
define(["js/runtime-util", "my-project/lib", "js/ffi-helpers"],
       function(util, lib, ffiLib) {
           return function(runtime, namespace) {
               return runtime.loadJSModules(namespace, [ffiLib], function(ffi) {
                   return util.makeModuleReturn(runtime, {}, {
                       "xy-plot": runtime.makeFunction(lib.xyPlot(runtime)),
                       "xy-plot-cont": runtime.makeFunction(lib.xyPlotCont(runtime)),
                       "scatter-plot": runtime.makeFunction(lib.scatterPlot(runtime, ffi)),
                       "show-svg": runtime.makeFunction(lib.showSVG(runtime)),
                       "test": runtime.makeFunction(lib.test(runtime))
                   });
               });
           };
       });