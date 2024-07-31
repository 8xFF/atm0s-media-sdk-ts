import {
  Kind,
  TrackSenderEvent,
  TrackSenderStatus,
} from "@atm0s-media-sdk/core";
import { Publisher, PublisherConfig } from "../context";
import { Atm0sMediaContext } from "../provider";
import { useContext, useEffect, useMemo, useState } from "react";

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

export function usePublisherStatus(
  publisher: Publisher,
): TrackSenderStatus | undefined {
  let [status, setStatus] = useState(() => publisher.sender.status);
  useEffect(() => {
    const handler = (status: TrackSenderStatus | undefined) => {
      setStatus(status);
    };
    publisher.sender.on(TrackSenderEvent.StatusUpdated, handler);
    return () => {
      publisher.sender.off(TrackSenderEvent.StatusUpdated, handler);
    };
  }, [publisher]);
  return status;
}
