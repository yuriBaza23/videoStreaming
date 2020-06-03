const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

navigator.getUserMedia(
  { video: true, audio: true },
  stream => {
    const localVideo = document.getElementById("local_video");
    if (localVideo) {
      localVideo.srcObject = stream;
    }
  },
  error => {
    console.warn(error.message);
  }
);

var socket = io();

socket.on('connectToRoom', data => {
  const room = document.getElementById('room');
  room.innerHTML = data;
})

socket.on('userSocketId', data => {
  const user = document.getElementById('user');
  user.innerHTML = data;
})

peerConnection.ontrack = function({ streams: [stream] }) {
  const remoteVideo = document.getElementById("remote_video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};