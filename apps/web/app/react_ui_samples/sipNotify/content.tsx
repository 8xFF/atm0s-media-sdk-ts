"use client";

import { Atm0sMediaProvider, useSipIncomingCallStatus, useSipIncomingListener } from "@atm0s-media-sdk/react-hooks";
import { Atm0sMediaUIProvider, SipIncomingCallWidget } from "@atm0s-media-sdk/react-ui";
import { useCallback, useState } from "react";
import { env } from "../../env";
import { AudioMixerMode } from "@atm0s-media-sdk/core";
import { generate_random_token } from "../../actions/token";
import IncomingCallPanel, { IncomingCallPanelProps } from "./in_call";

export interface CallListenrProps {
  notifyWs: string,
  onEnd?: () => void;
}

export default function PageContent({ notifyWs, onEnd }: CallListenrProps) {
  const [call, setCall] = useState<IncomingCallPanelProps | null>(null)

  const err = useSipIncomingListener(notifyWs, async (call) => {
    const [room, peer, token] = await generate_random_token();
    setCall({
      callFrom: call.callFrom,
      callWs: env.SIP_GATEWAY + call.callWs,
      room,
      peer,
      token,
      record: false,
    })
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-4">
        {call && <IncomingCallPanel {...call} onEnd={() => setCall(null)} />} {/* Pass session object to Content */}
      </div>
    </main>
  );
}