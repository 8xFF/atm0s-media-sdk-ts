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
const video_receivers = document.getElementById("receivers")!;
const connect_btn = document.getElementById("connect")!;
const disconnect_btn = document.getElementById("disconnect")!;
const add_receiver_btn = document.getElementById("add_receiver")!;

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
  let audio_send_track = session.sender(
    "audio_main",
    stream.getAudioTracks()[0],
    100,
  );
  let video_send_track = session.sender(
    "video_main",
    stream.getVideoTracks()[0],
    100,
  );
  console.log(audio_send_track, video_send_track);

  session.on(SessionEvent.ROOM_PEER_JOINED, (peer: RoomPeerJoined) => {
    console.log("Peer joined", peer);
  });

  session.on(SessionEvent.ROOM_PEER_LEAVED, (peer: RoomPeerLeaved) => {
    console.log("Peer leaved", peer);
  });

  let remote_audio_track: RoomTrackStarted | undefined = undefined;
  let remote_video_track: RoomTrackStarted | undefined = undefined;

  session.on(SessionEvent.ROOM_TRACK_STARTED, (track: RoomTrackStarted) => {
    console.log("Track started", track);
    if (track.track == "audio_main") {
      remote_audio_track = track;
    } else {
      remote_video_track = track;
    }
  });

  session.on(SessionEvent.ROOM_TRACK_STOPPED, (track: RoomTrackStopped) => {
    console.log("Track stopped", track);
  });

  add_receiver_btn.onclick = async () => {
    if (!remote_audio_track || !remote_video_track) {
      return;
    }

    console.log("add video element");
    const video = document.createElement("video");
    video.width = 500;
    video.height = 500;
    video.autoplay = true;
    video.muted = true;
    video.setAttribute("style", "background-color: gray;");
    video_receivers.appendChild(video);

    const video_receiver = session.receiver("video", 100);
    video.srcObject = video_receiver.stream;
    await video_receiver.attach(remote_video_track);
  };

  disconnect_btn.onclick = () => {
    stream.getTracks().map((t) => {
      t.stop();
    });
    video_preview.srcObject = null;
    video_receivers.innerHTML = "";
    session.disconnect();
  };
  await session.connect();
}

connect_btn.onclick = connect;
