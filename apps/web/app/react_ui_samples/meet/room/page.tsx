"use client";

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

import { Atm0sMediaUIProvider } from "@atm0s-media-sdk/sdk-react-ui/lib";
import MeetSelection from "./selection";
import { Suspense } from "react";
import { useCallback, useMemo, useState } from "react";
import MeetInRoom from "./room";
import { useSearchParams } from "next/navigation";
import { SelectedGateway } from "../../../components/GatewaySelector";
import { AudioMixerMode, SessionConfig } from "@atm0s-media-sdk/sdk-core/lib";

function MeetContent(): JSX.Element {
  const searchParams = useSearchParams();
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
      gateway={SelectedGateway.url}
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
