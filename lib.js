/*
 * pyret-d3
 */

var MARGIN = {'top': 30, 'left': 100, 'bottom': 45, 'right': 100};
var NOMARGIN = {'top': 0, 'left': 0, 'bottom': 0, 'right': 0};
var HISTOGRAMN = 100;
var ALLHEIGHT = 476;
var ALLWIDTH = 601;

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
        function (outter, inner) {
            return outter.concat(inner);
        }, []);
}

function fill(n, v) {
    var i, ret = [];
    for (i = 0; i < n; i++) { ret.push(v); }
    return ret;
}

function assert(val, msg) {
    if (!val) { throw new Error("Assertion failed: " + (msg || "")); }
}

function svgTranslate(x, y) {
    if (y === undefined) {
        return "translate(" + x.toString() + ")";
    }
    return "translate(" + x.toString() + "," + y.toString() + ")";
}

function getContrast(r, g, b){
    /*
     * http://24ways.org/2010/calculating-color-contrast/
     */
	return ((((r*299)+(g*587)+(b*114))/1000) >= 128) ? 'black' : 'white';
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
}

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
}

function convertColor(runtime, image) {
    function p(pred, name) {
        return function (val) {
            runtime.makeCheckType(pred, name)(val);
            return val;
        };
    }
    
    var colorDb = image.colorDb,
        _checkColor = p(image.isColorOrColorString, "Color");

    function checkColor(val) {
        var aColor = _checkColor(val);
        if (colorDb.get(aColor)) {
            aColor = colorDb.get(aColor);
        }
        return aColor;
    }

    function colorString(aColor) {
        return "rgba(" + image.colorRed(aColor) + "," +
            image.colorGreen(aColor) + ", " +
            image.colorBlue(aColor) + ", " +
            image.colorAlpha(aColor) + ")";
    }

    return function (v) { return colorString(checkColor(v)); };
}

function getDimension(margin) {
    return {
        width: ALLWIDTH - margin.left - margin.right,
        height: ALLHEIGHT - margin.top - margin.bottom
    };
}

var CError = {
    "RANGE": "x-min and y-min must be strictly less than " +
        "x-max and y-max respectively."
};

