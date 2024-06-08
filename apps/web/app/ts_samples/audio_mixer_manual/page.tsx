import { generate_token } from "../../actions/token";
import AudioMixerManualContent from "./content";

export default async function AudioMixerManual() {
  const room = "audio-mixer-room-manual";
  const peer = "peer-" + new Date().getTime();
  const token = await generate_token(room, peer);
  return <AudioMixerManualContent room={room!} peer={peer!} token={token!} />;
}
