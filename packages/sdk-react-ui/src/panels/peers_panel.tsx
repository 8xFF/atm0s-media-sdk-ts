import { useRemotePeers } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { PeerSingle } from "../components/consumers/peer_single";

interface Props {}

export function PeersPanel({}: Props) {
  const remote_peers = useRemotePeers();
  return (
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-4">
      {remote_peers.map((p) => (
        <PeerSingle key={p.peer} peer={p} />
      ))}
    </div>
  );
}
