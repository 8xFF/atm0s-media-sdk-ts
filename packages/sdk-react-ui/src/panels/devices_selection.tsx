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
        <CameraPreview source_name={video_name} />
      </div>
      <div className="flex flex-row">
        <CameraSelection source_name={video_name} first_page />
        <MicrophoneSelection source_name={audio_name} first_page />
      </div>
    </div>
  );
}
