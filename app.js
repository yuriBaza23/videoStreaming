const express = require('express');

const app = new express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

var port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));
app.listen(port, () => console.log('Started'));