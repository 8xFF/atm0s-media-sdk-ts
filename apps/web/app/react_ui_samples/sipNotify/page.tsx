"use client";

import { create_notify_ws } from "../../actions/sip";
import Content from "./content";
import { useState } from "react";

export default function SipIncoming({
  searchParams,
}: {
  searchParams: { server?: string };
}) {
  // Create a single session state object using the Session interface
  const [notifyWs, setNotifyWs] = useState<string | null>(null);
  const [client, setClient] = useState("");

  const handleCall = async () => {
    const notifyWs = await create_notify_ws({ client_id: client, ttl: 86400 });
    setNotifyWs(notifyWs);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100"> {/* Centering the form */}
      <form onSubmit={(e) => { e.preventDefault(); handleCall() }} className="bg-white p-4 rounded-lg shadow-md space-y-4 w-96"> {/* Reduced padding and width */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Show a Incoming SIP Call</h2> {/* Reduced title size */}
        <input
          type="text"
          placeholder="Client Id"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <button type="submit" className="button-class w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-200">Connect</button>
      </form>
      {notifyWs && <Content notifyWs={notifyWs} onEnd={() => setNotifyWs(null)} />} {/* Pass session object to Content */}
    </div>
  );
}
