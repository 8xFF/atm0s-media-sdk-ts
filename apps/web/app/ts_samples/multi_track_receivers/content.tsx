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
    const video_receivers = document.getElementById("receivers")!;
    const connect_btn = document.getElementById("connect")!;
    const disconnect_btn = document.getElementById("disconnect")!;
    const add_receiver_btn = document.getElementById("add_receiver")!;

    async function connect() {
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
        {
          priority: 100,
          bitrate: BitrateControlMode.DYNAMIC_CONSUMERS,
          simulcast: true,
        },
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

        const video_receiver = session.receiver(Kind.VIDEO);
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
  }, []);

  return (
    <main>
      <div className="p-4 w-full text-center">
        This is echo sample, click connect then you will see left video is from
        local, right video is echo from server.
      </div>
      {/* This is for source video */}
      <div className="grid p-4 card bg-base-300 rounded-box place-items-center">
        <video
          muted
          autoPlay
          width={500}
          height={500}
          style={{ backgroundColor: "gray" }}
          id="video-preview"
        />
      </div>
      {/* This is for control buttons */}
      <div className="flex flex-row justify-center p-4 space-x-2 w-full">
        <button id="connect" className="btn btn-success">
          Connect
        </button>
        <button id="add_receiver" className="btn btn-info">
          Add receiver
        </button>
        <button id="disconnect" className="btn btn-warning">
          Disconnect
        </button>
      </div>
      {/* This is for receivers */}
      <div className="grid p-4 grid-cols-3 gap-4" id="receivers" />
    </main>
  );
}
