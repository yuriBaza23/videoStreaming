// import express, { Application } from "express";
// import socketIO, { Server as SocketIOServer } from "socket.io";
// import { createServer, Server as HTTPServer } from "http";
// import path from 'path';

// export class Server {
//   private httpServer: HTTPServer;
//   private app: Application;
//   private io: SocketIOServer;
  
//   private readonly DEFAULT_PORT = 5000;

//   constructor() {
//     this.initialize();
//   }

//   private initialize(): void {
//     this.app = express();
//     this.httpServer = createServer(this.app);
//     this.io = socketIO(this.httpServer);

//     this.configureApp();
//     this.handleRoutes();
//     this.handleSocketConnection();
//   }

//   private configureApp(): void {
//     this.app.use(express.static(path.join(__dirname, "../public")));
//   }

//   private handleRoutes(): void {
//     this.app.get("/", async (req, res) => {
//       res.sendFile("index.html");
//     });
//   }

//   private handleSocketConnection(): void {
//     this.io.on("connection", socket => {
//       if(this.io.nsps['/'].adapter.rooms['room-1'] && this.io.nsps['/'].adapter.rooms['room-1'].length > 1){
        
//       } else {
//         socket.join('room-1');
//         this.io.sockets.in('room-1').emit('connectToRoom', 'Você está na room-1');
//         socket.emit('newMessage', 'Bem-vindo(a)!'); //para aquele que entrou agr
//         socket.broadcast.emit('newMessage', 'Um novo usuário entrou na room-1'); //para aquele que já estava
//         this.io.sockets.in('room-1').emit('sockets', this.io.nsps['/'].adapter.rooms['room-1'].sockets);
//         this.io.sockets.in('room-1').emit('url', socket.handshake.url)
//       }
//     });
//   }

//   public listen(callback: (port: number) => void): void {
//     this.httpServer.listen(this.DEFAULT_PORT, () =>
//       callback(this.DEFAULT_PORT)
//     );
//   }
// }
const fs = require('fs');
const express = require('express');
const path = require('path');

var options = {
  key: fs.readFileSync('fake-keys/privatekey.pem'),
  cert: fs.readFileSync('fake-keys/certificate.pem')
};
var util = require('util');
var now = require("performance-now");
var rooms = [];
var users = {};
var screensharingusers = {};
var trimmed;

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, '../public')));
app.set('views', path.join(__dirname, '../public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {
  res.render('404.html');
})

app.get('/:key',function(req,res){
	trimmed = req.params.key.trim();
	if (req.url === '/favicon.ico'){
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    return;
  } else {
		res.render('public.html');
	}
});

