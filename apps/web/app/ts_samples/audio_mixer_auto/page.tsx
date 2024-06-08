import { generate_token } from "../../actions/token";
import AudioMixerContent from "./content";

export default async function AudioMixer() {
  const room = "audio-mixer-room-auto";
  const peer = "peer-" + new Date().getTime();
  const token = await generate_token(room, peer);
  return <AudioMixerContent room={room!} peer={peer!} token={token!} />;
}
