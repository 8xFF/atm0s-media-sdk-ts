import { IncomingCallNotify, IncomingCallNotify_CallArrived } from "./generated/protobuf/sip_gateway";
import { EventEmitter } from "./utils";

export class SipIncomingCallNotify extends EventEmitter {
    constructor(private _callId: string, private _info: IncomingCallNotify_CallArrived) {
        super()
    }

    get callId() {
        return this._callId;
    }

    get callFrom() {
        return this._info.from
    }

    get callWs() {
        return this._info.callWs
    }

    onAccepted() {
        this.emit('accepted');
    }

    onCancelled() {
        this.emit('cancelled');
    }
}

export class SipIncomingCallListener extends EventEmitter {
    _calls: Map<string, SipIncomingCallNotify> = new Map();
    wsConn: WebSocket;

    constructor(private notifyWs: string) {
        super()
        this.wsConn = new WebSocket(notifyWs);
        this.wsConn.binaryType = "arraybuffer";
        this.wsConn.onopen = () => {
            this.emit("connect")
        };
        this.wsConn.onmessage = (msg) => {
            let data = IncomingCallNotify.decode(new Uint8Array(msg.data));
            if (data.arrived) {
                const call = new SipIncomingCallNotify(data.callId, data.arrived);
                this._calls.set(call.callId, call);
                this.emit('call', call);
            } else if (data.accepted) {
                const call = this._calls.get(data.callId);
                if (call) {
                    call.onAccepted()
                    this._calls.delete(data.callId)
                }
            } else if (data.cancelled) {
                const call = this._calls.get(data.callId);
                if (call) {
                    call.onCancelled()
                    this._calls.delete(data.callId)
                }
            }
        };
        this.wsConn.onerror = (e) => {
            this.emit("error");
        };
        this.wsConn.onclose = () => {
            this.emit("disconnect")
        };
    }

    disconnect() {
        this.wsConn.close();
    }
}