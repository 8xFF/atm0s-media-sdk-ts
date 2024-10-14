import {
  Sender,
  Kind,
  BitrateControlMode,
  Sender_State,
  Sender_Config,
} from "./generated/protobuf/shared";
import { Datachannel, DatachannelEvent } from "./data";
import { kindToString, stringToKind } from "./types";
import { ServerEvent_Sender } from "./generated/protobuf/session";
import { EventEmitter } from "./utils";
import { TrackSenderStatus } from "./lib";
import {
  RTCPeerConnection,
  MediaStreamTrack,
  RTCRtpTransceiver
} from 'react-native-webrtc';

const DEFAULT_CFG = {
  priority: 1,
  bitrate: BitrateControlMode.DYNAMIC_CONSUMERS,
  simulcast: false,
};

export enum TrackSenderEvent {
  StatusUpdated = "StatusUpdated",
}

export interface TrackSenderConfig {
  priority: number;
  bitrate: BitrateControlMode;
  simulcast?: boolean;
  metadata?: string;
}

export class TrackSender extends EventEmitter {
  sender_state: Sender_State;
  transceiver?: RTCRtpTransceiver;
  kind: Kind;
  track?: MediaStreamTrack;
  simulcast: boolean;
  _status?: TrackSenderStatus;

  constructor(
    private dc: Datachannel,
    private track_name: string,
    track_or_kind: MediaStreamTrack | Kind,
    cfg: TrackSenderConfig = DEFAULT_CFG,
  ) {
    super();
    console.log("[TrackSender] created", track_name, dc, track_or_kind);
    if (track_or_kind instanceof MediaStreamTrack) {
      this.track = track_or_kind;
      this.kind = stringToKind(track_or_kind.kind as any);
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
          metadata: cfg.metadata,
        }
        : undefined,
    };
    this.dc.on(
      DatachannelEvent.SENDER + track_name,
      (event: ServerEvent_Sender) => {
        if (event.state) {
          this._status = event.state.status;
          this.emit(TrackSenderEvent.StatusUpdated, this._status);
        }
      },
    );
  }

  public get name(): string {
    return this.track_name;
  }

  public get status(): TrackSenderStatus | undefined {
    return this.status;
  }

  public get attached() {
    return !!this.track;
  }

  public get state(): Sender {
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
      this.track || kindToString(this.kind),
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

  public async attach(track: MediaStreamTrack, metadata?: string) {
    if (this.track) {
      throw new Error("This sender already attached");
    }
    if (track.kind != kindToString(this.kind)) {
      throw new Error("Wrong track kind");
    }
    this.track = track;
    this.sender_state.source = {
      id: track.id,
      screen: false, //TODO check if it is screen
      metadata,
    };

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackSender] attach on prepare state");
      return;
    }

    this._status = undefined;
    this.emit(TrackSenderEvent.StatusUpdated, this._status);
    await this.dc.ready();
    await this.transceiver.sender.replaceTrack(track);
    return await this.dc.requestSender({
      name: this.track_name,
      attach: {
        config: this.sender_state.config,
        source: this.sender_state.source!,
      },
    });
  }

  public async config(config: Sender_Config) {
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
    return await this.dc.requestSender({
      name: this.track_name,
      config,
    });
  }

  public async detach() {
    if (!this.track) {
      throw new Error("This sender wasn't attach to any track");
    }
    this.track = undefined;
    this.sender_state.source = undefined;
    this._status = undefined;
    this.emit(TrackSenderEvent.StatusUpdated, this._status);

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackSender] detach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.transceiver.sender.replaceTrack(null);
    return await this.dc.requestSender({
      name: this.track_name,
      detach: {},
    });
  }
}
