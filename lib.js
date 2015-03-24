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
    return "translate(" + x.toString() + "," + y.toString() + ")";
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

define(["d3", "d3tip", "js/js-numbers", "my-project/libJS", "my-project/libNum"],
       function (d3, d3tip, jsnums, libJS, libNum) {

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
         * Creates a canvas and detached node
         *
         * @param {d3 selection} detached
         * @param {fixnum} width: in pixel
         * @param {fixnum} height: in pixel
         * @return {Object} an object containing 'detached' which has
         * a detached node and 'canvas' which has a canvas
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
            canvas.attr("transform",
                        svgTranslate(allwidth / 2, allheight / 2));
        } else {
            throw "orient '" + orient  + "' not implemented";
        }
        return canvas;
    }

    function callBigBang(runtime, detached) {
        runtime.getParam("current-animation-port")(detached.node());
    }

    function createSave(detached) {
        /*
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
         * Appends axes to canvas (this mutates the canvas)
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
         * Regression plot
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
        var legend = detached.select('.maing')
                .append("text")
                .attr("x", (MARGIN.left + width + MARGIN.right) / 2)
                .attr("y", height + MARGIN.top + 30)
                .html(label
                      .replace("<sup>",
                               "<tspan baseline-shift='super'>")
                      .replace("</sup>",
                               "</tspan>"));

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

    function genericPlot(runtime) {
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

            var plots = runtime.ffi.toArray(lst).map(
                function (e) {
                    return {
                        'points': parsePoints(
                            runtime.getField(e, "points"), runtime),
                        'color': runtime.getField(
                            runtime.getField(e, "color"), "js-value").app(),
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
        'showSVG': showSVG,
        'getBBox': getBBox,
        'test': test
    };
});

