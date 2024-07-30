export { Session, SessionEvent } from "./session";
export { TrackSender, TrackSenderEvent } from "./sender";
export type { TrackSenderConfig } from "./sender";
export { TrackReceiver, TrackReceiverEvent } from "./receiver";
export * from "./events";
export { EventEmitter } from "./utils";

import {
  SessionConfig as SessionConfigRaw,
  JoinInfo as JoinInfoRaw,
} from "./session";

export type {
  AudioMixerConfig,
  AudioMixer,
  AudioMixerVoiceActivity,
  AudioMixerPeerVoiceActivity,
  AudioMixerOutputChanged,
} from "./features/audio_mixer";

export { AudioMixerEvent } from "./features/audio_mixer";

export type {
  RoomMessageChannel,
  MessageChannelConfig,
  MessageChannelEvent,
} from "./features/msg_channel";

export {
  BitrateControlMode,
  Sender_Config,
  stringToKind,
  kindToString,
  Kind,
} from "./types";
export type SessionConfig = SessionConfigRaw;
export type JoinInfo = JoinInfoRaw;

export {
  Receiver_Status as TrackReceiverStatus,
  Sender_Status as TrackSenderStatus,
} from "./generated/protobuf/shared";

export { ServerEvent_Receiver_VoiceActivity as TrackReceiverVoiceActivity } from "./generated/protobuf/session";

export { Mode as AudioMixerMode } from "./generated/protobuf/features.mixer";
export { Receiver_Source as AudioMixerSource } from "./generated/protobuf/shared";
