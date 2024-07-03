import {
  VirtualDataChannel,
  VirtualDataChannelConfig,
} from "@atm0s-media-sdk/core/lib";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Atm0sMediaContext } from "../provider";

export function useDataChannel(
  key: string,
  callback: (event: {
    key: string;
    peer: string;
    message: Uint8Array | string;
  }) => void,
  config?: VirtualDataChannelConfig,
) {
  const ctx = useContext(Atm0sMediaContext);
  const [dc, setDc] = useState<VirtualDataChannel | null>(null);
  useEffect(() => {
    ctx.session.createDataChannel(key, config).then((_dc) => {
      _dc.on("message", callback);
      setDc(_dc);
    });
  }, [key, config]);

  return dc;
}
