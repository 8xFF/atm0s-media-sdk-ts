"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useConsumer,
  usePublisher,
  useRemoteVideoTracks,
  useSession,
  RemoteTrack,
  useConsumerStatus,
  Atm0sMediaProvider,
  useDataChannel,
} from "@atm0s-media-sdk/react-hooks/lib";

import { Kind } from "@atm0s-media-sdk/core/lib";
import { env } from "../../env";
import { VirtualDataChannelEvent } from "../../../../../packages/sdk-core/src/features/datachannel";

function EchoViewer({ track }: { track: RemoteTrack }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const consumer = useConsumer(track);
  const consumerStatus = useConsumerStatus(consumer);
  useEffect(() => {
    videoRef.current!.srcObject = consumer.stream;
  }, [videoRef.current, consumer]);
  useEffect(() => {
    consumer.attach({
      priority: 1,
      maxSpatial: 2,
      maxTemporal: 2,
    });
    return () => {
      consumer.detach();
    };
  }, [track]);

  return (
    <div>
      {track.peer}/{track.track} - {consumerStatus}
      <video
        muted
        autoPlay
        width={500}
        height={500}
        ref={videoRef}
        style={{ backgroundColor: "gray" }}
        id="video-echo"
      />
    </div>
  );
}

interface Message {
  peer: string;
  message: string;
}

function EchoContent(): JSX.Element {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const session = useSession();
  const audio_sender = usePublisher("audio_main", Kind.AUDIO);
  const video_sender = usePublisher("video_main", Kind.VIDEO);
  const [chats, setChats] = useState<Message[]>([]);
  const [view, setView] = useState(true);

  const video_tracks = useRemoteVideoTracks();
  const datachannel = useDataChannel("test", (e: VirtualDataChannelEvent) => {
    setChats((chats) => [
      ...chats,
      { peer: e.peer, message: e.message as string },
    ]);
  });

  const connect = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    previewVideoRef.current!.srcObject = stream;
    await audio_sender.attach(stream.getAudioTracks()[0]!);
    await video_sender.attach(stream.getVideoTracks()[0]!);
    await session.connect();
  }, [session, previewVideoRef.current]);

  const disconnect = useCallback(() => {
    (previewVideoRef.current!.srcObject as MediaStream)
      .getTracks()
      .map((t) => t.stop());
    previewVideoRef.current!.srcObject = null;
    session.disconnect();
  }, [session]);

  const chatInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6">
      <div className="p-4 w-full text-center">
        This is echo sample, click connect then you will see left video is from
        local, right video is echo from server.
      </div>
      {/* This is for video */}
      <div className="flex flex-col w-full lg:flex-row">
        <div className="grid p-4 flex-grow card bg-base-300 rounded-box place-items-center">
          <video
            muted
            autoPlay
            ref={previewVideoRef}
            width={500}
            height={500}
            style={{ backgroundColor: "gray" }}
            id="video-preview"
          />
        </div>
        <div className="divider lg:divider-horizontal">=&gt;</div>
        <div className="grid p-4 flex-grow card bg-base-300 rounded-box place-items-center">
          <audio autoPlay id="audio-echo" />
          {view &&
            video_tracks.map((t) => <EchoViewer key={t.peer} track={t} />)}
        </div>
      </div>
      {/* This is for control buttons */}
      <div className="flex flex-row justify-center p-4 space-x-2 w-full">
        <button id="connect" onClick={connect} className="btn btn-success">
          Connect
        </button>
        <button id="view" onClick={() => setView(true)} className="btn">
          View
        </button>
        <button id="unview" onClick={() => setView(false)} className="btn">
          Unview
        </button>
        <button
          id="disconnect"
          onClick={disconnect}
          className="btn btn-warning"
        >
          Disconnect
        </button>
      </div>

      <div className="flex flex-col w-[400px] h-[500px] p-3 border rounded mx-auto">
        <div id="chat-container" className="flex-1 w-full bg-base-300 p-2">
          <div className="text-xs">
            <i>Chat echo through virtual datachannel, connect to start.</i>
          </div>

          {chats.map((c, i) => (
            <div key={i}>
              <b>{c.peer}:</b> {c.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="chat-input"
            className="flex-1 p-2 rounded"
            ref={chatInputRef}
          />
          <button
            id="send"
            className="btn"
            onClick={() => {
              if (chatInputRef.current?.value) {
                datachannel?.publish(chatInputRef.current.value);
                chatInputRef.current.value = "";
              }
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  room: string;
  peer: string;
  token: string;
}

export default function PageContent({ room, peer, token }: Props) {
  return (
    <main>
      <Atm0sMediaProvider
        gateway={env.GATEWAY_ENDPOINTS[0]!}
        cfg={{
          token,
          join: {
            room,
            peer,
            publish: { peer: true, tracks: true },
            subscribe: { peers: true, tracks: true },
          },
        }}
        prepareAudioReceivers={1}
        prepareVideoReceivers={1}
      >
        <EchoContent />
      </Atm0sMediaProvider>
    </main>
  );
}
