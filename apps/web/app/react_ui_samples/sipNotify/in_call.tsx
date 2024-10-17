"use client";

import { Atm0sMediaProvider } from "@atm0s-media-sdk/react-hooks";
import { Atm0sMediaUIProvider, SipIncomingCallWidget } from "@atm0s-media-sdk/react-ui";
import { useCallback, useState } from "react";
import { env } from "../../env";
import { AudioMixerMode } from "@atm0s-media-sdk/core";

export interface IncomingCallPanelProps {
  callFrom: string,
  callWs: string,
  room: string;
  peer: string,
  token: string,
  record: boolean,
  onEnd?: () => void;
}

export default function IncomingCallPanel({ callFrom, callWs, room, peer, token, record, onEnd }: IncomingCallPanelProps) {
  const [active, setActive] = useState(true);
  const onEnd2 = useCallback(() => {
    setActive(false);
    onEnd && onEnd();
  }, [onEnd])

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-4">
        {active && <Atm0sMediaProvider
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
            <SipIncomingCallWidget callFrom={callFrom} callWs={callWs} room={room} record={record} onEnd={onEnd2} />
          </Atm0sMediaUIProvider>
        </Atm0sMediaProvider>}
      </div>
    </main>
  );
}