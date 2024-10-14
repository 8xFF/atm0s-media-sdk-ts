import { Text, View } from "react-native";
import { useDeviceStream } from "../../hooks";
import { useEffect, useRef, useState } from "react";
import { MediaStream, RTCView } from "react-native-webrtc";

interface Props {
  video: string;
}

export function PeerLocal({ video }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);
  //TODO show multi videos
  const stream = useDeviceStream(video);

  useEffect(() => {
    if (stream) {
      setLocalStream(stream);
    }
  }, [stream]);

  return (
    <View style={{
      flex: 1,
      width: "50%",
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    }}>
      <Text>Me</Text>
      {localStream &&
        <RTCView
          mirror={true}
          objectFit={'cover'}
          streamURL={localStream.toURL()}
          zOrder={1}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      }
    </View>
  );
}
