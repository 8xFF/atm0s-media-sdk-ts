import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePublisher } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { useDeviceStream } from "../../hooks";
import { Atm0sMediaUIContext } from "../../provider";
import { BitrateControlMode, Kind } from "@atm0s-media-sdk/sdk-core/lib";

interface CameraPreviewProps {
  source_name: string;
}

export function CameraPreview({ source_name }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useDeviceStream(source_name);
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      return () => {
        if (videoRef.current?.srcObject) {
          videoRef.current!.srcObject = null;
        }
      };
    }
  }, [stream, videoRef.current]);

  return (
    <div>
      <video ref={videoRef} width={500} height={500} autoPlay muted />
    </div>
  );
}

interface CameraSelectionProps {
  source_name: string;
  first_page?: boolean;
}

const PublisherConfig = {
  simulcast: true,
  priority: 1,
  bitrate: BitrateControlMode.DYNAMIC_CONSUMERS,
};

export function CameraSelection({
  source_name,
  first_page,
}: CameraSelectionProps) {
  const publisher = usePublisher(source_name, Kind.VIDEO, PublisherConfig);
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const ctx = useContext(Atm0sMediaUIContext);
  const stream = useDeviceStream(source_name);

  useEffect(() => {
    const init = async () => {
      if (first_page) {
        await ctx.requestDevice(source_name, "video");
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log(devices);
      setDevices(
        devices
          .filter((d) => d.kind == "videoinput")
          .map((d) => {
            return { id: d.deviceId, label: d.label };
          }),
      );
    };

    init();
  }, [ctx, source_name, setDevices, first_page]);

  useEffect(() => {
    let track = stream?.getVideoTracks()[0];
    if (track && !publisher.attached) {
      publisher.attach(track);
    } else if (!track && publisher.attached) {
      publisher.detach();
    }
  }, [publisher, stream]);

  const onToggle = useCallback(() => {
    if (stream) {
      ctx.turnOffDevice(source_name);
    } else {
      ctx
        .requestDevice(source_name, "video")
        .then(console.log)
        .catch(console.error);
    }
  }, [ctx, stream]);

  const onChange = useCallback((event: any) => {
    let selected = event.target.options[event.target.selectedIndex].value;
    ctx
      .requestDevice(source_name, "video", selected)
      .then(console.log)
      .catch(console.error);
  }, []);

  return (
    <div>
      <button onClick={onToggle}>Toggle</button>
      <select defaultValue={stream?.getTracks()[0]?.id} onChange={onChange}>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
