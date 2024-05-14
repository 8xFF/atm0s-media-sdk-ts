import { useRemoteVideoTracks } from "@atm0s-media-sdk/sdk-react-hooks/lib";
import { VideoSingle } from "./video_single";

interface Props {}

export function VideoPannel({}: Props) {
  const remote_videos = useRemoteVideoTracks();
  return (
    <div>
      {remote_videos.map((t) => (
        <VideoSingle key={t.peer} track={t} />
      ))}
    </div>
  );
}
