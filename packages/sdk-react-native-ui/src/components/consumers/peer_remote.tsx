import {
  RemotePeer,
  useRemoteAudioTracks,
  useRemoteVideoTracks,
} from "@atm0s-media-sdk/react-hooks";
import { AudioRemote } from "./audio_remote";
import { VideoRemote } from "./video_remote";
import { AudioMixerSpeaking } from "../uis/audio_mixer_speaking";
import { Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface Props {
  peer: RemotePeer;
}

export function PeerRemoteDirectAudio({ peer }: Props) {
  const remote_audios = useRemoteAudioTracks(peer.peer);
  const remote_videos = useRemoteVideoTracks(peer.peer);

  return (
    <View style={{
      width: '50%', height: 200, flex: 1, justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text>{peer.peer}</Text>
      {remote_videos.map((t) => (
        <VideoRemote key={t.track} track={t} />
      ))}
      {remote_audios.map((t) => (
        <AudioRemote key={t.track} track={t} />
      ))}
    </View>
  );
}

export function PeerRemoteMixerAudio({ peer }: Props) {
  const remote_videos = useRemoteVideoTracks(peer.peer);

  return (
    <View style={{
      width: '50%', height: 200, flex: 1, justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{ flexDirection: 'row' }}>
        <Text>
          {peer.peer}
        </Text>
        <AudioMixerSpeaking peer={peer.peer}>
          <Icon name="text-to-speech" size={24} />
        </AudioMixerSpeaking>
      </View>
      {remote_videos.map((t) => (
        <VideoRemote key={t.track} track={t} />
      ))}
    </View>
  );
}
