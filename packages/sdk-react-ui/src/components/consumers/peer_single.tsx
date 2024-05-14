import {
  RemotePeer,
  useRemoteVideoTracks,
} from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { VideoSingle } from "./video_single";

interface Props {
  peer: RemotePeer;
}

export function PeerSingle({ peer }: Props) {
  const remote_videos = useRemoteVideoTracks(peer.peer);
  return (
    <div className="relative">
      <span>{peer.peer}</span>
      {remote_videos.map((t) => (
        <VideoSingle key={t.track} track={t} />
      ))}
    </div>
  );
}
