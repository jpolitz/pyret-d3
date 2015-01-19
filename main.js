var baseUrl =  "https://cs.brown.edu/~sporncha/pyret-d3/";
requirejs.config({
    paths: {
        "my-project": baseUrl,
        "d3": baseUrl + "d3.v3.min",
        "d3tip": baseUrl + "customized-d3-tip"
    }
});
requirejs.undef("@js-http/" + baseUrl + "main.js");
requirejs.undef("my-project/lib");
define(["js/runtime-util", "my-project/lib", "js/ffi-helpers"],
       function(util, lib, ffiLib) {
           return function(runtime, namespace) {
               var ffi = ffiLib(runtime, runtime.namespace);
               return util.makeModuleReturn(runtime, {}, {
                   "xy-plot": runtime.makeFunction(lib.xyPlot(runtime)),
                   "xy-plot-cont": runtime.makeFunction(
                       lib.xyPlotCont(runtime)),
                   "regression-plot": runtime.makeFunction(
                       lib.regressionPlot(runtime, ffi)),
                   "histogram-plot": runtime.makeFunction(
                       lib.histogramPlot(runtime, ffi)),
                   "show-svg": runtime.makeFunction(lib.showSVG(runtime)),
                   "getBBox": runtime.makeFunction(lib.getBBox(runtime))
               });
           };
       });