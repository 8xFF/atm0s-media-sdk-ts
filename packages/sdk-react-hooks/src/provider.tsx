import { createContext, useEffect, useState } from "react";
import { SessionConfig } from "@atm0s-media-sdk/core";
import { Context } from "./context";

export const Atm0sMediaContext = createContext<Context>({} as any);

interface Props {
  gateway: string;
  cfg: SessionConfig;
  prepareAudioReceivers?: number;
  prepareVideoReceivers?: number;
  children: JSX.Element;
}

export function Atm0sMediaProvider({
  children,
  gateway,
  cfg,
  prepareAudioReceivers,
  prepareVideoReceivers,
}: Props): JSX.Element {
  const [context, setContext] = useState<Context | null>(null);
  useEffect(() => {
    const context = new Context(
      gateway,
      cfg,
      prepareAudioReceivers,
      prepareVideoReceivers,
    );
    setContext(context);

    return () => {
      context.disconnect();
    };
  }, [setContext]);

  return context ? (
    <Atm0sMediaContext.Provider value={context}>
      {children}
    </Atm0sMediaContext.Provider>
  ) : (
    <div></div>
  );
}
