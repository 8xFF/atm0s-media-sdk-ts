// @refresh reset

import { useSession } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import {
  CameraPreview,
  CameraSelection,
  MicrophonePreview,
  MicrophoneSelection,
} from "@atm0s-media-sdk/sdk-react-ui/lib";
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
    <div>
      <CameraPreview source_name="video_main" />
      <CameraSelection source_name="video_main" first_page />
      <MicrophonePreview source_name="audio_main" />
      <MicrophoneSelection source_name="audio_main" first_page />
      <button onClick={connect}>Connect</button>
    </div>
  );
}
