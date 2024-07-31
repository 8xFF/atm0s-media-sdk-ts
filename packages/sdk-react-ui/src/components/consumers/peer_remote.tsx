import {
  RemotePeer,
  useRemoteAudioTracks,
  useRemoteVideoTracks,
} from "@atm0s-media-sdk/react-hooks";
import { AudioRemote } from "./audio_remote";
import { VideoRemote } from "./video_remote";
import { AudioMixerSpeaking } from "../uis/audio_mixer_speaking";
import { SpeakingIcon } from "../icons/speaking";

interface Props {
  peer: RemotePeer;
}

export function PeerRemoteDirectAudio({ peer }: Props) {
  const remote_audios = useRemoteAudioTracks(peer.peer);
  const remote_videos = useRemoteVideoTracks(peer.peer);

  return (
    <div className="relative bg-gray-500">
      <span className="absolute left-2 top-2">{peer.peer}</span>
      {remote_videos.map((t) => (
        <VideoRemote key={t.track} track={t} />
      ))}
      {remote_audios.map((t) => (
        <AudioRemote key={t.track} track={t} />
      ))}
    </div>
  );
}

export function PeerRemoteMixerAudio({ peer }: Props) {
  const remote_videos = useRemoteVideoTracks(peer.peer);

  return (
    <div className="relative bg-gray-500">
      <span className="absolute left-2 top-2">
        {peer.peer}
        <AudioMixerSpeaking peer={peer.peer}>
          <SpeakingIcon />
        </AudioMixerSpeaking>
      </span>
      {remote_videos.map((t) => (
        <VideoRemote key={t.track} track={t} />
      ))}
    </div>
  );
}
