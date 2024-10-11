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

interface WsEvent {
    type: "Accepted" | "Sip" | "Destroyed" | "Error",
    content?: {
        type: "Cancelled" | "Bye",
        code?: number
    },
    message?: string,
}

export class SipIncomingCall extends EventEmitter {
    _status: IncomingSipCallStatus = { wsState: "WsConnecting" }
    wsConn: WebSocket;
    reqIdSeed = 0;

    constructor(private sipWs: string) {
        super()
        this.wsConn = new WebSocket(sipWs);
        this.wsConn.onopen = () => {
            this._status = {
                ...this._status,
                wsState: "WsConnected",
            };
            this.emit("status", this._status)
        };
        this.wsConn.onmessage = (msg) => {
            const json: WsEvent = JSON.parse(msg.data);
            switch (json.type) {
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
                        sipState: json.content?.type,
                    };
                    this.emit("status", this._status)
                    break;
                case "Error":
                    this.emit("error", json.message || 'Unknown error')
                    break;
                case "Destroyed":
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
        const cmd: WsRequest = {
            request_id: this.reqIdSeed,
            request: {
                action: "Accept",
                stream: {
                    room,
                    peer,
                    record
                }
            }
        };
        this.reqIdSeed += 1;
        this.wsConn.send(JSON.stringify(cmd));
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