define(
    ["d3", "d3tip", "js/js-numbers", "my-project/libJS", "my-project/libNum"],
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

        function createCanvas(detached, margin, orient) {
            /*
             * Creates a canva
             *
             * @param {fixnum} width: in pixel
             * @param {fixnum} height: in pixel
             * @param {d3 selection} detached
             * @param {string} orient
             * @return {d3 selection}
             */
            var divSvg = detached
                    .append('div')
                    .attr('class', 'divsvg'),
                canvas = divSvg
                    .append("svg")
                    .attr("width", ALLWIDTH)
                    .attr("height", ALLHEIGHT)
                    .append("g")
                    .attr('class', 'maing')
                    .append('g');

            if (orient === "top-left") {
                canvas.attr("transform", svgTranslate(margin.left, margin.top));
            } else if (orient == "center") {
                canvas.attr("transform",
                    svgTranslate(ALLWIDTH / 2, ALLHEIGHT / 2));
            } else {
                throw "orient '" + orient  + "' not implemented"; // internal error
            }
            return canvas;
        }

        function postStyle(detached) {
            detached.selectAll('.d3btn').style({
                'margin-right': '20px'
            })
        }

        function callBigBang(runtime, detached) {
            postStyle(detached);
            runtime.getParam("current-animation-port")(detached.node());
            var terminate = function () {  d3.selectAll(".maind3").remove(); };
            
            // simulate dialogclose
            d3.selectAll(".ui-dialog-titlebar-close").on("click", terminate);
            d3.select("body").on("keyup", function(e) {
                if (d3.event.keyCode == 27) { terminate(); } // esc
            });
        }

        function createSave(detached) {
            /*
             * Create a button to download the image of canvas as PNG file
             *
             * A part of these are adapted from
             * http://techslides.com/save-svg-as-an-image
             */
            detached.append('button')
                .attr('class', 'd3btn')
                .text('Save!')
                .on('click', function () {
                    var svg = detached.select("svg")
                            .attr("version", 1.1)
                            .attr("xmlns", "http://www.w3.org/2000/svg"),
                            
                        canvas = detached.append('canvas')
                            .style('display', 'none')
                            .attr('width', svg.attr("width"))
                            .attr('height', svg.attr("height")),
                            
                        svgData = detached.append('div')
                            .style('display', 'none'),
                            
                        html = detached.node().firstChild.innerHTML,
                            
                        imgsrc = 'data:image/svg+xml;base64,' + btoa(html),
                            
                        img = '<img src="' + imgsrc + '">';
                        
                    svgData.html(img);

                    var image = new Image;
                    image.src = imgsrc;
                    image.onload = function () {
                        var opts = {
                            canvas: canvas.node(),
                            image: image
                        };
                        var a = document.createElement("a");
                        a.download = "sample.png";
                        a.href = libJS.drawImage(opts).toDataURL("image/png");
                        a.click();

                        // the image's size was doubled everytime we click 
                        // the button, so remove all data to prevent this
                        // to happen
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
                var conf = {},
                    scaler = libNum.scaler(aMin, aMax, 0, 1, false),
                    pos = jsnums.toFixnum(scaler(0));
                    
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
                    .domain([0, d3.max(data, function (d) { return d.y; })])
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
                .attr("x", function (d) { return x(d.x); })
                .attr("y", function (d) { return y(d.y); })
                .attr("width", x(data[0].dx) - 1)
                .attr("height", function (d) { return height - y(d.y); });

            canvas.selectAll('.bar rect')
                .style({
                    'fill': 'steelblue',
                    'fill-opacity': '0.8',
                    'shape-rendering': 'crispEdges'
                })
                .on('mouseover', function (d) {
                    d3.select(this).style('fill', "black");
                })
                .on('mouseout', function (d) {
                    d3.select(this).style('fill', "steelblue");
                });

            stylizeTip(detached);
        }

        function putLabel(label, width, height, detached, margin) {
            var supportedTags = [
                ["<sup>", "<tspan baseline-shift='super'>"],
                ["</sup>", "</tspan>"],
                ["<sub>", "<tspan baseline-shift='sub'>"],
                ["</sub>", "</tspan>"]
            ];

            var processedLabel = supportedTags.reduce(function (prev, current) {
                return prev.replace(
                    libJS.htmlspecialchars(current[0]), current[1]);
            }, libJS.htmlspecialchars(label));

            var legend = detached.select('.maing')
                    .append("text")
                    .attr("x", (margin.left + width + margin.right) / 2)
                    .attr("y", height + margin.top + 30)
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

        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////

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
                var dataScaler = libNum.scaler(
                    xMin, xMax, 0, HISTOGRAMN, false);

                var histogramData = d3.layout.histogram()
                        .bins(n).value(function (val) {
                            return jsnums.toFixnum(dataScaler(val));
                        })(data);

                var yMax = d3.max(histogramData, function (d) { return d.y; });

                var margin = MARGIN,
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;
                

                var detached = createDiv();
                var canvas = createCanvas(detached, margin, "top-left");
                

                appendAxis(xMin, xMax, 0, yMax, width, height, canvas);

                plotBar(xMin, xMax, 0, yMax, width, height,
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

                var checkISD = function (v) {
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

                var margin = MARGIN,
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;

                var radius = Math.min(width, height) / 2;
                var color = d3.scale.category20();
                var arc = d3.svg.arc()
                        .outerRadius(radius)
                        .innerRadius(0);

                var pie = d3.layout.pie()
                        .sort(null)
                        .value(function (d) { return d.value; });

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

                var canvas = createCanvas(detached, margin, "center");
                canvas.call(tip);

                var g = canvas.selectAll(".arc")
                        .data(pie(data))
                        .enter().append("g")
                        .attr("class", "arc");

                g.append("path").attr("class", "path").attr("d", arc);

                g.append("text")
                    .attr("transform", function (d) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .attr("dy", ".35em")
                    .style({
                        "text-anchor": "middle"
                    })
                    .text(function (d) { return d.data.label; });

                g.append("path").attr("class", "transparent").attr("d", arc);

                stylizeTip(detached);

                canvas.selectAll(".arc path")
                    .style({
                        "fill": function (d, i) { return color(i); }
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
                
                var isDirected;
                
                if (rawGraph['$name'] == "undirected-graph") {
                    isDirected = false;
                } else if (rawGraph['$name'] == "directed-graph") {
                    isDirected = true;
                } else {
                    throw 'not Graph'
                }

                var margin = NOMARGIN,
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;

                var colorConverter = convertColor(runtime, image);

                var nodes = runtime.ffi.toArray(
                    runtime.getField(rawGraph, "vertices")).map(
                        function (e, i) {
                            return {
                                'name': runtime.getField(e, "name"),
                                'color': runtime.getField(e, "color"),
                                'index': i
                            };
                        });

                var indices = nodes.reduce(function (prev, current) {
                    prev[current.name] = current.index;
                    return prev;
                }, {});


                var totalLinks = {};
                var links = runtime.ffi.toArray(
                    runtime.getField(rawGraph, "edges")).map(
                        function (e) {
                            return {
                                'source': nodes[indices[runtime.getField(
                                    runtime.getField(e, "source"), "name")]],
                                'target': nodes[indices[runtime.getField(
                                    runtime.getField(e, "target"), "name")]],
                                'linkindex': 0,
                                'label': runtime.getField(e, "label"),
                                'color': runtime.getField(e, "color")
                            };
                        });

                links.sort(function (a, b) {
                    assert(a.source.index !== undefined);
                    if (a.source.index == b.source.index) {
                        return a.target.index - b.target.index;
                    }
                    return a.source.index - b.source.index;
                });
                
                function idEdge(d) {
                    return d.source.index + "_" + d.target.index + "_" +
                         d.linkindex;
                }

                links.forEach(function (v, i) {
                    assert(links[i].source.index !== undefined);
                    if (i > 0 &&
                        links[i].source.index == links[i - 1].source.index &&
                        links[i].target.index == links[i - 1].target.index) {

                        links[i].linkindex = links[i - 1].linkindex + 1;
                    }
                    totalLinks[links[i].source.index + ',' + links[i].target.index] =
                        links[i].linkindex + 1;
                });

                var detached = createDiv();
                
                var canvas = createCanvas(detached, margin, "top-left");

                detached.select('.divsvg').attr("tabindex", 1)
                    .on("keydown.brush", keydown)
                    .on("keyup.brush", keyup)
                    .each(function () { this.focus(); });

                var shiftKey, hideLabels = false;

                var xScale = d3.scale.linear()
                        .domain([0,width]).range([0,width]);
                var yScale = d3.scale.linear()
                        .domain([0,height]).range([0,height]);

                var zoomer = d3.behavior.zoom().
                    scaleExtent([0.5,5]).
                    x(xScale).
                    y(yScale).
                    on("zoomstart", zoomstart).
                    on("zoom", redraw);

                function zoomstart() {
                    node.each(function (d) {
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
                        .x(xScale)
                        .y(yScale)
                        .on("brushstart", function (d) {
                            node.each(function (d) {
                                d.previouslySelected = shiftKey && d.selected;
                            });
                            update();
                        })
                        .on("brush", function () {
                            var extent = d3.event.target.extent();

                            node.classed("selected", function (d) {
                                return d.selected = 
                                    d.previouslySelected ^
                                    (extent[0][0] <= d.x && 
                                        d.x < extent[1][0] && 
                                        extent[0][1] <= d.y &&
                                        d.y < extent[1][1]);
                            });
                            update();
                        })
                        .on("brushend", function () {
                            d3.event.target.clear();
                            d3.select(this).call(d3.event.target);
                            update();
                        });

                var svg_graph = canvas.append('g')
                        .call(zoomer);
                //.call(brusher)

                var brush = svg_graph.append("g")
                        .datum(function () {
                            return {
                                selected: false,
                                previouslySelected: false
                            };
                        })
                        .attr("class", "brush");

                var vis = svg_graph.append("g");

                vis.attr('opacity', 0.4)
                    .attr('id', 'vis');


                brush.call(brusher)
                    .on("mousedown.brush", null)
                    .on("touchstart.brush", null)
                    .on("touchmove.brush", null)
                    .on("touchend.brush", null);

                brush.select('.background').style('cursor', 'auto');
                
                vis.append("defs").selectAll("marker")
                    .data(links).enter()
                    .append("marker")
                    .attr("id", function (d) { return "arrow_" + idEdge(d); })
                    .attr("class", "link")
                    .attr("viewBox", "0 -5 10 10")
                    .attr("refX", 19)
                    .attr("refY", -1)
                    .attr("markerWidth", 3)
                    .attr("markerHeight", 3)
                    .attr("orient", "auto")
                    .append("path")
                    .attr("d", "M0,-5L10,0L0,5");

                var link = vis.append("g")
                        .attr("class", "link")
                        .selectAll("path")
                        .data(links).enter()
                        .append("path")
                        .attr("id", function(d) { return idEdge(d); })
                        .on('mouseover', function(d) {
                            var aClass = {
                                'active': true,
                                'inactive': false
                            };
                            d3.select(this).classed(aClass);
                            d3.select('#arrow_' + idEdge(d)).classed(aClass);
                            d3.select('#text_' + idEdge(d)).classed(aClass);
                            update();
                        })
                        .on('mouseout', function(d) {
                            var aClass = {
                                'active': false,
                                'inactive': true
                            };
                            d3.select(this).classed(aClass);
                            d3.select('#arrow_' + idEdge(d)).classed(aClass);
                            d3.select('#text_' + idEdge(d)).classed(aClass);
                            update();
                        });
                    
                if (isDirected) {
                    link = link.attr("marker-end", function(d) {
                        return "url(#arrow_" + idEdge(d) + ")";
                    })
                }

                var node = vis.append("g")
                        .attr("class", "node")
                        .selectAll("circle")
                        .data(nodes).enter()
                        .append("circle")
                        .attr("r", 8)
                        .attr("fill", function (d) {
                            return colorConverter(d.color);
                        })
                        .on("dblclick", function (d) {
                            d3.event.stopPropagation();
                        })
                        .on("click", function (d) {
                            if (d3.event.defaultPrevented) return;
                            if (!shiftKey) {
                                //if the shift key isn't down, 
                                // unselect everything
                                canvas.selectAll(".selected").classed(
                                    'selected', function (p) {
                                        p.selected = false;
                                        p.previouslySelected = false;
                                        return false;
                                    });
                            }
                            // always select this node
                            d3.select(this).classed(
                                "selected", d.selected = !d.previouslySelected);
                            update();
                        })
                        .on("mouseup", function (d) {
                            //if (d.selected && shiftKey) d3.select(this).classed("selected", d.selected = false);
                        })
                        .call(d3.behavior.drag()
                              .on("dragstart", dragstarted)
                              .on("drag", dragged)
                              .on("dragend", dragended));

              var textlink = vis.append('g')
                      .selectAll(".link_label")
                      .data(links).enter()
                      .append('text')
                      .attr('class', 'label link_label')
                      .attr('id', function(d) { return 'text_' + idEdge(d); })
                      .append('textPath')
                      .attr('startOffset', '50%')
                      .attr("text-anchor", "middle")
                      .attr("xlink:href", function (d) {
                          return "#" + idEdge(d);
                      })
                      .text(function (d) { return d.label; });

                var textnode = vis.append('g')
                        .selectAll('g')
                        .data(nodes).enter()
                        .append('g')

                var DXTEXTNODE = 14;
                var DYTEXTNODE = 4;

                textnode.append('text')
                        .attr('x', DXTEXTNODE)
                        .attr('y', DYTEXTNODE)
                        .attr("class", "shadow label")
                        .attr('stroke', function (d) {
                            return getContrast(
                                image.colorRed(d.color),
                                image.colorGreen(d.color),
                                image.colorBlue(d.color));
                        })
                        .text(function(d) { return d.name; });
                
                textnode.append('text')
                        .attr('x', DXTEXTNODE)
                        .attr('y', DYTEXTNODE)
                        .attr('class', 'label')
                        .attr('fill', function (d) {
                            return colorConverter(d.color);
                        })
                        .text(function (d) { return d.name; });

                var force = d3.layout.force()
                        .charge(-120)
                        .linkDistance(200)
                        .nodes(nodes)
                        .links(links)
                        .gravity(0.2)
                        .size([width, height])
                        .start();

                function tick() {
                    link.attr("d", function (d) {
                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            numOfLinks =
                                totalLinks[
                                    d.source.index + "," + d.target.index] ||
                                totalLinks[
                                    d.target.index + "," + d.source.index],
                            dr = 0.8 * Math.sqrt(dx * dx + dy * dy) /
                                (1 + d.linkindex / numOfLinks);

                        return "M" + d.source.x + "," + d.source.y +
                            "A" + dr + "," + dr + " 0 0,1" +
                            d.target.x + "," + d.target.y;
                    });

                    node.attr('transform',
                              function (d) { return svgTranslate(d.x, d.y); });
                    
                    textnode.attr('transform',
                              function (d) { return svgTranslate(d.x, d.y); });

                    update();
                };

                force.on("tick", tick);


                var center_view = function () {
                    // Center the view on the molecule(s) and scale it so 
                    // that everything fits in the window

                    //no molecules, nothing to do
                    if (nodes.length === 0) return;

                    // Get the bounding box
                    var min_x = d3.min(nodes.map(function (d) { return d.x; })),
                        max_x = d3.max(nodes.map(function (d) { return d.x; })),
                        min_y = d3.min(nodes.map(function (d) { return d.y; })),
                        max_y = d3.max(nodes.map(function (d) { return d.y; }));

                    // The width and the height of the graph
                    var mol_width = max_x - min_x,
                        mol_height = max_y - min_y;

                    // how much larger the drawing area is than the width and
                    // the height
                    var width_ratio = width / mol_width,
                        height_ratio = height / mol_height;

                    // we need to fit it in both directions, so we scale 
                    // according to the direction in which we need to 
                    // shrink the most
                    var min_ratio = Math.min(width_ratio, height_ratio) * 0.6;

                    // the new dimensions of the molecule
                    var new_mol_width = mol_width * min_ratio,
                        new_mol_height = mol_height * min_ratio;

                    // translate so that it's in the center of the window
                    var x_trans = -(min_x) * min_ratio +
                            (width - new_mol_width) / 2,
                        y_trans = -(min_y) * min_ratio +
                            (height - new_mol_height) / 2;


                    // do the actual moving
                    vis.attr("transform",
                             svgTranslate(x_trans, y_trans) +
                                 " scale(" + min_ratio + ")");

                    // tell the zoomer what we did so that next we zoom,
                    // it uses the transformation we entered here
                    zoomer.translate([x_trans, y_trans ]);
                    zoomer.scale(min_ratio);
                    update();
                };

                function dragended(d) {
                    //d3.select(self).classed("dragging", false);
                    node.filter(function (d) { return d.selected; })
                        .each(function (d) { d.fixed &= ~6; });
                    update();
                }

                function dragstarted(d) {
                    d3.event.sourceEvent.stopPropagation();
                    if (!d.selected && !shiftKey) {
                        // if this node isn't selected,
                        // then we have to unselect every other node
                        node.classed("selected", function (p) {
                            return p.selected = p.previouslySelected = false;
                        });
                    }

                    d3.select(this).classed("selected", function (p) {
                        d.previouslySelected = d.selected;
                        return d.selected = true;
                    });

                    node.filter(function (d) { return d.selected; })
                        .each(function (d) { d.fixed |= 2; });
                    update();
                }

                function dragged(d) {
                    node.filter(function (d) { return d.selected; })
                        .each(function (d) {
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

                        brush.select('.background').style(
                            'cursor', 'crosshair');
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
                    canvas.selectAll('.link').style({
                        'fill': 'none',
                        'stroke': 'black',
                        'stroke-opacity': '0.4',
                        'stroke-width': 3
                    });
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
                    canvas.selectAll('text').style({
                        'font-family': "sans-serif",
                        'user-select': 'none',
                        'cursor': 'default'
                    });
                    textlink.style({
                        'font-size': '6px',
                        'stroke-width': 0,
                        'fill': 'red'
                    });
                    textnode.style({
                        'font-size': '10px',
                        'stroke-width': 0,
                        'fill': 'green'
                    });
                    canvas.selectAll('.shadow').style({
                        'stroke-width': "3px",
                        'stroke-opacity': "0.9"
                    })
                    
                    detached.selectAll('.divsvg').style({
                        'outline': 'none'
                    });
                    
                    canvas.selectAll('.active').style({
                        'stroke-opacity': '1'
                    });
                    
                    canvas.selectAll('.inactive').style({
                        'stroke-opacity': '0.4'
                    });
                    
                }

                for(var i = 0; i < 100; ++i){ force.tick(); }
                center_view();
                
                createSave(detached);
                detached.append('button')
                    .attr('class', 'd3btn')
                    .text('Hide labels')
                    .on('click', function () {
                        if (hideLabels) {
                            canvas.selectAll('.label').style({
                                'opacity': '100'
                            });
                            d3.select(this).text('Hide labels');
                        } else {
                            canvas.selectAll('.label').style({
                                'opacity': 0
                            });
                            d3.select(this).text('Show labels');
                        }
                        hideLabels = !hideLabels;
                    });
                    
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

                var margin = MARGIN,
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;

                var tree = d3.layout.tree().size([height, width]);
                var diagonal = d3.svg.diagonal()
                        .projection(function (d) { return [d.x, d.y]; });

                var root = parseTree(rootNode);

                var detached = createDiv();
                var canvas = createCanvas(detached, margin, "top-left");

                root.x0 = height / 2;
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
                    nodes.forEach(function (d) { d.y = d.depth * 40; });

                    // Update the
                    var node = canvas.selectAll("g.node")
                            .data(nodes, function (d) {
                                return d.id || (d.id = ++i);
                            });

                    // Enter any new nodes at the parent's previous position.
                    var nodeEnter = node.enter().append("g")
                            .attr("class", "node")
                            .attr("transform", function (d) {
                                return svgTranslate(source.x0, source.y0);
                            })
                            .on("click", click);

                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", function (d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        });

                    nodeEnter.append("text")
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .text(function (d) { return d.name; })
                        .style("fill-opacity", 1e-6);

                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                            .duration(duration)
                            .attr("transform", function (d) {
                                return svgTranslate(d.x, d.y);
                            });

                    nodeUpdate.select("circle")
                        .attr("r", 10)
                        .style("fill", function (d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        });

                    nodeUpdate.select("text")
                        .style("fill-opacity", 1);

                    // Transition exiting nodes to the parent's new position.
                    var nodeExit = node.exit().transition()
                            .duration(duration)
                            .attr("transform", function (d) {
                                return svgTranslate(source.y, source.x);
                            })
                            .remove();

                    nodeExit.select("circle").attr("r", 1e-6);

                    nodeExit.select("text")
                        .style("fill-opacity", 1e-6);

                    // Update the links

                    var link = canvas.selectAll("path.link")
                            .data(links, function (d) { return d.target.id; });

                    // Enter any new links at the parent's previous position.
                    link.enter().insert("path", "g")
                        .attr("class", "link")
                        .attr("d", function (d) {
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
                        .attr("d", function (d) {
                            var o = {x: source.x, y: source.y};
                            return diagonal({source: o, target: o});
                        })
                        .remove();

                    // Stash the old positions for transition.
                    nodes.forEach(function (d) {
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
            return function (lst, xMin, xMax, yMin, yMax,
                             colorInfo, label, allID) {
                runtime.checkArity(8, arguments, "generic-plot");
                runtime.checkList(lst);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);
                runtime.checkList(colorInfo);
                runtime.checkString(label);
                runtime.checkNumber(allID);
                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException(CError.RANGE);
                }

                var margin = MARGIN,
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;
                    
                var detached = createDiv();
                var canvas = createCanvas(detached, margin, "top-left");
                appendAxis(xMin, xMax, yMin, yMax, width, height, canvas);

                var colorConverter = convertColor(runtime, image);

                var plots = runtime.ffi.toArray(lst).map(
                    function (e) {
                        return {
                            'points': parsePoints(
                                runtime.getField(e, "points"), runtime),
                            'id': runtime.getField(e, "id"),
                            'type': e["$name"]
                        };
                    }
                );
                
                var colors = runtime.ffi.toArray(colorInfo).map(
                    function (e) { return colorConverter(e); }
                );
                
                var xToPixel = libNum.scaler(xMin, xMax, 0, width - 1, true),
                    yToPixel = libNum.scaler(yMin, yMax, height - 1, 0, true);
                
                function plotLine(
                    dataPoints, id, xMin, xMax, yMin, yMax,
                    width, height, canvas) {
                    /*
                     * Graph a line
                     *
                     * Part of this function is adapted from
                     * http://jsfiddle.net/christopheviau/Hwpe3/
                     */

                    var line = d3.svg.line()
                            .x(function (d) { return xToPixel(d.x); })
                            .y(function (d) { return yToPixel(d.y); });

                    canvas.append("path")
                        .attr("class", "plotting" + id.toString())
                        .attr("d", line(dataPoints));
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

                    stylizeTip(detached);
                }
                
                plots.forEach(function (e) {
                    if (e.type === "line-plot-int") {
                        plotLine(e.points, e.id, xMin, xMax, yMin, yMax,
                                 width, height, canvas);
                    } else if (e.type == "scatter-plot-int") {
                        plotPoints(e.points, e.id, xMin, xMax, yMin, yMax,
                                   width, height, canvas, detached);
                    } else {
                        throw "plot model not supported";
                    }
                });
                
                
                fill(allID, 0).forEach(function (e, i) {
                    canvas.selectAll('.plotting' + i.toString()).style(
                        {'stroke': colors[i], 'stroke-width': 1, 'fill': 'none'});
                    canvas.selectAll('.scatter-plot' + i.toString()).style(
                        'fill', colors[i]);
                });
                    
                putLabel(label, width, height, detached, margin);
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

        function test(runtime, sd) {
            return function () {
            };
        }
        
        function generateXY(runtime) {
            return function (f, xMin, xMax, yMin, yMax) {
                runtime.checkArity(5, arguments, "generate-xy");
                runtime.checkFunction(f);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);

                var margin = MARGIN,
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height,
                    K = 500,
                    DELTA = 0.01;

                var inputScaler = libNum.scaler(
                        0, width - 1, xMin, xMax, false),
            
                    outputScaler = libNum.scaler(
                        yMin, yMax, height - 1, 0, false);
                
                var xToPixel = libNum.scaler(xMin, xMax, 0, width - 1, true);
                var yToPixel = libNum.scaler(yMin, yMax, height - 1, 0, true);

                function PointCoord(x) {
                    this.x = x;
                    this.px = xToPixel(x);
                    try {
                        this.y = f.app(x);
                        
                        // to test complex number in the same time as well
                        // TODO change to more elegant way
                        if (jsnums.lessThan(this.y, yMin) ||
                            jsnums.lessThan(yMax, this.y)) { 
                                
                            this.y = NaN;
                            this.py = NaN;
                        } else {
                            this.py = yToPixel(this.y);
                        }
                    } catch(e) {
                        this.y = NaN;
                        this.py = NaN;
                    }
                    return this;
                }
        
                function isSamePX(coordA, coordB) {
                    return Math.floor(coordA.px) == Math.floor(coordB.px);
                }

                function closeEnough(coordA, coordB) {
                    return ((Math.abs(coordA.py - coordB.py) <= 1) && 
                            (coordB.px - coordA.px <= 1));
                }
        
                function tooClose(coordA, coordB) {
                    if (jsnums.approxEquals(coordA.px, coordB.px, DELTA)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                
                function allInvalid(points) {
                    return points.every(function (v) {
                        return Number.isNaN(v.py);
                    });
                }

                // bplot([list: xy-plot(_ + 1, I.red)], -10, 10, -10, 10, "abc")
                // bplot([list: xy-plot(1 / _, I.red)], -10, 10, -10, 10, "abc")
                function divideSubinterval(left, right) {
                    /*
                    Input: two X values
                    Output: list of [2-length long list of points]
                    Note: invalid for two ends is still okay
                    invalid for K points indicate that it should not be plotted!
                    */
                    
                    if (closeEnough(left, right)) {
                        return [[left, right]];
                    } else if (tooClose(left, right)) {
                        return [];
                    } else {
                        var scalerSubinterval = libNum.scaler(
                            0, K, left.x, right.x, false);

                        var points = fill(K, 0).map(function (v, i) {
                            return new PointCoord(scalerSubinterval(i));
                        });
                        
                        if (allInvalid(points)) {
                            return [];
                        } else {
                            var intervals = fill(K - 1, 0).map(function (v, i) {
                                return divideSubinterval(
                                    points[i], points[i + 1]);
                            });
                            intervals = [].concat.apply([], intervals);
                            return intervals.reduce(
                                function(dataPoints, val) {
                                    if (dataPoints.length > 0) {
                                        var prev = dataPoints.pop();
                                        if (prev.length > 0 && val.length > 0) {
                                            if (closeEnough(
                                                lastElement(prev), val[0])) {
                                                val.shift();
                                                dataPoints.push(
                                                    prev.concat(val));
                                            } else {
                                                dataPoints.push(prev);
                                                dataPoints.push(val);
                                            }
                                        } else {
                                            dataPoints.push(prev);
                                            dataPoints.push(val);
                                        }
                                    } else {
                                        dataPoints.push(val);
                                    }
                                    return dataPoints;
                            }, []);
                        }
                    }
                }
        
                var ans = divideSubinterval(new PointCoord(xMin),
                                            new PointCoord(xMax))
                ans = ans.map(
                    function (lst) {
                            return lst.map(function (dp) {
                                return runtime.makeObject({
                                    'x': dp.x,
                                    'y': dp.y
                                });
                            });
                        }).map(runtime.ffi.makeList);
                return runtime.ffi.makeList(ans);
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

