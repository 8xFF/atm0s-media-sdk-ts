import { generate_random_token } from "../../api_handler";
import EchoFastContent from "./content";

export default async function EchoFast() {
  const [room, peer, token] = await generate_random_token();
  return <EchoFastContent room={room!} peer={peer!} token={token!} />;
}
