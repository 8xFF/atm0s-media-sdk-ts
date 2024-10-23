import { OutgoingCallData } from "./generated/protobuf/sip_gateway";
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
    reqIdSeed = 1;
    reqs: Map<number, [() => void, (err: Error) => void]> = new Map();

    constructor(callWs: string) {
        super()
        this.wsConn = new WebSocket(callWs);
        this.wsConn.binaryType = "arraybuffer";
        this.wsConn.onopen = () => {
            this._status = {
                ...this._status,
                wsState: "WsConnected",
            };
            this.emit("status", this._status)
        };
        this.wsConn.onmessage = (msg) => {
            console.log(msg.data);
            const data = OutgoingCallData.decode(new Uint8Array(msg.data));
            if (data.event) {
                const event = data.event;
                if (event.sip) {
                    if (event.sip.provisional) {
                        this._status = {
                            ...this._status,
                            sipState: "Provisional",
                            sipCode: event.sip.provisional.code,
                            sipCodeStr: (sipStatusCodes[event.sip.provisional.code] || 'Code ' + event.sip.provisional.code),
                        };
                    } else if (event.sip.early) {
                        this._status = {
                            ...this._status,
                            sipState: "Early",
                            sipCode: event.sip.early.code,
                            sipCodeStr: (sipStatusCodes[event.sip.early.code] || 'Code ' + event.sip.early.code),
                        };
                    } else if (event.sip.failure) {
                        this._status = {
                            ...this._status,
                            sipState: "Failure",
                            sipCode: event.sip.failure.code,
                            sipCodeStr: (sipStatusCodes[event.sip.failure.code] || 'Code ' + event.sip.failure.code),
                        };
                    } else if (event.sip.accepted) {
                        this._status = {
                            ...this._status,
                            startedAt: Date.now(),
                            sipState: "Accepted",
                            sipCode: event.sip.accepted.code,
                            sipCodeStr: (sipStatusCodes[event.sip.accepted.code] || 'Code ' + event.sip.accepted.code),
                        };
                    } else if (event.sip.bye) {
                        this._status = {
                            ...this._status,
                            sipState: "Bye",
                            sipCode: undefined,
                            sipCodeStr: undefined,
                        };
                    } else {
                        console.warn("Invalid sip event", event.sip);
                    }
                    this.emit("status", this._status)
                } else if (event.ended) {

                } else if (event.err) {
                    this.emit("error", event.err.message || 'Unknown error')
                }
            } else if (data.request) {

            } else if (data.response) {
                const response = data.response;
                if (response.reqId && this.reqs.has(response.reqId)) {
                    let [resolve, reject] = this.reqs.get(response.reqId)!;
                    this.reqs.delete(response.reqId);
                    if (response.error) {
                        reject(new Error(response.error.message))
                    } else {
                        resolve()
                    }
                } else {
                    console.error("Invalid response:", response);
                }
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

    async end() {
        return new Promise<void>((resolve, reject) => {
            const buf = OutgoingCallData.encode({
                request: {
                    reqId: this.reqIdSeed,
                    end: {}
                }
            }).finish();
            this.reqs.set(this.reqIdSeed, [resolve, reject]);
            this.reqIdSeed += 1;
            this.wsConn.send(buf);
        });
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