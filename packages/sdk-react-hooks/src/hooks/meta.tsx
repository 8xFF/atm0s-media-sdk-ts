import { Kind } from "@atm0s-media-sdk/sdk-core/lib";
import { useContext, useEffect, useState } from "react";
import { Atm0sMediaContext } from "../provider";
import { ContextEvent } from "../context";

export interface RemotePeer {
  peer: string;
}

export interface RemoteTrack {
  peer: string;
  track: string;
  kind: Kind;
}

export function useRemotePeers(): RemotePeer[] {
  const ctx = useContext(Atm0sMediaContext);
  const [peers, setPeers] = useState(() => Array.from(ctx.peers.values()));
  useEffect(() => {
    const handler = () => {
      let peers = Array.from(ctx.peers.values());
      setPeers(peers);
    };
    ctx.on(ContextEvent.PeersUpdated, handler);
    return () => {
      ctx.off(ContextEvent.PeersUpdated, handler);
    };
  }, [ctx]);
  return peers;
}

export function useRemoteTracks(peer?: string, kind?: Kind): RemoteTrack[] {
  const ctx = useContext(Atm0sMediaContext);
  const [tracks, setTracks] = useState(() =>
    Array.from(ctx.tracks.values()).filter(
      (t) => (!peer || t.peer == peer) && (kind == undefined || t.kind == kind),
    ),
  );
  useEffect(() => {
    console.log("new", peer, kind, tracks, tracks);
    const handler = () => {
      let tracks = Array.from(ctx.tracks.values()).filter(
        (t) =>
          (!peer || t.peer == peer) && (kind == undefined || t.kind == kind),
      );
      console.log("update", peer, kind, tracks);
      setTracks(tracks);
    };
    ctx.on(
      peer ? ContextEvent.PeerTracksUpdated + peer : ContextEvent.TracksUpdated,
      handler,
    );
    return () => {
      ctx.off(
        peer
          ? ContextEvent.PeerTracksUpdated + peer
          : ContextEvent.TracksUpdated,
        handler,
      );
    };
  }, [ctx, peer]);
  return tracks;
}
export function useRemoteAudioTracks(peer?: string): RemoteTrack[] {
  return useRemoteTracks(peer, Kind.AUDIO);
}
export function useRemoteVideoTracks(peer?: string): RemoteTrack[] {
  return useRemoteTracks(peer, Kind.VIDEO);
}
