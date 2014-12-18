define(["d3"], function(d3) {
  // Arbitrary JS that does what you need here.  You can declare more
  // dependencies above, as long as you can express them as requirejs modules
  // and put them in the same directory.  

  function draw(runtime){
    var detached = document.createElement("div");
    runtime.getParam("current-animation-port")(detached);
    detached.innerHTML = "Hello!";
  }
  
  var counter = 0;
  return {
    libFunction: function() { return counter++; },
    draw: draw
  };
});

