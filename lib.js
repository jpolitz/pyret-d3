var WIDTH = 400;
var HEIGHT = 400;

function lastElement(arr) {
    // Consumes an array and produces its last element
    return arr[arr.length - 1];
}

define(["d3", "js/js-numbers"], function (d3, jsnums) {
    'use strict';

    // Arbitrary JS that does what you need here.  You can declare more
    // dependencies above, as long as you can express them as requirejs modules
    // and put them in the same directory.

    function scaler(oldX, oldY, newX, newY, toInt) {
        // Produces a scaler function to convert a value in
        // an interval to another valud in a new interval
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
        // Consumes a value and a range and produces
        // a proper value in the range
        if (jsnums.lessThan(k, vmin)) {
            return vmin;
        } else if (jsnums.lessThan(vmax, k)) {
            return vmax;
        } else {
            return k;
        }
    }

    function xyPlotMeta(
        runtime, f, xMin, xMax, yMin, yMax, getDataFunc, width, height) {
        // Plots a graph

        var dataPoints = getDataFunc(f, xMin, xMax, yMin, yMax, width, height);

        // These are adapted from http://jsfiddle.net/christopheviau/Hwpe3/
        var margin = {'top': 30, 'left': 50, 'bottom': 30, 'right': 50},
            tickX = 11, tickY = 19,
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

        dataPoints.forEach(
            function (groupedPoints) {
                graph.append("path")
                    .attr("class", "plotting")
                    .attr("d", line(groupedPoints));
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
        graph.selectAll('.axis line').style({
            'stroke': 'lightgray',
            'opacity': 0.6
        });

        runtime.getParam("current-animation-port")(detached.node());
    }

    function getDataCont(f, xMin, xMax, yMin, yMax, width, height) {
        // Produces "rough" data points to be used for plotting
        // It is rough because it assumes that f is continuous

        var inputScaler = scaler(0, width - 1, xMin, xMax, false),
            outputScaler = scaler(yMin, yMax, height - 1, 0, false);

        function addPoint(dataPoints, i) {
            // Consumes old data points and produces a new data points
            // which one point is added
            var x = inputScaler(i), y;
            var groupedPoints = lastElement(dataPoints);
            try {
                // prevent Pyret's division by zero
                y = f.app(x);
            } catch (e) {
                dataPoints.push([]);
                return dataPoints;
            }
            try {
                // y can't be converted to a fixnum if it is a complex number.
                // we therefore use
                if (Number.isNaN(jsnums.toFixnum(y))) {
                    dataPoints.push([]);
                    return dataPoints;
                }
            } catch (e) {
                dataPoints.push([]);
                return dataPoints;
            }
            var possibleY = adjustInRange(y, yMin, yMax);

            groupedPoints.push({
                'x': i,
                'y': jsnums.toFixnum(outputScaler(possibleY)),
                'realx': x,
                'realy': y
            });
            if (possibleY !== y) {
                dataPoints.push([]);
            }
            return dataPoints;
        }

        function getList(range) {
            return range
                .reduce(addPoint, [[]])
                .filter(function (d) { return d.length > 1; });
        }

        var forwardList = getList(d3.range(width));
        var backwardList = getList(d3.range(width).reverse())
                .map(function (d) { return d.reverse(); }).reverse();

        function getInterval(lst) {
            return lst.map(function (sublist) {
                return {
                    left: sublist[0].x,
                    right: sublist[sublist.length - 1].x,
                    arr: sublist
                };
            });
        }

        var forwardInterval = getInterval(forwardList);
        var backwardInterval = getInterval(backwardList);

        var interval = forwardInterval.concat(backwardInterval)
                .sort(function (a, b) { return a.left - b.left; });

        function isIntersectInterval(a, b) {
            var left = Math.max(a.left, b.left);
            var right = Math.min(a.right, b.right);
            return left <= right;
        }

        function mergeInterval(a, b) {
            return {
                left: a.left,
                right: b.right,
                arr: a.arr.concat(b.arr)
            };
        }

        if (interval.length > 0) {
            var firstValue = interval.shift();
            return interval.reduce(
                function (arr, val) {
                    var prevValue = arr.pop();
                    if (isIntersectInterval(prevValue, val)) {
                        arr.push(mergeInterval(prevValue, val));
                    } else {
                        arr.push(prevValue);
                        arr.push(val);
                    }
                    return arr;
                }, [firstValue])
                .map(function (d) {
                    d.arr.sort(function (a, b) {
                        return a.x - b.x;
                    });
                    return d.arr;
                });
        } else {
            return [];
        }
    }

    function getDataGeneric(f, xMin, xMax, yMin, yMax, width, height) {
        var xToPixel = scaler(xMin, xMax, 0, width - 1, true),
            yToPixel = scaler(yMin, yMax, height - 1, 0, true),
            delta = jsnums.divide(
                jsnums.subtract(xMax, xMin),
                jsnums.multiply(width, 10000));

        var INSERTLEFT = 0, INSERTRIGHT = 1,
            dyTolerate = 1,
            data = [];

        var roughData = getDataCont(f, xMin, xMax, yMin, yMax, width, height);
        var stackInit = roughData.map(function (d) {
            return {
                left: d[0],
                right: lastElement(d),
                stage: INSERTLEFT
            };
        }).reverse();

        // use stack instead of recursion
        var stack = stackInit, current, left, right, stage, ok,
            dPixX, dPixY;

        while (stack.length > 0) {
            current = stack.pop();
            left = current.left;
            right = current.right;
            stage = current.stage;

            if (stage === INSERTLEFT) {
                // we use ok as a flag instead of using results from pix
                // which are unreliable
                ok = true;

                if (!Number.isNaN(left.realy)) {
                    data.push({'x': left.x, 'y': left.y});
                } else {
                    ok = false;
                }
                if (!Number.isNaN(right.realy)) {
                    current.stage = INSERTRIGHT;
                    stack.push(current);
                } else {
                    ok = false;
                }
                if (jsnums.approxEquals(left.realx, right.realx, delta)) {
                    // this is the case where it's discontinuous
                    // we have no need to continue searching
                    continue;
                } else if (ok) {
                    dPixX = right.x - left.x;
                    dPixY = Math.abs(right.y - left.y);
                    if (dPixX <= 1 && dPixY <= dyTolerate) {
                        // this is the case where the graph is connected
                        // enough to be considered continuous
                        continue;
                    }
                }
                var midRealX = jsnums.divide(
                    jsnums.add(left.realx, right.realx), 2);
                var midX = xToPixel(midRealX);
                var midRealY, midY;
                try {
                    midRealY = f.app(midRealX);
                    jsnums.toFixnum(midRealY); // to test complex number
                    midY = yToPixel(midRealY);
                } catch(e) {
                    midRealY = NaN;
                    midY = NaN;
                }
                var mid = {
                    'realx': midRealX,
                    'x': midX,
                    'realy': midRealY,
                    'y': midY
                };
                stack.push({
                    'left': mid,
                    'right': right,
                    'stage': INSERTLEFT
                });
                stack.push({
                    'left': left,
                    'right': mid,
                    'stage': INSERTLEFT
                });
            } else if (stage === INSERTRIGHT) {
                data.push({'x': right.x, 'y': right.y});
            }
        }

        var newData = data.filter(function(item, pos) {
            return ((pos === 0) ||
                    (item.x !== data[pos - 1].x) ||
                    (item.y !== data[pos - 1].y));
        }).reduce(function(arr, d) {
            var inner = lastElement(arr);
            if (inner.length > 0) {
                var prev = lastElement(inner);
                if ((Math.abs(d.y - prev.y) > dyTolerate) ||
                    ((d.x - prev.x) > 1)) {
                    arr.push([d]);
                } else {
                    inner.push(d);
                }
            } else {
                inner.push(d);
            }
            return arr;
        }, [[]]).filter(function (d) { return d.length > 1; });

        //return newData;

        var intervals = newData.map(
            function (interval) {
                return {
                    left: interval[0].x,
                    right: lastElement(interval).x
                };
            }).reverse();
        // we are going to perform stack operations
        // so we reverse the order

        var flattened = roughData.reduce(
            function(arr, innerArray) {
                innerArray.forEach(function (d) { arr.push(d); });
                return arr;
            }, []);

        return flattened.reduce(
            function (arr, item) {
                while ((intervals.length > 0) &&
                       (lastElement(intervals).right < item.x)) {
                    intervals.pop();
                    arr.push([]);
                }
                if (intervals.length > 0) {
                    if ((lastElement(intervals).left <= item.x) &&
                        (item.x <= lastElement(intervals).right)) {
                        lastElement(arr).push(item);
                    }
                }
                return arr;
            }, [[]]).filter(function (d) { return d.length > 1; });
    }

    function xyPlot(runtime) {
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

            xyPlotMeta(
                runtime, f, xMin, xMax, yMin, yMax,
                getDataGeneric, WIDTH, HEIGHT);
        };
    }

    function xyPlotCont(runtime) {
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

            xyPlotMeta(
                runtime, f, xMin, xMax, yMin, yMax,
                getDataCont, WIDTH, HEIGHT);
        };
    }

    function test(runtime) {
        return function(x, y) {
            console.log(jsnums.greaterThan(x, y));
        };
    }

    return {
        xyPlot: xyPlot,
        xyPlotCont: xyPlotCont,
        test: test
    };
});