io.sockets.on('connection',function(socket){
	console.log(now()+' connected..');
	socket.key = trimmed;
	socket.screenShared = false;
	socket.on('disconnect',function(){
		if(socket.username === undefined)
		{
			console.log('User has disconnected!! without using the product!!');
		}
		else
		{
			console.log(socket.username + ' has disconnected!!');
			socket.broadcast.to(socket.key).emit('disconnected-user-reset');
				if(rooms.length > 0)
			{
				console.log('Calling removeUserKey..');
				removeUserKey(socket);
				io.to(socket.key).emit('checking-for-screen-share', socket.key, users[socket.key]);	
			}
		}
	});
	//Getting Username
	socket.on('username',function(data){
		console.log(data+' just joined..');
		addUserKey(data,socket);
	});

	socket.on('checked-stream',function(data){
		console.log('Inside checked stream!!..Now emitting checking-for-screen-share !!!');
		io.to(socket.key).emit('checking-for-screen-share', socket.key, users[socket.key]);
		if(users[socket.key].length===2)
		{
			socket.broadcast.to(socket.key).emit('available-for-offer');
			io.to(socket.key).emit('users-final', users[socket.key]);
		}
		else
		{
			if(users[socket.key].length>2)
			{
				console.log("Sorry..This room is already in use..Try again later.");
			}
		}
	});

	socket.on('got-local-description',function(data){
		console.log('Got Local Description...');
		console.log('Now broadcasting...');
		socket.broadcast.to(socket.key).emit('available-for-answer',data);
	});

	socket.on('got-remote-description',function(data){
		console.log('Got Remote Description...');
		console.log('Now broadcasting...');
		socket.broadcast.to(socket.key).emit('available-for-stream',data);
	});
	socket.on('local-candidate',function(data){
		console.log('Got Local Candidate!!!');
		socket.broadcast.to(socket.key).emit('local-candidate-broadcast',data);	
	
	});
	socket.on('remote-candidate',function(data){
		console.log('Got Remote Candidate!!!');
		socket.broadcast.to(socket.key).emit('remote-candidate-broadcast',data);
	});
	socket.on('remote-disconnected',function(){
		socket.broadcast.to(socket.key).emit('remote-candidate-disconnect');
	});

	socket.on('this-chat-data',function(data){
		socket.broadcast.to(socket.key).emit('remote-chat-data',data);
	});

	socket.on('different-chat-data',function(data){
		socket.broadcast.to(socket.key).emit('different-remote-chat-data',data);
	});

	socket.on('screen-share-off', function(){
		socket.screenShared = false;
		console.log('OFF CALLED..Screen shared is '+ socket.screenShared);
		screensharingusers[socket.key][socket.username] = socket.screenShared;
		console.log('Now screensharingusers object is '+util.inspect(screensharingusers));	
		socket.broadcast.to(socket.key).emit('other-guy-screen-share-off');
	});

	socket.on('screen-share-on', function(){
		socket.screenShared = true;
		console.log('ON CALLED..Screen shared is '+ socket.screenShared);
		screensharingusers[socket.key][socket.username] = socket.screenShared;
		console.log('Now screensharingusers object is '+util.inspect(screensharingusers));	
		socket.broadcast.to(socket.key).emit('other-guy-screen-share-on');
	});
});
//FUNCTIONS----start
	function addUserKey(data,socket)
	{
		try
		{
				var key = socket.key;
				if(rooms.indexOf(key) === -1)
			{
				console.log('Generating new key!!');
				rooms.push(key);
				users[key]=[data];
				screensharingusers[key] = {};
				screensharingusers[key][data] = socket.screenShared;
				socket.users = {} ;
				socket.users[data] = key;
				socket.username= data;
				socket.join(socket.key);
				console.log('Socket joins a room.');
				console.log('Adding socket.username --->'+ socket.username);
				console.log('Adding socket.users[data] --->'+socket.users[data]);
				console.log('Now screensharingusers object is '+util.inspect(screensharingusers));	
			}
			else
			{
				if(users[key]!=undefined)
				{

					console.log(now()+' Room already exists!!!');
					users[key].push(data);
					screensharingusers[key][data] = socket.screenShared;
					console.log('Now rooms array is '+JSON.stringify(rooms));
					console.log('Now users array is '+JSON.stringify(users));
					socket.users = {};
					socket.users[data] = key;
					socket.username= data;
					socket.join(socket.key);
					console.log('Now screensharingusers object is '+util.inspect(screensharingusers));		
				}

			}
		}
		catch(err)
		{
			console.log('Thrown error is ->'+err);
		}

	}

	function removeUserKey(socket)
	{		
		try
		{
			var username = socket.username;
			var key = socket.users[socket.username];
			console.log('Deleting inside removeUserKey() function...');
			users[socket.key].splice(users[socket.key].indexOf(username),1);
			delete screensharingusers[socket.key][username];
				if(users[socket.key].length === 0)
				{
					delete users[socket.key];
					rooms.splice(rooms.indexOf(username),1);
					delete screensharingusers[socket.key];
				}
			console.log('Now rooms array is '+util.inspect(rooms));
			console.log('Now users array is '+util.inspect(users));
			console.log('Now screensharingusers object is '+util.inspect(screensharingusers));
		}

		catch(err)
		{
			console.log('Thrown error is ->'+err);
		}
			

	}

//FUNCTIONS----end


server.listen(3006, () => console.log('Started!'));