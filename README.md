Usage
=====

xy-plot
-------
Here are arguments

1. a function to be plotted [(Number -> Number)]
2. x-min [Number]
3. x-max [Number]
4. y-min [Number]
5. y-max [Number]

Example
=======

xy-plot
-------

https://patch-experiment.herokuapp.com/editor#share=0Bxr4FfLa3goOb1pieksyNE1nV3c&v=v0.5r763-test

Issues
======

xy-plot
-------

1. What will happen if we try to plot "lam(x): (num-sqr(x) - 4) / (x - 2) end"?
Should it make an error when encounter x = 2?

2. Each window creates a lot of objects which is not destroyed when it is closed

3. Bignum? Irrational Number? Complex Number? How should we deal with these?

Credit
======

http://jsfiddle.net/christopheviau/Hwpe3/
