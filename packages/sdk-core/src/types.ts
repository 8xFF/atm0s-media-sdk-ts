import { Kind } from "./generated/protobuf/shared";

export {
  BitrateControlMode,
  Sender_Config,
  Kind,
} from "./generated/protobuf/shared";

export function kind_to_string(kind: Kind): "audio" | "video" {
  return kind == Kind.AUDIO ? "audio" : "video";
}

export function string_to_kind(kind: "audio" | "video"): Kind {
  return kind == "audio" ? Kind.AUDIO : Kind.VIDEO;
}
