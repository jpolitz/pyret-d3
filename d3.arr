provide {
  xy-plot: xy-plot,
  scatter-plot: scatter-plot,
  polynomial-regression: polynomial-regression,
  regression-polynomial: regression-polynomial,
  linear-regression: linear-regression,
  regression-linear: regression-linear,
  power-regression: power-regression,
  regression-power: regression-power,
  regression-plot: regression-plot,
  histogram-plot: histogram-plot,
  pie-chart: pie-chart,
  posn: posn
} end
provide-types *

import js-http("https://cs.brown.edu/~sporncha/pyret-d3/main.js") as J
import shared-gdrive("matrices_3", "0ByJ_bK5RkycfSVZTRFd5QUpzaWc") as M
import either as E
import string-dict as SD

type Either = E.Either
left = E.left
right = E.right

data Posn:
  | posn(x :: Number, y :: Number)
end

data Regression:
  | regression-linear(coeff :: List<Number>)
  | regression-polynomial(coeff :: List<Number>)
  | regression-exponential(coeff :: List<Number>)
  | regression-power(coeff :: List<Number>)
  | regression-empty
end

MATH_E = 2.71828182845904523536

###############
### xy-plot ###
###############

fun xy-plot(
    f :: (Number -> Number),
    x-min :: Number,
    x-max :: Number,
    y-min :: Number,
    y-max :: Number) -> Nothing:
  J.xy-plot(f, x-min, x-max, y-min, y-max)
  nothing
end

fun xy-plot-cont(
    f :: (Number -> Number),
    x-min :: Number,
    x-max :: Number,
    y-min :: Number,
    y-max :: Number) -> Nothing:
  J.xy-plot-cont(f, x-min, x-max, y-min, y-max)
  nothing
end

##################
### regression ###
##################

### General ###

MULTIPLIER = 10000000

fun number-pretify(num :: Number) -> Number:
  doc: "Round num to a 'nice' and number"
  multiplied = num * MULTIPLIER
  diff-floor = multiplied - num-floor(multiplied)
  diff-ceiling = num-ceiling(multiplied) - multiplied
  closest = if diff-floor < diff-ceiling:
    num-floor(multiplied)
  else:
    num-ceiling(multiplied)
  end
  closest / MULTIPLIER
where:
  number-pretify(0.3333333333333444) is 3333333/10000000
  number-pretify(0.999999999998123) is 1
end

fun regression-solve(A :: M.Matrix, b :: M.Matrix) -> List<Number>:
  cases (Either) run-task(lam(): A.least-squares-solve(b) end):
    | left(v) => v.to-list()
    | right(_) => raise("There are not enough points.")
  end
end

fun generate-term(a :: String, b :: String, c :: String) -> String:
  doc: "Generate a * b^c in html"
  # Note: comparision MUST NOT be used in this function. Only equality can
  # be used
  ask:
    | b == "0" then: ""
    | b == "1" then: a
    | otherwise:
      ask:
        | a == "0" then: ""
        | a <> "0" then:
          coeff = ask:
            | a == "1" then: ""
            | a <> "1" then: a
          end
          non-coeff = ask:
            | c == "0" then: ""
            | c == "1" then: b
            | otherwise: b + "<sup>" + c + "</sup>"
          end
          ask:
            | (coeff == "") and (non-coeff == "") then: "1"
            | (coeff == "") or (non-coeff == "") then: coeff + non-coeff
            | otherwise: coeff + " " + non-coeff
          end
      end
  end
where:
  generate-term("0", "ANYTHING", "ANYTHING") is ""
  generate-term("ANYTHING", "0", "ANYTHING") is ""
  generate-term("1", "1", "1") is "1"
  generate-term("1", "x", "1") is "x"
  generate-term("1", "1", "ANYTHING") is "1"
  generate-term("1", "x", "2") is "x<sup>2</sup>"
  generate-term("1", "2", "x") is "2<sup>x</sup>"
  generate-term("1", "e", "x") is "e<sup>x</sup>"
end

fun generate-equation(body :: String):
  "y = " +  if body == "": "0" else: body end
end

fun regression-plot(
    points :: List<Posn>,
    regression-func :: (List<Posn> -> Regression)) -> Nothing:
  
  regression = regression-func(points)
  
  label = cases (Regression) regression:
    | regression-empty => ""
    | regression-linear(coeff) => generate-eqn-polynomial(coeff)
    | regression-polynomial(coeff) => generate-eqn-polynomial(coeff)
    | regression-exponential(coeff) => generate-eqn-exponential(coeff)
    | regression-power(coeff) => generate-eqn-power(coeff)
  end
  
  func = cases (Regression) regression:
    | regression-empty => lam(x :: Number) -> Number: num-sqrt(-1) end
    | regression-linear(coeff) => generate-func-polynomial(coeff)
    | regression-polynomial(coeff) => generate-func-polynomial(coeff)
    | regression-exponential(coeff) => generate-func-exponential(coeff)
    | regression-power(coeff) => generate-func-power(coeff)
  end
  
  J.regression-plot(points, func, label)
  nothing
