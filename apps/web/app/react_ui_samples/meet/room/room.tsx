import { ControlsPanel, PeersPanel } from "@atm0s-media-sdk/sdk-react-ui/lib";

interface Props {}

export default function MeetInRoom({}: Props): JSX.Element {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow flex-grow-col">
        <PeersPanel my_video="video_main" audio_direct />
      </div>
      <div className="">
        <ControlsPanel audio_name="audio_main" video_name="video_main" />
      </div>
    </div>
  );
}
