import { Kind } from "@atm0s-media-sdk/core";
import { useContext, useEffect, useState } from "react";
import { Atm0sMediaContext } from "../provider";
import { ContextEvent } from "../context";
import { useRoom } from "./session";

export interface RemotePeer {
  peer: string;
}

export interface RemoteTrack {
  peer: string;
  track: string;
  kind: Kind;
}

export function usePeers(): RemotePeer[] {
  const ctx = useContext(Atm0sMediaContext);
  const [peers, setPeers] = useState(() => Array.from(ctx.peers.values()));
  useEffect(() => {
    const handler = () => {
      let peers = Array.from(ctx.peers.values());
      setPeers(peers);
    };
    // because useEffect have some delay after useState, we need to update now
    // TODO: avoid call twice if data not changed
    handler();
    ctx.on(ContextEvent.PeersUpdated, handler);
    return () => {
      ctx.off(ContextEvent.PeersUpdated, handler);
    };
  }, [ctx]);
  return peers;
}

export function useTracks(peer?: string, kind?: Kind): RemoteTrack[] {
  const ctx = useContext(Atm0sMediaContext);
  const [tracks, setTracks] = useState(() =>
    Array.from(ctx.tracks.values()).filter(
      (t) => (!peer || t.peer == peer) && (kind == undefined || t.kind == kind),
    ),
  );
  useEffect(() => {
    const handler = () => {
      let tracks = Array.from(ctx.tracks.values()).filter(
        (t) =>
          (!peer || t.peer == peer) && (kind == undefined || t.kind == kind),
      );
      setTracks(tracks);
    };
    // because useEffect have some delay after useState, we need to update now
    // TODO: avoid call twice if data not changed
    handler();
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
export function useAudioTracks(peer?: string): RemoteTrack[] {
  return useTracks(peer, Kind.AUDIO);
}
export function useVideoTracks(peer?: string): RemoteTrack[] {
  return useTracks(peer, Kind.VIDEO);
}

export function useLocalPeer() {
  const room = useRoom();
  return usePeers().filter((p) => p.peer === room?.peer);
}
export function useLocalTracks(kind?: Kind): RemoteTrack[] {
  const room = useRoom();
  return useTracks(room?.peer, kind).filter((t) => t.peer === room?.peer);
}
export function useLocalAudioTracks(): RemoteTrack[] {
  return useLocalTracks(Kind.AUDIO);
}
export function useLocalVideoTracks(): RemoteTrack[] {
  return useLocalTracks(Kind.VIDEO);
}

export function useRemotePeers(): RemotePeer[] {
  const room = useRoom();
  return usePeers().filter((p) => p.peer !== room?.peer);
}
export function useRemoteTracks(peer?: string, kind?: Kind): RemoteTrack[] {
  const room = useRoom();
  return useTracks(peer, kind).filter((t) => t.peer !== room?.peer);
}
export function useRemoteAudioTracks(peer?: string): RemoteTrack[] {
  return useRemoteTracks(peer, Kind.AUDIO)
}
export function useRemoteVideoTracks(peer?: string): RemoteTrack[] {
  return useRemoteTracks(peer, Kind.VIDEO);
}
