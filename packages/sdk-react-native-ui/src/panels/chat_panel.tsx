import { MessageChannelEvent } from "@atm0s-media-sdk/core";
import { useMessageChannel } from "@atm0s-media-sdk/react-hooks";
import { useRef, useState } from "react";
import { View } from "react-native";

interface Message {
  peer: string;
  message: string;
}

interface Props {
  channel: string;
}

export function ChatPanel({ channel }: Props) {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [chats, setChats] = useState<Message[]>([]);
  const msgChannel = useMessageChannel(channel, (e: MessageChannelEvent) => {
    setChats((chats) => [
      ...chats,
      { peer: e.peer, message: e.message as string },
    ]);
  });

  return (
    <View>
      <View id="chat-container">
        {chats.map((c, i) => (
          <View key={i}>
            <b>{c.peer}:</b> {c.message}
          </View>
        ))}
      </View>
      <View>
        {/* <input
          id="chat-input"
          className="flex-1 p-2 rounded"
          onKeyUp={(e) => {
            if (e.key === "Enter" && chatInputRef.current?.value) {
              msgChannel?.publish(chatInputRef.current.value);
              chatInputRef.current.value = "";
            }
          }}
          ref={chatInputRef}
        />
        <button
          id="send"
          className="btn"
          onClick={() => {
            if (chatInputRef.current?.value) {
              msgChannel?.publish(chatInputRef.current.value);
              chatInputRef.current.value = "";
            }
          }}
        >
          Send
        </button> */}
      </View>
    </View>
  );
}
