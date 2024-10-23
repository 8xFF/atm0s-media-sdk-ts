import { CameraPreview, CameraSelection } from "../components/previews/camera";
import { MicrophoneSelection } from "../components/previews/microphone";

interface Props {
  audio_name: string;
  video_name: string;
}

export function DevicesSelection({ audio_name, video_name }: Props) {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-grow">
        <CameraPreview trackName={video_name} />
      </div>
      <div className="flex flex-row">
        <CameraSelection trackName={video_name} defaultEnable />
        <MicrophoneSelection trackName={audio_name} defaultEnable />
      </div>
    </div>
  );
}
