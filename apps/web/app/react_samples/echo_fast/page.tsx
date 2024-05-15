"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";
const Atm0sMediaProvider = dynamic(
  () =>
    import("@atm0s-media-sdk/sdk-react-hooks/lib").then(
      (mod) => mod.Atm0sMediaProvider,
    ),
  {
    ssr: false,
  },
);

import {
  useConsumer,
  usePublisher,
  useRemoteAudioTracks,
  useRemoteVideoTracks,
  useSession,
  RemoteTrack,
} from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { Kind } from "@atm0s-media-sdk/sdk-core/lib";
import { SelectedGateway } from "../../components/GatewaySelector";

function EchoViewer({ track }: { track: RemoteTrack }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const consumer = useConsumer(track);
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
      {track.peer}/{track.track}
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

function EchoContent(): JSX.Element {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const session = useSession();
  const audio_sender = usePublisher("audio_main", Kind.AUDIO);
  const video_sender = usePublisher("video_main", Kind.VIDEO);
  const [view, setView] = useState(true);

  const audio_tracks = useRemoteAudioTracks();
  const video_tracks = useRemoteVideoTracks();

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
    </div>
  );
}

export default function EchoFast(): JSX.Element {
  return (
    <main>
      <Atm0sMediaProvider
        gateway={SelectedGateway.url}
        cfg={{
          token: "demo",
          join: {
            room: "room1",
            peer: "peer1",
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
