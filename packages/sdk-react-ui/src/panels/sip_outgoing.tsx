import { useCallback, useEffect } from "react";
import { useSipOutgoingCallStatus, useSession } from "@atm0s-media-sdk/react-hooks";
import { AudioMixerPlayer, MicrophoneSelection } from "../lib";
import { ClockTimer } from "../components/uis/clock_timer";

export interface SipOutgoingCallProps {
    callTo: string,
    sipWs: string;
    onEnd: () => void;
}

export function SipOutgoingCallWidget(props: SipOutgoingCallProps): JSX.Element {
    const [status, callErr] = useSipOutgoingCallStatus(props.sipWs);
    const session = useSession();

    useEffect(() => {
        session.connect();
        return () => {
            session.disconnect();
        };
    }, [session]);

    const hangUp = useCallback(() => {
        session.disconnect();
        props.onEnd()
    }, [session, props.onEnd]);

    return (
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg">
            {/* WebSocket Status Indicator */}
            <div className={`w-4 h-4 rounded-full ${status.wsState === 'WsConnected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <p className={`text-lg ${status.sipState === 'Accepted' ? 'text-green-600' : 'text-red-600'}`}>
                SIP Status: {callErr || status.sipState} {status.sipCodeStr && '/ ' + status.sipCodeStr}
            </p>

            {/* Time Counting */}
            <div className="text-xl">{status.startedAt && <ClockTimer started_at={status.startedAt} />}</div>

            {/* Destination Number Info */}
            <p className="text-md">Destination: {props.callTo}</p>

            <MicrophoneSelection trackName={'audio_main'} defaultEnable />
            <AudioMixerPlayer />

            {/* Hangup Button */}
            <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={hangUp}
            >
                Hang Up
            </button>
        </div>
    );
}

