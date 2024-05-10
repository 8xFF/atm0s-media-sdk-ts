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
const share_btn = document.getElementById("share")!;
const join_btn = document.getElementById("join")!;
const leave_btn = document.getElementById("leave")!;
const disconnect_btn = document.getElementById("disconnect")!;

async function connect(_e: any) {
  const session = new Session("http://localhost:3000", {
    token: "demo-token",
  });

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
  });

  let stream: MediaStream | undefined = undefined;
  disconnect_btn.onclick = () => {
    stream?.getTracks().map((t) => {
      t.stop();
    });
    video_preview.srcObject = null;
    audio_echo.srcObject = null;
    video_echo.srcObject = null;
    session.disconnect();
  };

  share_btn.onclick = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
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
  };

  join_btn.onclick = () => {
    session
      .join(
        {
          room: "demo",
          peer: "web-1",
          publish: { peer: true, tracks: true },
          subscribe: { peers: true, tracks: true },
        },
        "token",
      )
      .then(console.log)
      .catch(console.error);
  };

  leave_btn.onclick = () => {
    session.leave().then(console.log).catch(console.error);
  };
  await session.connect();
}

connect_btn.onclick = connect;
