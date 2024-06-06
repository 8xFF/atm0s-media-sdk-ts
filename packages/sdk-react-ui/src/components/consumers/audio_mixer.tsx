import { useMixer } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { useEffect, useRef } from "react";

export function AudioMixerPlayer() {
  const mixer = useMixer();
  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);
  const audio3Ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audio1Ref.current && mixer) {
      audio1Ref.current.srcObject = mixer.streams()[0] || null;
    }
  }, [mixer, audio1Ref.current]);

  return (
    <div>
      <audio autoPlay ref={audio1Ref} />
      <audio autoPlay ref={audio2Ref} />
      <audio autoPlay ref={audio3Ref} />
    </div>
  );
}
