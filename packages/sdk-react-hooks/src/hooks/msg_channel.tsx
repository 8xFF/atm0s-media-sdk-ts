import { useContext, useEffect, useState } from "react";
import { Atm0sMediaContext } from "../provider";
import {
  MessageChannelConfig,
  MessageChannel,
} from "@atm0s-media-sdk/core/lib";

export function useMessageChannel(
  key: string,
  callback: (event: {
    key: string;
    peer: string;
    message: Uint8Array | string;
  }) => void,
  config?: MessageChannelConfig,
) {
  const ctx = useContext(Atm0sMediaContext);
  const [channel, setChannel] = useState<MessageChannel | null>(null);
  useEffect(() => {
    ctx.session.createMessageChannel(key, config).then((_chan) => {
      _chan.on("message", callback);
      setChannel(_chan);
    });
  }, [key, config]);

  return channel;
}
