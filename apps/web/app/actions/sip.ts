"use server";

import { env } from "../env";
import { generate_random_token } from "./token";

interface MakeCallParams {
    sip_server: string;
    sip_auth?: {
        username: string;
        password: string;
    };
    from_number: string;
    to_number: string;
    hook: string;
}

interface MakeCallResponse {
    status: boolean,
    data?: {
        gateway: string,
        call_id: string,
        call_token: string,
        call_ws: string
    },
    error?: string
}

export async function make_outgoing_call(params: MakeCallParams) {
    console.log("Creating webrtc token");
    const [room, peer, token] = await generate_random_token();
    const url = env.SIP_GATEWAY + "/call";
    const rawResponse = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + env.APP_SECRET,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...params,
            streaming: {
                room,
                peer: params.to_number,
                record: false,
            },
        }),
        cache: "no-cache",
    });

    const content = await rawResponse.json() as MakeCallResponse;
    if (content.status && content.data) {
        return {
            room: room!,
            peer: peer!,
            token: token!,
            callTo: params.to_number,
            callWs: content.data.call_ws,
        }
    } else {
        throw new Error(content.error);
    }
}