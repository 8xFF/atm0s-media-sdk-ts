import { ReactNode, createContext, useEffect, useMemo } from "react";
import { SessionConfig } from "@atm0s-media-sdk/core/lib";
import { Context } from "./context";

export const Atm0sMediaContext = createContext<Context>({} as any);

interface Props {
  gateway: string;
  cfg: SessionConfig;
  prepareAudioReceivers?: number;
  prepareVideoReceivers?: number;
  children: ReactNode;
}

export function Atm0sMediaProvider({
  children,
  gateway,
  cfg,
  prepareAudioReceivers,
  prepareVideoReceivers,
}: Props): JSX.Element {
  const context = useMemo(() => {
    console.log("create new context");
    return new Context(
      gateway,
      cfg,
      prepareAudioReceivers,
      prepareVideoReceivers,
    );
  }, [gateway, cfg]);
  useEffect(() => {
    return () => {
      console.log("destroy context");
      context.disconnect();
    };
  }, [context]);

  return (
    <Atm0sMediaContext.Provider value={context}>
      {children}
    </Atm0sMediaContext.Provider>
  );
}
