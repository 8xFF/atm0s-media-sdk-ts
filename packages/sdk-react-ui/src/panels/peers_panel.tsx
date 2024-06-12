import { useRemotePeers, useRoom } from "@atm0s-media-sdk/react-hooks/lib";
import {
  PeerRemoteDirectAudio,
  PeerRemoteMixerAudio,
} from "../components/consumers/peer_remote";
import { PeerLocal } from "../components/consumers/peer_local";
import { AudioMixerPlayer } from "../lib";

interface Props {
  /// Default is false, in this mode audio mix-minus will be used
  /// If is true, it will create separated audio receivers for each peers,
  /// this is not recommend for large conference
  audio_direct?: boolean;

  /// Show local peer or not
  my_video?: string;
}

export function PeersPanel({ audio_direct, my_video }: Props) {
  const room = useRoom();
  const remote_peers = useRemotePeers();
  return (
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-4">
      {my_video && <PeerLocal video={my_video} />}
      {remote_peers
        .filter((p) => p.peer != room?.peer)
        .map((p) =>
          audio_direct ? (
            <PeerRemoteDirectAudio key={p.peer} peer={p} />
          ) : (
            <PeerRemoteMixerAudio key={p.peer} peer={p} />
          ),
        )}
      {!audio_direct && <AudioMixerPlayer />}
    </div>
  );
}
