/*
 * pyret-d3
 */
'use strict';

var WIDTH = 401;
var HEIGHT = 401;

function lastElement(arr) {
    /*
     * Produces the last element of arr
     *
     * @param {array} arr
     * @return {Any}
     */
    return arr[arr.length - 1];
}

function assert(val) {
    if (!val) {
        throw new Error("assertion failed");
    }
}

function FenwickTree(n) {
    /*
     * Fenwick Tree for computing prefix sum
     *
     * @param {n} number of elements
     * @return {Object}
     */
    this.arr = []; // use index 1 to n
    for (var i = 0; i < n + 1; ++i) {
        this.arr.push(0);
    }

    this.add = function (ind, val) {

        assert(1 <= ind); // add from 1 to n
        assert(ind <= n);
        while (ind <= n) {
            this.arr[ind] += val;
            ind += (ind & (-ind));
        }
    };
    this.sum = function (ind) {
        assert(0 <= ind); // query from 0 to n
        assert(ind <= n);
        var ret = 0;
        while (ind >= 1) {
            ret += this.arr[ind];
            ind -= (ind & (-ind));
        }
        return ret;
    };
    this.sumInterval = function (l, r) {
        return this.sum(r) - this.sum(l - 1);
    };
};

/*
var testFenwick = new FenwickTree(10);
testFenwick.add(1, 2);
assert(testFenwick.sumInterval(1, 10) === 2);
testFenwick.add(1, 3);
assert(testFenwick.sumInterval(1, 10) === 5);
testFenwick.add(3, 4);
assert(testFenwick.sumInterval(1, 10) === 9);
assert(testFenwick.sumInterval(1, 2) === 5);
assert(testFenwick.sumInterval(2, 3) === 4);
*/

function LogTable(n) {
    this.fenwick = new FenwickTree(n);
    this.occupy = function (v) {
        v += 1; // use baed-1 index
        if (!Number.isNaN(v) && this.fenwick.sumInterval(v, v) === 0) {
            this.fenwick.add(v, 1);
        }
        return this;
    };
    this.isRangedOccupied = function (l, r) {
        l += 1;
        r += 1;
        if (Number.isNaN(l) || Number.isNaN(r)) {
            return false;
        } else {
            return this.fenwick.sumInterval(l, r) === (r - l + 1);
        }
    };
};

