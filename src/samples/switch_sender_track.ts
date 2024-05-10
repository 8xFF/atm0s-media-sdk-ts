import {
  RoomPeerJoined,
  RoomPeerLeaved,
  RoomTrackStarted,
  RoomTrackStopped,
  Session,
  SessionEvent,
} from "../../lib/main";

const video_preview = document.getElementById(
  "video-preview",
)! as HTMLVideoElement;
const audio_echo = document.getElementById("audio-echo")! as HTMLAudioElement;
const video_echo = document.getElementById("video-echo")! as HTMLVideoElement;
const connect_btn = document.getElementById("connect")!;
const sources = document.getElementById("sources")! as HTMLSelectElement;
const disconnect_btn = document.getElementById("disconnect")!;

async function connect(_e: any) {
  const session = new Session("http://localhost:3000", {
    token: "demo-token",
    join: {
      room: "demo",
      peer: "web-1",
      publish: { peer: true, tracks: true },
      subscribe: { peers: true, tracks: true },
    },
  });

  const audio_stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const devices = await navigator.mediaDevices.enumerateDevices();
  sources.innerHTML = "";
  const noneSelect = document.createElement("option");
  noneSelect.value = "";
  noneSelect.textContent = "None";
  sources.appendChild(noneSelect);

  devices.map((d) => {
    if (d.kind === "videoinput") {
      const noneSelect = document.createElement("option");
      noneSelect.value = d.deviceId;
      noneSelect.textContent = d.label;
      sources.appendChild(noneSelect);
      sources.appendChild(noneSelect);
    }
  });

  video_preview.srcObject = audio_stream;
  let audio_send_track = session.sender(
    "audio_main",
    audio_stream.getAudioTracks()[0],
    100,
  );
  let video_send_track = session.sender("video_main", "video", 100);
  console.log(audio_send_track, video_send_track);
  let audio_recv_track = session.receiver("audio", 100);
  let video_recv_track = session.receiver("video", 100);
  audio_echo.srcObject = audio_recv_track.stream;
  video_echo.srcObject = video_recv_track.stream;

  session.on(SessionEvent.ROOM_PEER_JOINED, (peer: RoomPeerJoined) => {
    console.log("Peer joined", peer);
  });

  session.on(SessionEvent.ROOM_PEER_LEAVED, (peer: RoomPeerLeaved) => {
    console.log("Peer leaved", peer);
  });

  session.on(SessionEvent.ROOM_TRACK_STARTED, (track: RoomTrackStarted) => {
    console.log("Track started", track);
    if (track.track == "audio_main") {
      audio_recv_track.attach(track).then(console.log).catch(console.error);
    } else {
      video_recv_track.attach(track).then(console.log).catch(console.error);
    }
  });

  session.on(SessionEvent.ROOM_TRACK_STOPPED, (track: RoomTrackStopped) => {
    console.log("Track stopped", track);
    if (track.track == "audio_main") {
      audio_recv_track.detach().then(console.log).catch(console.error);
    } else {
      video_recv_track.detach().then(console.log).catch(console.error);
    }
  });

  let video_stream: MediaStream | undefined = undefined;
  sources.onchange = async () => {
    const selected = sources.options[sources.selectedIndex];
    console.log("Changed video to", selected.value, selected.textContent);
    if (!!video_stream) {
      await video_send_track.detach().then(console.log).catch(console.error);
      video_stream.getTracks().map((t) => {
        t.stop();
      });
      video_stream = undefined;
    }
    if (!selected.value) {
      return;
    }
    video_stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selected.value,
      },
    });
    video_preview.srcObject = video_stream;
    await video_send_track
      .attach(video_stream.getVideoTracks()[0])
      .then(console.log)
      .catch(console.error);
  };

  disconnect_btn.onclick = () => {
    audio_stream.getTracks().map((t) => {
      t.stop();
    });
    video_stream?.getTracks().map((t) => {
      t.stop();
    });
    video_preview.srcObject = null;
    audio_echo.srcObject = null;
    video_echo.srcObject = null;
    session.disconnect();
  };
  await session.connect();
}

connect_btn.onclick = connect;
