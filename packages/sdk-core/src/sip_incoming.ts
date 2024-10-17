import { IncomingCallData, IncomingCallData_IncomingCallRequest_Accept2, IncomingCallData_IncomingCallResponse_Accept2 } from "./generated/protobuf/sip_gateway";
import { EventEmitter } from "./utils";

export interface IncomingSipCallStatus {
    wsState: "WsConnecting" | "WsConnected" | "WsClosed",
    sipState?: "Accepted" | "Cancelled" | "Bye",
    startedAt?: number,
}

export class SipIncomingCall extends EventEmitter {
    _status: IncomingSipCallStatus = { wsState: "WsConnecting" }
    wsConn: WebSocket;
    reqIdSeed = 1;
    reqs: Map<number, [(data: any) => void, (err: Error) => void]> = new Map();

    constructor(private callWs: string) {
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
            let data = IncomingCallData.decode(new Uint8Array(msg.data));
            if (data.event) {
                let event = data.event;
                if (event.accepted) {
                    this._status = {
                        ...this._status,
                        sipState: "Accepted",
                        startedAt: Date.now(),
                    };
                    this.emit("status", this._status)
                } else if (event.ended) {

                } else if (event.err) {
                    this.emit("error", event.err.message)
                } else if (event.sip) {
                    if (event.sip.cancelled) {
                        this._status = {
                            ...this._status,
                            sipState: "Cancelled",
                        };
                        this.emit("status", this._status)
                    } else if (event.sip.bye) {
                        this._status = {
                            ...this._status,
                            sipState: "Bye",
                        };
                        this.emit("status", this._status)
                    }
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
                        resolve(response.accept || response.end || response.end || response.ring || response.accept2)
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

    get status(): IncomingSipCallStatus {
        return this._status;
    }

    async accept(room: string, peer: string, record: boolean) {
        return new Promise<void>((resolve, reject) => {
            const buf = IncomingCallData.encode({
                request: {
                    reqId: this.reqIdSeed,
                    accept: {
                        room,
                        peer,
                        record
                    }
                }
            }).finish();
            this.reqs.set(this.reqIdSeed, [resolve, reject]);
            this.reqIdSeed += 1;
            this.wsConn.send(buf);
        });
    }

    async accept2(room: string, peer: string, record: boolean): Promise<IncomingCallData_IncomingCallResponse_Accept2> {
        return new Promise((resolve, reject) => {
            const buf = IncomingCallData.encode({
                request: {
                    reqId: this.reqIdSeed,
                    accept2: {}
                }
            }).finish();
            this.reqs.set(this.reqIdSeed, [resolve, reject]);
            this.reqIdSeed += 1;
            this.wsConn.send(buf);
        });
    }

    async reject() {
        return new Promise<void>((resolve, reject) => {
            const buf = IncomingCallData.encode({
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

    async end() {
        return new Promise<void>((resolve, reject) => {
            const buf = IncomingCallData.encode({
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