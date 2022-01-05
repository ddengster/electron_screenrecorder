
const { desktopCapturer } = require('electron')
const remote = require('@electron/remote')
const { dialog, Menu } = remote;


const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};


const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSource;

async function getVideoSource() {
    var inputSources = await desktopCapturer.getSources({
        types:['window', 'screen']
    });

    console.log(inputSources);
    const videoOptionsMenu = Menu.buildFromTemplate(
      inputSources.map(source => {
       return {
         label: source.name,
        click: () => selectSource(source)
        }
      })
    );
    
    videoOptionsMenu.popup();
}

let mediaRecorder; //mediarecorder instance to capture footage
const recordedChunks = [];

async function selectSource(source) {
  videoSelectBtn.innerHTML = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject =stream;
  videoElement.play();

  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log("data arrived {}", typeof(e));
  recordedChunks.push(e.data);
}

const { writeFile } = require('fs');

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog(
    {
      buttonLabel: 'Save video',
      defaultPath: `vid-${Date.now()}.webm`
    }
  );
  console.log(filePath);

  writeFile(filePath, buffer, () => console.log('video saved successfully'))
}
