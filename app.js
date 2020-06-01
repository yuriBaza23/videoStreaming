const express = require('express');
const http = require('http');

const app = new express();
const server = http.Server(app);

//Concede a permissão para trabalhar com o realtime
const io = io(server);

var port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.redirect('index.html')
})

// io.on('connection', (socket) => {
//   socket.join('any');
//   socket.on('stream', (image) => {
//     socket.broadcast.emit('stream', image)
//   })
// })

app.use(express.static(__dirname + "/public"));
http.listen(port, () => console.log('Started'));