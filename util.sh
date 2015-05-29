#!/bin/bash

case "$1" in
"download")
        echo "begin downloading .arr files"
        wget -O "plot.arr" "https://drive.google.com/uc?export=download&id=0Bxr4FfLa3goOc1IzbDNaZlZ6ZWc"
        wget -O "graph.arr" "https://drive.google.com/uc?export=download&id=0Bxr4FfLa3goOVERuNEJpcWhzTjg"
        wget -O "graph-structs.arr" "https://drive.google.com/uc?export=download&id=0Bxr4FfLa3goOdHVsS1VMdHBZTG8"
        wget -O "plot-structs.arr" "https://drive.google.com/uc?export=download&id=0Bxr4FfLa3goORTBMd1c2UlZXOGc"
        #wget -O "svg.arr" "https://docs.google.com/uc?export=download&id=0Bxr4FfLa3goOWks2TGdJc1RFd3M"
        ;;
*)
        echo "please specify arguments"
esac
