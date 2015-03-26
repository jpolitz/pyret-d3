/*
 * pyret-d3
 */
'use strict';

var WIDTH = 401;
var HEIGHT = 401;
var MARGIN = {'top': 30, 'left': 100, 'bottom': 45, 'right': 100};
var HISTOGRAMN = 100;

function lastElement(arr) {
    /*
     * Produces the last element of arr
     *
     * @param {array} arr
     * @return {Any}
     */
    return arr[arr.length - 1];
}

function flatten(lst) {
    /*
     * Flatten the list
     *
     * @param {array} lst
     * @return {array}
     */
    return lst.reduce(
        function(outter, inner) { return outter.concat(inner); },
        []);
}

function fill(n, v) {
    var ret = [];
    for (var i = 0; i < n; ++i) ret.push(v);
    return ret;
}

function assert(val, msg) {
    if (!val) throw new Error("Assertion failed: " + (msg || ""));
}

function svgTranslate(x, y) {
    if (y === undefined) {
        return "translate(" + x.toString() + ")";
    } else {
        return "translate(" + x.toString() + "," + y.toString() + ")";
    }
}

function FenwickTree(n) {
    /*
     * Fenwick Tree for computing prefix sum
     *
     * @param {fixnum} n: number of elements
     * @return {Object}
     */
    this.arr = fill(n + 1, 0); // use index 1 to n

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

var CError = {
    "RANGE": "x-min and y-min must be strictly less than " +
        "x-max and y-max respectively."
};

define(
    ["d3", "d3tip", "js/js-numbers", "my-project/libJS", "my-project/libNum"],
    function (d3, d3tip, jsnums, libJS, libNum) {


        function convertColor(image) {
            var colorDb = image.colorDb;

            var p = function(pred, name) {
                return function(val) {
                    runtime.makeCheckType(pred, name)(val);
                    return val;
                };
            };

            var _checkColor = p(image.isColorOrColorString, "Color");

            var checkColor = function(val) {
                var aColor = _checkColor(val);
                if (colorDb.get(aColor)) {
                    aColor = colorDb.get(aColor);
                }
                return aColor;
            };

            var colorString = function(aColor) {
                return "rgba(" + image.colorRed(aColor) + "," +
                    image.colorGreen(aColor) + ", " +
                    image.colorBlue(aColor) + ", " +
                    image.colorAlpha(aColor) + ")";
            };

            return function(v) { return colorString(checkColor(v)); };
        }

        function createDiv() {
            /*
             * Creates a blank div
             *
             * @return {d3 selection}
             */
            return d3.select(document.createElement("div"))
                .attr('class', 'maind3');
        }

        function createCanvas(width, height, detached, orient) {
            /*
             * Creates a canva
             *
             * @param {fixnum} width: in pixel
             * @param {fixnum} height: in pixel
             * @param {d3 selection} detached
             * @param {string} orient
             * @return {d3 selection}
             */

            var divSvg = detached.append('div');
            var canvas = divSvg
                    .append("svg")
                    .attr("width", width + MARGIN.left + MARGIN.right)
                    .attr("height", height + MARGIN.top + MARGIN.bottom)
                    .append("g")
                    .attr('class', 'maing')
                    .append('g');

            if (orient === "top-left") {
                canvas.attr("transform", svgTranslate(MARGIN.left, MARGIN.top));
            } else if (orient == "center") {
                var allwidth = width + MARGIN.left + MARGIN.right;
                var allheight = height + MARGIN.top + MARGIN.bottom;
                canvas.attr("transform", svgTranslate(allwidth / 2, allheight / 2));
            } else {
                throw "orient '" + orient  + "' not implemented"; // internal error
            }
            return canvas;
        }

        function callBigBang(runtime, detached) {
            runtime.getParam("current-animation-port")(detached.node());
        }

        function createSave(detached) {
            /*
             * Create a button to download the image of canvas as PNG file
             *
             * A part of these are adapted from
             * http://techslides.com/save-svg-as-an-image
             */
            detached.append('button')
                .text('Save!')
                .on('click', function() {
                    var svg = detached.select("svg")
                            .attr("version", 1.1)
                            .attr("xmlns", "http://www.w3.org/2000/svg");
                    var canvas = detached.append('canvas')
                            .style('display', 'none')
                            .attr('width', svg.attr("width"))
                            .attr('height', svg.attr("height"));
                    var svgData = detached.append('div')
                            .style('display', 'none');
                    var html = detached.node().firstChild.innerHTML;
                    var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);
                    var img = '<img src="' + imgsrc + '">';
                    svgData.html(img);

                    var image = new Image;
                    image.src = imgsrc;
                    image.onload = function() {
                        var opts = {
                            canvas: canvas.node(),
                            image: image
                        };
                        var a = document.createElement("a");
                        a.download = "sample.png";
                        a.href = libJS.drawImage(opts).toDataURL("image/png");;
                        a.click();

                        // the image's size was doubled everytime we click the button
                        // remove all data to prevent this to happen
                        svgData.remove();
                        canvas.remove();
                    };
                });
        }

        function appendAxis(xMin, xMax, yMin, yMax, width, height, canvas) {
            /*
             * Appends axes to canvas
             *
             * @param {jsnums} xMin
             * @param {jsnums} xMax
             * @param {jsnums} yMin
             * @param {jsnums} yMax
             * @param {fixnum} width
             * @param {fixnum} height
             * @param {d3 selection} canvas
             */

            function getAxisConf(aMin, aMax) {
                var conf = {};
                var scaler = libNum.scaler(aMin, aMax, 0, 1, false);
                var pos = jsnums.toFixnum(scaler(0));
                if (0 <= pos && pos <= 1) {
                    conf.bold = true;
                    conf.pos = pos;
                } else if (pos > 1) {
                    conf.bold = false;
                    conf.pos = 1;
                } else if (pos < 0) {
                    conf.bold = false;
                    conf.pos = 0;
                }
                return conf;
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

            var xAxisDisplayScaler = libNum.scaler(0, tickNum, xMin, xMax),
                yAxisDisplayScaler = libNum.scaler(0, tickNum, yMin, yMax);

            var xAxis = d3.svg.axis().scale(xAxisScaler)
                    .orient((xAxisConf.pos === 0) ? "top" : "bottom")
                    .tickValues(allValues).tickFormat(
                        function (d, i) {
                            return libNum.format(xAxisDisplayScaler(i), 10);
                        });

            canvas.append("g")
                .attr("class", "x axis").attr(
                    "transform",
                    svgTranslate(0, xAxisConf.pos * (height - 1)))
                .call(xAxis);

            var yAxis = d3.svg.axis().scale(yAxisScaler)
                    .orient((yAxisConf.pos === 1) ? "right" : "left")
                    .tickValues(allValues).tickFormat(
                        function (d, i) {
                            return libNum.format(yAxisDisplayScaler(i), 10);
                        });

            canvas.append("g")
                .attr("class", "y axis").attr(
                    "transform",
                    svgTranslate(yAxisConf.pos * (width - 1), 0))
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
        }

        function stylizeTip(detached) {
            /*
             * Add styles for tooltip
             *
             * @param {d3 selection} detached
             */
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
        }

        function plotLine(
            dataPoints, id, xMin, xMax, yMin, yMax,
            width, height, color, canvas) {
            /*
             * Graph a line
             *
             * Part of this function is adapted from
             * http://jsfiddle.net/christopheviau/Hwpe3/
             */

            var xToPixel = libNum.scaler(xMin, xMax, 0, width - 1, true),
                yToPixel = libNum.scaler(yMin, yMax, height - 1, 0, true);

            var line = d3.svg.line()
                    .x(function (d) { return xToPixel(d.x); })
                    .y(function (d) { return yToPixel(d.y); });

            canvas.append("path")
                .attr("class", "plotting" + id.toString())
                .attr("d", line(dataPoints));

            canvas.selectAll('.plotting' + id.toString()).style(
                {'stroke': color, 'stroke-width': 1, 'fill': 'none'});
        }

        function plotPoints(
            dataPoints, id, xMin, xMax, yMin, yMax,
            width, height, color, canvas, detached) {
            /*
             * Plot data points (scatter plot)
             *
             * Part of this function is adapted from
             * http://alignedleft.com/tutorials/d3/making-a-scatterplot
             */

            var xToPixel = libNum.scaler(xMin, xMax, 0, width - 1, true),
                yToPixel = libNum.scaler(yMin, yMax, height - 1, 0, true);

            var tip = d3tip(detached)
                    .attr('class', 'd3-tip')
                    .direction('e')
                    .offset([0, 20])
                    .html(function (d) {
                        var x = libNum.format(d.x, 6);
                        var y = libNum.format(d.y, 6);
                        return "x: " + x.toString() + "<br />" +
                            "y: " + y.toString() + "<br />";
                    });

            canvas.call(tip);

            canvas.selectAll("circle")
                .data(dataPoints)
                .enter()
                .append("circle")
                .attr("class", "scatter-plot" + id.toString())
                .attr("cx", function (d) { return xToPixel(d.x); })
                .attr("cy", function (d) { return yToPixel(d.y); })
                .attr("r", 2)
                .on("mouseover", tip.show)
                .on("mouseout", tip.hide);

            canvas.selectAll('.scatter-plot' + id.toString()).style('fill', color);
            stylizeTip(detached);
        }

        function plotBar(xMin, xMax, yMin, yMax, width, height,
                         data, histogramn, detached, canvas) {

            /*
             * Plot a histogram
             *
             * Part of this function is adapted from
             * http://www.frankcleary.com/making-an-interactive-histogram-in-d3-js/
             */

            var x = d3.scale.linear()
                    .domain([0, histogramn])
                    .range([0, width]);

            var y = d3.scale.linear()
                    .domain([0, d3.max(data, function(d) { return d.y; })])
                    .range([height, 0]);

            var tip = d3tip(detached)
                    .attr('class', 'd3-tip')
                    .direction('e')
                    .offset([0, 20])
                    .html(function (d) {
                        var maxVal = libNum.format(d.reduce(libNum.max), 6);
                        var minVal = libNum.format(d.reduce(libNum.min), 6);
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

            stylizeTip(detached);
        }

        function putLabel(label, width, height, detached) {
            var supportedTags = [
                ["<sup>", "<tspan baseline-shift='super'>"],
                ["</sup>", "</tspan>"],
                ["<sub>", "<tspan baseline-shift='sub'>"],
                ["</sub>", "</tspan>"]
            ];

            var processedLabel = supportedTags.reduce(function(prev, current) {
                return prev.replace(libJS.htmlspecialchars(current[0]), current[1]);
            }, libJS.htmlspecialchars(label));

            var legend = detached.select('.maing')
                    .append("text")
                    .attr("x", (MARGIN.left + width + MARGIN.right) / 2)
                    .attr("y", height + MARGIN.top + 30)
                    .html(processedLabel);

            legend.style({
                'position': 'absolute',
                'font-size': '8pt',
                'text-anchor': 'middle'
            });
        }

        function parsePoints(points, runtime) {
            return runtime.ffi.toArray(points).map(
                function (e) {
                    return {
                        'x': runtime.getField(e, "x"),
                        'y': runtime.getField(e, "y")
                    };
                }
            );
        }

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

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

        function getBBox(runtime) {
            return function (xml) {
                var parser = new DOMParser();
                var svg = parser.parseFromString(
                    xml, "image/svg+xml").documentElement;
                var bbox = libJS.getBBox(svg);
                return runtime.makeObject({
                    'height': bbox.height,
                    'width': bbox.width,
                    'x': bbox.x,
                    'y': bbox.y
                });
            };
        }

        function histogramPlot(runtime) {
            return function (lst, n) {
                runtime.checkArity(2, arguments, "histogram-plot");
                runtime.checkList(lst);
                runtime.checkNumber(n);

                if ((!jsnums.isInteger(n)) ||
                    (n < 1) ||
                    (n > HISTOGRAMN)) {
                    runtime.throwMessageException(
                        "n must be an interger between 1 and " +
                            HISTOGRAMN.toString());
                }

                var data = runtime.ffi.toArray(lst);

                if (data.length === 0) {
                    runtime.throwMessageException("There must be at least " +
                                                  "one Number in the list.");
                }

                var xMin = data.reduce(libNum.min);
                var xMax = data.reduce(libNum.max);
                var dataScaler = libNum.scaler(xMin, xMax, 0, HISTOGRAMN, false);

                var histogramData = d3.layout.histogram()
                        .bins(n).value(function (val) {
                            return jsnums.toFixnum(dataScaler(val));
                        })(data);

                var yMax = d3.max(histogramData, function(d) { return d.y; });

                var detached = createDiv();
                var canvas = createCanvas(WIDTH, HEIGHT, detached, "top-left");

                appendAxis(xMin, xMax, 0, yMax, WIDTH, HEIGHT, canvas);

                plotBar(xMin, xMax, 0, yMax, WIDTH, HEIGHT,
                        histogramData, HISTOGRAMN, detached, canvas);

                callBigBang(runtime, detached);
            };
        }

        function pieChart(runtime, sd) {
            /*
             * Part of this function is adapted from:
             * http://bl.ocks.org/mbostock/3887235
             */
            return function (sdValue) {
                runtime.checkArity(1, arguments, "pie-chart");

                var annImmutable = sd.dict["provide-plus-types"]
                        .dict.types.StringDict;

                var checkISD = function(v) {
                    runtime._checkAnn(["string-dict"], annImmutable, v);
                };

                checkISD(sdValue);

                var keys = runtime.ffi.toArray(
                    runtime.getField(sdValue, "keys-list").app());

                if (keys.length === 0) {
                    runtime.throwMessageException("There must be at least " +
                                                  "one entry in the list.");
                }

                var data = keys.map(function (k) {
                    return {
                        'label': k,
                        'value': runtime.getField(sdValue, "get-value").app(k)
                    };
                });

                var sum = data.map(function (e) { return e.value; })
                        .reduce(jsnums.add);

                var scaler = libNum.scaler(0, sum, 0, 100);

                var radius = Math.min(WIDTH, HEIGHT) / 2;
                var color = d3.scale.category20();
                var arc = d3.svg.arc()
                        .outerRadius(radius)
                        .innerRadius(0);

                var pie = d3.layout.pie()
                        .sort(null)
                        .value(function(d) { return d.value; });

                var detached = createDiv();

                var tip = d3tip(detached)
                        .attr('class', 'd3-tip')
                        .direction('e')
                        .offset([0, 20])
                        .html(function (d) {
                            return "value: <br />" +
                                libNum.format(d.data.value, 10) + "<br />" +
                                "percent: <br />" +
                                libNum.format(
                                    jsnums.toFixnum(
                                        scaler(d.data.value)), 7) + "%";
                        });

                var canvas = createCanvas(WIDTH, HEIGHT, detached, "center");
                canvas.call(tip);

                var g = canvas.selectAll(".arc")
                        .data(pie(data))
                        .enter().append("g")
                        .attr("class", "arc");

                g.append("path").attr("class", "path").attr("d", arc);

                g.append("text")
                    .attr("transform", function(d) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .attr("dy", ".35em")
                    .style({
                        "text-anchor": "middle"
                    })
                    .text(function(d) { return d.data.label; });

                g.append("path").attr("class", "transparent").attr("d", arc);

                stylizeTip(detached);

                canvas.selectAll(".arc path")
                    .style({
                        "fill": function(d, i) { return color(i); }
                    })
                    .on("mouseover", function (e) {
                        d3.select(this.parentNode)
                            .selectAll(".path")
                            .style('opacity', '0.4');
                        tip.show(e);
                    })
                    .on("mouseout", function (e) {
                        d3.select(this.parentNode)
                            .selectAll(".path")
                            .style('opacity', '0.9');
                        tip.hide(e);
                    });

                canvas.selectAll(".transparent").style('opacity', '0');
                canvas.selectAll('text').style({'font-size': '15px'});

                createSave(detached);

                callBigBang(runtime, detached);
            };
        }

        function forceLayout(runtime, image) {
            /*
             * This function is adapted from:
             *
             * http://jsfiddle.net/zhanghuancs/a2QpA/
             * http://emptypipes.org/2015/02/15/selectable-force-directed-graph/
             */
            return function (rawGraph) {
                runtime.checkArity(1, arguments, "force-layout");
                runtime.checkObject(rawGraph);

                var colorConverter = convertColor(image);

                var nodes = runtime.ffi.toArray(
                    runtime.getField(rawGraph, "vertices")).map(
                        function(e) {
                            return {
                                'name': runtime.getField(e, "name"),
                                'color': colorConverter(runtime.getField(e, "color"))
                            };
                        });

                var indices = nodes.reduce(function (prev, current, index) {
                    prev[current.name] = index;
                    return prev;
                }, {});


                var totalLinks = {};
                var links = runtime.ffi.toArray(
                    runtime.getField(rawGraph, "edges")).map(
                        function(e) {
                            return {
                                'source': indices[runtime.getField(runtime.getField(e, "source"), "name")],
                                'target': indices[runtime.getField(runtime.getField(e, "target"), "name")],
                                'linkindex': 0,
                                'label': runtime.getField(e, "label")
                            };
                        });

                // haven't call .start() why is it activated???

                links.sort(function(a, b) {
                    if (a.source.id == b.source.id) return a.target.id - b.target.id;
                    return a.source.id - b.source.id;
                });

                links.forEach(function (v, i) {
                    if (i > 0 &&
                        links[i].source == links[i - 1].source &&
                        links[i].target == links[i - 1].target) {

                        links[i].linkindex = links[i - 1].linkindex + 1;
                    }
                    totalLinks[links[i].source.id + ',' + links[i].target.id] = links[i].linkindex + 1;
                });

                var detached = createDiv();
                var canvas = createCanvas(WIDTH, HEIGHT, detached, "top-left");

                detached.attr("tabindex", 1)
                    .on("keydown.brush", keydown)
                    .on("keyup.brush", keyup)
                    .each(function() { this.focus(); });

                var shiftKey;

                var xScale = d3.scale.linear()
                        .domain([0,WIDTH]).range([0,WIDTH]);
                var yScale = d3.scale.linear()
                        .domain([0,HEIGHT]).range([0, HEIGHT]);

                var zoomer = d3.behavior.zoom().
                    scaleExtent([0.1,10]).
                    x(xScale).
                    y(yScale).
                    on("zoomstart", zoomstart).
                    on("zoom", redraw);

                function zoomstart() {
                    node.each(function(d) {
                        d.selected = false;
                        d.previouslySelected = false;
                    });
                    node.classed("selected", false);
                    update();
                }

                function redraw() {
                    vis.attr("transform",
                             svgTranslate(d3.event.translate) +
                             " scale(" + d3.event.scale + ")");
                    update();
                }


             var brusher = d3.svg.brush()
                //.x(d3.scale.identity().domain([0, width]))
                //.y(d3.scale.identity().domain([0, height]))
                        .x(xScale)
                        .y(yScale)
                        .on("brushstart", function(d) {
                            node.each(function(d) {
                                d.previouslySelected = shiftKey && d.selected;
                            });
                            update();
                        })
                        .on("brush", function() {
                            var extent = d3.event.target.extent();

                            node.classed("selected", function(d) {
                                return d.selected = d.previouslySelected ^
                                    (extent[0][0] <= d.x && d.x < extent[1][0]
                                     && extent[0][1] <= d.y && d.y < extent[1][1]);
                            });
                            update();
                        })
                     .on("brushend", function() {
                         d3.event.target.clear();
                         d3.select(this).call(d3.event.target);
                         update();
                     });

                var svg_graph = canvas.append('g')
                        .call(zoomer);
                //.call(brusher)

                var brush = svg_graph.append("g")
                        .datum(function() {
                            return { selected: false, previouslySelected: false }; })
                        .attr("class", "brush");

                var vis = svg_graph.append("g");

                vis.attr('fill', 'red')
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
                    .attr('opacity', 0.5)
                    .attr('id', 'vis');


                brush.call(brusher)
                    .on("mousedown.brush", null)
                    .on("touchstart.brush", null)
                    .on("touchmove.brush", null)
                    .on("touchend.brush", null);

                brush.select('.background').style('cursor', 'auto');

                var link = vis.append("g")
                        .attr("class", "link")
                        .selectAll("path")
                        .data(links).enter().append("path");

                var nodearea = vis.append("g")
                        .attr("class", "node")
                        .selectAll("circle")
                        .data(nodes).enter();

                var node = nodearea.append("circle")
                        .attr("r", 4)
                        .attr("fill", function(d) { return d.color; })
                        .on("dblclick", function(d) { d3.event.stopPropagation(); })
                        .on("click", function(d) {
                            if (d3.event.defaultPrevented) return;
                            if (!shiftKey) {
                                //if the shift key isn't down, unselect everything
                                canvas.selectAll(".selected").classed(
                                    'selected', function(p) {
                                        return p.selected = p.previouslySelected = false;
                                    });
                            }
                            // always select this node
                            d3.select(this).classed(
                                "selected", d.selected = !d.previouslySelected);
                            update();
                        })
                        .on("mouseup", function(d) {
                            //if (d.selected && shiftKey) d3.select(this).classed("selected", d.selected = false);
                        })
                        .call(d3.behavior.drag()
                              .on("dragstart", dragstarted)
                              .on("drag", dragged)
                              .on("dragend", dragended));

                var textnode = nodearea.append('text')
                    .text(function(d) { return d.name; });

                var force = d3.layout.force()
                        .charge(-120)
                        .linkDistance(50)
                        .nodes(nodes)
                        .links(links)
                        .size([WIDTH, HEIGHT])
                        .start();

                function tick() {
                    /*
                     link.attr("x1", function(d) { return d.source.x; })
                     .attr("y1", function(d) { return d.source.y; })
                     .attr("x2", function(d) { return d.target.x; })
                     .attr("y2", function(d) { return d.target.y; }); */
                    link.attr("d", function (d) {
                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            numOfLinks = totalLinks[d.source.id + "," + d.target.id] || totalLinks[d.target.id + "," + d.source.id],
                            dr = Math.sqrt(dx * dx + dy * dy) / (1 + d.linkindex / numOfLinks);

                        return "M" + d.source.x + "," + d.source.y +
                            "A" + dr + "," + dr + " 0 0 1," + d.target.x + "," + d.target.y +
                            "A" + dr + "," + dr + " 0 0 0," + d.source.x + "," + d.source.y;
                    });

                    node.attr('cx', function(d) { return d.x; })
                        .attr('cy', function(d) { return d.y; });

                    textnode
                        .attr("x", function(d){ return d.x + 7; })
                        .attr("y", function(d){ return d.y + 7; });

                    update();
                };

                force.on("tick", tick);


                var center_view = function() {
                    // Center the view on the molecule(s) and scale it so that everything
                    // fits in the window

                    //no molecules, nothing to do
                    if (nodes.length === 0) return;

                    // Get the bounding box
                    var min_x, max_x, min_y, max_y;
                    [min_x, max_x] = d3.extent(nodes.map(function(d) { return d.x; }));
                    [min_y, max_y] = d3.extent(nodes.map(function(d) { return d.y; }));

                    // The width and the height of the graph
                    var mol_width = max_x - min_x;
                    var mol_height = max_y - min_y;

                    // how much larger the drawing area is than the width and the height
                    var width_ratio = WIDTH / mol_width;
                    var height_ratio = HEIGHT / mol_height;

                    // we need to fit it in both directions, so we scale according to
                    // the direction in which we need to shrink the most
                    var min_ratio = Math.min(width_ratio, height_ratio) * 0.8;

                    // the new dimensions of the molecule
                    var new_mol_width = mol_width * min_ratio;
                    var new_mol_height = mol_height * min_ratio;

                    // translate so that it's in the center of the window
                    var x_trans = -(min_x) * min_ratio + (WIDTH - new_mol_width) / 2;
                    var y_trans = -(min_y) * min_ratio + (HEIGHT - new_mol_height) / 2;


                    // do the actual moving
                    vis.attr("transform",
                             svgTranslate(x_trans, y_trans) + " scale(" + min_ratio + ")");

                    // tell the zoomer what we did so that next we zoom, it uses the
                    // transformation we entered here
                    zoomer.translate([x_trans, y_trans ]);
                    zoomer.scale(min_ratio);
                    update();
                };

                function dragended(d) {
                    //d3.select(self).classed("dragging", false);
                    node.filter(function(d) { return d.selected; })
                        .each(function(d) { d.fixed &= ~6; });
                    update();
                }

                function dragstarted(d) {
                    d3.event.sourceEvent.stopPropagation();
                    if (!d.selected && !shiftKey) {
                        // if this node isn't selected, then we have to unselect every other node
                        node.classed("selected", function(p) {
                            return p.selected = p.previouslySelected = false;
                        });
                    }

                    d3.select(this).classed("selected", function(p) {
                        d.previouslySelected = d.selected; return d.selected = true;
                    });

                    node.filter(function(d) { return d.selected; })
                        .each(function(d) { d.fixed |= 2; });
                    update();
                }

                function dragged(d) {
                    node.filter(function(d) { return d.selected; })
                        .each(function(d) {
                            d.x += d3.event.dx;
                            d.y += d3.event.dy;

                            d.px += d3.event.dx;
                            d.py += d3.event.dy;
                        });
                    force.resume();
                    update();
                }

                function keydown() {
                    shiftKey = d3.event.shiftKey || d3.event.metaKey;

                    //console.log('d3.event', d3.event);

                    if (d3.event.keyCode == 67) {   //the 'c' key
                        center_view();
                    }

                    if (shiftKey) {
                        svg_graph.call(zoomer)
                            .on("mousedown.zoom", null)
                            .on("touchstart.zoom", null)
                            .on("touchmove.zoom", null)
                            .on("touchend.zoom", null);

                        //svg_graph.on('zoom', null);
                        vis.selectAll('g.gnode')
                            .on('mousedown.drag', null);

                        brush.select('.background').style('cursor', 'crosshair');
                        brush.call(brusher);
                    }
                    update();
                }

                function keyup() {
                    shiftKey = d3.event.shiftKey || d3.event.metaKey;

                    brush.call(brusher)
                        .on("mousedown.brush", null)
                        .on("touchstart.brush", null)
                        .on("touchmove.brush", null)
                        .on("touchend.brush", null);

                    brush.select('.background').style('cursor', 'auto');
                    svg_graph.call(zoomer);
                    update();
                }

                function update() {
                    link.style('stroke', '#999');
                    node.style({
                        'stroke': '#fff',
                        'stroke-width': '1.5px'
                    });
                    canvas.selectAll('.selected').style({
                        'stroke': 'black'
                    });
                    canvas.selectAll('.brush .extent').style({
                        'fill-opacity': '0.1',
                        'stoke': '#fff',
                        'shape-rendering': 'crispEdges'
                    });
                    canvas.selectAll('text').style('font-size', '10px');
                    textnode.style({
                        'stroke': 'green',
                        'fill': 'green'
                    });
                }

                callBigBang(runtime, detached);
            };
        }

        function treeDiagram(runtime) {
            /*
             * Part of this function is adapted from:
             * http://www.d3noob.org/2014/01/tree-diagrams-in-d3js_11.html
             */
            return function (rootNode) {
                runtime.checkArity(1, arguments, "tree-diagram");
                runtime.checkObject(rootNode);

                function parseTree(node) {
                    return {
                        'name': runtime.getField(node, "name"),
                        'children': runtime.ffi.toArray(
                            runtime.getField(node, "children")).map(parseTree)
                    };
                }

                var tree = d3.layout.tree().size([HEIGHT, WIDTH]);
                var diagonal = d3.svg.diagonal()
                        .projection(function(d) { return [d.x, d.y]; });

                var root = parseTree(rootNode);

                var detached = createDiv();
                var canvas = createCanvas(WIDTH, HEIGHT, detached, "top-left");

                root.x0 = HEIGHT / 2;
                root.y0 = 0;

                var i = 0, duration = 750;

                function click(d) {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                    update(d);
                }

                function update(source) {
                    // Compute the new tree layout.
                    var nodes = tree.nodes(root).reverse(),
                        links = tree.links(nodes);

                    // Normalize for fixed-depth.
                    nodes.forEach(function(d) { d.y = d.depth * 40; });

                    // Update the
                    var node = canvas.selectAll("g.node")
                            .data(nodes, function(d) { return d.id || (d.id = ++i); });

                    // Enter any new nodes at the parent's previous position.
                    var nodeEnter = node.enter().append("g")
                            .attr("class", "node")
                            .attr("transform", function(d) {
                                return svgTranslate(source.x0, source.y0);
                            })
                            .on("click", click);

                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", function(d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        });

                    nodeEnter.append("text")
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .text(function(d) { return d.name; })
                        .style("fill-opacity", 1e-6);

                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                            .duration(duration)
                            .attr("transform", function(d) {
                                return svgTranslate(d.x, d.y);
                            });

                    nodeUpdate.select("circle")
                        .attr("r", 10)
                        .style("fill", function(d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        });

                    nodeUpdate.select("text")
                        .style("fill-opacity", 1);

                    // Transition exiting nodes to the parent's new position.
                    var nodeExit = node.exit().transition()
                            .duration(duration)
                            .attr("transform", function(d) {
                                return svgTranslate(source.y, source.x);
                            })
                            .remove();

                    nodeExit.select("circle").attr("r", 1e-6);

                    nodeExit.select("text")
                        .style("fill-opacity", 1e-6);

                    // Update the links

                    var link = canvas.selectAll("path.link")
                            .data(links, function(d) { return d.target.id; });

                    // Enter any new links at the parent's previous position.
                    link.enter().insert("path", "g")
                        .attr("class", "link")
                        .attr("d", function(d) {
                            var o = {x: source.x0, y: source.y0};
                            return diagonal({source: o, target: o});
                        });

                    // Transition links to their new position.
                    link.transition()
                        .duration(duration)
                        .attr("d", diagonal);

                    // Transition exiting nodes to the parent's new position.
                    link.exit().transition()
                        .duration(duration)
                        .attr("d", function(d) {
                            var o = {x: source.x, y: source.y};
                            return diagonal({source: o, target: o});
                        })
                        .remove();

                    // Stash the old positions for transition.
                    nodes.forEach(function(d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });

                    canvas.selectAll(".node").style("cursor", "pointer");

                    canvas.selectAll(".node circle").style({
                        'fill': '#fff',
                        'opacity': 0.5,
                        'stroke': 'blue',
                        'stroke-width': "1.5px"
                    });

                    canvas.selectAll(".node text").style({
                        'font-size': '13px'
                    });

                    canvas.selectAll(".link").style({
                        'fill': 'none',
                        'stroke': '#ccc',
                        'stroke-width': '2px'
                    });
                }

                update(root);
                createSave(detached);
                callBigBang(runtime, detached);
            };
        }

        function genericPlot(runtime, image) {
            return function (lst, xMin, xMax, yMin, yMax, label) {
                runtime.checkArity(6, arguments, "generic-plot");
                runtime.checkList(lst);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);
                runtime.checkString(label);
                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException(CError.RANGE);
                }

                var detached = createDiv();
                var canvas = createCanvas(WIDTH, HEIGHT, detached, "top-left");
                appendAxis(xMin, xMax, yMin, yMax, WIDTH, HEIGHT, canvas);

                var colorConverter = convertColor(image);

                var plots = runtime.ffi.toArray(lst).map(
                    function (e) {
                        return {
                            'points': parsePoints(
                                runtime.getField(e, "points"), runtime),
                            'color': colorConverter(runtime.getField(e, "color")),
                            'type': e["$name"]
                        };
                    }
                );

                plots.forEach(function(e, id) {
                    if (e.type === "line-plot") {
                        plotLine(e.points, id, xMin, xMax, yMin, yMax,
                                 WIDTH, HEIGHT, e.color, canvas);
                    } else if (e.type == "scatter-plot") {
                        plotPoints(e.points, id, xMin, xMax, yMin, yMax,
                                   WIDTH, HEIGHT, e.color, canvas, detached);
                    }
                });
                putLabel(label, WIDTH, HEIGHT, detached);
                createSave(detached);
                callBigBang(runtime, detached);
            };
        }

        function inferBounds(runtime) {
            return function (lst) {
                runtime.checkArity(1, arguments, "infer-bounds");
                runtime.checkList(lst);
                var dataPoints = flatten(runtime.ffi.toArray(lst).map(
                    function (p) {
                        if (runtime.hasField(p, "points")) {
                            return parsePoints(
                                runtime.getField(p, "points"), runtime);
                        } else {
                            return [];
                        }
                    }));

                var xMin, xMax, yMin, yMax;

                if (dataPoints.length === 0) {
                    xMin = -10;
                    xMax = 10;
                    yMin = -10;
                    yMax = 10;
                } else {
                    xMin = dataPoints
                        .map( function (d) { return d.x; } )
                        .reduce(libNum.min);
                    xMax = dataPoints
                        .map( function (d) { return d.x; } )
                        .reduce(libNum.max);
                    yMin = dataPoints
                        .map( function (d) { return d.y; } )
                        .reduce(libNum.min);
                    yMax = dataPoints
                        .map( function (d) { return d.y; } )
                        .reduce(libNum.max);

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
                }
                return runtime.makeObject({
                    'x-min': xMin,
                    'x-max': xMax,
                    'y-min': yMin,
                    'y-max': yMax
                });
            };
        }

        function generateXY(runtime) {
            return function(f, xMin, xMax, yMin, yMax) {
                runtime.checkArity(5, arguments, "generate-xy");
                runtime.checkFunction(f);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);

                // Produces "rough" data points to be used for plotting
                // It is rough because it assumes that f is continuous
                var width = WIDTH,
                    height = HEIGHT;

                var inputScaler = libNum.scaler(0, width - 1, xMin, xMax, false),
                    outputScaler = libNum.scaler(yMin, yMax, height - 1, 0, false);

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

                    var possibleY = libNum.adjustInRange(y, yMin, yMax);

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

                function answer() {
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
                }
                var ans = answer()
                        .map(function (lst) {
                            return lst.map(function (dp) {
                                return runtime.makeObject({
                                    'x': dp.realx,
                                    'y': dp.realy
                                });
                            });
                        }).map(runtime.ffi.makeList);
                return runtime.ffi.makeList(ans);
            };
        }

        function test(runtime, sd) {
            return function () {
            };
        }

        return {
            'genericPlot': genericPlot,
            'inferBounds': inferBounds,
            'generateXY': generateXY,
            'histogramPlot': histogramPlot,
            'pieChart': pieChart,
            'treeDiagram': treeDiagram,
            'forceLayout': forceLayout,
            'showSVG': showSVG,
            'getBBox': getBBox,
            'test': test
        };
    });

