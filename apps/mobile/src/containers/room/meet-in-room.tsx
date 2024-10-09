import { View } from "react-native";
import {
    ChatPanel,
    ControlsPanel,
    PeersPanel,
} from "@atm0s-media-sdk/react-native-ui";

interface Props { }

export default function MeetInRoom({ }: Props): JSX.Element {
    return (
        <View style={{ flex: 1, backgroundColor: "red" }}>
            <PeersPanel my_video="video_main" />
            {/* <ChatPanel channel="chat-main" />
            <ControlsPanel audio_name="audio_main" video_name="video_main" /> */}
        </View>
    );
}
