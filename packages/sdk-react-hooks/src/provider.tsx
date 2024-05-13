import { createContext, useEffect, useMemo } from "react";
import { SessionConfig } from "@atm0s-media-sdk/sdk-core/lib";
import { Context } from "./context";

export const Atm0sMediaContext = createContext<Context>({} as any);

interface Props {
  gateway: string;
  cfg: SessionConfig;
  prepareAudioReceivers?: number;
  prepareVideoReceivers?: number;
  children?: any;
}

export const Atm0sMediaProvider = ({
  children,
  gateway,
  cfg,
  prepareAudioReceivers,
  prepareVideoReceivers,
}: Props) => {
  const context = useMemo(
    () =>
      new Context(gateway, cfg, prepareAudioReceivers, prepareVideoReceivers),
    [gateway, cfg],
  );
  useEffect(() => {
    return () => {
      context.disconnect();
    };
  }, [context]);

  return (
    <Atm0sMediaContext.Provider value={context}>
      {children}
    </Atm0sMediaContext.Provider>
  );
};
