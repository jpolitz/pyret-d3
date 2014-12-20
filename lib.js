define(["d3", "js/js-numbers"], function (d3, jsnums) {
    // Arbitrary JS that does what you need here.  You can declare more
    // dependencies above, as long as you can express them as requirejs modules
    // and put them in the same directory.
    
    function xy_plot(runtime) {
        return function (f, xMin, xMax, yMin, yMax) {
            runtime.checkArity(5, arguments, "xy-plot");
            runtime.checkFunction(f);
            runtime.checkNumber(xMin);
            runtime.checkNumber(xMax);
            runtime.checkNumber(yMin);
            runtime.checkNumber(yMax);
	    
            if (jsnums.greaterThanOrEqual(xMin, xMax) || 
		jsnums.greaterThanOrEqual(yMin, yMax)) {
                throw new Error("x-min and y-min must be strictly less " +
                                "than x-max and y-max respectively.");
            }

	    function scaler(oldX, oldY, newX, newY) {
		return function (k) {
                    var oldDiff = jsnums.subtract(k, oldX);
		    var oldRange = jsnums.subtract(oldY, oldX);
		    var portion = jsnums.divide(oldDiff, oldRange);
		    var newRange = jsnums.subtract(newY, newX);
		    var newPortion = jsnums.multiply(portion, newRange);
		    return jsnums.add(newPortion, newX);
		};
	    }

	    // These are adapted from http://jsfiddle.net/christopheviau/Hwpe3/
            var margin = {'top': 30, 'left': 50, 'bottom': 30, 'right': 50};
            var width = 500;
            var height = 500;
            var tickX = 11;  // d3 will find the closest proper number of tick
            var tickY = 21;
            var tickFormat = 'g';
            var delta = 0.0001;
            var threshold = 0.001;
            var inputScaler = scaler(0, width - 1, xMin, xMax);
            var outputScaler = scaler(yMin, yMax, height - 1, 0);
            var data = d3.range(width).reduce(
                function (arr, i) {
                    // Group data which are near each other together
                    var x = inputScaler(i), y;
                    try {
                        y = f.app(x);
                    } catch (e) {
                        arr.push([]);
                        return arr;
                    }
                    if (jsnums.greaterThan(yMin, y) || 
			jsnums.greaterThan(y, yMax)) {
                        arr.push([]);
                        return arr;
                    } else {
                        /*
                         var diff = f.app(x - runtime.makeNumber(delta)) - y;
                         diff = runtime.num_abs(diff);
                         console.log(x - runtime.makeNumber(delta));
                         console.log(diff);
                         if (diff > threshold) {
                             arr.push([]);
                         }
                         // x is not at the edge! we can't do this!
                         */
                    }
                    arr[arr.length - 1].push(
			{ x: i, y: jsnums.toFixnum(outputScaler(y)) });
                    return arr;
                }, [[]]).filter(function (d) { return d.length !== 0; });
	    
            function getAxisConf(aMin, aMax) {
                var axisConf = {};
		var numer = jsnums.subtract(0, aMin);
		var denom = jsnums.subtract(aMax, aMin);
		var pos = jsnums.toFixnum(jsnums.divide(numer, denom));
                if (0 <= pos && pos <= 1) {
                    axisConf.bold = true;
                    axisConf.pos = pos;
                } else if (pos > 1) {
                    axisConf.bold = false;
                    axisConf.pos = 1;
                } else if (pos < 0) {
                    axisConf.bold = false;
                    axisConf.pos = 0;
                }
                return axisConf;
            }
	    
            var xAxisConf = getAxisConf(yMin, yMax);
            var yAxisConf = getAxisConf(xMin, xMax);
            xAxisConf.pos = 1 - xAxisConf.pos;
	    
            var line = d3.svg.line()
                    .x(function (d) { return d.x; })
                    .y(function (d) { return d.y; });
	    
            var detached = d3.select(document.createElement("div"));
            var graph = detached.append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr(
			"transform",
			"translate(" + margin.left + "," + margin.top + ")");

	    xMin = jsnums.toFixnum(xMin);
            xMax = jsnums.toFixnum(xMax);
            yMin = jsnums.toFixnum(yMin);
            yMax = jsnums.toFixnum(yMax);

	    console.log(xMin);

            var xAxisScaler = d3.scale.linear()
                    .domain([xMin, xMax]).range([0, width - 1]);
	    var yAxisScaler = d3.scale.linear()
		    .domain([yMin, xMax]).range([height - 1, 0]);
	    
            var xAxis = d3.svg.axis().scale(xAxisScaler)
                    .orient((xAxisConf.pos === 0) ? "top" : "bottom")
                    .ticks(tickX).tickFormat(d3.format(tickFormat));
	    
            graph.append("g")
                .attr("class", "x axis").attr(
                    "transform",
                    "translate(0," + xAxisConf.pos * (height - 1) + ")")
                .call(xAxis);
	    
            var yAxis = d3.svg.axis().scale(yAxisScaler)
                    .orient((yAxisConf.pos === 1) ? "right" : "left")
                    .ticks(tickY).tickFormat(d3.format(tickFormat));
	    
            graph.append("g")
                .attr("class", "y axis").attr(
                    "transform",
                    "translate(" + yAxisConf.pos * (width - 1) + ", 0)")
                .call(yAxis);
	    
            data.forEach(
                function (arr) {
                    graph.append("path")
                        .attr("class", "plotting")
                        .attr("d", line(arr));
                }
            );
	    
            // CSS goes here
            graph.selectAll('.plotting').style(
                {'stroke': 'blue', 'stroke-width': 1, 'fill': 'none'});
            graph.selectAll('.x.axis path').style({
                'stroke': 'black',
                'stroke-width': xAxisConf.bold ? 2 : 0,
                'fill': 'none'
            });
            graph.selectAll('.y.axis path').style({
                'stroke': 'black',
                'stroke-width': yAxisConf.bold ? 2 : 0,
                'fill': 'none'
            });
            graph.selectAll('.axis').style({'shape-rendering': 'crispEdges'});
            graph.selectAll('.axis text').style({'font-size': '10px'});
            graph.selectAll('.axis line').style({'stroke': 'black'});
	    
            runtime.getParam("current-animation-port")(detached.node());
        };
    }
    
    return {
        xy_plot: xy_plot
    };
});
