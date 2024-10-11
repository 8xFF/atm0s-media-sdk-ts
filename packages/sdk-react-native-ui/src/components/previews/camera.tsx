import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePublisher } from "@atm0s-media-sdk/react-hooks";
import { useDeviceStream } from "../../hooks";
import { Atm0sMediaUIContext } from "../../provider";
import { BitrateControlMode, Kind } from "@atm0s-media-sdk/core";
import { mediaDevices, MediaStream, RTCView } from "react-native-webrtc";
import { Text, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from 'react-native-vector-icons/Feather';
let mediaConstraints = {
  audio: true,
  video: {
    frameRate: 30,
    facingMode: 'user'
  }
};
interface CameraPreviewProps {
  source_name: string;
}

export function CameraPreview({ source_name }: CameraPreviewProps) {
  const stream = useDeviceStream(source_name);
  const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);

  useEffect(() => {
    if (stream) {
      setLocalStream(stream);
    }
  }, [stream]);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    }}>
      {localStream &&
        <RTCView
          mirror={true}
          objectFit={'cover'}
          streamURL={localStream.toURL()}
          zOrder={0}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      }
    </View>
  );
}

interface CameraSelectionProps {
  source_name: string;
  first_page?: boolean;
}

const PublisherConfig = {
  simulcast: true,
  priority: 1,
  bitrate: BitrateControlMode.DYNAMIC_CONSUMERS,
};

export function CameraSelection({
  source_name,
  first_page,
}: CameraSelectionProps) {
  const publisher = usePublisher(source_name, Kind.VIDEO, PublisherConfig);
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const ctx = useContext(Atm0sMediaUIContext);
  const stream = useDeviceStream(source_name);

  useEffect(() => {
    const init = async () => {
      if (first_page) {
        await ctx.requestDevice(source_name, "video");
      }
      const devices: any = await mediaDevices.enumerateDevices();
      console.log(devices);
      setDevices(
        devices
          .filter((d) => d.kind == "videoinput")
          .map((d) => {
            return { id: d.deviceId, label: d.label };
          }),
      );
    };

    init();
  }, [ctx, source_name, setDevices, first_page]);

  useEffect(() => {
    let track = stream?.getVideoTracks()[0];
    if (track && !publisher.attached) {
      publisher.attach(track);
    } else if (!track && publisher.attached) {
      publisher.detach();
    }
  }, [publisher, stream]);

  const onToggle = useCallback(() => {
    if (stream) {
      ctx.turnOffDevice(source_name);
    } else {
      ctx
        .requestDevice(source_name, "video")
        .then(console.log)
        .catch(console.error);
    }
  }, [ctx, stream]);

  const onChange = useCallback((event: any) => {
    let selected = event.target.options[event.target.selectedIndex].value;
    ctx
      .requestDevice(source_name, "video", selected)
      .then(console.log)
      .catch(console.error);
  }, []);

  return (
    <View style={{ flexDirection: 'row', height: 40 }}>
      <TouchableOpacity onPress={onToggle}>
        {stream ? <Icon name="camera" size={24} /> : <Icon name="camera-off" size={24} />}
      </TouchableOpacity>
      <View>
        <Text>Select a Device:</Text>
        <Picker
          selectedValue={stream?.getTracks()[0]?.id} // Set the default value
          onValueChange={(itemValue) => onChange(itemValue)} // Handle changes
        >
          {devices.map((d) => (
            <Picker.Item key={d.id} label={d.label} value={d.id} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
