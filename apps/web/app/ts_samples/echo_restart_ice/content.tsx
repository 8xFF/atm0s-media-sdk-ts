"use client";

import { useEffect } from "react";
import {
  BitrateControlMode,
  Kind,
  RoomPeerJoined,
  RoomPeerLeaved,
  RoomTrackStarted,
  RoomTrackStopped,
  Session,
  SessionEvent,
} from "@atm0s-media-sdk/sdk-core/lib";
import { SelectedGateway } from "../../components/GatewaySelector";

interface Props {
  room: string;
  peer: string;
  token: string;
}

export default function PageContent({ room, peer, token }: Props) {
  useEffect(() => {
    const video_preview = document.getElementById(
      "video-preview",
    )! as HTMLVideoElement;
    const audio_echo = document.getElementById(
      "audio-echo",
    )! as HTMLAudioElement;
    const video_echo = document.getElementById(
      "video-echo",
    )! as HTMLVideoElement;
    const connect_btn = document.getElementById("connect")!;
    const restart_ice_btn = document.getElementById("restart-ice")!;
    const disconnect_btn = document.getElementById("disconnect")!;

    async function connect(_e: any) {
      const session = new Session(SelectedGateway.url, {
        token,
        join: {
          room,
          peer,
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
        stream.getAudioTracks()[0]!,
      );
      let video_send_track = session.sender(
        "video_main",
        stream.getVideoTracks()[0]!,
        { priority: 100, bitrate: BitrateControlMode.DYNAMIC_CONSUMERS },
      );
      console.log(audio_send_track, video_send_track);
      let audio_recv_track = session.receiver(Kind.AUDIO);
      let video_recv_track = session.receiver(Kind.VIDEO);
      audio_echo.srcObject = audio_recv_track.stream;
      video_echo.srcObject = video_recv_track.stream;

      (window as any).video_recv_track = video_recv_track;

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

      restart_ice_btn.onclick = () => {
        session.restartIce().then(console.log).catch(console.error);
      };

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
  }, []);

  return (
    <main>
      <div className="p-6">
        <div className="p-4 w-full text-center">
          This is echo sample, click connect then you will see left video is
          from local, right video is echo from server.
        </div>
        {/* This is for video */}
        <div className="flex flex-col w-full lg:flex-row">
          <div className="grid p-4 flex-grow card bg-base-300 rounded-box place-items-center">
            <video
              muted
              autoPlay
              width={500}
              height={500}
              style={{ backgroundColor: "gray" }}
              id="video-preview"
            />
          </div>
          <div className="divider lg:divider-horizontal">=&gt;</div>
          <div className="grid p-4 flex-grow card bg-base-300 rounded-box place-items-center">
            <audio autoPlay id="audio-echo" />
            <video
              muted
              autoPlay
              width={500}
              height={500}
              style={{ backgroundColor: "gray" }}
              id="video-echo"
            />
          </div>
        </div>
        {/* This is for control buttons */}
        <div className="flex flex-row justify-center p-4 space-x-2 w-full">
          <button id="connect" className="btn btn-success">
            Connect
          </button>
          <button id="restart-ice" className="btn">
            Restart Ice
          </button>
          <button id="disconnect" className="btn btn-warning">
            Disconnect
          </button>
        </div>
      </div>
    </main>
  );
}
