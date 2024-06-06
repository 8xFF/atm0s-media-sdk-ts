import { useContext, useMemo } from "react";
import { Atm0sMediaContext } from "../provider";
export type { AudioMixer } from "@atm0s-media-sdk/sdk-core/lib";

export function useMixer() {
  const ctx = useContext(Atm0sMediaContext);
  return useMemo(() => {
    return ctx.session.mixer;
  }, [ctx]);
}
