import {
  RoomTrackStarted,
  RoomTrackStopped,
  Session,
  SessionEvent,
} from "../lib/main";

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
  let audio_recv_track = session.receiver("audio", 100);
  let video_recv_track = session.receiver("video", 100);
  (document.getElementById("audio-main")! as HTMLVideoElement).srcObject =
    audio_recv_track.stream;
  (document.getElementById("video-main")! as HTMLVideoElement).srcObject =
    video_recv_track.stream;

  session.on(SessionEvent.ROOM_TRACK_STARTED, (track: RoomTrackStarted) => {
    console.log("Track started", track);
    if (track.track == "audio_main") {
      audio_recv_track.switch(track);
    } else {
      video_recv_track.switch(track);
    }
  });

  session.on(SessionEvent.ROOM_TRACK_STOPPED, (track: RoomTrackStopped) => {
    console.log("Track stopped", track);
  });
  await session.connect();
}

document.getElementById("connect")!.onclick = connect;
