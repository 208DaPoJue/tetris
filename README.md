# **tetris**

**a web page tetris**

## preparation
    install node.js
    install npm
    install go

## run method
*when you first run, make sure you have install dependencies(run web/setup.sh)*

1. cd ./web

2. gulp

   > will create a dist document

3. cd ../server

   go build -ldflags '-s'

   cp ./server ../dist

*now you can accept http://127.0.0.1:8100/tetris to play game, have fun!*