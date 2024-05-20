import { Kind } from "@atm0s-media-sdk/sdk-core/lib";
import { Publisher, PublisherConfig } from "../context";
import { Atm0sMediaContext } from "../provider";
import { useContext, useEffect, useMemo, useState } from "react";
import { Sender_Status } from "../../../sdk-core/src/generated/protobuf/shared";
import { TrackSenderEvent } from "../../../sdk-core/src/sender";

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
): Sender_Status | undefined {
  let [status, setStatus] = useState(() => publisher.sender.status);
  useEffect(() => {
    const handler = (status: Sender_Status | undefined) => {
      setStatus(status);
    };
    publisher.sender.on(TrackSenderEvent.StateUpdated, handler);
    return () => {
      publisher.sender.off(TrackSenderEvent.StateUpdated, handler);
    };
  }, [publisher]);
  return status;
}