end

### Polynomial ###

fun generate-eqn-polynomial(coeff :: List<Number>) -> String:
  generate-equation(
    map_n(
      lam(i :: Number, c :: Number):
        generate-term(num-tostring(c), "x", num-tostring(i))
      end, 0, coeff).filter(_ <> "").reverse().join-str(" + "))
end

fun generate-func-polynomial(coeff :: List<Number>) -> (Number -> Number):
  lam(x :: Number) -> Number:
    map_n(
      lam(i :: Number, c :: Number):
        c * num-expt(x, i)
      end,
      0, coeff).foldl(_ + _, 0)
  end
where:
  generate-func-polynomial([list: 1, -2, 3, 5])(1/3)
    is 1 + -2/3 + 3/9 + 5/27
end

fun polynomial-regression(degree :: Number) -> (List<Posn> -> Regression):
  lam(points :: List<Posn>) -> Regression:
    x-list = points.map(_.x)

    A = M.lists-to-matrix(
      range(0, degree + 1).map(
        lam(i :: Number) -> List<Number>:
          x-list.map(num-expt(_, i))
        end)).transpose()

    b = M.list-to-col-matrix(points.map(_.y))

    regression-polynomial(
      regression-solve(A, b).map(number-pretify))
  end
end

fun linear-regression() -> (List<Posn> -> Regression):
  lam(points :: List<Posn>) -> Regression:
    regression-linear(polynomial-regression(1)(points).coeff)
  end
end

### Power ###

fun generate-func-power(kh :: List<Number>) -> (Number -> Number):
  k = kh.get(0)
  h = kh.get(1)
  lam(x :: Number) -> Number: h * num-expt(x, k) end
end

fun generate-eqn-power(kh :: List<Number>) -> String:
  k = kh.get(0)
  h = kh.get(1)
  generate-equation(generate-term(num-tostring(h), "x", num-tostring(k)))
end

fun power-regression() -> (List<Posn> -> Regression):
  doc: "find k, h where y = h * x^k: similar to log-log plot"
  # ln(y) = ln(h) + k ln(x)
  
  lam(points :: List<Posn>) -> Regression:
    ln-x-list = points.map(_.x).map(num-log)
    one-list = repeat(points.length(), 1)

    A = M.lists-to-matrix([list: ln-x-list, one-list]).transpose()
    b = M.list-to-col-matrix(points.map(_.y).map(num-log))

    result = regression-solve(A, b)
    regression-power(
      [list:
        result.get(0),
        num-expt(MATH_E, result.get(1))].map(number-pretify))
  end
where:
  power-regression()([list: 1, 2, 3, 4, 5, 6].map(
      lam(e :: Number): posn(e, 5 * num-expt(e, 7)) end))
    is regression-power([list: 7, 5])
end

### Exponential ###

fun generate-func-exponential(kh :: List<Number>) -> (Number -> Number):
  k = kh.get(0)
  h = kh.get(1)
  lam(x :: Number) -> Number: h * num-expt(MATH_E, k * x) end
end

fun generate-eqn-exponential(kh :: List<Number>) -> String:
  k = kh.get(0)
  h = kh.get(1)
  generate-equation(
    generate-term(
      num-tostring(h),
      "e",
      generate-term(num-tostring(k), "x", "1")))
end

fun exponential-regression() -> (List<Posn> -> Regression):
  doc: "find h, k where y = h * e^(xk)"
  # ln(y) = ln(h) + xk
  
  lam(points :: List<Posn>) -> Regression:
    x-list = points.map(_.x)
    one-list = repeat(points.length(), 1)

    A = M.lists-to-matrix([list: x-list, one-list]).transpose()
    b = M.list-to-col-matrix(points.map(_.y).map(num-log))

    result = regression-solve(A, b)
    regression-exponential(
      [list:
        result.get(0),
        num-expt(MATH_E, result.get(1))].map(number-pretify))
  end
where:
  exponential-regression()([list: 1, 2, 3, 4, 5, 6].map(
      lam(e :: Number): posn(e, 7 * num-expt(MATH_E, 3 * e)) end))
    is regression-exponential([list: 3, 7])
end

####################
### scatter-plot ###
####################

fun scatter-plot(points :: List<Posn>) -> Nothing:
  regression-plot(points, lam(_): regression-empty end)
end

######################
### histogram-plot ###
######################

fun histogram-plot(lst :: List<Number>, n :: Number) -> Nothing:
  J.histogram-plot(lst, n)
  nothing
end

#################
### pie-chart ###
#################

fun pie-chart(sd :: SD.StringDict) -> Nothing:
  J.pie-chart(sd)
  nothing
end