var baseUrl =  "https://cs.brown.edu/~sporncha/pyret-d3/";
requirejs.config({
    paths: {
        "my-project": baseUrl,
        d3: baseUrl + "d3.v3.min"
    }
});
requirejs.undef("@js-http/" + baseUrl + "main.js");
requirejs.undef("my-project/lib");
define(["js/runtime-util", "my-project/lib"], function(util, lib) {
    return function(runtime, namespace) {
        return util.makeModuleReturn(runtime, {}, {
            "xy-plot": runtime.makeFunction(lib.xy_plot(runtime)),
            "xy-plot-cont": runtime.makeFunction(lib.xy_plot_cont(runtime)),
            "test": runtime.makeFunction(lib.test(runtime))
        });
    };
});
