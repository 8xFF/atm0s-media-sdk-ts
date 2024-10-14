import React from "react";
import { View } from "react-native";
import { CameraPreview, CameraSelection } from "../components/previews/camera";
import { MicrophoneSelection } from "../components/previews/microphone";

interface Props {
  audio_name: string;
  video_name: string;
}

export function DevicesSelection({ audio_name, video_name }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ width: 200, height: 200, backgroundColor: "red" }}>
        <CameraPreview source_name={video_name} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <CameraSelection source_name={video_name} first_page />
        <MicrophoneSelection source_name={audio_name} first_page />
      </View>
    </View>
  );
}
