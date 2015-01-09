Usage
=====

xy-plot
-------

This function plots a graph. It is slow and might not render the graph properly.

Arguments are:

1. a function to be plotted [(Number -> Number)]
2. x-min [Number]
3. x-max [Number]
4. y-min [Number]
5. y-max [Number]

xy-plot-cont
------------

This function plots a graph. It is very fast. However,
it assumes that the plotting graph is continuous and therefore will show
stange behavior such as showing vertical bars in a step function

Arguments are:

1. a function to be plotted [(Number -> Number)]
2. x-min [Number]
3. x-max [Number]
4. y-min [Number]
5. y-max [Number]

scatter-plot
-----------

Arguments are:

1. List<Posn>

Example
=======

xy-plot & xy-ploy-cont & scatter-plot
------------------------------------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOVmtfV21oazVBVTg&v=v0.5r763-test

Credit
======

http://jsfiddle.net/christopheviau/Hwpe3/
