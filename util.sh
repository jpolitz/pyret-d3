#!/bin/bash

case "$1" in
"lib2")
        echo "begin renaming to lib2"
        mv lib.js lib2.js
        sed 's@my-project/lib@my-project/lib2@' main.js > tmp && mv tmp main.js
        chmod a+r main.js
        ;;
"lib")
        echo "begin renaming to lib"
        mv lib2.js lib.js
        sed 's@my-project/lib2@my-project/lib@' main.js > tmp && mv tmp main.js
        chmod a+r main.js
        ;;
"download")
        echo "begin downloading .arr files"
        wget -O "d3.arr" "https://drive.google.com/uc?export=download&id=0Bxr4FfLa3goOc1IzbDNaZlZ6ZWc"
        wget -O "svg.arr" "https://docs.google.com/uc?export=download&id=0Bxr4FfLa3goOWks2TGdJc1RFd3M"
        ;;
*)
        echo "please specify arguments"
esac
