import { useSession } from "@atm0s-media-sdk/react-hooks";
import { DevicesSelection } from "@atm0s-media-sdk/react-ui";
import { useCallback } from "react";

interface Props {
  onConnected: () => void;
}

export default function MeetSelection({ onConnected }: Props): JSX.Element {
  const session = useSession();
  const connect = useCallback(() => {
    session.connect().then(() => {
      onConnected();
    });
  }, [session, onConnected]);

  return (
    <div className="flex flex-col w-full h-full lg:flex-row">
      <div className="flex-grow-1 h-full">
        <DevicesSelection audio_name="audio_main" video_name="video_main" />
      </div>
      <div className="divider lg:divider-horizontal"></div>
      <div className="grid place-content-center w-full h-full">
        <button onClick={connect}>Connect</button>
      </div>
    </div>
  );
}
