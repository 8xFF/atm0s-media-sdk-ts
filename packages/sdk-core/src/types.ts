import { Kind } from "./generated/protobuf/shared";

export {
  BitrateControlMode,
  Sender_Config,
  Kind,
} from "./generated/protobuf/shared";

export function kindToString(kind: Kind): "audio" | "video" {
  return kind == Kind.AUDIO ? "audio" : "video";
}

export function stringToKind(kind: "audio" | "video"): Kind {
  return kind == "audio" ? Kind.AUDIO : Kind.VIDEO;
}
