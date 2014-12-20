import either as E
import js-http("https://cs.brown.edu/~sporncha/pyret-d3/main.js") as J

left = E.left
right = E.right

WIDTH = 500
HEIGHT = 500

fun scaler(
    old-x :: Number,
    old-y :: Number,
    new-x :: Number,
    new-y :: Number) -> (Number -> Number):
  
  doc: "Scale a Number linearly from [old-x, old-y] to [new-x, new-y]."
  
  lam(k :: Number) -> Number:
    (((k - old-x) / (old-y - old-x)) * (new-y - new-x)) + new-x
  end
  
where:
  scaler(1, 3, -1, -3)(1.5) is -1.5
  scaler(1, 3, -2, -5)(1) is -2
  scaler(1, 3, -2, -5)(3) is -5
end

data Point: point(x :: Number, y :: Number) end

fun check-limit-left(
    f :: (Number -> Number), x :: Number, y :: Number) -> Boolean:
  
  doc: "Check whether lim z -> x- f(z) = y?"
  
  # TODO: implement
  true
end

fun get-xy(
    f :: (Number -> Number),
    x-min :: Number,
    x-max :: Number,
    y-min :: Number,
    y-max :: Number) -> List<List<Point>>:
  
  input-scaler = scaler(0, WIDTH - 1, x-min, x-max)
  output-scaler = scaler(y-min, y-max, HEIGHT - 1, 0)
  
  xy = for fold(prev from [list: empty], i from range(0, WIDTH)):
    x = input-scaler(i)
    cases (E.Either) run-task(lam(): f(x) end):
      | left(y :: Number) =>
        if (y-min <= y) and (y <= y-max):
          new-prev = if check-limit-left(f, x, y):
            prev
          else:
            link(empty, prev)
          end
          link(
            link(
              point(i, output-scaler(y)),
              prev.first), prev.rest)
        else:
          link(empty, prev)
        end
      | right(_) =>
        # TODO: should only Division by zero acceptable?
        link(empty, prev)
    end
  end
  xy.filter(is-link).reverse().map(_.reverse())
where:
  x = 1000000000000000000000000000000000000000000000000000
  get-xy(_ + 0, x, x + 1, x, x + 1).first.first is point(0, 499)
end

fun xy-plot(
    f :: (Number -> Number),
    x-min :: Number,
    x-max :: Number,
    y-min :: Number,
    y-max :: Number): # TODO: Add annotation?
  
  doc: "Plot f in [x-min, x-max], [y-min, y-max] boundary."
  
  when (x-min >= x-max) or (y-min >= y-max):
    raise(```x-min and y-min must be strictly less than
      x-max and y-max respectively.```)
  end
  
  # TODO: call lib with get-xy(f, x-min, x-max, y-min, y-max)
  nothing
end

