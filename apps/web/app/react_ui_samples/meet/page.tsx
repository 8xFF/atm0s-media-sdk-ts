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
    <main className="grid h-screen place-content-center">
      <div className="card card-compact w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Enter your information</h2>
          <p>Select gateway which closest to your location</p>
          <GatewaySelectors />
          <label className="input input-bordered flex items-center gap-2">
            <input
              ref={roomRef}
              type="text"
              className="grow"
              placeholder="Room"
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <input
              ref={peerRef}
              type="text"
              className="grow"
              placeholder="Username"
            />
          </label>
          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={onEnter}>
              Enter
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
