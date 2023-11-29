const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementsById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

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
      if(currentCamera.label == camera.label){
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
      video: {facingMode: "user"}
    }
    const cameraConstraints = {
      audio: true, 
      video: {deviceId: {exact: deviceId}}
    };
    
    myStream = await navigator.mediaDevices.getUserMedia(/*{
      audio: true,
      video: true,
    }*/
    deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if(!deviceId){
      await getCameras();

    }
  } catch (e) {
    console.log(e);
  }
}

function handleCameraChange() {
  //console.log(cameraSelect.value);
  await getMedia(cameraSelect.value)
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
