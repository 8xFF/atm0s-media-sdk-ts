"use client";

import { useEffect } from "react";
import {
  BitrateControlMode,
  Kind,
  MessageChannelEvent,
  RoomPeerJoined,
  RoomPeerLeaved,
  RoomTrackStarted,
  RoomTrackStopped,
  Session,
  SessionEvent,
} from "@atm0s-media-sdk/core/lib";
import { env } from "../../env";

interface Props {
  room: string;
  peer: string;
  token: string;
}

export default function EchoFast({ room, peer, token }: Props) {
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
    const disconnect_btn = document.getElementById("disconnect")!;
    const view_btn = document.getElementById("view")!;
    const unview_btn = document.getElementById("unview")!;
    const send_btn = document.getElementById("send")!;
    const chat_input = document.getElementById(
      "chat-input",
    )! as HTMLInputElement;
    const chat_container = document.getElementById("chat-container")!;

    async function connect(_e: any) {
      const session = new Session(env.GATEWAY_ENDPOINTS[0]!, {
        token,
        join: {
          room,
          peer,
          metadata: "Echo peer",
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
          metadata: "Video stream metadata",
        },
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

      let remote_audio_track: RoomTrackStarted | undefined = undefined;
      let remote_video_track: RoomTrackStarted | undefined = undefined;

      session.on(SessionEvent.ROOM_TRACK_STARTED, (track: RoomTrackStarted) => {
        console.log("Track started", track);
        if (track.track == "audio_main") {
          remote_audio_track = track;
          audio_recv_track.attach(track).then(console.log).catch(console.error);
        } else {
          remote_video_track = track;
          video_recv_track.attach(track).then(console.log).catch(console.error);
        }
      });

      session.on(SessionEvent.ROOM_TRACK_STOPPED, (track: RoomTrackStopped) => {
        console.log("Track stopped", track);
      });

      view_btn.onclick = () => {
        if (remote_audio_track)
          audio_recv_track
            .attach(remote_audio_track)
            .then(console.log)
            .catch(console.error);
        if (remote_video_track)
          video_recv_track
            .attach(remote_video_track)
            .then(console.log)
            .catch(console.error);
      };

      unview_btn.onclick = () => {
        audio_recv_track.detach().then(console.log).catch(console.error);
        video_recv_track.detach().then(console.log).catch(console.error);
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
      const datachannel = await session.createMessageChannel("testing");
      send_btn.onclick = () => {
        const value = chat_input.value;
        chat_input.value = "";

        datachannel.publish(value);
      };

      datachannel.on("message", (e: MessageChannelEvent) => {
        const chatMessageEl = document.createElement("div");
        const bold = document.createElement("b");
        bold.innerText = e.peer + ": ";
        const text = document.createTextNode(e.message as string);
        chatMessageEl.appendChild(bold);
        chatMessageEl.appendChild(text);
        chat_container.appendChild(chatMessageEl);
      });
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
          <button id="view" className="btn">
            View
          </button>
          <button id="unview" className="btn">
            Unview
          </button>
          <button id="disconnect" className="btn btn-warning">
            Disconnect
          </button>
        </div>

        <div className="flex flex-col w-[400px] h-[500px] p-3 border rounded mx-auto">
          <div id="chat-container" className="flex-1 w-full bg-base-300 p-2">
            <div className="text-xs">
              <i>Chat echo through virtual datachannel, connect to start.</i>
            </div>
          </div>
          <div className="flex gap-2">
            <input id="chat-input" className="flex-1 p-2 rounded" />
            <button id="send" className="btn">
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
