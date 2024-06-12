import { RemoteTrack, useConsumer } from "@atm0s-media-sdk/react-hooks/lib";
import { useEffect, useRef } from "react";

interface Props {
  track: RemoteTrack;
}

export function VideoRemote({ track }: Props) {
  const consumer = useConsumer(track);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (videoRef.current) {
      videoRef.current.srcObject = consumer.stream;
    }
  }, [consumer, videoRef.current]);

  return <video muted autoPlay className="w-full h-full" ref={videoRef} />;
}
