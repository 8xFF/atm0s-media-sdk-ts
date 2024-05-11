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
const max_spatial = document.getElementById(
  "max-spatial",
)! as HTMLSelectElement;
const max_temporal = document.getElementById(
  "max-temporal",
)! as HTMLSelectElement;
const connect_btn = document.getElementById("connect")!;
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

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  video_preview.srcObject = stream;
  let audio_send_track = await session.sender(
    "audio_main",
    stream.getAudioTracks()[0],
    { priority: 100 },
  );
  let video_send_track = await session.sender(
    "video_main",
    stream.getVideoTracks()[0],
    { priority: 100, simulcast: true },
  );
  console.log(audio_send_track, video_send_track);
  let audio_recv_track = session.receiver("audio");
  let video_recv_track = session.receiver("video");
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
      video_recv_track
        .attach(track, {
          priority: 100,
          maxSpatial: 0,
          maxTemporal: 0,
        })
        .then(console.log)
        .catch(console.error);
    }
  });

  session.on(SessionEvent.ROOM_TRACK_STOPPED, (track: RoomTrackStopped) => {
    console.log("Track stopped", track);
  });

  let change_quality = () => {
    let spatial = parseInt(
      max_spatial.options[max_spatial.selectedIndex].value || "2",
    );
    let temporal = parseInt(
      max_temporal.options[max_temporal.selectedIndex].value || "2",
    );

    video_recv_track
      .config({
        priority: 100,
        maxSpatial: spatial,
        maxTemporal: temporal,
      })
      .then(console.log)
      .catch(console.error);
  };

  max_spatial.onchange = change_quality;
  max_temporal.onchange = change_quality;

  disconnect_btn.onclick = () => {
    stream.getTracks().map((t) => {
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
