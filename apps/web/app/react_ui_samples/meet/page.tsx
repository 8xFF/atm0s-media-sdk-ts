"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { GatewaySelectors } from "../../components/GatewaySelector";
import { generate_token } from "../../actions/token";

export default function MeetPage(): JSX.Element {
  const router = useRouter();
  const roomRef = useRef<HTMLInputElement>(null);
  const peerRef = useRef<HTMLInputElement>(null);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  const onEnter = useCallback(async () => {
    const room = roomRef.current!.value;
    const peer = peerRef.current!.value;
    const token = await generate_token(room, peer);
    router.push(
      `/react_ui_samples/meet/room?&gateway=${gatewayIndex}&room=${room}&peer=${peer}&token=${token}`,
    );
  }, [gatewayIndex, roomRef, peerRef]);

  return (
    <main className="grid h-screen place-content-center">
      <div className="card card-compact w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Enter your information</h2>
          <p>Select gateway which closest to your location</p>
          <GatewaySelectors onChanged={setGatewayIndex} />
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
