import { useCallback, useEffect, useState } from "react";
import { useSession, useSipIncomingCallStatus } from "@atm0s-media-sdk/react-hooks";
import { AudioMixerPlayer, MicrophoneSelection } from "../lib";
import { ClockTimer } from "../components/uis/clock_timer";

export interface SipIncomingCallProps {
    callFrom: string,
    sipWs: string;
    room: string,
    record: boolean,
    onEnd: () => void;
}

type AcceptState = "Connecting" | "Accepting" | "Accepted";
type AcceptError = "MediaFailed" | "SipFailed";

export function SipIncomingCallWidget(props: SipIncomingCallProps): JSX.Element {
    const [status, callErr, call] = useSipIncomingCallStatus(props.sipWs);
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

    const accept = useCallback(() => {
        setAcceptState("Connecting")
        session.connect().then(() => {
            setAcceptState("Accepting")
            return call.accept(props.room, props.callFrom, props.record).then(() => {
                setAcceptState("Accepted")
            }).catch(() => setAcceptError("SipFailed"))
        }).catch(() => setAcceptError("MediaFailed"))

    }, [call]);

    const reject = useCallback(() => {
        call.reject()
        session.disconnect();
        props.onEnd()
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

            {/* Destination Number Info */}
            <p className="text-md">Destination: {props.callFrom}</p>

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
                onClick={reject}
            >
                Hangup
            </button>}
        </div>
    );
}

