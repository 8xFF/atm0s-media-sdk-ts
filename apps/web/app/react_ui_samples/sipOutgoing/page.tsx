"use client";

import { generate_random_token } from "../../actions/token";
import { make_outgoing_call } from "../../actions/sip"; // Import the server action
import Content, { OutgoingCallPanelProps } from "./content";
import { useState } from "react";

export default function SipOutgoing({
  searchParams,
}: {
  searchParams: { server?: string };
}) {
  // New state variables for the input form
  const [sipServer, setSipServer] = useState("");
  const [sipUser, setSipUser] = useState("");
  const [sipPassword, setSipPassword] = useState("");
  const [sipFrom, setSipFrom] = useState("");
  const [sipTo, setSipTo] = useState("");
  const [sipHook, setSipHook] = useState("");

  const [outgoingProps, setOutgoingProps] = useState<OutgoingCallPanelProps | null>(null)

  // Function to handle the call button click
  const handleCall = async () => {
    const props = await make_outgoing_call({
      sip_server: sipServer,
      sip_auth: sipUser ? {
        username: sipUser,
        password: sipPassword,
      } : undefined,
      from_number: sipFrom,
      to_number: sipTo,
      hook: sipHook,
    });
    // Logic to display the outgoing call with callWs and streamingToken
    setOutgoingProps(props)
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100"> {/* Centering the form */}
      <form onSubmit={(e) => { e.preventDefault(); handleCall(); }} className="bg-white p-4 rounded-lg shadow-md space-y-4 w-96"> {/* Reduced padding and width */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Make a SIP Call</h2> {/* Reduced title size */}
        <input
          type="text"
          placeholder="SIP Server"
          value={sipServer}
          onChange={(e) => setSipServer(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <input
          type="text"
          placeholder="SIP User"
          value={sipUser}
          onChange={(e) => setSipUser(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <input
          type="password"
          placeholder="SIP Password"
          value={sipPassword}
          onChange={(e) => setSipPassword(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <input
          type="text"
          placeholder="SIP From"
          value={sipFrom}
          onChange={(e) => setSipFrom(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <input
          type="text"
          placeholder="SIP To"
          value={sipTo}
          onChange={(e) => setSipTo(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <input
          type="text"
          placeholder="SIP Hook"
          value={sipHook}
          onChange={(e) => setSipHook(e.target.value)}
          className="input-class p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" // Reduced padding
        />
        <button type="submit" className="button-class w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-200">Call</button> {/* Reduced button padding */}
      </form>

      {outgoingProps && <Content {...outgoingProps} onEnd={() => setOutgoingProps(null)} />}
    </div>
  );
}
