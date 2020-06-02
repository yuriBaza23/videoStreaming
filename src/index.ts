// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

var activeSockets: string[] = [];

var roomno = 0;

app.use((req, res, next) => {
  var url = req.originalUrl;
  var channel = url.split('channel=');
  if(channel[1] !== undefined){
    if(channel[1].indexOf('&') !== -1){
      var realChannel = channel[1].split('&');
      roomno = realChannel[0];
    } else {
      if(channel[1] === null || channel[1] === undefined){
        
      } else {
        roomno = channel[1];
      }
    }
  }
  console.log(roomno);
  next();
})

// Routing
app.use(express.static(path.join(__dirname, '../public')));

// Chatroom

var numUsers = 0;
io.on('connection', socket => {
  socket.join(roomno);

  const existingSocket = activeSockets.find(
    existingSocket => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);

    io.sockets.in(roomno).emit('connectedUsers', {
      users: activeSockets.filter(
        existingSocket => existingSocket !== socket.id
      )
    });
    
  }

  var room = io.nsps['/'].adapter.rooms[roomno];
  var num = 0;
  for(var i = 0; i <= room.length; i++){
    num = i;
  }
  //Send this event to everyone in the room.
  io.sockets.in(roomno).emit('connectToRoom', "You are in room " + roomno + "com " + num);
});