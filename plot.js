var baseUrl =  "https://cs.brown.edu/~sporncha/pyret-d3/";
requirejs.config({
    paths: {
        "my": baseUrl,
        "d3": baseUrl + "d3.min"
        
    }
});
requirejs.undef("@js-http/" + baseUrl + "plot.js");
define(["js/runtime-util", "trove/string-dict", "trove/image-lib",
    "d3", "my/d3-tip/index", "js/js-numbers", "my/d3-shared"],
    function(util, sdLib, imageLib, d3, d3tip, jsnums, clib) {
        
        var HISTOGRAM_N = 100;

        var CError = {
            "RANGE": "x-min and y-min must be strictly less than " +
            "x-max and y-max respectively."
        };
        
        var libData = clib.libData,
            libNum = clib.libNum,
            libJS = clib.libJS,
            libColor = clib.libColor,
            libCheck = clib.libCheck,
            getMargin = clib.d3common.getMargin,
            getDimension = clib.d3common.getDimension,
            svgTranslate = clib.d3common.svgTranslate,
            createDiv = clib.d3common.createDiv,
            createCanvas = clib.d3common.createCanvas,
            callBigBang = clib.d3common.callBigBang,
            stylizeTip = clib.d3common.stylizeTip;
    
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

            var tickNum = 7;
        
            var xAxisScaler = d3.scale.linear()
                    .domain([0, tickNum - 1]).range([0, width - 1]),
                yAxisScaler = d3.scale.linear()
                    .domain([0, tickNum - 1]).range([height - 1, 0]);
                
            var allValues = d3.range(0, tickNum);

            var xAxisDisplayScaler = libNum.scaler(0, tickNum - 1, xMin, xMax),
                yAxisDisplayScaler = libNum.scaler(0, tickNum - 1, yMin, yMax);

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

        function histogramPlot(runtime) {
            return function (lst, n) {
                runtime.checkArity(2, arguments, "histogram-plot");
                runtime.checkList(lst);
                runtime.checkNumber(n);
            
                var checkListofNumber = libCheck.checkListGenerator(
                    "Number", runtime.isNumber, runtime);
                checkListofNumber(lst);

                if ((!jsnums.isInteger(n)) ||
                    (n < 1) ||
                    (n > HISTOGRAM_N)) {
                    runtime.throwMessageException(
                        "n must be an interger between 1 and " +
                            HISTOGRAM_N.toString());
                }
            
                var data = runtime.ffi.toArray(lst);

                if (data.length === 0) {
                    runtime.throwMessageException("There must be at least " +
                                                  "one Number in the list.");
                }

                var xMin = data.reduce(libNum.min);
                var xMax = data.reduce(libNum.max);
                var dataScaler = libNum.scaler(
                    xMin, xMax, 0, HISTOGRAM_N, false);

                var histogramData = d3.layout.histogram()
                        .bins(n).value(function (val) {
                            return jsnums.toFixnum(dataScaler(val));
                        })(data);

                var yMax = d3.max(histogramData, function (d) { return d.y; });

                var marginType = "normal",
                    margin = getMargin(marginType),
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;
            

                var detached = createDiv();
                var canvas = createCanvas(detached, margin, "top-left");
            

                appendAxis(xMin, xMax, 0, yMax, width, height, canvas);

                plotBar(xMin, xMax, 0, yMax, width, height,
                        histogramData, HISTOGRAM_N, detached, canvas);

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
                // TODO: check if all are numbers
                // Pyret currently doesn't have a good way to check this

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

                var marginType = "normal",
                    margin = getMargin(marginType),
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
                        console.log('in', e)
                        tip.show(e);
                    })
                    .on("mouseout", function (e) {
                        d3.select(this.parentNode)
                            .selectAll(".path")
                            .style('opacity', '0.9');
                            console.log('out', e);
                        tip.hide(e);
                    });

                canvas.selectAll(".transparent").style('opacity', '0');
                canvas.selectAll('text').style({'font-size': '15px'});
                callBigBang(runtime, detached);
            };
        }

        function genericPlot(runtime, image) {
            return function (lst, windowOption, plotOptions, allID) {
                runtime.checkArity(4, arguments, "generic-plot");
                runtime.checkList(lst);
                runtime.checkObject(windowOption);
                runtime.checkList(plotOptions);
                runtime.checkNumber(allID);
            
                var xMin = runtime.getField(windowOption, "x-min");
                var xMax = runtime.getField(windowOption, "x-max");
                var yMin = runtime.getField(windowOption, "y-min");
                var yMax = runtime.getField(windowOption, "y-max");
            
                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException(CError.RANGE);
                }

                var marginType = "normal",
                    margin = getMargin(marginType),
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height;
                
                var detached = createDiv();
                var canvas = createCanvas(detached, margin, "top-left");
                appendAxis(xMin, xMax, yMin, yMax, width, height, canvas);

                var colorConverter = libColor.convertColor(runtime, image);

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
            
                var colors = runtime.ffi.toArray(plotOptions).map(
                    function (e) {
                        return colorConverter(runtime.getField(e, "color"));
                    }
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
                    width, height, canvas, detached) {
                    /*
                     * Plot data points (scatter plot)
                     *
                     * Part of this function is adapted from
                     * http://alignedleft.com/tutorials/d3/making-a-scatterplot
                     */

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
                    // would be nice to use cases like in 
                    // http://cs.brown.edu/~joe/public/docs/ffi.html#%28part._.F.F.I_cases%29
                    // But HOW?
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
            
            
                libData.fill(allID, 0).forEach(function (e, i) {
                    canvas.selectAll('.plotting' + i.toString()).style(
                        {'stroke': colors[i], 'stroke-width': 1, 'fill': 'none'});
                    canvas.selectAll('.scatter-plot' + i.toString()).style(
                        'fill', colors[i]);
                });
                
                putLabel(
                    runtime.getField(windowOption, "label"),
                    width,
                    height,
                    detached,
                    margin);
                
                callBigBang(runtime, detached);
            };
        }

        function inferBounds(runtime) {
            return function (lst) {
                runtime.checkArity(1, arguments, "infer-bounds");
                runtime.checkList(lst);
            
                // TODO: check if all are Plot
                var dataPoints = libData.flatten(runtime.ffi.toArray(lst).map(
                    function (pts) {
                        if (runtime.hasField(pts, "points")) {
                            return parsePoints(
                                runtime.getField(pts, "points"), runtime);
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
            return function (f, xMin, xMax, yMin, yMax) {
                runtime.checkArity(5, arguments, "generate-xy");
                runtime.checkFunction(f);
                runtime.checkNumber(xMin);
                runtime.checkNumber(xMax);
                runtime.checkNumber(yMin);
                runtime.checkNumber(yMax);
                if (jsnums.greaterThanOrEqual(xMin, xMax) ||
                    jsnums.greaterThanOrEqual(yMin, yMax)) {
                    runtime.throwMessageException(CError.RANGE);
                }

                var marginType = "normal",
                    margin = getMargin(marginType),
                    dimension = getDimension(margin),
                    width = dimension.width,
                    height = dimension.height,
                    K = 70,
                    DELTA = 0.001;

                var inputScaler = libNum.scaler(
                        0, width - 1, xMin, xMax, false),
        
                    outputScaler = libNum.scaler(
                        yMin, yMax, height - 1, 0, false);
            
                var xToPixel = libNum.scaler(xMin, xMax, 0, width - 1, true);
                var yToPixel = libNum.scaler(yMin, yMax, height - 1, 0, true);

                function PointCoord(x) {
                    this.x = x;
                    this.px = xToPixel(x);
                
                    // TODO: replace try block with this when
                    // execThunk is available
                
                    /*
                    runtime.safeCall(function(){
                        return runtime.execThunk(function(){
                            return f.app(x);
                        });
                    }, function(answer){
                        if(runtime.isSuccessResult(answer)){
                            this.y = answer.result;
                        
                            // below will cause an exception
                            // if y is a complex number
                        
                            if (!jsnums.isReal(this.y) ||
                                jsnums.lessThan(this.y, yMin) ||
                                jsnums.lessThan(yMax, this.y)) {         
                                this.y = NaN;
                                this.py = NaN;
                            } else {
                                this.py = yToPixel(this.y);
                            }
                        
                        }else{
                            this.y = NaN;
                            this.py = NaN;
                        }
                    });
                    */
                
                    try {
                        this.y = f.app(x);
                    
                        // below will cause an exception
                        // if y is a complex number
                    
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
                    // consider all invalid if there is no (i, i+1) which are both valid
                    return libData.range(0, points.length - 1).every(
                        function (i) {
                            return Number.isNaN(points[i].py) ||
                                   Number.isNaN(points[i + 1].py);
                    });
                }
            
                logtable = [];
                for(var i = 0; i < width; ++i) {
                    logtable.push(new libData.LogTable(height));
                }

                function occupy(pt) {
                    logtable[Math.floor(pt.px)].occupy(Math.floor(pt.py));
                }
            
                function isAllOccupied(left, right) {
                    return logtable[Math.floor(left.px)].isRangedOccupied(
                        Math.floor(left.py), Math.floor(right.py));
                }
                
                function divideSubinterval(left, right, depth) {
                    /*
                    Input: two X values
                    Output: list of [2-length long list of points]
                    Note: invalid for two ends is still okay
                    invalid for K points indicate that it should not be plotted!
                    */
                
                    occupy(left);
                    occupy(right);
                
                    if (closeEnough(left, right)) {
                        return [[left, right]];
                    } else if (tooClose(left, right)) {
                        return [];
                    } else if (isSamePX(left, right) && 
                        isAllOccupied(left, right)) {
                            return [[left, right]];
                    } else {
                        var scalerSubinterval = libNum.scaler(
                            0, K - 1, left.x, right.x, false);

                        var points = libData.range(0, K).map(function (i) {
                            return new PointCoord(scalerSubinterval(i));
                        });
                    
                        if (allInvalid(points)) {
                            return [];
                        } else {
                            var intervals = [];
                            var shuffled = libData.shuffle(
                                libData.range(0, K - 1));
                            for (var i = 0; i < K - 1; i++) {
                                var v = shuffled[i];
                                intervals.push(divideSubinterval(
                                    points[v], points[v + 1], depth + 1
                                ));
                                if (isSamePX(left, right) && 
                                    isAllOccupied(left, right)) {
                                        return [[left, right]];
                                }
                            }  
                            return libData.flatten(intervals);
                        }
                    }
                }
    
                var ans = divideSubinterval(new PointCoord(xMin),
                                            new PointCoord(xMax), 0)
            
                ans.sort(function(a, b) {
                    if (a[0].px == b[0].px) {
                        return a[0].py - b[0].py;
                    }
                    return a[0].px - b[0].px;
                });
            
                ans = ans.reduce(
                    function(dataPoints, val) {
                        if (dataPoints.length > 0) {
                            var prev = dataPoints.pop();
                            if (prev.length > 0 && val.length > 0) {
                                if (closeEnough(
                                    libData.lastElement(prev), val[0])) {
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
        
        return function(runtime, namespace) {
            var sd = sdLib(runtime, runtime.namespace);
            var image = imageLib(runtime, runtime.namespace);
            return util.makeModuleReturn(runtime, {}, {
                "generic-plot": runtime.makeFunction(
                    genericPlot(runtime, image)),
                "infer-bounds": runtime.makeFunction(
                    inferBounds(runtime)),
                "generate-xy": runtime.makeFunction(
                    generateXY(runtime)),
                "histogram-plot": runtime.makeFunction(
                    histogramPlot(runtime)),
                "pie-chart": runtime.makeFunction(
                    pieChart(runtime, sd))
            });
        };
    });
