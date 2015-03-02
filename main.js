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
requirejs.undef("my-project/libJS");
define(["js/runtime-util", "my-project/lib", "trove/string-dict"],
       function(util, lib, sdLib) {
           return function(runtime, namespace) {
               var sd = sdLib(runtime, runtime.namespace);
               return util.makeModuleReturn(runtime, {}, {
                   "generic-plot": runtime.makeFunction(
                       lib.genericPlot(runtime)),
                   "infer-bounds": runtime.makeFunction(
                       lib.inferBounds(runtime)),
                   "generate-xy": runtime.makeFunction(
                       lib.generateXY(runtime)),
                   "histogram-plot": runtime.makeFunction(
                       lib.histogramPlot(runtime)),
                   "pie-chart": runtime.makeFunction(
                       lib.pieChart(runtime, sd)),
                   "tree-diagram": runtime.makeFunction(
                       lib.treeDiagram(runtime)),
                   "show-svg": runtime.makeFunction(lib.showSVG(runtime)),
                   "getBBox": runtime.makeFunction(lib.getBBox(runtime)),
                   "test": runtime.makeFunction(lib.test(runtime, sd))
               });
           };
       });
