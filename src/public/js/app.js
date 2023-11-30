const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    //console.log(devices);
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}
async function getMedia(deviceId) {
  try {
    const initialConstraints = {
      audio: true,
      video: { facingMode: "user" },
    };
    const cameraConstraints = {
      audio: true,
      video: { deviceId: { exact: deviceId } },
    };

    myStream = await navigator.mediaDevices.getUserMedia(
      /*{
      audio: true,
      video: true,
    }*/
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

async function handleCameraChange() {
  //console.log(cameraSelect.value);
  await getMedia(cameraSelect.value);
  if (myPeerConnection) {
    //console.log(myPeerConnection.getSenders());
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");

    videoSender.replaceTrack(videoTrack);
  }
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}
function handleMuteClick() {
  //console.log(myStream.getAudioTracks());
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (!muted) {
    muteBtn.innerHTML = "Unmute";
    muted = true;
  } else {
    muteBtn.innerHTML = "Mute";
    muted = false;
  }
}
// getMedia();

function handleCameraClick() {
  //console.log(myStream.getVideoTracks());
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerHTML = "Turn Camera On";
    cameraOff = true;
  } else {
    cameraBtn.innerHTML = "Turn Camera Off";
    cameraOff = false;
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
socket.on("welcome", async () => {
  //console.log("someone joined!");
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => {
    console.log(event);
  });
  console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  //  console.log(offer);
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    //console.log(event);
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => {
      console.log(event.data);
    });
  });
  console.log("reveived the offer");
  console.log(offer);
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", async (answer) => {
  console.log("reveived the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", async (ice) => {
  console.log("received ice candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track));
}
function handleAddStream(data) {
  //console.log("got a stream from peer");
  //console.log("Peer's Stream", data.stream);
  //console.log("my stream", myStream);
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}
function handleIce(data) {
  //console.log("got ice candidate");
  //console.log(data);
  console.log("sent ice candidate");
  socket.emit("ice", data.candidate, roomName);
}
