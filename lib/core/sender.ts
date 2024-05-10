import {
  Sender,
  Kind,
  BitrateControlMode,
  Sender_State,
} from "../generated/protobuf/shared";
import { Datachannel } from "./data";
import { MediaKind } from "./types";

export class TrackSender {
  sender_state: Sender_State;

  constructor(
    private dc: Datachannel,
    private transceiver: RTCRtpTransceiver,
    private track_name: string,
    private kind: MediaKind,
    priority: number,
    bitrate?: BitrateControlMode,
  ) {
    console.log("[TrackSender] ", track_name, dc);
    this.sender_state = {
      config: {
        priority,
        bitrate,
      },
      source: transceiver.sender.track
        ? {
            id: transceiver.sender.track.id,
            screen: false, //TODO check if it is screen
          }
        : undefined,
    };
  }

  get name(): string {
    return this.track_name;
  }

  get attached() {
    return !!this.transceiver.sender.track;
  }

  get state(): Sender {
    return {
      name: this.track_name,
      kind: this.kind == "audio" ? Kind.AUDIO : Kind.VIDEO,
      state: this.sender_state,
    };
  }

  async attach(track: MediaStreamTrack) {
    if (!!this.transceiver.sender.track) {
      throw new Error("This sender already attached");
    }
    if (track.kind != this.kind) {
      throw new Error("Wrong track kind");
    }
    this.transceiver.sender.replaceTrack(track);
    this.sender_state.source = {
      id: track.id,
      screen: false, //TODO check if it is screen
    };
    return await this.dc.request_sender({
      name: this.track_name,
      attach: {
        config: this.sender_state.config,
        source: this.sender_state.source!,
      },
    });
  }

  async detach() {
    if (!this.transceiver.sender.track) {
      throw new Error("This sender wasn't attach to any track");
    }
    this.transceiver.sender.replaceTrack(null);
    this.sender_state.source = undefined;
    return await this.dc.request_sender({
      name: this.track_name,
      detach: {},
    });
  }
}
