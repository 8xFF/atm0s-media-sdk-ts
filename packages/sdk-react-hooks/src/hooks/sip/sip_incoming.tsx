import { IncomingSipCallStatus, SipIncomingCall } from "@atm0s-media-sdk/core";
import { useEffect, useMemo, useState } from "react";

export function useSipIncomingCallStatus(
    callWs: string,
): [IncomingSipCallStatus, string | null, SipIncomingCall] {
    const call = useMemo(() => new SipIncomingCall(callWs), [callWs])
    const [status, setStatus] = useState<IncomingSipCallStatus>(call.status);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        call.on('status', setStatus)
        call.on('error', setErr)

        return () => {
            call.disconnect()
        };
    }, [call]);

    return [status, err, call];
}

