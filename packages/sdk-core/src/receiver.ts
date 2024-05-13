import {
  Receiver,
  Kind,
  Receiver_Config,
  Receiver_Source,
  Receiver_State,
} from "./generated/protobuf/shared";
import { ReadyWaiter } from "./utils";
import { Datachannel } from "./data";
import { kind_to_string } from "./types";

const DEFAULT_CFG = {
  priority: 1,
  maxSpatial: 2,
  maxTemporal: 2,
};

export class TrackReceiver {
  transceiver?: RTCRtpTransceiver;
  waiter: ReadyWaiter = new ReadyWaiter();
  media_stream: MediaStream;
  receiver_state: Receiver_State = { config: undefined, source: undefined };

  constructor(
    private dc: Datachannel,
    private track_name: string,
    private _kind: Kind,
  ) {
    this.media_stream = new MediaStream();
    console.log("[TrackReceiver] create ", track_name, dc);
  }

  public get kind() {
    return this._kind;
  }

  public has_track() {
    return this.media_stream.getTracks().length > 0;
  }

  public set_track(track: MediaStreamTrack) {
    if (this.media_stream.getTracks().length > 0) {
      throw new Error("media_stream already set");
    }

    if (track.kind != kind_to_string(this._kind)) {
      throw new Error("wrong track type");
    }
    this.waiter.setReady();
    this.media_stream.addTrack(track);
  }

  public async ready() {
    return this.waiter.waitReady();
  }

  /// We need lazy prepare for avoding error when sender track is changed before it connect.
  /// Config after init feature will be useful when complex application
  prepare(peer: RTCPeerConnection) {
    this.transceiver = peer.addTransceiver(kind_to_string(this._kind), {
      direction: "recvonly",
    });
  }

  public async attach(
    source: Receiver_Source,
    config: Receiver_Config = DEFAULT_CFG,
  ) {
    this.receiver_state.config = config;
    this.receiver_state.source = source;

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackReceiver] attach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.ready();
    await this.dc.request_receiver({
      name: this.track_name,
      attach: {
        source: this.receiver_state.source,
        config: this.receiver_state.config,
      },
    });
  }

  public async detach() {
    delete this.receiver_state.source;
    delete this.receiver_state.config;

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackReceiver] detach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.ready();
    await this.dc.request_receiver({
      name: this.track_name,
      detach: {},
    });
  }

  public async config(config: Receiver_Config) {
    this.receiver_state.config = config;

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackReceiver] config on prepare state");
      return;
    }

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
      kind: this.kind,
      state: this.receiver_state,
    };
  }
}
