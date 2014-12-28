#!/bin/bash

case "$1" in
"clear")
        mv lib.js lib2.js
        sed 's@my-project/lib@my-project/lib2@' main.js > tmp && mv tmp main.js
        chmod a+r main.js
        ;;
"reset")
        mv lib2.js lib.js
        sed 's@my-project/lib2@my-project/lib@' main.js > tmp && mv tmp main.js
        chmod a+r main.js
        ;;
esac
