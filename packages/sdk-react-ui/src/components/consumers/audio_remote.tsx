import { RemoteTrack, useConsumer } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { useEffect, useRef } from "react";

interface Props {
  track: RemoteTrack;
}

export function AudioRemote({ track }: Props) {
  const consumer = useConsumer(track);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    consumer.attach({
      priority: 10,
      maxSpatial: 2,
      maxTemporal: 2,
    });
    return () => {
      consumer.detach();
    };
  }, [consumer]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = consumer.stream;
    }
  }, [consumer, audioRef.current]);

  return <audio autoPlay ref={audioRef} />;
}
