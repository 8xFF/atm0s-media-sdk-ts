import { useContext, useEffect, useMemo } from "react";
import { RemoteTrack } from "./meta";
import { Context } from "../context";
import { Atm0sMediaContext } from "../provider";
import { TrackReceiver } from "@atm0s-media-sdk/sdk-core/lib";

export interface ConsumerConfig {
  priority: number;
  maxSpatial: number;
  maxTemporal: number;
}

export class Consumer {
  receiver?: TrackReceiver;
  media_stream: MediaStream = new MediaStream();

  constructor(
    private ctx: Context,
    private track: RemoteTrack,
  ) {}

  get stream() {
    return this.media_stream;
  }

  async attach(cfg: ConsumerConfig) {
    this.receiver = this.ctx.takeReceiver(this.track.kind);
    this.media_stream.getTracks().map((t) => this.media_stream.removeTrack(t));
    this.receiver.stream.getTracks().map((t) => this.media_stream.addTrack(t));
    return this.receiver.attach(this.track, cfg);
  }

  async config(cfg: ConsumerConfig) {
    return this.receiver?.config(cfg);
  }

  async detach() {
    if (this.receiver) {
      let receiver = this.receiver;
      this.ctx.backReceiver(receiver);
      this.receiver = undefined;
      return receiver.detach();
    }
  }

  release() {}
}

export function useConsumer(track: RemoteTrack): Consumer {
  const ctx = useContext(Atm0sMediaContext);
  const consumer = useMemo(() => new Consumer(ctx, track), [track]);
  useEffect(() => {
    return () => {
      consumer.release();
    };
  }, [consumer]);
  return consumer;
}
