https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goObF90QVp5eU1CdXc&v=v0.5r765-test

Data Definition
===============

data Posn:
  | posn(x :: Number, y :: Number)
end

data Vertex:
  | vertex(name :: String,
           color :: Color)
end

data Edge:
  | edge(from :: Vertex,
         to :: Vertex,
         type :: EdgeType)
end

Functions
=========

xy-plot
-------

xy-plot(f :: (Number -> Number),
        x-min :: Number,
        x-max :: Number,
        y-min :: Number,
        y-max :: Number)

xy-plot-cont (deprecated)
-------------------------

xy-plot-cont(f :: (Number -> Number),
             x-min :: Number,
             x-max :: Number,
             y-min :: Number,
             y-max :: Number)

scatter-plot
------------

scatter-plot(lst :: List<Posn>)

histrogram (not implemented)
----------------------------

histrogram(lst :: List<Number>, n :: Number)

graph-display (not implemented)
-------------------------------

graph-display(vertices :: List<Vertex>,
              edges :: List<Edge>)

Example
=======

1. scatter-plot([list: posn(1, 2), posn(100, 100), posn(50, 51), posn(49, 46)])
2. xy-plot(num-floor, -10, 10, -10, 10)
3. xy-plot(lam(x): num-sin(1 / x) end, -1, 1, -1, 1)

Credit
======

http://jsfiddle.net/christopheviau/Hwpe3/
