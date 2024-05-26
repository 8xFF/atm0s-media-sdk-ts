import { generate_random_token } from "../../api_handler";
import EchoLazyContent from "./content";

export default async function EchoLazy() {
  const [room, peer, token] = await generate_random_token();
  return <EchoLazyContent room={room!} peer={peer!} token={token!} />;
}
