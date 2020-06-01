const express = require('express');

const app = new express();

const http = require('http').Server(app);
const io = require('socket.io')(http);

var port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.redirect('index.html')
})

io.on('connection', (socket) => {
  socket.on('stream', (image) => {
    socket.broadcast.emit('stream', image)
  })
})

app.use(express.static(__dirname + "/public"));
http.listen(port, () => console.log('Started'));