import { useMixerPeerVoiceActivity } from "@atm0s-media-sdk/react-hooks/lib";
import { useState, useEffect, ReactNode } from "react";

interface Props {
  peer: string;
  children: ReactNode;
}

export function AudioMixerSpeaking({ peer, children }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const voiceActivity = useMixerPeerVoiceActivity(peer);
  useEffect(() => {
    if (voiceActivity?.active) {
      setSpeaking(true);
      const timeout = setTimeout(() => {
        setSpeaking(false);
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    } else {
      setSpeaking(false);
    }
  }, [setSpeaking, voiceActivity]);

  return speaking ? children : <></>;
}