define(["d3", "js/runtime-util", "js/js-numbers"], function (d3, util, jsnums) {
    var numLib = {
        'scaler': function(oldX, oldY, newX, newY, toInt) {
            /*
             * Produces a scaler function to convert a value in
             * an interval to another value in a new interval
             *
             * @param {jsnums} oldX
             * @param {jsnums} oldY
             * @param {jsnums} newX
             * @param {jsnums} newY
             * @param {boolean} toInt: if true, the result is converted to
             * integer fixnum
             * @return {Function}
             */
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
        },

        'adjustInRange': function(k, vmin, vmax) {
            /*
             * Adjust k to be between vmin and vmax if it's not in the range
             *
             * @param {jsnums} k
             * @param {jsnums} vmin
             * @param {jsnums} vmax
             * @return {jsnums}
             */
            if (jsnums.lessThan(k, vmin)) {
                return vmin;
            } else if (jsnums.lessThan(vmax, k)) {
                return vmax;
            } else {
                return k;
            }
        },

        'max': function(a, b) {
            /*
             * Find the maximum value
             *
             * @param {jsnums} a
             * @param {jsnums} b
             * @return {jsnums}
             */
            if (jsnums.lessThan(a, b)) {
                return b;
            } else {
                return a;
            }
        },

        'min': function (a, b) {
            /*
             * Find the minimum value
             *
             * @param {jsnums} a
             * @param {jsnums} b
             * @return {jsnums}
             */
            if (jsnums.lessThan(a, b)) {
                return a;
            } else {
                return b;
            }
        }
    };

    function createCanvas(width, height) {
        var margin = {'top': 30, 'left': 70, 'bottom': 30, 'right': 70};

        var detached = d3.select(document.createElement("div"));
        var canvas = detached
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + margin.top + ")");
        return {'detached': detached, 'canvas': canvas};
    }

    function appendAxis(canvas, xMin, xMax, yMin, yMax, width, height) {
        /*
         * Produces a new canvas which has axis on
         *
         * @param {d3 selection} canvas
         * @param {jsnums} xMin
         * @param {jsnums} xMax
         * @param {jsnums} yMin
         * @param {jsnums} yMax
         * @param {fixnum} width
         * @param {fixnum} height
         * @param {d3 selection}
         */

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

        var tickNum = 6; // TODO: why 6, not 7?
        var xAxisScaler = d3.scale.linear()
                .domain([0, tickNum]).range([0, width - 1]),
            yAxisScaler = d3.scale.linear()
                .domain([0, tickNum]).range([height - 1, 0]);
        var allValues = d3.range(0, tickNum + 1);

        var xAxisDisplayScaler = numLib.scaler(0, tickNum, xMin, xMax),
            yAxisDisplayScaler = numLib.scaler(0, tickNum, yMin, yMax);

        var STR_LENGTH_MAX = 10;

        var xAxis = d3.svg.axis().scale(xAxisScaler)
                .orient((xAxisConf.pos === 0) ? "top" : "bottom")
                .tickValues(allValues).tickFormat(
                    function (d, i) {
                        var ret = xAxisDisplayScaler(i);
                        if (ret.toString().length > STR_LENGTH_MAX) {
                            var fixnum = jsnums.toFixnum(ret);
                            if (fixnum.toString().length > STR_LENGTH_MAX) {
                                var fixnumRounded = d3.format('.9r')(ret);
                                // d3 always cast the result of format to string
                                // and .r formatter could give NaN
                                if ((fixnumRounded === "NaN") ||
                                    (fixnumRounded.length > STR_LENGTH_MAX)) {
                                    return d3.format('.3e')(fixnum);
                                } else {
                                    return fixnumRounded;
                                }
                            } else {
                                return fixnum;
                            }
                        } else {
                            return ret;
                        }
                    });

        canvas.append("g")
            .attr("class", "x axis").attr(
                "transform",
                "translate(0," + xAxisConf.pos * (height - 1) + ")")
            .call(xAxis);

        var yAxis = d3.svg.axis().scale(yAxisScaler)
                .orient((yAxisConf.pos === 1) ? "right" : "left")
                .tickValues(allValues).tickFormat(
                    function (d, i) {
                        var ret = yAxisDisplayScaler(i);
                        if (ret.toString().length > STR_LENGTH_MAX) {
                            return d3.format('.3e')(jsnums.toFixnum(ret));
                        } else {
                            return ret;
                        }
                    });

        canvas.append("g")
            .attr("class", "y axis").attr(
                "transform",
                "translate(" + yAxisConf.pos * (width - 1) + ", 0)")
            .call(yAxis);

        canvas.selectAll('.x.axis path').style({
            'stroke': 'black',
            'stroke-width': xAxisConf.bold ? 2 : 0,
            'fill': 'none'
        });
        canvas.selectAll('.y.axis path').style({
            'stroke': 'black',
            'stroke-width': yAxisConf.bold ? 2 : 0,
            'fill': 'none'
        });

        canvas.selectAll("g.y.axis g.tick line")
            .attr("x1", -yAxisConf.pos * (width - 1))
            .attr("x2", (1 - yAxisConf.pos) * (width - 1));
        canvas.selectAll("g.x.axis g.tick line")
            .attr("y1", -xAxisConf.pos * (height - 1))
            .attr("y2", (1 - xAxisConf.pos) * (height - 1));

        canvas.selectAll('.axis').style({'shape-rendering': 'crispEdges'});
        canvas.selectAll('.axis text').style({'font-size': '10px'});
        canvas.selectAll('.axis line').style({
            'stroke': 'lightgray',
            'opacity': 0.6
        });

        return canvas;
    }

    var xyPlot = {
        plot: function(
            runtime, xMin, xMax, yMin, yMax, width, height, dataPoints) {
            // Plots a graph
            // These are adapted from http://jsfiddle.net/christopheviau/Hwpe3/

            var canvasObj = createCanvas(width, height);
            var detached = canvasObj.detached;
            var canvas = canvasObj.canvas;
            canvas = appendAxis(canvas, xMin, xMax, yMin, yMax, width, height);

            var line = d3.svg.line()
                    .x(function (d) { return d.x; })
                    .y(function (d) { return d.y; });

            dataPoints.forEach(
                function (groupedPoints) {
                    canvas.append("path")
                        .attr("class", "plotting")
                        .attr("d", line(groupedPoints));
                }
            );

            canvas.selectAll('.plotting').style(
                {'stroke': 'blue', 'stroke-width': 1, 'fill': 'none'});

            runtime.getParam("current-animation-port")(detached.node());
        },


        findMidPoint: function(left, right, xToPixel, yToPixel, f, yMin, yMax) {
            var midRealX = jsnums.divide(
                jsnums.add(left.realx, right.realx), 2);
            var midX = xToPixel(midRealX);
            var midRealY, midY;
            try {
                midRealY = f.app(midRealX);
                jsnums.toFixnum(midRealY); // to test complex number
                midRealY = numLib.adjustInRange(midRealY, yMin, yMax);
                midY = yToPixel(midRealY);
            } catch(e) {
                midRealY = NaN;
                midY = NaN;
            }
            return {
                'realx': midRealX,
                'x': midX,
                'realy': midRealY,
                'y': midY
            };
        },

        getDataRough: function(f, xMin, xMax, yMin, yMax, width, height) {
            // Produces "rough" data points to be used for plotting
            // It is rough because it assumes that f is continuous

            var inputScaler = numLib.scaler(0, width - 1, xMin, xMax, false),
                outputScaler = numLib.scaler(yMin, yMax, height - 1, 0, false);

            function addPoint(dataPoints, i) {
                // Consumes old data points and produces a new data points
                // which one point is added
                var x = inputScaler(i), y;
                var groupedPoints = lastElement(dataPoints);
                try {
                    // prevent Pyret's division by zero
                    y = f.app(x);
                    // y could be a complex number, which could not be converted
                    // to a fixnum
                    if (Number.isNaN(jsnums.toFixnum(y))) {
                        dataPoints.push([]);
                        return dataPoints;
                    }
                } catch (e) {
                    dataPoints.push([]);
                    return dataPoints;
                }

                var possibleY = numLib.adjustInRange(y, yMin, yMax);

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
                        'left': sublist[0].x,
                        'right': lastElement(sublist).x,
                        'arr': sublist
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
                    'left': a.left,
                    'right': b.right,
                    'arr': a.arr.concat(b.arr)
                };
            }

            if (interval.length > 0) {
                var firstValue = interval.shift();
                return interval.reduce(
                    function (dataPoints, val) {
                        var prevValue = dataPoints.pop();
                        if (isIntersectInterval(prevValue, val)) {
                            dataPoints.push(mergeInterval(prevValue, val));
                        } else {
                            dataPoints.push(prevValue);
                            dataPoints.push(val);
                        }
                        return dataPoints;
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
        },

        getDataBisect: function(f, xMin, xMax, yMin, yMax, width, height) {
            var xToPixel = numLib.scaler(xMin, xMax, 0, width - 1, true),
                yToPixel = numLib.scaler(yMin, yMax, height - 1, 0, true),
                delta = jsnums.divide(
                    jsnums.subtract(xMax, xMin),
                    jsnums.multiply(width, 10000));

            var INSERTLEFT = 0, INSERTRIGHT = 1,
                dyTolerate = 1,
                data = [];

            var roughData = xyPlot.getDataRough(
                f, xMin, xMax, yMin, yMax, width, height);
            var stackInit = roughData.map(function (d) {
                return {
                    'left': d[0],
                    'right': lastElement(d),
                    'stage': INSERTLEFT
                };
            }).reverse();

            function fillVertical(left, right, logTable, depth) {
                if (depth === 0) {
                    return {
                        'logTable': logTable,
                        'dataPoints': []
                    };
                }
                logTable = logTable.occupy(left.y).occupy(right.y);
                if (logTable.isRangedOccupied(left.y, right.y)) {
                    return {
                        'logTable': logTable,
                        'dataPoints': [
                            {'x': left.x, 'y': left.y, 'cont': true},
                            {'x': right.x, 'y': right.y, 'cont': true}
                        ]
                    };
                }
                var mid = xyPlot.findMidPoint(
                    left, right, xToPixel, yToPixel, f, yMin, yMax);
                var resultLeft = fillVertical(left, mid, logTable, depth - 1);
                logTable = resultLeft.logTable;
                var resultRight = fillVertical(mid, right, logTable, depth - 1);
                logTable = resultRight.logTable;
                return {
                    'logTable': logTable,
                    'dataPoints': resultLeft.dataPoints.concat(resultRight.dataPoints)
                };
            }

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
                        data.push({'x': left.x, 'y': left.y, 'cont': false});
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
                        } else if (dPixX === 0) {
                            var logTable = new LogTable(height);
                            var result = fillVertical(left, right, logTable, 15);
                            data.push.apply(data, result.dataPoints);
                            continue;
                        }
                    }
                    var mid = xyPlot.findMidPoint(
                        left, right, xToPixel, yToPixel, f, yMin, yMax);
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
                    data.push({'x': right.x, 'y': right.y, 'cont': false});
                }
            }

            var newData = data.filter(function(item, pos) {
                //console.log(item.x, item.y, item.cont);
                return (item.y >= 0 && item.y < HEIGHT) &&
                    ((pos === 0) ||
                     item.cont ||
                     (item.x !== data[pos - 1].x) ||
                     (item.y !== data[pos - 1].y));
            }).reduce(function(dataPoints, d) {
                var groupedPoints = lastElement(dataPoints);
                if (groupedPoints.length > 0) {
                    var prev = lastElement(groupedPoints);
                    if ((Math.abs(d.y - prev.y) > dyTolerate) ||
                        ((d.x - prev.x) > 1)) {
                        dataPoints.push([d]);
                    } else {
                        groupedPoints.push(d);
                    }
                } else {
                    groupedPoints.push(d);
                }
                return dataPoints;
            }, [[]]).filter(function (d) { return d.length > 1; });

            // newData could be used to plot, but it's not smooth
            return newData;

            var intervals = newData.map(
                function (interval) {
                    return {
                        left: interval[0].x,
                        right: lastElement(interval).x
                    };
                }).reverse();
            // we are going to perform stack operations
            // so we reverse the order

            // flatten the rough data to be regrouped again
            var flattened = roughData.reduce(
                function(lstOfPoints, groupedPoints) {
                    groupedPoints.forEach(function (d) { lstOfPoints.push(d); });
                    return lstOfPoints;
                }, []);

            return flattened.reduce(
                function (dataPoints, item) {
                    while ((intervals.length > 0) &&
                           (lastElement(intervals).right < item.x)) {
                        intervals.pop();
                        dataPoints.push([]);
                    }
                    if (intervals.length > 0) {
                        if ((lastElement(intervals).left <= item.x) &&
                            (item.x <= lastElement(intervals).right)) {
                            lastElement(dataPoints).push(item);
                        }
                    }
                    return dataPoints;
                }, [[]]).filter(function (d) { return d.length > 1; });
        },

        xyPlot: function(runtime) {
            return function (f, xMin, xMax, yMin, yMax) {
                runtime.checkArity(5, arguments, "xy-plot");
                runtime.checkFunction(f);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);

                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException("x-min and y-min must be strictly " +
                                                  "less than x-max and y-max " +
                                                  "respectively.");
                }
                xyPlot.plot(
                    runtime, xMin, xMax, yMin, yMax, WIDTH, HEIGHT,
                    xyPlot.getDataBisect(f, xMin, xMax, yMin, yMax, WIDTH, HEIGHT));
            };
        },

        xyPlotCont: function(runtime) {
            return function (f, xMin, xMax, yMin, yMax) {
                runtime.checkArity(5, arguments, "xy-plot");
                runtime.checkFunction(f);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);

                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException("x-min and y-min must be strictly " +
                                                  "less than x-max and y-max " +
                                                  "respectively.");
                }
                xyPlot.plot(
                    runtime, xMin, xMax, yMin, yMax, WIDTH, HEIGHT,
                    xyPlot.getDataRough(f, xMin, xMax, yMin, yMax, WIDTH, HEIGHT));
            };
        }
    };

    var scatterPlot = {
        plot: function(
            runtime, xMin, xMax, yMin, yMax, width, height, dataPoints) {

            var canvasObj = createCanvas(width, height);
            var detached = canvasObj.detached;
            var canvas = canvasObj.canvas;
            canvas = appendAxis(canvas, xMin, xMax, yMin, yMax, width, height);

            canvas.selectAll("circle")
                .data(dataPoints)
                .enter()
                .append("circle")
                .attr("class", "plotting")
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .attr("r", 2);

            canvas.selectAll('.plotting').style({'stroke': 'blue'});

            runtime.getParam("current-animation-port")(detached.node());
        },


        scatterPlot: function(runtime, ffi) {
            return function (lst) {
                runtime.checkList(lst);

                var dataPoints = ffi.toArray(lst).map(
                    function (e) {
                        // check that e is a posn
                        return {
                            'x': runtime.getField(e, "x"),
                            'y': runtime.getField(e, "y")
                        };
                    }
                );

                if (dataPoints.length === 0) {
                    runtime.throwMessageException("There must be at least one point " +
                                                  "in the list.");
                }

                var xMin = dataPoints
                        .map( function (d) { return d.x; } )
                        .reduce(numLib.min);
                var xMax = dataPoints
                        .map( function (d) { return d.x; } )
                        .reduce(numLib.max);
                var yMin = dataPoints
                        .map( function (d) { return d.y; } )
                        .reduce(numLib.min);
                var yMax = dataPoints
                        .map( function (d) { return d.y; } )
                        .reduce(numLib.max);

                var blockPortion = 10;
                var xOneBlock = jsnums.divide(jsnums.subtract(xMax, xMin), blockPortion);
                var yOneBlock = jsnums.divide(jsnums.subtract(yMax, yMin), blockPortion);

                xMin = jsnums.subtract(xMin, xOneBlock);
                xMax = jsnums.add(xMax, xOneBlock);
                yMin = jsnums.subtract(yMin, yOneBlock);
                yMax = jsnums.add(yMax, yOneBlock);

                // Plotting 1 point should be possible
                // but we need a wider range
                if (jsnums.equals(xMin, xMax)) {
                    xMin = jsnums.subtract(xMin, 1);
                    xMax = jsnums.add(xMax, 1);
                }
                if (jsnums.equals(yMin, yMax)) {
                    yMin = jsnums.subtract(yMin, 1);
                    yMax = jsnums.add(yMax, 1);
                }

                var xToPixel = numLib.scaler(xMin, xMax, 0, WIDTH - 1, true),
                    yToPixel = numLib.scaler(yMin, yMax, HEIGHT - 1, 0, true);

                dataPoints = dataPoints.map(
                    function (d) {
                        return {'x': xToPixel(d.x), 'y': yToPixel(d.y)};
                    }
                );

                scatterPlot.plot(runtime, xMin, xMax, yMin, yMax,
                                 WIDTH, HEIGHT, dataPoints);
            };
        }
    };

    function showSVG(runtime) {
        return function (xml) {
            /*
             * Produces a rendered SVG image in Big Bang box
             *
             * @param (string) xml
             * @return (nothing)
             */
            runtime.checkString(xml);
            runtime.getParam("current-animation-port")(xml);
        };
    }

    function test(runtime) {
        return function (x, y) {
            console.log(jsnums.greaterThan(x, y));
        };
    }

    return {
        xyPlot: xyPlot.xyPlot,
        xyPlotCont: xyPlot.xyPlotCont,
        scatterPlot: scatterPlot.scatterPlot,
        showSVG: showSVG,
        test: test
    };
});