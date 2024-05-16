import { useDeviceStream } from "../../hooks";
import { useEffect, useRef } from "react";

interface Props {
  video: string;
}

export function PeerLocal({ video }: Props) {
  //TODO show multi videos
  const stream = useDeviceStream(video);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
      return () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    }
  }, [stream, videoRef.current]);

  return (
    <div className="relative bg-gray-500">
      <span className="absolute left-2 top-2">Me</span>
      <video muted autoPlay className="w-full h-full" ref={videoRef} />
    </div>
  );
}
