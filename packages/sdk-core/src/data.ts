import {
  ClientEvent,
  ServerEvent,
  Request as ProtoRequest,
  Response as ProtoResponse,
  Request_Session,
  Response_Session,
  Request_Sender,
  Response_Sender,
  Request_Receiver,
  Response_Receiver,
  Request_Room_ChannelControl_StartPublish,
  Response_Room_ChannelControl_StartPublish,
  Request_Room_ChannelControl,
  Response_Room_ChannelControl_StopPublish,
  Response_Room_ChannelControl_Subscribe,
  Response_Room_ChannelControl_Unsubscribe,
  Response_Room_ChannelControl_Publish,
} from "./generated/protobuf/session";
import {
  Request as RequestMixer,
  Response as ResponseMixer,
} from "./generated/protobuf/features.mixer";
import { EventEmitter, ReadyWaiter } from "./utils";

export enum DatachannelEvent {
  ROOM = "event.room",
  SESSION = "event.session",
  SENDER = "event.sender.",
  RECEIVER = "event.receiver.",
  FEATURE_MIXER = "event.features.mixer",
}

export class Datachannel extends EventEmitter {
  waiter: ReadyWaiter = new ReadyWaiter();
  seq_id: number = 0;
  req_id: number = 0;
  reqs: Map<number, (_: ProtoResponse) => void> = new Map();
  prepare_state = true;

  constructor(private dc: RTCDataChannel) {
    super();
    dc.onopen = () => {
      console.log("[Datachannel] on open");
      this.waiter.setReady();
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
      } else if (msg.features) {
        if (msg.features.mixer) {
          this.emit(DatachannelEvent.FEATURE_MIXER, msg.features.mixer);
        }
      } else if (msg.response) {
        const req_cb = this.reqs.get(msg.response.reqId);
        if (req_cb) {
          console.log("[Datachannel] on response", msg.response);
          this.reqs.delete(msg.response.reqId);
          req_cb(msg.response);
        } else {
          console.warn(
            "[Datachannel] unknown request with response",
            msg.response,
          );
        }
      }
    };
    dc.onerror = (e) => {
      console.error("[Datachannel] on error", e);
      this.waiter.setError(e);
    };
    dc.onclose = () => {
      console.log("[Datachannel] on close");
    };
  }

  public get connected() {
    return this.dc.readyState == "open";
  }

  public async ready(): Promise<void> {
    return this.waiter.waitReady();
  }

  public async request_session(
    req: Request_Session,
  ): Promise<Response_Session> {
    const reqId = this.gen_req_id();
    const res = await this.request({ reqId, session: req });
    if (res.session) {
      return res.session;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_sender(req: Request_Sender): Promise<Response_Sender> {
    const reqId = this.gen_req_id();
    const res = await this.request({ reqId, sender: req });
    if (res.sender) {
      return res.sender;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_receiver(
    req: Request_Receiver,
  ): Promise<Response_Receiver> {
    const reqId = this.gen_req_id();
    const res = await this.request({ reqId, receiver: req });
    if (res.receiver) {
      return res.receiver;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_start_publish_channel(req: {
    label: string;
  }): Promise<Response_Room_ChannelControl_StartPublish> {
    const reqId = this.gen_req_id();
    const res = await this.request({
      reqId,
      room: {
        channelControl: {
          label: req.label,
          startPub: 1,
        },
      },
    });
    if (res.room) {
      return res.room;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_stop_publish_channel(req: {
    label: string;
  }): Promise<Response_Room_ChannelControl_StopPublish> {
    const reqId = this.gen_req_id();
    const res = await this.request({
      reqId,
      room: {
        channelControl: {
          label: req.label,
          stopPub: 1,
        },
      },
    });
    if (res.room) {
      return res.room;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_subscribe_channel(req: {
    label: string;
  }): Promise<Response_Room_ChannelControl_Subscribe> {
    const reqId = this.gen_req_id();
    const res = await this.request({
      reqId,
      room: {
        channelControl: {
          label: req.label,
          sub: 1,
        },
      },
    });
    if (res.room) {
      return res.room;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_unsubscribe_channel(req: {
    label: string;
  }): Promise<Response_Room_ChannelControl_Unsubscribe> {
    const reqId = this.gen_req_id();
    const res = await this.request({
      reqId,
      room: {
        channelControl: {
          label: req.label,
          unsub: 1,
        },
      },
    });
    if (res.room) {
      return res.room;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_publish_data_channel(req: {
    label: string;
    data: Uint8Array;
  }): Promise<Response_Room_ChannelControl_Publish> {
    const reqId = this.gen_req_id();
    const res = await this.request({
      reqId,
      room: {
        channelControl: {
          label: req.label,
          pub: {
            data: req.data,
          },
        },
      },
    });
    if (res.room) {
      return res.room;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  public async request_mixer(req: RequestMixer): Promise<ResponseMixer> {
    const reqId = this.gen_req_id();
    const res = await this.request({ reqId, features: { mixer: req } });
    if (res.features?.mixer) {
      return res.features.mixer;
    } else {
      throw Error("INVALID_SERVER_RESPONSE");
    }
  }

  async request(request: ProtoRequest): Promise<ProtoResponse> {
    const seq = this.gen_seq_id();
    const buf = ClientEvent.encode({
      seq,
      request,
    }).finish();
    console.log("[Datachannel] send request", seq, request);
    this.dc.send(buf);
    const reqId = request.reqId;
    const res = await new Promise<ProtoResponse>((resolve, reject) => {
      this.reqs.set(reqId, resolve);
      setTimeout(() => {
        if (this.reqs.has(reqId)) {
          this.reqs.delete(reqId);
          reject(new Error("TIMEOUT"));
        }
      }, 5000);
    });

    if (res.error) {
      throw res.error;
    } else {
      return res;
    }
  }

  gen_req_id(): number {
    this.req_id += 1;
    return this.req_id;
  }

  gen_seq_id(): number {
    this.seq_id += 1;
    return this.seq_id;
  }
}
