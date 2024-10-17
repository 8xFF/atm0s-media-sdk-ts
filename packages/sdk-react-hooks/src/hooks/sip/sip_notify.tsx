import { SipIncomingCallListener, SipIncomingCallNotify } from "@atm0s-media-sdk/core";
import { useEffect, useMemo, useState } from "react";

export function useSipIncomingListener(
    notifyWs: string,
    handler: (call: SipIncomingCallNotify) => void,
): string | null {
    const listener = useMemo(() => new SipIncomingCallListener(notifyWs), [notifyWs])
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        listener.on('call', (call: SipIncomingCallNotify) => {
            handler(call);
        });
        listener.on('error', setErr)

        return () => {
            listener.disconnect()
        };
    }, [listener]);

    return err;
}

export enum SipIncomingCallNotifyState {
    Ringing,
    Accepted,
    Cancelled,
}

export function useSipIncomingCallNotify(call: SipIncomingCallNotify): SipIncomingCallNotifyState {
    const [state, setState] = useState(SipIncomingCallNotifyState.Ringing)

    useEffect(() => {
        const onCallAccept = () => {

        }

        const onCallCancel = () => {

        }

        call.on('accepted', onCallAccept);
        call.on('cancelled', onCallCancel);

        return () => {
            call.off('accepted', onCallAccept);
            call.off('cancelled', onCallCancel);
        }
    }, [call]);

    return state
}