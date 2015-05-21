define(["d3", "js/js-numbers"], function (d3, jsnums) {
    function scaler(oldX, oldY, newX, newY, toFixnum) {
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
            return toFixnum ? jsnums.toFixnum(result) : result;
        };
    }

    function adjustInRange(k, vmin, vmax) {
        /*
         * Adjust k to be between vmin and vmax if it's not in the range
         *
         * @param {jsnums} k
         * @param {jsnums} vmin
         * @param {jsnums} vmax
         * @return {jsnums}
         */
        if (jsnums.lessThan(k, vmin)) return vmin;
        else if (jsnums.lessThan(vmax, k)) return vmax;
        else return k;
    }

    function max(a, b) {
        /*
         * Find the maximum value
         *
         * @param {jsnums} a
         * @param {jsnums} b
         * @return {jsnums}
         */
        return jsnums.lessThan(a, b) ? b : a;
    }

    function min(a, b) {
        /*
         * Find the minimum value
         *
         * @param {jsnums} a
         * @param {jsnums} b
         * @return {jsnums}
         */
        return jsnums.lessThan(a, b) ? a : b;
    }
    
    function random(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    function format(num, digit) {
        if (num.toString().length > digit) {
            var fixnum = jsnums.toFixnum(num);
            if (fixnum.toString().length > digit) {
                var digitRounded = digit - 1;
                if (fixnum < 0) digitRounded--;
                if (fixnum.toString().indexOf(".") !== -1) digitRounded--;
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
    return {
        'scaler': scaler,
        'adjustInRange': adjustInRange,
        'max': max,
        'min': min,
        'format': format
    }
});
