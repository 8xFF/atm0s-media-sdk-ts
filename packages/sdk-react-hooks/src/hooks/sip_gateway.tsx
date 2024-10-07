import { useEffect, useState } from "react";

interface OutgoingSipCallStatus {
    wsState: "WsConnecting" | "WsConnected" | "WsClosed",
    sipState?: "Provisional" | "Early" | "Accepted" | "Failure" | "Bye",
    sipCode?: number,
    sipCodeStr?: string,
    startedAt?: number,
}

interface WsEvent {
    type: "Sip" | "Destroyed" | "Error",
    content?: {
        type: "Provisional" | "Early" | "Accepted" | "Failure" | "Bye",
        code?: number
    },
    message?: string,
}

export function useSipOutgoingCallStatus(
    ws: string,
): [OutgoingSipCallStatus, string | null] {
    const [status, setStatus] = useState<OutgoingSipCallStatus>({ wsState: "WsConnecting" });
    const [err, setErr] = useState<string | null>(null);
    useEffect(() => {
        let status: OutgoingSipCallStatus = { wsState: "WsConnecting" };
        const wsConn = new WebSocket(ws);
        wsConn.onopen = () => {
            status = {
                ...status,
                wsState: "WsConnected",
            };
            setStatus(status)
        };
        wsConn.onmessage = (msg) => {
            const json: WsEvent = JSON.parse(msg.data);
            switch (json.type) {
                case "Sip":
                    status = {
                        ...status,
                        sipState: json.content?.type,
                        sipCode: json.content?.code,
                        sipCodeStr: json.content?.code ? (sipStatusCodes[json.content?.code] || 'Code ' + json.content.code) : undefined,
                    };

                    if (json.content?.type == 'Accepted') {
                        status.startedAt = Date.now();
                    }
                    setStatus(status)
                    break;
                case "Error":
                    setErr(json.message || 'Unknown error')
                    break;
                case "Destroyed":
                    break;
            }
        };
        wsConn.onerror = (e) => {
            setErr("WsConnectError");
        };
        wsConn.onclose = () => {
            status = {
                ...status,
                wsState: "WsClosed",
            };
            setStatus(status)
        };

        return () => {
            wsConn.close();
        };
    }, [ws]);

    return [status, err];
}

const sipStatusCodes: Record<number, string> = {
    100: "Trying",
    180: "Ringing",
    181: "Call Is Being Forwarded",
    182: "Queued",
    183: "Session Progress",
    200: "OK",
    202: "Accepted",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Moved Temporarily",
    305: "Use Proxy",
    380: "Alternative Service",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Unsupported URI Scheme",
    420: "Bad Extension",
    421: "Extension Required",
    423: "Interval Too Brief",
    480: "Temporarily Unavailable",
    481: "Call/Transaction Does Not Exist",
    482: "Loop Detected",
    483: "Too Many Hops",
    484: "Address Incomplete",
    485: "Ambiguous",
    486: "Busy Here",
    487: "Request Terminated",
    488: "Not Acceptable Here",
    489: "Bad Event",
    491: "Request Pending",
    493: "Undecipherable",
    500: "Server Internal Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Server Time-out",
    505: "Version Not Supported",
    513: "Message Too Large",
    580: "Precondition Failure",
    600: "Busy Everywhere",
    603: "Decline",
    604: "Does Not Exist Anywhere",
    606: "Not Acceptable"
};