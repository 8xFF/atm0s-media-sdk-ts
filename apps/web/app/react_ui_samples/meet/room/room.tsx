import {
  ChatPanel,
  ControlsPanel,
  PeersPanel,
} from "@atm0s-media-sdk/react-ui";

interface Props {}

export default function MeetInRoom({}: Props): JSX.Element {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow flex-grow-col flex flex-row">
        <div className="flex-grow flex-grow-row">
          <PeersPanel my_video="video_main" />
        </div>
        <div className="flex-grow flex-grow-row w-[300px]">
          <ChatPanel channel="chat-main" />
        </div>
      </div>
      <div className="">
        <ControlsPanel audio_name="audio_main" video_name="video_main" />
      </div>
    </div>
  );
}
