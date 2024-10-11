import { useMixer } from "@atm0s-media-sdk/react-hooks";
import React from "react";
import { useEffect, useRef } from "react";
import { View } from "react-native";

export function AudioMixerPlayer() {
  // const mixer = useMixer();
  // const audio1Ref = useRef<HTMLAudioElement>(null);
  // const audio2Ref = useRef<HTMLAudioElement>(null);
  // const audio3Ref = useRef<HTMLAudioElement>(null);

  // useEffect(() => {
  //   if (audio1Ref.current && mixer) {
  //     audio1Ref.current.srcObject = mixer.streams()[0] || null;
  //   }
  // }, [mixer, audio1Ref.current]);

  // useEffect(() => {
  //   if (audio2Ref.current && mixer) {
  //     audio2Ref.current.srcObject = mixer.streams()[1] || null;
  //   }
  // }, [mixer, audio1Ref.current]);

  // useEffect(() => {
  //   if (audio3Ref.current && mixer) {
  //     audio3Ref.current.srcObject = mixer.streams()[2] || null;
  //   }
  // }, [mixer, audio3Ref.current]);

  return (
    <View>
      {/* <audio autoPlay ref={audio1Ref} />
      <audio autoPlay ref={audio2Ref} />
      <audio autoPlay ref={audio3Ref} /> */}
    </View>
  );
}
