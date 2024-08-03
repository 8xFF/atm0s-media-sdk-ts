import { generate_random_token } from "../../actions/token";
import Content from "./content";

export default async function EchoFast({
  searchParams,
}: {
  searchParams: { server?: string };
}) {
  const [room, peer, token] = await generate_random_token(searchParams.server);
  return <Content room={room!} peer={peer!} token={token!} />;
}
