import { ServerEvent } from "../generated/protobuf/conn";
import EventEmitter from "../utils";

export enum DatachannelEvent {
  ROOM = "event.room",
  SESSION = "event.session",
  SENDER = "event.sender.",
  RECEIVER = "event.receiver.",
}

export class Datachannel extends EventEmitter {
  wait_connects: [() => any, (err: any) => any][] = [];
  req_id: number = 0;

  constructor(private dc: RTCDataChannel) {
    super();
    dc.onopen = () => {
      console.log("[Datachannel] on open");
      while (this.wait_connects.length > 0) {
        let [success, _] = this.wait_connects.shift()!;
        success();
      }
    };
    dc.onmessage = (e) => {
      const msg = ServerEvent.decode(new Uint8Array(e.data));

      console.log("[Datachannel] on event", msg);
      if (msg.room) {
        this.emit(DatachannelEvent.ROOM, msg.room);
      } else if (msg.session) {
        this.emit(DatachannelEvent.SESSION, msg.room);
      } else if (msg.sender) {
        this.emit(DatachannelEvent.SENDER + msg.sender.name, msg.sender);
      } else if (msg.receiver) {
        this.emit(DatachannelEvent.RECEIVER + msg.receiver.name, msg.receiver);
      } else if (msg.response) {
        console.log("[Datachannel] on response", msg.response);
      }
    };
    dc.onerror = (e) => {
      console.error("[Datachannel] on error", e);
      while (this.wait_connects.length > 0) {
        let [_, error] = this.wait_connects.shift()!;
        error(e);
      }
    };
    dc.onclose = () => {
      console.log("[Datachannel] on close");
    };
  }

  public async wait_connect(): Promise<void> {
    if (this.dc.readyState == "open") {
      return Promise.resolve();
    } else {
      return new Promise((resolve, reject) => {
        this.wait_connects.push([resolve, reject]);
      });
    }
  }

  public async request(_req: any): Promise<any> {
    return {};
  }

  gen_req_id(): number {
    this.req_id += 1;
    return this.req_id;
  }
}
