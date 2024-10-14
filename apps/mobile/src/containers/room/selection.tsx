import { useSession } from "@atm0s-media-sdk/react-hooks";
import { useCallback } from "react";
import { Button, View } from "react-native";
import { DevicesSelection } from "@atm0s-media-sdk/react-native-ui";

interface Props {
  onConnected: () => void;
}

export default function MeetSelection({ onConnected }: Props): JSX.Element {
  const session = useSession();
  const connect = useCallback(() => {
    session.connect().then(() => {
      onConnected();
    });
  }, [session, onConnected]);

  return (
    <View>
      <DevicesSelection audio_name="audio_main" video_name="video_main" />
      <Button onPress={connect} title="Connect" />
    </View>
  );
}
