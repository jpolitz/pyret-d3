Functions
=========

xy-plot (using d3.arr)
----------------------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOSUdNY1ZQTW5Idjg&v=v0.5r765-test

xy-plot(f :: (Number -> Number),
        x-min :: Number,
        x-max :: Number,
        y-min :: Number,
        y-max :: Number)

scatter-plot (using d3.arr)
---------------------------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOSDlZZlFIS1gtUGs&v=v0.5r765-test

scatter-plot(lst :: List<Posn>)

histogram-plot (using d3.arr)
-----------------------------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOR184LW1zTTlxU28&v=v0.5r765-test

histogram-plot(lst :: List<Number>, n :: Number)


graph-display (using d3.arr, not implemented)
---------------------------------------------

graph-display(vertices :: List<Vertex>,
              edges :: List<Edge>)

show-svg (using show-svg.arr)
-----------------------------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOZUtyV210WjBNMGs&v=v0.5r765-test

show-svg(xml :: XML.Element)

Credit
======

1. http://jsfiddle.net/christopheviau/Hwpe3/
2. http://alignedleft.com/tutorials/d3/making-a-scatterplot
3. http://www.frankcleary.com/making-an-interactive-histogram-in-d3-js/