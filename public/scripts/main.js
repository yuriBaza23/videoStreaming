const constraints = window.constraints = {
  audio: true,
  video: true
};

var localStream;

function handleSuccess(stream) {
  const video = document.querySelector('#local');
  const videoTracks = stream.getVideoTracks(); //Retorna trilhas de vídeo
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
  localStream = stream;
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
    document.querySelector('#closeVideo').disabled = false;
  } catch (e) {
    console.log(e)
  }
}

async function close(e) {
  try {
    const video = document.querySelector('#local');
    video.srcObject = null;
    localStream.getTracks()[0].stop();
    localStream.getTracks()[1].stop();
    e.target.disabled = true;
    document.querySelector('#showVideo').disabled = false;
  } catch (e) {
    console.log(e)
  }
}

document.querySelector('#closeVideo').disabled = true;
document.querySelector('#showVideo').addEventListener('click', e => init(e));
document.querySelector('#closeVideo').addEventListener('click', e => close(e));