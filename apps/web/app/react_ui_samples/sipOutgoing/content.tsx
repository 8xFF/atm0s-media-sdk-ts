"use client";

import { AudioMixerMode } from "@atm0s-media-sdk/core";
import { Atm0sMediaProvider } from "@atm0s-media-sdk/react-hooks";
import { Atm0sMediaUIProvider, SipOutgoingCall } from "@atm0s-media-sdk/react-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "../../env";

export interface OutgoingCallPanelProps {
  room: string;
  peer: string;
  token: string;
  callTo: string,
  sipWs: string;
  onEnd?: () => void;
}

export default function PageContent({ room, peer, token, callTo, sipWs, onEnd }: OutgoingCallPanelProps) {
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
            features: {
              mixer: {
                mode: AudioMixerMode.AUTO,
                outputs: 3
              }
            }
          },
        }}
      >
        <Atm0sMediaUIProvider>
          <Inner callTo={callTo} sipWs={sipWs} onEnd={onEnd} />
        </Atm0sMediaUIProvider>
      </Atm0sMediaProvider>
    </main>
  );
}

function Inner({ sipWs, callTo, onEnd }: { sipWs: string, callTo: string, onEnd?: () => void }) {
  const [active, setActive] = useState(true);
  const hangUp = useCallback(() => {
    setActive(false);
    onEnd && onEnd();
  }, [onEnd])
  return <div>
    {active && <SipOutgoingCall callTo={callTo} sipWs={sipWs} onEnd={hangUp} />}
  </div>
}