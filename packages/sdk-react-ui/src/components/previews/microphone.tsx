import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDeviceStream } from "../../hooks";
import { Atm0sMediaUIContext } from "../../provider";
import { usePublisher } from "@atm0s-media-sdk/react-hooks";
import { Kind } from "@atm0s-media-sdk/core";
import { MicIcon, MicOffIcon } from "../icons/microphone";

interface MicrophonePreviewProps {
  source_name: string;
}

export function MicrophonePreview({ source_name }: MicrophonePreviewProps) {
  const audioRef = useRef<HTMLVideoElement>(null);
  const stream = useDeviceStream(source_name);
  useEffect(() => {
    if (stream && audioRef.current) {
      audioRef.current.srcObject = stream;
    }
    return () => {
      if (audioRef.current?.srcObject) {
        audioRef.current!.srcObject = null;
      }
    };
  }, [stream, audioRef.current]);

  return (
    <div className="preview microphone">
      <audio ref={audioRef} controls autoPlay muted />
    </div>
  );
}

interface MicrophoneSelectionProps {
  source_name: string;
  first_page?: boolean;
}

export function MicrophoneSelection({
  source_name,
  first_page,
}: MicrophoneSelectionProps) {
  const publisher = usePublisher(source_name, Kind.AUDIO);
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const ctx = useContext(Atm0sMediaUIContext);
  const stream = useDeviceStream(source_name);

  useEffect(() => {
    const init = async () => {
      if (first_page) {
        await ctx.requestDevice(source_name, "audio");
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log(devices);
      setDevices(
        devices
          .filter((d) => d.kind == "audioinput")
          .map((d) => {
            return { id: d.deviceId, label: d.label };
          }),
      );
    };

    init();
  }, [ctx, source_name, setDevices, first_page]);

  useEffect(() => {
    let track = stream?.getAudioTracks()[0];
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
        .requestDevice(source_name, "audio")
        .then(console.log)
        .catch(console.error);
    }
  }, [ctx, stream]);
  const onChange = useCallback((event: any) => {
    let selected = event.target.options[event.target.selectedIndex].value;
    ctx
      .requestDevice(source_name, "audio", selected)
      .then(console.log)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-row h-10">
      <button className="btn btn-circle" onClick={onToggle}>
        {stream ? <MicIcon /> : <MicOffIcon />}
      </button>
      <select
        className="devices"
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
