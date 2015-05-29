provide {
  show-svg: show-svg,
  getBBox: getBBox
} end

import js-http("https://cs.brown.edu/~sporncha/pyret-d3/main.js") as J
import shared-gdrive("XML", "0ByJ_bK5RkycfbURxd2p3WlR3aUE") as XML
import shared-gdrive("my_image_v2", "0Bxr4FfLa3goOeUc2Mk42ZFZ2MkU") as I

type Element = XML.Element
type Attribute = XML.Attribute

tag = XML.tag
attribute = XML.attribute

ERROR-NOT-SVG = "Not a valid SVG image"

fun show-svg(svg :: Element) -> Nothing:
  cases (Element) svg:
    | tag(name, attributes, elts) => 
      when name <> "svg":
        raise(ERROR-NOT-SVG)
      end
      J.show-svg(torepr(svg))
    | else => raise(ERROR-NOT-SVG)
  end
  nothing
end

fun attribute-tostring(
    lst :: List<Attribute>, key :: String) -> List<Attribute>:
  cases (List) lst:
    | empty => empty
    | link(f, r) =>
      if f.name == key:
        link(attribute(f.name, num-tostring(f.value)), r)
      else:
        link(f, attribute-tostring(r, key))
      end
  end
end

fun getBBox(el :: Element):
  XMLNS-ATTR = attribute("xmlns", "http://www.w3.org/2000/svg")
  
  is-svg = cases (Element) el:
    | tag(name, _, _) => name == "svg"
    | else => false
  end
  
  svg = if is-svg:
    is-add-ns = cases (List) el.attributes:
      | empty => true
      | link(f, _) => f.name <> "xmlns"
    end
    if is-add-ns:
      tag(el.name, link(XMLNS-ATTR, el.attributes), el.elts)
    else:
      el
    end
  else:
    tag("svg", [list: XMLNS-ATTR], [list: el])
  end
  
  fixed-svg = tag(
    svg.name,
    svg.attributes
      ^ attribute-tostring(_, "width")
      ^ attribute-tostring(_, "height"),
    svg.elts)
  
  J.getBBox(torepr(fixed-svg))
end