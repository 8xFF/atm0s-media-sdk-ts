"use client";

import { Atm0sMediaProvider } from "@atm0s-media-sdk/react-hooks/lib";
import { Atm0sMediaUIProvider } from "@atm0s-media-sdk/react-ui/lib";
import MeetSelection from "./selection";
import { Suspense } from "react";
import { useCallback, useMemo, useState } from "react";
import MeetInRoom from "./room";
import { useSearchParams } from "next/navigation";
import { AudioMixerMode, SessionConfig } from "@atm0s-media-sdk/core/lib";
import { env } from "../../../env";

function MeetContent(): JSX.Element {
  const searchParams = useSearchParams();
  const gatewayIndex = parseInt(searchParams!.get("gateway") || "0");
  const cfg = useMemo<SessionConfig>(() => {
    return {
      token: searchParams!.get("token") || "demo",
      join: {
        room: searchParams!.get("room") || "room1",
        peer: searchParams!.get("peer") || "peer1",
        publish: { peer: true, tracks: true },
        subscribe: { peers: true, tracks: true },
        features: {
          mixer: {
            mode: AudioMixerMode.AUTO,
            outputs: 3,
          },
        },
      },
    };
  }, [searchParams]);
  const [inRoom, setInRoom] = useState(false);
  const onConnected = useCallback(() => {
    setInRoom(true);
  }, [setInRoom]);

  return (
    <Atm0sMediaProvider
      gateway={env.GATEWAY_ENDPOINTS[gatewayIndex]!}
      cfg={cfg}
      prepareAudioReceivers={3}
      prepareVideoReceivers={3}
    >
      <Atm0sMediaUIProvider>
        {!inRoom && <MeetSelection onConnected={onConnected} />}
        {inRoom && <MeetInRoom />}
      </Atm0sMediaUIProvider>
    </Atm0sMediaProvider>
  );
}

export default function MeetPage(): JSX.Element {
  return (
    <main className="w-screen h-screen">
      <Suspense fallback={<span>Loading</span>}>
        <MeetContent />
      </Suspense>
    </main>
  );
}
