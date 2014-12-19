define(["d3", "js/js-numbers"], function(d3, jsnums) {
    // Arbitrary JS that does what you need here.  You can declare more
    // dependencies above, as long as you can express them as requirejs modules
    // and put them in the same directory.  
    
    function xy_plot(runtime){
	return function(f, x_min, x_max, y_min, y_max, step){
	    runtime.checkArity(6, arguments, "xy-plot");
	    runtime.checkFunction(f);
	    runtime.checkNumber(x_min);
	    runtime.checkNumber(x_max);
	    runtime.checkNumber(y_min);
	    runtime.checkNumber(y_max);
	    runtime.checkNumber(step);

	    var max_width = 400;
	    var max_height = 400;
	    var s = runtime.makeNumber(100);

	    var data = [];
	    for(var i = x_min; i <= x_max; i = runtime.plus(i, step)){
		x = runtime.makeNumber(i)
		data.push([x, f.app(x)])
	    }
	    // flip y-axis to display properly
	    data = data.map(function(d){ return [d[0], (max_height / s - d[1])]});
	    var detached = d3.select(document.createElement("div"));
	    var svg_container = detached.append("svg")
		                        .attr("width", max_width)
                      	                .attr("height", max_height);
	    var circles = svg_container.selectAll("circle")
	                               .data(data)
	                               .enter()
	                               .append("circle");
	    
	    var plotted = circles.attr("cx", function (d) { return runtime.times(s, d[0]); })
                            	 .attr("cy", function (d) { return runtime.times(s, d[1]); })
	                         .attr("r", 2)
     	                         .style("fill", "black");
	    runtime.getParam("current-animation-port")(detached.node());
	}
    }
    
    var counter = 0;
    return {
	libFunction: function() { return counter++; },
	xy_plot: xy_plot,
    };
});

