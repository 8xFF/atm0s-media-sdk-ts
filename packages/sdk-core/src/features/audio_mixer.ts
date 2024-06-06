import {
  Config,
  Mode as AudioMixerMode,
} from "../generated/protobuf/features_mixer";
import { Receiver_Source as AudioMixerSource } from "../generated/protobuf/shared";
import { TrackReceiver } from "../receiver";
import { Session } from "../session";
import { Kind } from "../types";

export interface AudioMixerConfig {
  mode: AudioMixerMode;
  outputs: number;
  sources?: AudioMixerSource[];
}

export class AudioMixer {
  mode: AudioMixerMode;
  receivers: TrackReceiver[] = [];
  sources: AudioMixerSource[];

  constructor(session: Session, config: AudioMixerConfig) {
    this.mode = config.mode;
    for (let i = 0; i < config.outputs; i++) {
      let receiver = session.receiver(Kind.AUDIO);
      this.receivers.push(receiver);
    }
    this.sources = config.sources || [];
  }

  state(): Config {
    return {
      mode: this.mode,
      outputs: this.receivers.map((r) => r.name),
      sources: this.sources,
    };
  }

  streams(): MediaStream[] {
    return this.receivers.map((r) => r.stream);
  }
}
