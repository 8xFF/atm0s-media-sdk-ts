import {
  RemotePeer,
  useRemoteAudioTracks,
  useRemoteVideoTracks,
} from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { AudioRemote } from "./audio_remote";
import { VideoRemote } from "./video_remote";

interface Props {
  peer: RemotePeer;
  audio?: boolean;
}

export function PeerRemote({ peer, audio }: Props) {
  const remote_audios = useRemoteAudioTracks(peer.peer);
  const remote_videos = useRemoteVideoTracks(peer.peer);
  console.log("audio:", audio, remote_videos, remote_audios);
  return (
    <div className="relative bg-gray-500">
      <span className="absolute left-2 top-2">{peer.peer}</span>
      {remote_videos.map((t) => (
        <VideoRemote key={t.track} track={t} />
      ))}
      {audio &&
        remote_audios.map((t) => <AudioRemote key={t.track} track={t} />)}
    </div>
  );
}
