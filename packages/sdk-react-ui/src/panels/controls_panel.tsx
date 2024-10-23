import { CameraSelection, MicrophoneSelection } from "../lib";

interface Props {
  audio_name: string;
  video_name: string;
}

export function ControlsPanel({ audio_name, video_name }: Props) {
  return (
    <div className="flex flex-row items-center space-x-2 w-full h-full">
      <div className="flex-grow" />
      <MicrophoneSelection trackName={audio_name} />
      <CameraSelection trackName={video_name} />
      <div className="flex-grow" />
    </div>
  );
}
