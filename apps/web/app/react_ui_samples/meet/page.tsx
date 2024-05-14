"use client";

import { Atm0sMediaProvider } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { Atm0sMediaUIProvider } from "@atm0s-media-sdk/sdk-react-ui/lib";
import MeetSelection from "./selection";
import { useCallback, useMemo, useState } from "react";
import MeetInRoom from "./room";

export default function MeetPage(): JSX.Element {
  const cfg = useMemo(() => {
    return {
      token: "demo",
      join: {
        room: "room1",
        peer: "peer1",
        publish: { peer: true, tracks: true },
        subscribe: { peers: true, tracks: true },
      },
    };
  }, []);
  const [inRoom, setInRoom] = useState(false);
  const onConnected = useCallback(() => {
    setInRoom(true);
  }, [setInRoom]);

  return (
    <main>
      <Atm0sMediaProvider
        gateway="http://localhost:3000"
        cfg={cfg}
        prepareAudioReceivers={3}
        prepareVideoReceivers={3}
      >
        <Atm0sMediaUIProvider>
          {!inRoom && <MeetSelection onConnected={onConnected} />}
          {inRoom && <MeetInRoom />}
        </Atm0sMediaUIProvider>
      </Atm0sMediaProvider>
    </main>
  );
}
