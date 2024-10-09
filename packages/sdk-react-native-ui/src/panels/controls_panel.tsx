import { View } from "react-native";
import { CameraSelection, MicrophoneSelection } from "../lib";

interface Props {
  audio_name: string;
  video_name: string;
}

export function ControlsPanel({ audio_name, video_name }: Props) {
  return (
    <View />
    // <div className="flex flex-row items-center space-x-2 w-full h-full">
    //   <div className="flex-grow" />
    //   <MicrophoneSelection source_name={audio_name} />
    //   <CameraSelection source_name={video_name} />
    //   <div className="flex-grow" />
    // </div>
  );
}
