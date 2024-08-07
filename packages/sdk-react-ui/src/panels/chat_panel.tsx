import { MessageChannelEvent } from "@atm0s-media-sdk/core";
import { useMessageChannel } from "@atm0s-media-sdk/react-hooks";
import { useRef, useState } from "react";

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
    <div className="flex flex-col w-full h-full p-3 mx-auto">
      <div id="chat-container" className="flex-1 w-full bg-base-300 p-2">
        {chats.map((c, i) => (
          <div key={i}>
            <b>{c.peer}:</b> {c.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
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
        </button>
      </div>
    </div>
  );
}
