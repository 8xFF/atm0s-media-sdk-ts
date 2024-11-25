import { useCallback, useEffect, useState } from "react";
import { useSession, useSipIncomingCallStatus } from "@atm0s-media-sdk/react-hooks";
import { AudioMixerPlayer, MicrophoneSelection } from "../lib";
import { ClockTimer } from "../components/uis/clock_timer";

export interface SipIncomingCallProps {
    callFrom: string,
    callWs: string;
    room: string,
    sipPeer: string,
    record: boolean,
    onAccept?: () => void;
    onCancel?: () => void;
    onReject?: () => void;
    onEnd?: () => void;
}

type AcceptState = "Connecting" | "Accepting" | "Accepted";
type AcceptError = "MediaFailed" | "SipFailed";

export function SipIncomingCallWidget(props: SipIncomingCallProps): JSX.Element {
    const [status, callErr, call] = useSipIncomingCallStatus(props.callWs);
    const [acceptState, setAcceptState] = useState<AcceptState | null>(null);
    const [acceptError, setAcceptError] = useState<AcceptError | null>(null);
    const session = useSession();

    const showAccept = !status.sipState;
    const showReject = !status.sipState;
    const showHangup = status.sipState == "Accepted";

    useEffect(() => {
        return () => {
            session.disconnect();
        };
    }, [session]);

    useEffect(() => {
        switch (status.sipState) {
            case "Bye": {
                if (props.onEnd) {
                    props.onEnd();
                }
                break;
            }
            case "Cancelled": {
                if (props.onCancel) {
                    props.onCancel();
                }
                break;
            }
        }
    }, [status])

    const accept = useCallback(() => {
        setAcceptState("Connecting")
        session.connect().then(() => {
            setAcceptState("Accepting")
            if (props.onAccept) {
                props.onAccept();
            }
            return call.accept(props.room, props.sipPeer, props.record).then(() => {
                setAcceptState("Accepted")
            }).catch(() => setAcceptError("SipFailed"))
        }).catch(() => setAcceptError("MediaFailed"))

    }, [session, call, props.onAccept]);

    const reject = useCallback(() => {
        call.reject()
        session.disconnect();
        if (props.onReject) {
            props.onReject();
        }
    }, [session, call, props.onReject]);

    const end = useCallback(() => {
        call.end()
        session.disconnect();
        if (props.onEnd) {
            props.onEnd();
        }
    }, [session, call, props.onEnd]);

    return (
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg">
            {/* WebSocket Status Indicator */}
            <div className={`w-4 h-4 rounded-full ${status.wsState === 'WsConnected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <p className={`text-lg ${status.sipState === 'Accepted' ? 'text-green-600' : 'text-red-600'}`}>
                Status: {acceptError || callErr || status.sipState || acceptState}
            </p>

            {/* Time Counting */}
            <div className="text-xl">{status.startedAt && <ClockTimer started_at={status.startedAt} />}</div>

            {/* From Number Info */}
            <p className="text-md">From: {props.callFrom}</p>

            <MicrophoneSelection trackName={'audio_main'} defaultEnable />
            <AudioMixerPlayer />

            {/* Accept Button */}
            {showAccept && <button
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={accept}
            >
                Accept
            </button>}

            {/* Reject Button */}
            {showReject && <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={reject}
            >
                Reject
            </button>}
            {/* Reject Button */}
            {showHangup && <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={end}
            >
                Hangup
            </button>}
        </div>
    );
}

