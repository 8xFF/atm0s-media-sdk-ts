import { generate_random_token } from "../../actions/token";
import Content from "./content";

export default async function EchoRestartIce() {
  const [room, peer, token] = await generate_random_token();
  return <Content room={room!} peer={peer!} token={token!} />;
}
