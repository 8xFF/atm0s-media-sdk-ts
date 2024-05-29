import { AppToken, Gateways } from "./constants";

export async function generate_token(
  room: string,
  peer: string,
): Promise<string> {
  console.log("create token");
  const rawResponse = await fetch(Gateways[0]! + "/token/webrtc", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + AppToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ room, peer, ttl: 7200 }),
    cache: "no-cache",
  });
  const content = await rawResponse.json();
  return content.data.token;
}

export async function generate_random_token() {
  console.log("create token");
  const now = new Date().getTime();
  const room = "room-" + now;
  const peer = "peer-" + now;
  return [room, peer, await generate_token(room, peer)];
}
