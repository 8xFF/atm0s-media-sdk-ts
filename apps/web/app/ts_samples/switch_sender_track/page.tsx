import { generate_random_token } from "../../api_handler";
import Content from "./content";

export default async function SwitchSenderTrack() {
  const [room, peer, token] = await generate_random_token();
  return <Content room={room!} peer={peer!} token={token!} />;
}
