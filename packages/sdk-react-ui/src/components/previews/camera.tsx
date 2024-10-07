import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePublisher } from "@atm0s-media-sdk/react-hooks";
import { useDeviceStream } from "../../hooks";
import { Atm0sMediaUIContext } from "../../provider";
import { BitrateControlMode, Kind } from "@atm0s-media-sdk/core";
import { CameraIcon, CameraOffIcon } from "../icons/camera";

interface CameraPreviewProps {
  trackName: string;
}

export function CameraPreview({ trackName }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useDeviceStream(trackName);
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
    <div className="w-full h-full">
      <video
        className="w-full h-full"
        ref={videoRef}
        width={500}
        height={500}
        autoPlay
        muted
      />
    </div>
  );
}

interface CameraSelectionProps {
  trackName: string;
  defaultEnable?: boolean;
}

const PublisherConfig = {
  simulcast: true,
  priority: 1,
  bitrate: BitrateControlMode.DYNAMIC_CONSUMERS,
};

export function CameraSelection({
  trackName,
  defaultEnable,
}: CameraSelectionProps) {
  const publisher = usePublisher(trackName, Kind.VIDEO, PublisherConfig);
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const ctx = useContext(Atm0sMediaUIContext);
  const stream = useDeviceStream(trackName);

  useEffect(() => {
    const init = async () => {
      if (defaultEnable) {
        await ctx.requestDevice(trackName, "video");
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
  }, [ctx, trackName, setDevices, defaultEnable]);

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
      ctx.turnOffDevice(trackName);
    } else {
      ctx
        .requestDevice(trackName, "video")
        .then(console.log)
        .catch(console.error);
    }
  }, [ctx, stream]);

  const onChange = useCallback((event: any) => {
    let selected = event.target.options[event.target.selectedIndex].value;
    ctx
      .requestDevice(trackName, "video", selected)
      .then(console.log)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-row h-10">
      <button className="btn btn-circle" onClick={onToggle}>
        {stream ? <CameraIcon /> : <CameraOffIcon />}
      </button>
      <select
        className=""
        defaultValue={stream?.getTracks()[0]?.id}
        onChange={onChange}
      >
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
