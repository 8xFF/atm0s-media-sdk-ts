import { Sender, Kind, BitrateControlMode } from "../generated/protobuf/shared";
import { Datachannel } from "./data";
import { MediaKind } from "./types";

export class TrackSender {
  constructor(
    dc: Datachannel,
    private track_name: string,
    private kind: MediaKind,
    private priority: number,
    _transceiver: RTCRtpTransceiver,
  ) {
    console.log("[TrackSender] ", track_name, dc);
  }

  get name(): string {
    return this.track_name;
  }

  get state(): Sender {
    return {
      name: this.track_name,
      kind: this.kind == "audio" ? Kind.AUDIO : Kind.VIDEO,
      state: {
        config: {
          priority: this.priority,
          bitrate: BitrateControlMode.DYNAMIC_CONSUMERS, //TODO allow config
        },
      },
    };
  }
}
