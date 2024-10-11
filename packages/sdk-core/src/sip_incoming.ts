import { EventEmitter } from "./utils";

export interface IncomingSipCallStatus {
    wsState: "WsConnecting" | "WsConnected" | "WsClosed",
    sipState?: "Accepted" | "Cancelled" | "Bye",
    startedAt?: number,
}

interface WsRequest {
    request_id: number,
    request: {
        action: "Accept" | "Reject",
        stream?: {
            room: string,
            peer: string,
            record: boolean
        }
    }
}

interface WsResponse {
    request_id?: number,
    success: boolean,
    message?: string,
    response?: {},
}

interface WsEvent {
    type: "Accepted" | "Sip" | "Destroyed" | "Error",
    content?: {
        type: "Cancelled" | "Bye",
        code?: number
    },
    message?: string,
}

interface WsMessage {
    type: "Event" | "Request" | "Response",
    content: WsRequest | WsResponse | WsEvent
}

export class SipIncomingCall extends EventEmitter {
    _status: IncomingSipCallStatus = { wsState: "WsConnecting" }
    wsConn: WebSocket;
    reqIdSeed = 1;
    reqs: Map<number, [() => void, (err: Error) => void]> = new Map();

    constructor(private callWs: string) {
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
                        case "Accepted":
                            this._status = {
                                ...this._status,
                                sipState: "Accepted",
                                startedAt: Date.now(),
                            };
                            this.emit("status", this._status)
                            break;
                        case "Sip":
                            this._status = {
                                ...this._status,
                                sipState: event.content?.type,
                            };
                            this.emit("status", this._status)
                            break;
                        case "Error":
                            this.emit("error", event.message || 'Unknown error')
                            break;
                        case "Destroyed":
                            break;
                    }
                    break;
                case "Response":
                    const response = json.content as WsResponse;
                    if (response.request_id && this.reqs.has(response.request_id)) {
                        let [resolve, reject] = this.reqs.get(response.request_id)!;
                        this.reqs.delete(response.request_id);
                        if (response.success) {
                            resolve()
                        } else {
                            reject(new Error(response.message))
                        }
                    } else {
                        console.error("Invalid response:", json);
                    }
                    break;
                default:
                    console.error("Invalid message:", json);
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

    get status(): IncomingSipCallStatus {
        return this._status;
    }

    async accept(room: string, peer: string, record: boolean) {
        return new Promise<void>((resolve, reject) => {
            const cmd: WsMessage = {
                type: "Request",
                content: {
                    request_id: this.reqIdSeed,
                    request: {
                        action: "Accept",
                        stream: {
                            room,
                            peer,
                            record
                        }
                    }
                }
            };
            this.reqs.set(this.reqIdSeed, [resolve, reject]);
            this.reqIdSeed += 1;
            this.wsConn.send(JSON.stringify(cmd));
        });
    }

    reject() {
        this.wsConn.close();
    }

    end() {
        this.wsConn.close();
    }

    disconnect() {
        this.wsConn.close();
    }
}