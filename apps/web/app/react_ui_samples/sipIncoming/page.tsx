"use client";

import { generate_random_token } from "../../actions/token";
import Content, { IncomingCallPanelProps } from "./content";
import { useState } from "react";

export default function SipIncoming({
  searchParams,
}: {
  searchParams: { server?: string };
}) {
  // Create a single session state object using the Session interface
  const [session, setSession] = useState<IncomingCallPanelProps | null>(null);

  const [callWs, setCallWs] = useState("");
  const [callFrom, setCallFrom] = useState("");
  const [record, setRecord] = useState(false);

  const handleCall = async () => {
    const [room, peer, token] = await generate_random_token();
    setSession({
      callFrom,
      callWs,
      room,
      peer,
      token,
      record,
    })
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100"> {/* Centering the form */}
      <form onSubmit={(e) => { e.preventDefault(); handleCall(); }} className="bg-white p-4 rounded-lg shadow-md space-y-4 w-96"> {/* Reduced padding and width */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Show a Incoming SIP Call</h2> {/* Reduced title size */}
        <input
          type="text"
          placeholder="Websocket Call URL"
          value={callWs}
          onChange={(e) => setCallWs(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <input
          type="text"
          placeholder="Call From"
          value={callFrom}
          onChange={(e) => setCallFrom(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={record}
            onChange={(e) => setRecord(e.target.checked)}
            className="mr-2"
          />
          <label className="text-gray-700">Record Call</label>
        </div>

        <button type="submit" className="button-class w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-200">Show</button>
      </form>
      {session && <Content {...session} onEnd={() => setSession(null)} />} {/* Pass session object to Content */}
    </div>
  );
}
