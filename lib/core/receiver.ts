import {
  Receiver,
  Kind,
  Receiver_Config,
  Receiver_Source,
} from "../generated/protobuf/shared";
import { ReadyWaiter } from "../utils";
import { Datachannel } from "./data";
import { MediaKind } from "./types";

export class TrackReceiver {
  waiter: ReadyWaiter = new ReadyWaiter();
  media_stream: MediaStream;
  cfg?: Receiver_Config;

  constructor(
    private dc: Datachannel,
    _transceiver: RTCRtpTransceiver,
    private track_name: string,
    private kind: MediaKind,
  ) {
    this.media_stream = new MediaStream();
    console.log("[TrackReceiver] create ", track_name, dc);
  }

  public has_track() {
    return this.media_stream.getTracks().length > 0;
  }

  public set_track(track: MediaStreamTrack) {
    if (this.media_stream.getTracks().length > 0) {
      throw new Error("media_stream already set");
    }
    this.waiter.setReady();
    this.media_stream.addTrack(track);
  }

  public async ready() {
    return this.waiter.waitReady();
  }

  public async attach(source: Receiver_Source, config?: Receiver_Config) {
    await this.dc.ready();
    await this.ready();
    this.cfg = config;
    await this.dc.request_receiver({
      name: this.track_name,
      attach: {
        source,
        config: config || { priority: 1, maxSpatial: 2, maxTemporal: 2 },
      },
    });
  }

  public async detach() {
    await this.dc.ready();
    await this.ready();
    delete this.cfg;
    await this.dc.request_receiver({
      name: this.track_name,
      detach: {},
    });
  }

  public async config(config: Receiver_Config) {
    await this.dc.ready();
    await this.ready();
    await this.dc.request_receiver({
      name: this.track_name,
      config,
    });
  }

  get stream() {
    return this.media_stream;
  }

  get name(): string {
    return this.track_name;
  }

  get state(): Receiver {
    return {
      name: this.name,
      kind: this.kind == "audio" ? Kind.AUDIO : Kind.VIDEO,
      state: {
        config: this.cfg || { priority: 1, maxSpatial: 2, maxTemporal: 2 },
      },
    };
  }
}
