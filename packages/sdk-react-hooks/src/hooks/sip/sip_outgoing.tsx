import { OutgoingSipCallStatus, SipOutgoingCall } from "@atm0s-media-sdk/core";
import { useEffect, useMemo, useState } from "react";

export function useSipOutgoingCallStatus(
    ws: string,
): [OutgoingSipCallStatus, string | null, SipOutgoingCall] {
    const call = useMemo(() => new SipOutgoingCall(ws), [ws])
    const [status, setStatus] = useState<OutgoingSipCallStatus>(call.status);
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

