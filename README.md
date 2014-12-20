Usage
=====

xy-plot
-------

This function plots a graph. It is slow and might not be rendered properly
for some graphs.

Arguments are:

1. a function to be plotted [(Number -> Number)]
2. x-min [Number]
3. x-max [Number]
4. y-min [Number]
5. y-max [Number]

xy-plot-cont
------------

This function plots a graph. It is very fast and renders smoothly. However,
it assumes that the plotting graph is continuous and therefore will show
stange behavior such as showing vertical bar in step function

Arguments are:

1. a function to be plotted [(Number -> Number)]
2. x-min [Number]
3. x-max [Number]
4. y-min [Number]
5. y-max [Number]

Example
=======

xy-plot
-------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOWlVUMXJjcS1Qd2s&v=v0.5r763-test

Credit
======

http://jsfiddle.net/christopheviau/Hwpe3/
