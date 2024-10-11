import {
  Receiver,
  Kind,
  Receiver_Config,
  Receiver_Source,
  Receiver_State,
} from "./generated/protobuf/shared";
import { EventEmitter, ReadyWaiter } from "./utils";
import { Datachannel, DatachannelEvent } from "./data";
import { kindToString } from "./types";
import { ServerEvent_Receiver } from "./generated/protobuf/session";
import { TrackReceiverStatus } from "./lib";
import {
  RTCPeerConnection,
  MediaStream,
  MediaStreamTrack,
  RTCRtpTransceiver
} from 'react-native-webrtc';

const DEFAULT_CFG = {
  priority: 1,
  maxSpatial: 2,
  maxTemporal: 2,
};

export enum TrackReceiverEvent {
  StatusUpdated = "StatusUpdated",
  VoiceActivity = "VoiceActivity",
}

export class TrackReceiver extends EventEmitter {
  transceiver?: RTCRtpTransceiver;
  waiter: ReadyWaiter = new ReadyWaiter();
  media_stream: MediaStream;
  media_track?: MediaStreamTrack;
  receiver_state: Receiver_State = { config: undefined, source: undefined };
  _status?: TrackReceiverStatus;

  constructor(
    private dc: Datachannel,
    private track_name: string,
    private _kind: Kind,
  ) {
    super();
    this.media_stream = new MediaStream();
    console.log("[TrackReceiver] create ", track_name, dc);
    this.dc.on(
      DatachannelEvent.RECEIVER + track_name,
      (event: ServerEvent_Receiver) => {
        if (event.state) {
          this._status = event.state.status;
          this.emit(TrackReceiverEvent.StatusUpdated, this._status);
        } else if (event.voiceActivity) {
          this.emit(TrackReceiverEvent.VoiceActivity, event.voiceActivity);
        }
      },
    );
  }

  public get kind() {
    return this._kind;
  }

  public get webrtcTrackId() {
    return this.media_track?.id;
  }

  public get status(): TrackReceiverStatus | undefined {
    return this.status;
  }

  public setTrackReady() {
    this.waiter.setReady();
  }

  public async ready() {
    return this.waiter.waitReady();
  }

  /// We need lazy prepare for avoding error when sender track is changed before it connect.
  /// Config after init feature will be useful when complex application
  prepare(peer: RTCPeerConnection) {
    this.transceiver = peer.addTransceiver(kindToString(this._kind), {
      direction: "recvonly",
    });
    if (this.transceiver.receiver.track)
      this.media_stream.addTrack(this.transceiver.receiver.track);
    if (this.transceiver.receiver.track)
      this.media_track = this.transceiver.receiver.track;
  }

  /// We need update stream with newest track
  afterRestartIce() {
    let old_track = this.media_stream.getTracks()[0]!;
    let new_track = this.transceiver!.receiver.track;
    this.media_stream.removeTrack(old_track);
    if (new_track)
      this.media_stream.addTrack(new_track);
  }

  public async attach(
    source: Receiver_Source,
    config: Receiver_Config = DEFAULT_CFG,
  ) {
    this.receiver_state.config = config;
    this.receiver_state.source = source;
    this._status = TrackReceiverStatus.WAITING;
    this.emit(TrackReceiverEvent.StatusUpdated, this._status);

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackReceiver] attach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.ready();
    await this.dc.requestReceiver({
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
    delete this._status;
    this.emit(TrackReceiverEvent.StatusUpdated, undefined);

    //if we in prepare state, we dont need to access to server, just update local
    if (!this.transceiver) {
      console.log("[TrackReceiver] detach on prepare state");
      return;
    }

    await this.dc.ready();
    await this.ready();
    await this.dc.requestReceiver({
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
    await this.dc.requestReceiver({
      name: this.track_name,
      config,
    });
  }

  // We need to reset local state when leave room
  public leaveRoom() {
    this.receiver_state.source = undefined;
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
