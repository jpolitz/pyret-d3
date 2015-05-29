define(["d3", "js/js-numbers", "libNum", "libArr"], function (d3, jsnums, numLib, arrLib) {
    function getDataUnstable(f, xMin, xMax, yMin, yMax, width, height) {
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
                'right': arrLib.lastElement(d),
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
            var groupedPoints = arrLib.lastElement(dataPoints);
            if (groupedPoints.length > 0) {
                var prev = arrLib.lastElement(groupedPoints);
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
                    right: arrLib.lastElement(interval).x
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
                       (arrLib.lastElement(intervals).right < item.x)) {
                    intervals.pop();
                    dataPoints.push([]);
                }
                if (intervals.length > 0) {
                    if ((arrLib.lastElement(intervals).left <= item.x) &&
                        (item.x <= arrLib.lastElement(intervals).right)) {
                        arrLib.lastElement(dataPoints).push(item);
                    }
                }
                return dataPoints;
            }, [[]]).filter(function (d) { return d.length > 1; });
    }

    return {
        'getDataUnstable': getDataUnstable
    };
});
