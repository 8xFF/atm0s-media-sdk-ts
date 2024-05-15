import {
  Sender,
  Kind,
  BitrateControlMode,
  Sender_State,
  Sender_Config,
} from "./generated/protobuf/shared";
import { Datachannel } from "./data";
import { kind_to_string, string_to_kind } from "./types";

const DEFAULT_CFG = {
  priority: 1,
  bitrate: BitrateControlMode.DYNAMIC_CONSUMERS,
  simulcast: false,
};

export interface TrackSenderConfig {
  priority: number;
  bitrate: BitrateControlMode;
  simulcast?: boolean;
}

export class TrackSender {
  sender_state: Sender_State;
  transceiver?: RTCRtpTransceiver;
  kind: Kind;
  track?: MediaStreamTrack;
  simulcast: boolean;

  constructor(
    private dc: Datachannel,
    private track_name: string,
    track_or_kind: MediaStreamTrack | Kind,
    cfg: TrackSenderConfig = DEFAULT_CFG,
  ) {
    console.log("[TrackSender] created", track_name, dc, track_or_kind);
    if (track_or_kind instanceof MediaStreamTrack) {
      this.track = track_or_kind;
      this.kind = string_to_kind(track_or_kind.kind as any);
    } else {
      this.kind = track_or_kind;
    }
    this.simulcast = !!cfg.simulcast;
    this.sender_state = {
      config: {
        priority: cfg.priority,
        bitrate: cfg.bitrate,
      },
      source: this.track
        ? {
            id: this.track.id,
            screen: false, //TODO check if it is screen
          }
        : undefined,
    };
  }

  get name(): string {
    return this.track_name;
  }

  get attached() {
    return !!this.track;
  }

  get state(): Sender {
    return {
      name: this.track_name,
      kind: this.kind,
      state: this.sender_state,
    };
  }

  /// We need lazy prepare for avoding error when sender track is changed before it connect.
  /// Config after init feature will be useful when complex application
  prepare(peer: RTCPeerConnection) {
    this.transceiver = peer.addTransceiver(
      this.track || kind_to_string(this.kind),
      {
        direction: "sendonly",
        sendEncodings: this.simulcast
          ? [
              { rid: "0", active: true },
              { rid: "1", active: true },
              { rid: "2", active: true },
            ]
          : undefined,
      },
    );
  }

  async attach(track: MediaStreamTrack) {
    if (this.track) {
      throw new Error("This sender already attached");
    }
    if (track.kind != kind_to_string(this.kind)) {
      throw new Error("Wrong track kind");
    }
    this.track = track;
    this.sender_state.source = {
      id: track.id,
      screen: false, //TODO check if it is screen
    };

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackSender] attach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.transceiver.sender.replaceTrack(track);
    return await this.dc.request_sender({
      name: this.track_name,
      attach: {
        config: this.sender_state.config,
        source: this.sender_state.source!,
      },
    });
  }

  async config(config: Sender_Config) {
    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackSender] config on prepare state");
      return;
    }

    if (!this.track) {
      throw new Error("This sender wasn't attach to any track");
    }

    this.sender_state.config = config;

    await this.dc.ready();
    return await this.dc.request_sender({
      name: this.track_name,
      config,
    });
  }

  async detach() {
    if (!this.track) {
      throw new Error("This sender wasn't attach to any track");
    }
    this.track = undefined;
    this.sender_state.source = undefined;

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackSender] detach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.transceiver.sender.replaceTrack(null);
    return await this.dc.request_sender({
      name: this.track_name,
      detach: {},
    });
  }
}
