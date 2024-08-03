import { useContext, useState, useMemo, useEffect } from "react";
import { Atm0sMediaContext } from "../provider";
import {
  AudioMixerEvent,
  AudioMixerPeerVoiceActivity,
} from "@atm0s-media-sdk/core";
export type { AudioMixer } from "@atm0s-media-sdk/core";

export function useMixer() {
  const ctx = useContext(Atm0sMediaContext);
  return useMemo(() => {
    return ctx.session.mixer;
  }, [ctx]);
}

export function useMixerPeerVoiceActivity(peer: string) {
  const ctx = useContext(Atm0sMediaContext);
  let [status, setStatus] = useState<AudioMixerPeerVoiceActivity | undefined>(
    undefined,
  );
  useEffect(() => {
    const handler = (status: AudioMixerPeerVoiceActivity | undefined) => {
      setStatus(status);
    };
    ctx.session.mixer?.on(AudioMixerEvent.PEER_VOICE_ACTIVITY + peer, handler);
    return () => {
      ctx.session.mixer?.off(
        AudioMixerEvent.PEER_VOICE_ACTIVITY + peer,
        handler,
      );
    };
  }, [ctx]);
  return status;
}
