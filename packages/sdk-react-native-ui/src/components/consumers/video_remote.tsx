import { RemoteTrack, useConsumer } from "@atm0s-media-sdk/react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { MediaStream, RTCView } from "react-native-webrtc";

interface Props {
  track: RemoteTrack;
}

export function VideoRemote({ track }: Props) {
  const consumer = useConsumer(track);
  useEffect(() => {
    consumer.attach({
      priority: 10,
      maxSpatial: 2,
      maxTemporal: 2,
    });
    return () => {
      consumer.detach();
    };
  }, [consumer]);

  const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);

  useEffect(() => {
    if (consumer) {
      setLocalStream(consumer.stream);
    }
  }, [consumer]);

  return (
    <View style={{
      width: "100%",
      height: "100%",
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    }}>
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