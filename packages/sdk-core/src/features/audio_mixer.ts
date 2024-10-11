import { Datachannel, DatachannelEvent } from "../data";
import {
  Config,
  ServerEvent,
  Mode as AudioMixerMode,
} from "../generated/protobuf/features.mixer";
import { ServerEvent_Receiver_VoiceActivity } from "../generated/protobuf/session";
import { Receiver_Source as AudioMixerSource } from "../generated/protobuf/shared";
import { TrackReceiver, TrackReceiverEvent } from "../receiver";
import { Session } from "../session";
import { Kind } from "../types";
import { EventEmitter } from "../utils";
import {
  MediaStream,
} from 'react-native-webrtc';
export enum AudioMixerEvent {
  OUTPUT_CHANGED = "features.mixer.output_changed",
  VOICE_ACTIVITY = "feature.mixer.voice_activity",
  PEER_VOICE_ACTIVITY = "feature.mixer.peers.voice_activity.",
}

export type AudioMixerOutputChanged = OutputSlot[];

export interface AudioMixerVoiceActivity {
  peer: string;
  track: string;
  active: boolean;
  audio_level?: number;
}

export interface AudioMixerPeerVoiceActivity {
  track: string;
  active: boolean;
  audio_level?: number;
}

export interface AudioMixerConfig {
  mode: AudioMixerMode;
  outputs: number;
  sources?: AudioMixerSource[];
}

interface OutputSlot {
  source?: AudioMixerSource;
}

export class AudioMixer extends EventEmitter {
  mode: AudioMixerMode;
  receivers: TrackReceiver[] = [];
  sources: AudioMixerSource[];
  outputs: OutputSlot[] = [{}, {}, {}];

  constructor(
    session: Session,
    private dc: Datachannel,
    config: AudioMixerConfig,
  ) {
    super();
    this.mode = config.mode;
    for (let i = 0; i < config.outputs; i++) {
      let receiver = session.receiver(Kind.AUDIO);
      receiver.on(TrackReceiverEvent.VoiceActivity, (event: any) => {
        this._onReceiverVoiceActivity(i, event);
      });
      this.receivers.push(receiver);
    }
    this.sources = config.sources || [];
    dc.on(DatachannelEvent.FEATURE_MIXER, this._onMixerEvent);
  }

  //TODO reconfig when we re-join room
  public reconfig(config: AudioMixerConfig) {
    console.log("reconfig mixer with config", config);
  }

  public state(): Config {
    return {
      mode: this.mode,
      outputs: this.receivers.map((r) => r.name),
      sources: this.sources,
    };
  }

  public streams(): MediaStream[] {
    return this.receivers.map((r) => r.stream);
  }

  public attach(sources: AudioMixerSource[]) {
    const req_srcs: AudioMixerSource[] = [];
    for (const i in sources) {
      const source: AudioMixerSource = sources[i]!;
      const existed = this.sources.find((s) => {
        return s.peer == source.peer && s.track == source.track;
      });
      if (!existed) {
        this.sources.push(source);
        req_srcs.push(source);
      }
    }
    return this.dc.requestMixer({
      attach: {
        sources: req_srcs,
      },
    });
  }

  public detach(sources: AudioMixerSource[]) {
    const req_srcs: AudioMixerSource[] = [];
    for (const i in sources) {
      const source: AudioMixerSource = sources[i]!;
      const existed = this.sources.findIndex((s) => {
        return s.peer == source.peer && s.track == source.track;
      });
      if (existed != -1) {
        this.sources.splice(existed, 1);
        req_srcs.push(source);
      }
    }

    return this.dc.requestMixer({
      detach: {
        sources: req_srcs,
      },
    });
  }

  // We need to reset local state when leave room
  public leave_room() {
    this.outputs = [{}, {}, {}];
    this.sources = [];
    this.emit(AudioMixerEvent.OUTPUT_CHANGED, this.outputs);
  }

  _onReceiverVoiceActivity = (
    slot: number,
    activity: ServerEvent_Receiver_VoiceActivity,
  ) => {
    let output_source = this.outputs[slot];
    if (output_source?.source) {
      this._fireVoiceEvent(output_source.source, true, activity.audioLevel);
    }
  };

  _onMixerEvent = (event: ServerEvent) => {
    if (event.slotSet) {
      let output_source = this.outputs[event.slotSet.slot]?.source;
      // if this slot already set to other => reset it
      if (output_source) {
        this._fireVoiceEvent(output_source, false);
      }
      this.outputs[event.slotSet.slot] = { source: event.slotSet.source! };
      this.emit(AudioMixerEvent.OUTPUT_CHANGED, this.outputs);
      this._fireVoiceEvent(event.slotSet.source!, true);
    } else if (event.slotUnset) {
      let output_source = this.outputs[event.slotUnset.slot]?.source;
      if (output_source) {
        this.outputs[event.slotUnset.slot]!.source = undefined;
        this._fireVoiceEvent(output_source, false);
        this.emit(AudioMixerEvent.OUTPUT_CHANGED, this.outputs);
      }
    }
  };

  _fireVoiceEvent(
    source: AudioMixerSource,
    active: boolean,
    audio_level?: number,
  ) {
    this.emit(AudioMixerEvent.VOICE_ACTIVITY, {
      peer: source.peer,
      track: source.track,
      active,
      audio_level,
    });
    this.emit(AudioMixerEvent.PEER_VOICE_ACTIVITY + source.peer, {
      track: source.track,
      active,
      audio_level,
    });
  }
}
