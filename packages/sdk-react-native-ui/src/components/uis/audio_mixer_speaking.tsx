import { useMixerPeerVoiceActivity } from "@atm0s-media-sdk/react-hooks";
import { useState, useEffect, ReactNode } from "react";

interface Props {
  peer: string;
  children: ReactNode;
}

export function AudioMixerSpeaking({ peer, children }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const voiceActivity = useMixerPeerVoiceActivity(peer);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (voiceActivity?.active) {
      setSpeaking(true);
      timeout = setTimeout(() => {
        setSpeaking(false);
      }, 1000);
    } else {
      setSpeaking(false);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [setSpeaking, voiceActivity]);

  return speaking ? children : <></>;
}
