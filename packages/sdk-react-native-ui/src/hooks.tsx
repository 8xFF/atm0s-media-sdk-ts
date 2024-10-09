import { useContext, useEffect, useState } from "react";
import { Atm0sMediaUIContext } from "./provider";
import { ContextEvent } from "./context";

import {
  MediaStream,
} from 'react-native-webrtc';

export const useDeviceStream = (
  source_name: string,
): MediaStream | undefined => {
  const ctx = useContext(Atm0sMediaUIContext);

  const [stream, setStream] = useState(() => ctx.streams.get(source_name));
  useEffect(() => {
    const handler = (stream: MediaStream | undefined) => {
      setStream(stream);
    };
    if (ctx.streams.get(source_name) != stream) {
      setStream(ctx.streams.get(source_name));
    }
    ctx.on(ContextEvent.DeviceChanged + source_name, handler);
    return () => {
      ctx.off(ContextEvent.DeviceChanged + source_name, handler);
    };
  }, [source_name]);
  return stream;
};
