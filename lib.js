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

function assert(val, msg) {
    if (!val) {
        throw new Error("Assertion failed: " + (msg || ""));
    }
}

function FenwickTree(n) {
    /*
     * Fenwick Tree for computing prefix sum
     *
     * @param {fixnum} n: number of elements
     * @return {Object}
     */
    this.arr = []; // use index 1 to n
    for (var i = 0; i < n + 1; ++i) {
        this.arr.push(0);
    }

    this.add = function (ind, val) {
        /*
         * Add `val` to position `ind`
         *
         * @param {fixnum} ind: index
         * @param {fixnum} val: value
         * @return {Object} this
         */
        assert(1 <= ind); // add from 1 to n
        assert(ind <= n);
        while (ind <= n) {
            this.arr[ind] += val;
            ind += (ind & (-ind));
        }
        return this;
    };

    this.sum = function (ind) {
        /*
         * Produces the sum of all values from position 1 to `ind`
         *
         * @param {fixnum} ind: index
         * @return {fixnum}
         */
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
        /*
         * Produces the sum of all values between position `l` and `r`
         *
         * @param {fixnum} l
         * @param {fixnum} r
         * @return {fixnum}
         */
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
    /*
     * LogTable to check whether an interval is full
     *
     * @param {fixnum} n
     */
    this.fenwick = new FenwickTree(n);

    this.occupy = function (v) {
        /*
         * Occupied a space
         *
         * @param {fixnum} v
         * @return {Object} this
         */
        v += 1; // use based-1 index
        if (!Number.isNaN(v) && this.fenwick.sumInterval(v, v) === 0) {
            this.fenwick.add(v, 1);
        }
        return this;
    };

    this.isRangedOccupied = function (l, r) {
        /*
         * Answered whether the interval [l, r] is all occupied
         *
         * @param {fixnum} l
         * @param {fixnum} r
         * @return {Boolean}
         */
        l += 1;
        r += 1;
        if (Number.isNaN(l) || Number.isNaN(r)) {
            return false;
        } else {
            if (l > r) {
                var tmp = l;
                l = r;
                r = tmp;
            }
            return this.fenwick.sumInterval(l, r) === (r - l + 1);
        }
    };
};

define(["d3", "d3tip", "js/js-numbers"], function (d3, d3tip, jsnums) {
    var numLib = {
        /*
         * Utility for jsnums
         */

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

    function myFormatter(num, digit) {
        if (num.toString().length > digit) {
            var fixnum = jsnums.toFixnum(num);
            if (fixnum.toString().length > digit) {
                // digit - 2 because we might have '.' and '-'
                var digitRounded = digit - 1;
                if (fixnum < 0) {
                    digitRounded--;
                }
                if (fixnum.toString().indexOf(".") !== -1) {
                    digitRounded--;
                }
                var fixnumRounded = d3
                        .format('.' + digitRounded + 'r')(fixnum);
                // d3 always cast the result of format to
                // string and .r formatter could give NaN
                if ((fixnumRounded === "NaN") ||
                    (fixnumRounded.length > digit)) {
                    // use only 3 position because this notation
                    // has xxx.xxxe+.. ~ 9 digits
                    return d3.format('.3e')(fixnum);
                } else {
                    return fixnumRounded;
                }
            } else {
                return fixnum;
            }
        } else {
            return num;
        }
    }

    function createCanvas(width, height) {
        /*
         * Creates a canvas and detached node
         *
         * @param {fixnum} width: in pixel
         * @param {fixnum} height: in pixel
         * @return {Object} an object containing 'detached' which has
         * a detached node and 'canvas' which has a canvas
         */
        var margin = {'top': 30, 'left': 100, 'bottom': 45, 'right': 100};

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
         * @return {d3 selection}
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

        var xAxis = d3.svg.axis().scale(xAxisScaler)
                .orient((xAxisConf.pos === 0) ? "top" : "bottom")
                .tickValues(allValues).tickFormat(
                    function (d, i) {
                        return myFormatter(xAxisDisplayScaler(i), 10);
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
                        return myFormatter(yAxisDisplayScaler(i), 10);
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
        /*
         * Plot a function
         *
         * Part of this function is adapted from
         * http://jsfiddle.net/christopheviau/Hwpe3/
         */

        'constant': {
            'rangeError': "x-min and y-min must be strictly less than " +
                "x-max and y-max respectively."
        },

        'plot': function(
            runtime, xMin, xMax, yMin, yMax, width, height, dataPoints) {

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


        'findMidPoint': function (left, right, xToPixel, yToPixel,
                                  f, yMin, yMax) {
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
                    // y could be a complex number, which could not be
                    // converted to a fixnum
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
                    jsnums.multiply(width, 1000));

            var MAXDEPTH = 15, INSERTLEFT = 0, INSERTRIGHT = 1,
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

            /*
             stackInit = [{
             'left': lastElement(stackInit).left,
             'right': stackInit[0].right, 'stage': INSERTLEFT
             }];
             */

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
                            {'x': left.x, 'y': left.y, 'cont': false},
                            {'x': right.x, 'y': right.y, 'cont': true}
                        ] // really? why the left point should have cont=true?
                    };
                }
                var mid = xyPlot.findMidPoint(
                    left, right, xToPixel, yToPixel, f, yMin, yMax);
                var resultLeft = fillVertical(
                    left, mid, logTable, depth - 1);
                logTable = resultLeft.logTable;
                var resultRight = fillVertical(
                    mid, right, logTable, depth - 1);
                logTable = resultRight.logTable;
                return {
                    'logTable': logTable,
                    'dataPoints': resultLeft.dataPoints.concat(
                        resultRight.dataPoints)
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
                            var result = fillVertical(left, right, logTable,
                                                      MAXDEPTH);
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


            // TODO: Below is absolutely wrong; why does it work?
            var newData = data.filter(function(item, pos) {
                return (item.y >= 0 && item.y < HEIGHT) &&
                    ((pos === 0) ||
                     (item.x !== data[pos - 1].x) ||
                     (item.y !== data[pos - 1].y));
            }).reduce(function(dataPoints, d) {
                var groupedPoints = lastElement(dataPoints);
                if (groupedPoints.length > 0) {
                    var prev = lastElement(groupedPoints);
                    if ((!d.cont) && ((Math.abs(d.y - prev.y) > dyTolerate) ||
                                      ((d.x - prev.x) > 1))) {
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
                    groupedPoints.forEach(function (d) {
                        lstOfPoints.push(d);
                    });
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

                // TODO: check that f produces Number?

                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException(xyPlot.constants.rangeError);
                }
                xyPlot.plot(
                    runtime, xMin, xMax, yMin, yMax, WIDTH, HEIGHT,
                    xyPlot.getDataBisect(f, xMin, xMax, yMin, yMax,
                                         WIDTH, HEIGHT));
            };
        },

        xyPlotCont: function(runtime) {
            return function (f, xMin, xMax, yMin, yMax) {
                runtime.checkArity(5, arguments, "xy-plot-cont");
                runtime.checkFunction(f);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);

                // TODO: check that f produces Number?

                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException(xyPlot.constants.rangeError);
                }
                xyPlot.plot(
                    runtime, xMin, xMax, yMin, yMax, WIDTH, HEIGHT,
                    xyPlot.getDataRough(f, xMin, xMax, yMin, yMax,
                                        WIDTH, HEIGHT));
            };
        }
    };

    var scatterPlot = {
        /*
         * Scatter plot
         *
         * Part of this function is adapted from
         * http://alignedleft.com/tutorials/d3/making-a-scatterplot
         */
        plot: function(
            runtime, xMin, xMax, yMin, yMax, width, height,
            dataPoints, canvasObj) {

            var xToPixel = numLib.scaler(xMin, xMax, 0, width - 1, true),
                yToPixel = numLib.scaler(yMin, yMax, height - 1, 0, true);

            var canvas = canvasObj.canvas;
            var detached = canvasObj.detached;
            canvas = appendAxis(canvas, xMin, xMax, yMin, yMax, width, height);

            var tip = d3tip(detached)
                    .attr('class', 'd3-tip')
                    .direction('e')
                    .offset([0, 20])
                    .html(function (d) {
                        var x = myFormatter(d.x, 6);
                        var y = myFormatter(d.y, 6);
                        return "x: " + x.toString() + "<br />" +
                            "y: " + y.toString() + "<br />";
                    });

            canvas.call(tip);

            canvas.selectAll("circle")
                .data(dataPoints)
                .enter()
                .append("circle")
                .attr("class", "plotting")
                .attr("cx", function (d) { return xToPixel(d.x); })
                .attr("cy", function (d) { return yToPixel(d.y); })
                .attr("r", 2)
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            canvas.selectAll('.plotting').style('stroke', 'blue');
            detached.selectAll('.d3-tip')
                .style({
                    'background': 'rgba(0, 0, 0, 0.8)',
                    'line-height': '1.5',
                    'font-weight': 'bold',
                    'font-size': '8pt',
                    'color': '#fff',
                    'padding': '10px',
                    'border-radius': '2px'
                });

            runtime.getParam("current-animation-port")(detached.node());
        },

        plotWithLine: function(canvas, dataPoints) {
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

            return canvas.selectAll('.plotting').style(
                {'stroke': 'blue', 'stroke-width': 1, 'fill': 'none'});
        },

        scatterPlot: function(runtime, ffi) {
            return function (lst) {
                runtime.checkArity(1, arguments, "scatter-plot");
                runtime.checkList(lst);

                var dataPoints = ffi.toArray(lst).map(
                    function (e) {
                        // TODO: check that e is a posn?
                        return {
                            'x': runtime.getField(e, "x"),
                            'y': runtime.getField(e, "y")
                        };
                    }
                );

                if (dataPoints.length === 0) {
                    runtime.throwMessageException("There must be at least " +
                                                  "one point in the list.");
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
                var xOneBlock = jsnums.divide(jsnums.subtract(xMax, xMin),
                                              blockPortion);
                var yOneBlock = jsnums.divide(jsnums.subtract(yMax, yMin),
                                              blockPortion);

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

                scatterPlot.plot(runtime, xMin, xMax, yMin, yMax,
                                 WIDTH, HEIGHT, dataPoints,
                                 createCanvas(WIDTH, HEIGHT));
            };
        },

        linearRegression: function(runtime, ffi) {
            return function (lst, f) {
                runtime.checkArity(2, arguments, "linear-regression");
                runtime.checkList(lst);
                runtime.checkFunction(f);

                var dataPoints = ffi.toArray(lst).map(
                    function (e) {
                        // TODO: check that e is a posn?
                        return {
                            'x': runtime.getField(e, "x"),
                            'y': runtime.getField(e, "y")
                        };
                    }
                );

                if (dataPoints.length === 0) {
                    runtime.throwMessageException("There must be at least " +
                                                  "one point in the list.");
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
                var xOneBlock = jsnums.divide(jsnums.subtract(xMax, xMin),
                                              blockPortion);
                var yOneBlock = jsnums.divide(jsnums.subtract(yMax, yMin),
                                              blockPortion);

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

                var canvasObj = createCanvas(WIDTH, HEIGHT);
                scatterPlot.plotWithLine(canvasObj.canvas,
                                         xyPlot.getDataRough(f, xMin, xMax,
                                                             yMin, yMax,
                                                             WIDTH, HEIGHT));

                scatterPlot.plot(runtime, xMin, xMax, yMin, yMax,
                                 WIDTH, HEIGHT, dataPoints,
                                 canvasObj);

            };
        }
    };

    var histogramPlot = {
        /*
         * Plot a histogram
         *
         * Part of this function is adapted from
         * http://www.frankcleary.com/making-an-interactive-histogram-in-d3-js/
         */

        'constant': {
            'MAXN': 100
        },

        plot: function(
            runtime, xMin, xMax, yMin, yMax, width, height, data) {

            var canvasObj = createCanvas(width, height);
            var detached = canvasObj.detached;
            var canvas = canvasObj.canvas;
            canvas = appendAxis(canvas, xMin, xMax, yMin, yMax, width, height);

            var x = d3.scale.linear()
                    .domain([0, histogramPlot.constant.MAXN])
                    .range([0, width]);

            var y = d3.scale.linear()
                    .domain([0, d3.max(data, function(d) { return d.y; })])
                    .range([height, 0]);

            var tip = d3tip(detached)
                    .attr('class', 'd3-tip')
                    .direction('e')
                    .offset([0, 20])
                    .html(function (d) {
                        var maxVal = myFormatter(d.reduce(numLib.max), 6);
                        var minVal = myFormatter(d.reduce(numLib.min), 6);
                        return "min: " + minVal.toString() + "<br />" +
                            "max: " + maxVal.toString() + "<br />" +
                            "freq: " + d.y;
                    });

            canvas.call(tip);

            var bar = canvas.selectAll(".bar")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "bar")
                    .on("mouseover", tip.show)
                    .on("mouseout", tip.hide);

            bar.append("rect")
                .attr("x", function(d) { return x(d.x); })
                .attr("y", function(d) { return y(d.y); })
                .attr("width", x(data[0].dx) - 1)
                .attr("height", function(d) { return height - y(d.y); });

            canvas.selectAll('.bar rect')
                .style({
                    'fill': 'steelblue',
                    'fill-opacity': '0.8',
                    'shape-rendering': 'crispEdges'
                })
                .on('mouseover', function(d) {
                    d3.select(this).style('fill', "black");
                })
                .on('mouseout', function(d) {
                    d3.select(this).style('fill', "steelblue");
                });

            detached.selectAll('.d3-tip')
                .style({
                    'background': 'rgba(0, 0, 0, 0.8)',
                    'line-height': '1.5',
                    'font-weight': 'bold',
                    'font-size': '8pt',
                    'color': '#fff',
                    'padding': '10px',
                    'border-radius': '2px'
                });

            runtime.getParam("current-animation-port")(detached.node());
        },


        histogramPlot: function(runtime, ffi) {
            return function (lst, n) {
                runtime.checkList(lst);
                runtime.checkNumber(n);

                if ((!jsnums.isInteger(n)) ||
                    (n < 1) ||
                    (n > histogramPlot.constant.MAXN)) {
                    runtime.throwMessageException("n must be an interger " +
                                                  "between 1 and " +
                                                  histogramPlot.constant.MAXN);
                }

                var data = ffi.toArray(lst);

                if (data.length === 0) {
                    runtime.throwMessageException("There must be at least " +
                                                  "one Number in the list.");
                }

                var xMin = data.reduce(numLib.min);
                var xMax = data.reduce(numLib.max);
                var dataScaler = numLib.scaler(
                    xMin, xMax, 0, histogramPlot.constant.MAXN, false);

                var histogramData = d3.layout.histogram()
                        .bins(n).value(function (val) {
                            return jsnums.toFixnum(dataScaler(val));
                        })(data);

                var yMax = d3.max(histogramData, function(d) { return d.y; });

                histogramPlot.plot(runtime, xMin, xMax, 0, yMax,
                                   WIDTH, HEIGHT, histogramData);
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
        return function () {
        };
    }

    return {
        'xyPlot': xyPlot.xyPlot,
        'xyPlotCont': xyPlot.xyPlotCont,
        'scatterPlot': scatterPlot.scatterPlot,
        'linearRegression': scatterPlot.linearRegression,
        'histogramPlot': histogramPlot.histogramPlot,
        'showSVG': showSVG,
        'test': test
    };
});