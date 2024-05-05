import { Receiver, Kind } from "../generated/protobuf/shared";
import { Datachannel } from "./data";
import { MediaKind } from "./types";

export class TrackReceiver {
  media_stream: MediaStream;

  constructor(
    dc: Datachannel,
    private track_name: string,
    private kind: MediaKind,
    private priority: number,
    _transceiver: RTCRtpTransceiver,
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
    this.media_stream.addTrack(track);
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
        config: {
          priority: this.priority,
          maxSpatial: 2,
          maxTemporal: 2,
        },
      },
    };
  }
}
