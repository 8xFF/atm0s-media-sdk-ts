import { EventEmitter } from "./utils";

export interface OutgoingSipCallStatus {
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

interface WsMessage {
    type: "Event",
    content: WsEvent,
}

export class SipOutgoingCall extends EventEmitter {
    _status: OutgoingSipCallStatus = { wsState: "WsConnecting" }
    wsConn: WebSocket;
    constructor(callWs: string) {
        super()
        this.wsConn = new WebSocket(callWs);
        this.wsConn.onopen = () => {
            this._status = {
                ...this._status,
                wsState: "WsConnected",
            };
            this.emit("status", this._status)
        };
        this.wsConn.onmessage = (msg) => {
            const json: WsMessage = JSON.parse(msg.data);
            switch (json.type) {
                case "Event":
                    const event = json.content as WsEvent;
                    switch (event.type) {
                        case "Sip":
                            this._status = {
                                ...this._status,
                                sipState: event.content?.type,
                                sipCode: event.content?.code,
                                sipCodeStr: event.content?.code ? (sipStatusCodes[event.content?.code] || 'Code ' + event.content.code) : undefined,
                            };

                            if (event.content?.type == 'Accepted') {
                                this._status.startedAt = Date.now();
                            }
                            this.emit("status", this._status)
                            break;
                        case "Error":
                            this.emit("error", event.message || 'Unknown error')
                            break;
                        case "Destroyed":
                            break;
                    }
                    break;
                default:
                    console.error("Invalid message:", json.type);
                    break;
            }
        };
        this.wsConn.onerror = (e) => {
            this.emit("error", "WsConnectError");
        };
        this.wsConn.onclose = () => {
            this._status = {
                ...this._status,
                wsState: "WsClosed",
            };
            this.emit("status", this._status)
        };
    }

    get status(): OutgoingSipCallStatus {
        return this._status;
    }

    end() {
        this.wsConn.close();
    }

    disconnect() {
        this.wsConn.close();
    }
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