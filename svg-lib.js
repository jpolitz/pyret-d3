define(["my-project/d3-shared"], function (clib) {
    var libJS = clib.libJS;

    function showSVG(runtime) {
       return function (xml) {
           /*
            * Produces a rendered SVG image in Big Bang box
            *
            * @param (string) xml
            * @return (nothing)
            */
           runtime.checkArity(1, arguments, "show-svg");
           runtime.checkString(xml);
           runtime.getParam("current-animation-port")(xml);
       };
   }

   function getBBox(runtime) {
       return function (xml) {
           runtime.checkArity(1, arguments, "getBBox");
           runtime.checkString(xml);
           var parser = new DOMParser();
           var svg = parser.parseFromString(
               xml, "image/svg+xml").documentElement;
           var bbox = libJS.getBBox(svg);
           return runtime.makeObject({
               'height': bbox.height,
               'width': bbox.width,
               'x': bbox.x,
               'y': bbox.y
           });
       };
   }
   
   return {
       'showSVG': showSVG,
       'getBBox': getBBox
   };
   
});