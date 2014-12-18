var baseUrl =  "https://cs.brown.edu/~sporncha/pyret-d3";
requirejs.config({
  paths: {
    "my-project": baseUrl,
    d3: "https://cs.brown.edu/~sporncha/d3.v3.min"
  }
});
requirejs.undef("@js-http/" + baseUrl + "main.js");
requirejs.undef("my-project/lib");
define(["js/runtime-util", "my-project/lib"], function(util, lib) {
  return function(runtime, namespace) {
    return util.makeModuleReturn(runtime, {}, {
      "provided-fun": runtime.makeFunction(lib.libFunction),
      "draw": runtime.makeFunction(function() { return lib.draw(runtime); })
    });
  };
});