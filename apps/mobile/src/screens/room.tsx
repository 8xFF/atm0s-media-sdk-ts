import { AudioMixerMode, SessionConfig } from "@atm0s-media-sdk/core";
import { Atm0sMediaProvider } from "@atm0s-media-sdk/react-hooks";
import { useCallback, useMemo, useState } from "react";
import { Atm0sMediaUIProvider } from "@atm0s-media-sdk/react-native-ui";
import MeetSelection from "../containers/room/selection";
import MeetInRoom from "../containers/room/meet-in-room";
import { env } from "../../env";
import { SafeAreaView } from "react-native-safe-area-context";
interface IProps {
    route: {
        params: {
            room: string;
            gatewayIndex: number;
            peer: string;
            token: string;
        }
    }
}
export const RoomScreen = ({ route }: IProps) => {
    const { room, gatewayIndex, peer, token } = route.params;
    const cfg = useMemo<SessionConfig>(() => {
        return {
            token: token || "demo",
            join: {
                room: room || "room1",
                peer: peer || "peer1",
                publish: { peer: true, tracks: true },
                subscribe: { peers: true, tracks: true },
                features: {
                    mixer: {
                        mode: AudioMixerMode.AUTO,
                        outputs: 3,
                    },
                },
            },
        };
    }, [room, gatewayIndex, peer, token]);
    const [inRoom, setInRoom] = useState(false);
    const onConnected = useCallback(() => {
        setInRoom(true);
    }, [setInRoom]);
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Atm0sMediaProvider
                gateway={env.GATEWAY_ENDPOINTS[gatewayIndex]!}
                cfg={cfg}
                prepareAudioReceivers={3}
                prepareVideoReceivers={3}
            >
                <Atm0sMediaUIProvider>
                    {!inRoom && <MeetSelection onConnected={onConnected} />}
                    {inRoom && <MeetInRoom />}
                </Atm0sMediaUIProvider>
            </Atm0sMediaProvider>
        </SafeAreaView>
    );
}