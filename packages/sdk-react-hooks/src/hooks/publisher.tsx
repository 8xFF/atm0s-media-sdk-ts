import { Kind } from "@atm0s-media-sdk/sdk-core/lib";
import { PublisherConfig } from "../context";
import { Atm0sMediaContext } from "../provider";
import { useContext, useMemo } from "react";

export function usePublisher(
  name: string,
  media_or_kind: Kind | MediaStreamTrack,
  cfg?: PublisherConfig,
) {
  const ctx = useContext(Atm0sMediaContext);
  return useMemo(
    () => ctx.getOrCreatePublisher(name, media_or_kind, cfg),
    [name, media_or_kind, cfg],
  );
}
