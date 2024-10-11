import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDeviceStream } from "../../hooks";
import { Atm0sMediaUIContext } from "../../provider";
import { usePublisher } from "@atm0s-media-sdk/react-hooks";
import { Kind } from "@atm0s-media-sdk/core";
import { mediaDevices, MediaStream, RTCView } from "react-native-webrtc";
import { Text, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from 'react-native-vector-icons/Ionicons';

interface MicrophonePreviewProps {
  source_name: string;
}

export function MicrophonePreview({ source_name }: MicrophonePreviewProps) {
  const stream = useDeviceStream(source_name);
  const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);

  useEffect(() => {
    if (stream) {
      setLocalStream(stream);
    }
  }, [stream]);

  return (
    <View style={{ width: "100%", height: '100%' }}>
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

interface MicrophoneSelectionProps {
  source_name: string;
  first_page?: boolean;
}

export function MicrophoneSelection({
  source_name,
  first_page,
}: MicrophoneSelectionProps) {
  const publisher = usePublisher(source_name, Kind.AUDIO);
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const ctx = useContext(Atm0sMediaUIContext);
  const stream = useDeviceStream(source_name);

  useEffect(() => {
    const init = async () => {
      if (first_page) {
        await ctx.requestDevice(source_name, "audio");
      }
      const devices: any = await mediaDevices.enumerateDevices();
      console.log(devices);
      setDevices(
        devices
          .filter((d) => d.kind == "audioinput")
          .map((d) => {
            return { id: d.deviceId, label: d.label };
          }),
      );
    };

    init();
  }, [ctx, source_name, setDevices, first_page]);

  useEffect(() => {
    let track = stream?.getAudioTracks()[0];
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
        .requestDevice(source_name, "audio")
        .then(console.log)
        .catch(console.error);
    }
  }, [ctx, stream]);
  const onChange = useCallback((event: any) => {
    let selected = event.target.options[event.target.selectedIndex].value;
    ctx
      .requestDevice(source_name, "audio", selected)
      .then(console.log)
      .catch(console.error);
  }, []);

  return (
    <View style={{ flexDirection: 'row', height: 40 }}>
      <TouchableOpacity onPress={onToggle}>
        {stream ? <Icon name="mic-outline" size={24} /> : <Icon name="mic-off-outline" size={24} />}
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
