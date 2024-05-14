import {
  CameraSelection,
  MicrophoneSelection,
  VideoPannel,
} from "@atm0s-media-sdk/sdk-react-ui/lib";

interface Props {}

export default function MeetInRoom({}: Props): JSX.Element {
  return (
    <div>
      <VideoPannel />
      <MicrophoneSelection source_name="audio_main" />
      <CameraSelection source_name="video_main" />
    </div>
  );
}
