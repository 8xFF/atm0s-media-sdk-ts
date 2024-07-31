"use client";

import { useEffect } from "react";
import {
  AudioMixerEvent,
  AudioMixerMode,
  AudioMixerOutputChanged,
  Kind,
  Session,
  SessionEvent,
} from "@atm0s-media-sdk/core";
import { env } from "../../env";
import { RemoteTrack } from "@atm0s-media-sdk/react-hooks";

interface Props {
  room: string;
  peer: string;
  token: string;
}

export default function AudioMixerManualContent({ room, peer, token }: Props) {
  useEffect(() => {
    const connect_btn = document.getElementById("connect")!;
    const disconnect_btn = document.getElementById("disconnect")!;
    const join_btn = document.getElementById("join")!;
    const leave_btn = document.getElementById("leave")!;
    const mute_btn = document.getElementById("mute")!;
    const unmute_btn = document.getElementById("unmute")!;
    const mixer_outputs = [
      document.getElementById("mixer-output-1")!,
      document.getElementById("mixer-output-2")!,
      document.getElementById("mixer-output-3")!,
    ];

    const audio_mixer1 = document.getElementById(
      "audio-mixer-1",
    )! as HTMLAudioElement;
    const audio_mixer2 = document.getElementById(
      "audio-mixer-2",
    )! as HTMLAudioElement;
    const audio_mixer3 = document.getElementById(
      "audio-mixer-3",
    )! as HTMLAudioElement;

    async function connect(_e: any) {
      const session = new Session(env.GATEWAY_ENDPOINTS[0]!, {
        token,
        join: {
          room,
          peer,
          publish: { peer: false, tracks: true },
          subscribe: { peers: false, tracks: true },
          features: {
            mixer: {
              mode: AudioMixerMode.MANUAL,
              outputs: 3,
            },
          },
        },
      });

      const mixer_streams = session.mixer!.streams();
      audio_mixer1!.srcObject = mixer_streams[0]!;
      audio_mixer2!.srcObject = mixer_streams[1]!;
      audio_mixer3!.srcObject = mixer_streams[2]!;

      session.mixer!.on(
        AudioMixerEvent.OUTPUT_CHANGED,
        (output: AudioMixerOutputChanged) => {
          for (let i = 0; i < mixer_outputs.length; i++) {
            mixer_outputs[i]!.textContent = output[i]?.source
              ? output[i]!.source!.peer + "/" + output[i]!.source!.track
              : "N/A";
          }
        },
      );

      session.on(SessionEvent.ROOM_TRACK_STARTED, (track: RemoteTrack) => {
        if (track.kind == Kind.AUDIO) {
          session.mixer!.attach([track]);
        }
      });
      session.on(SessionEvent.ROOM_TRACK_STOPPED, (track: RemoteTrack) => {
        if (track.kind == Kind.AUDIO) {
          session.mixer!.detach([track]);
        }
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      let audio_send_track = session.sender(
        "audio_main",
        stream.getAudioTracks()[0]!,
      );

      mute_btn.onclick = () => {
        audio_send_track.detach();
      };

      unmute_btn.onclick = () => {
        audio_send_track.attach(stream.getAudioTracks()[0]!);
      };

      join_btn.onclick = () => {
        session
          .join(
            {
              room,
              peer,
              publish: { peer: false, tracks: true },
              subscribe: { peers: false, tracks: false },
              features: {
                mixer: {
                  mode: AudioMixerMode.AUTO,
                  outputs: 3,
                },
              },
            },
            token,
          )
          .then(console.log)
          .catch(console.error);
      };

      leave_btn.onclick = () => {
        session.leave().then(console.log).catch(console.error);
      };

      disconnect_btn.onclick = () => {
        stream.getTracks().map((t) => {
          t.stop();
        });
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
          This is audio_mixer sample, you can open multiple tabs for testing.
          Server will select only 3 max audio level to send to client, no master
          what how many users.
        </div>
        <div className="flex flex-col w-full lg:flex-row justify-center space-x-2">
          <div className="border-1">
            Selected: <span id="mixer-output-1"></span>
            <audio autoPlay controls id="audio-mixer-1" />
          </div>
          <div className="border-1">
            Selected: <span id="mixer-output-2"></span>
            <audio autoPlay controls id="audio-mixer-2" />
          </div>
          <div className="border-1">
            Selected: <span id="mixer-output-3"></span>
            <audio autoPlay controls id="audio-mixer-3" />
          </div>
        </div>
        {/* This is for control buttons */}
        <div className="flex flex-row justify-center p-4 space-x-2 w-full">
          <button id="connect" className="btn btn-success">
            Connect
          </button>
          <button id="mute" className="btn">
            Mute
          </button>
          <button id="unmute" className="btn">
            Unmute
          </button>
          <button id="join" className="btn">
            Join room
          </button>
          <button id="leave" className="btn">
            Leave room
          </button>
          <button id="disconnect" className="btn btn-warning">
            Disconnect
          </button>
        </div>
      </div>
    </main>
  );
}
