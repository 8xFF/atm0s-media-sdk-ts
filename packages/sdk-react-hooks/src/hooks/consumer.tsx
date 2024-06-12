import { useContext, useEffect, useMemo, useState } from "react";
import { RemoteTrack } from "./meta";
import { Context } from "../context";
import { Atm0sMediaContext } from "../provider";
import {
  EventEmitter,
  TrackReceiver,
  TrackReceiverVoiceActivity,
} from "@atm0s-media-sdk/core/lib";
import { Receiver_Status } from "../../../sdk-core/src/generated/protobuf/shared";
import { TrackReceiverEvent } from "../../../sdk-core/src/receiver";

export interface ConsumerConfig {
  priority: number;
  maxSpatial: number;
  maxTemporal: number;
}

export class Consumer extends EventEmitter {
  receiver?: TrackReceiver;
  media_stream: MediaStream = new MediaStream();

  constructor(
    private ctx: Context,
    private track: RemoteTrack,
  ) {
    super();
  }

  get stream() {
    return this.media_stream;
  }

  async attach(cfg: ConsumerConfig) {
    this.receiver = this.ctx.takeReceiver(this.track.kind);
    this.receiver.on(TrackReceiverEvent.StatusUpdated, this.onStateEvent);
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
      this.receiver.off(TrackReceiverEvent.StatusUpdated, this.onStateEvent);
      this.receiver = undefined;
      return receiver.detach();
    }
  }

  release() {}

  onStateEvent = (event: Receiver_Status | undefined) => {
    this.emit(TrackReceiverEvent.StatusUpdated, event);
  };
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

export function useConsumerStatus(
  consumer: Consumer,
): Receiver_Status | undefined {
  let [status, setStatus] = useState(() => consumer.receiver?.status);
  useEffect(() => {
    const handler = (status: Receiver_Status | undefined) => {
      setStatus(status);
    };
    consumer.on(TrackReceiverEvent.StatusUpdated, handler);
    return () => {
      consumer.off(TrackReceiverEvent.StatusUpdated, handler);
    };
  }, [consumer]);
  return status;
}

export function useConsumerVoiceActivity(
  consumer: Consumer,
): TrackReceiverVoiceActivity | undefined {
  let [status, setStatus] = useState<TrackReceiverVoiceActivity | undefined>(
    undefined,
  );
  useEffect(() => {
    const handler = (status: TrackReceiverVoiceActivity | undefined) => {
      setStatus(status);
    };
    consumer.on(TrackReceiverEvent.VoiceActivity, handler);
    return () => {
      consumer.off(TrackReceiverEvent.VoiceActivity, handler);
    };
  }, [consumer]);
  return status;
}
