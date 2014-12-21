define(["d3", "js/js-numbers"], function (d3, jsnums) {
    // Arbitrary JS that does what you need here.  You can declare more
    // dependencies above, as long as you can express them as requirejs modules
    // and put them in the same directory.

    function scaler(oldX, oldY, newX, newY, toInt) {
        return function (k) {
            var oldDiff = jsnums.subtract(k, oldX);
            var oldRange = jsnums.subtract(oldY, oldX);
            var portion = jsnums.divide(oldDiff, oldRange);
            var newRange = jsnums.subtract(newY, newX);
            var newPortion = jsnums.multiply(portion, newRange);
            var result = jsnums.add(newPortion, newX);
            if (toInt) {
                return Math.floor(jsnums.toFixnum(result));
            } else {
                return result;
            }
        };
    }

    function adjustInRange(k, vmin, vmax) {
        if (jsnums.lessThan(k, vmin)) {
            return vmin;
        } else if (jsnums.lessThan(vmax, k)) {
            return vmax;
        } else {
            return k;
        }
    }

    function xy_plot_meta(
        runtime, f, xMin, xMax, yMin, yMax, getDataFunc, width, height) {

        var data = getDataFunc(f, xMin, xMax, yMin, yMax, width, height);

        // These are adapted from http://jsfiddle.net/christopheviau/Hwpe3/
        var margin = {'top': 30, 'left': 50, 'bottom': 30, 'right': 50},
            tickX = 11, tickY = 21,
            tickFormat = 'g';

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

        var xAxisConf = getAxisConf(yMin, yMax),
            yAxisConf = getAxisConf(xMin, xMax);
        xAxisConf.pos = 1 - xAxisConf.pos;

        var line = d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; });

        var detached = d3.select(document.createElement("div")),
            graph = detached.append("svg")
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

        var xAxisScaler = d3.scale.linear()
                .domain([xMin, xMax]).range([0, width - 1]),
            yAxisScaler = d3.scale.linear()
                .domain([yMin, yMax]).range([height - 1, 0]);

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
        graph.selectAll("g.y.axis g.tick line")
            .attr("x1", -yAxisConf.pos * (width - 1))
            .attr("x2", (1 - yAxisConf.pos) * (width - 1));
        graph.selectAll("g.x.axis g.tick line")
            .attr("y1", -xAxisConf.pos * (height - 1))
            .attr("y2", (1 - xAxisConf.pos) * (height - 1));
        graph.selectAll('.axis').style({'shape-rendering': 'crispEdges'});
        graph.selectAll('.axis text').style({'font-size': '10px'});
        graph.selectAll('.axis line').style({'stroke': 'lightgray', 'opacity': 0.6});

        runtime.getParam("current-animation-port")(detached.node());
    }

    function getDataCont(f, xMin, xMax, yMin, yMax, width, height) {
        var inputScaler = scaler(0, width - 1, xMin, xMax, false),
            outputScaler = scaler(yMin, yMax, height - 1, 0, false);

        function draw(arr, i) {
            // Group data which are near each other together
            var x = inputScaler(i), y;
            var inner = arr[arr.length - 1];
            try {
                y = f.app(x);
            } catch (e) {
                arr.push([]);
                return arr;
            }
            try {
                if (Number.isNaN(jsnums.toFixnum(y))) {
                    arr.push([]);
                    return arr;
                }
            } catch (e) {
                arr.push([]);
                return arr;
            }
            var possibleY = adjustInRange(y, yMin, yMax);
            if (possibleY !== y) {
                inner.push({
                    x: i,
                    y: jsnums.toFixnum(outputScaler(possibleY))
                });
                arr.push([]);
                return arr;
            }
            inner.push({ x: i, y: jsnums.toFixnum(outputScaler(y)) });
            return arr;
        };

        return d3.merge([d3.range(width), d3.range(width).reverse()])
            .reduce(draw, [[]])
            .filter(function (d) { return d.length > 1; });
    }

    function getDataGeneric(f, xMin, xMax, yMin, yMax, width, height) {
        var inputScaler = scaler(0, width - 1, xMin, xMax, false),
            xToPixel = scaler(xMin, xMax, 0, width - 1, true),
            yToPixel = scaler(yMin, yMax, height - 1, 0, true),
            delta = jsnums.divide(
                jsnums.subtract(xMax, xMin),
                jsnums.multiply(width, 1000));

        var INSERTLEFT = 0, INSERTRIGHT = 1,
            dyTolerate = 1,
            data = [];

        var roughData = getDataCont(f, xMin, xMax, yMin, yMax, width, height);
        var stackInit = roughData.map(function (d) {
            return {
                left: inputScaler(d[0].x),
                right: inputScaler(d[d.length - 1].x),
                stage: INSERTLEFT
            };
        }).reverse();

        // use stack instead of recursion
        var stack = stackInit;

        while (stack.length > 0) {
            var current = stack.pop();
            var xLeft = current.left,
                xRight = current.right,
                stage = current.stage;

            var pixXRight = xToPixel(xRight), yRight, pixYRight;

            try {
                yRight = adjustInRange(f.app(xRight), yMin, yMax);
                pixYRight = yToPixel(yRight);
            } catch (e) {
                yRight = NaN;
                pixYRight = NaN;
            }

            if (stage == INSERTLEFT) {
                var pixXLeft = xToPixel(xLeft), yLeft, pixYLeft;

                try {
                    yLeft = adjustInRange(f.app(xLeft), yMin, yMax);
                    pixYLeft = yToPixel(yLeft);
                } catch (e) {
                    yLeft = NaN;
                    pixYLeft = NaN;
                }
                // we use ok as a flag instead of using results from pix
                // which are unreliable
                var ok = true;

                if (!Number.isNaN(yLeft)) {
                    data.push({x: pixXLeft, y: pixYLeft});
                } else {
                    ok = false;
                }
                if (!Number.isNaN(yRight)) {
                    stack.push(
                        {left: xLeft, right: xRight, stage: INSERTRIGHT}
                    );
                } else {
                    ok = false;
                }
                if (jsnums.approxEquals(xLeft, xRight, delta)) {
                    continue;
                } else if (ok) {
                    var dPixX = pixXRight - pixXLeft,
                        dPixY = Math.abs(pixYRight - pixYLeft);
                    if (dPixX <= 1 && dPixY <= dyTolerate) {
                        continue;
                    }
                }
                var xMid = jsnums.divide(jsnums.add(xLeft, xRight), 2);
                stack.push({left: xMid, right: xRight, stage: INSERTLEFT});
                stack.push({left: xLeft, right: xMid, stage: INSERTLEFT});
            } else if (stage == INSERTRIGHT) {
                data.push({x: pixXRight, y: pixYRight});
            }
        }

        var newData = data.filter(function(item, pos){
            return ((pos === 0) ||
                    (item.x !== data[pos - 1].x) ||
                    (item.y !== data[pos - 1].y));
        }).reduce(function(arr, d){
            var inner = arr[arr.length - 1];
            if (inner.length > 0) {
                var prev = inner[inner.length - 1];
                if ((Math.abs(d.y - prev.y) > dyTolerate) ||
                    ((d.x - prev.x) > 1)) {
                    arr.push([]);
                }
            }
            arr[arr.length - 1].push(d);
            return arr;
        }, [[]]).filter(function (d) { return d.length > 1; });

        var intervals = newData.map(
            function (interval) {
                return {
                    left: interval[0].x,
                    right: interval[interval.length - 1].x
                };
            });

        var flattened = roughData.reduce(
            function(arr, innerArray){
                innerArray.forEach(function (d){ arr.push(d); });
                return arr;
            }, []);

        var group = 0;

        return flattened.reduce(
            function (arr, item) {
                while ((group < intervals.length) &&
                       (intervals[group].right < item.x)) {
                    group++;
                    arr.push([]);
                }
                if (group < intervals.length) {
                    if ((intervals[group].left <= item.x) &&
                        (item.x <= intervals[group].right)) {
                        arr[arr.length - 1].push(item);
                    }
                }
                return arr;
            }, [[]]).filter(function (d) { return d.length > 1; });
    }

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

            var width = 500, height = 500;

            xy_plot_meta(
                runtime, f, xMin, xMax, yMin, yMax,
                getDataGeneric, width, height);
        };
    }

    function xy_plot_cont(runtime) {
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

            var width = 500, height = 500;

            xy_plot_meta(
                runtime, f, xMin, xMax, yMin, yMax,
                getDataCont, width, height);
        };
    }

    function test(runtime) {
        return function(x, y){
            console.log(jsnums.greaterThan(x, y));
        };
    }

    return {
        xy_plot: xy_plot,
        xy_plot_cont: xy_plot_cont,
        test: test
    };
});

