define(["d3"], function (d3) {
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

            // These are adapted from http://jsfiddle.net/christopheviau/Hwpe3/

            // left and bottom needs spaces for axis label
            var margin = {'top': 20, 'left': 50, 'bottom': 30, 'right': 20};
            var width = 500 - margin.left - margin.right;
            var height = 500 - margin.top - margin.bottom;
            var tickX = 9;  // d3 will find the closest proper number of tick
            var tickY = 21;
            var sampleSize = 100;  // 100 is enough to make the graph smooth
            var inputScaler = d3.scale.linear()
                .domain([0, sampleSize]).range([xMin, xMax]);
            var data = d3.range(sampleSize).map(
                function (i) {
                    var x = runtime.makeNumber(inputScaler(i));
                    return { x: x, y: f.app(x) }; }).filter(
                        function (d) { return yMin <= d.y && d.y <= yMax; });
            // it's possible that some values will be out of the plotting area
            // so we have to filter them out

            var x = d3.scale.linear().domain([xMin, xMax]).range([0, width]);
            var y = d3.scale.linear().domain([yMin, yMax]).range([height, 0]);
            var line = d3.svg.line()
                .x(function (d) { return x(d.x); })
                .y(function (d) { return y(d.y); });

            var detached = d3.select(document.createElement("div"));
            var graph = detached.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            var xAxis = d3.svg.axis().scale(x)
                .ticks(tickX).tickFormat(d3.format('e'));

            graph.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            // orient is used to set position of labels
            var yAxis = d3.svg.axis().scale(y).orient("left")
                .ticks(tickY).tickFormat(d3.format('e'));

            graph.append("g").attr("class", "y axis").call(yAxis);

            graph.append('path').attr("d", line(data));

            // all CSS goes here
            graph.selectAll('path').style(
                {'stroke': 'black', 'stroke-width': 1, 'fill': 'none'});
            graph.selectAll('.axis path').style({'stroke-width': 3});
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
