"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { GatewaySelectors } from "../../components/GatewaySelector";

export default function MeetPage(): JSX.Element {
  const router = useRouter();
  const roomRef = useRef<HTMLInputElement>(null);
  const peerRef = useRef<HTMLInputElement>(null);

  const onEnter = useCallback(() => {
    const room = roomRef.current!.value;
    const peer = peerRef.current!.value;
    router.push("/react_ui_samples/meet/room?room=" + room + "&peer=" + peer);
  }, [roomRef, peerRef]);

  return (
    <main>
      <GatewaySelectors />
      <div>
        <span>Room</span>
        <input ref={roomRef} />
      </div>
      <div>
        <span>User</span>
        <input ref={peerRef} />
      </div>
      <button onClick={onEnter}>Enter</button>
    </main>
  );
}
