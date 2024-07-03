import { Datachannel, DatachannelEvent } from "../data";
import { ServerEvent_Room } from "../generated/protobuf/session";
import { EventEmitter } from "../utils";

export interface VirtualDataChannelConfig {
  /**
   * By default the message received from the channel will be automatically convert from UInt8Array to String.
   * You can turn this off by setting this setting to true
   *
   * @default false
   */
  raw?: boolean;
}

export interface VirtualDataChannelEvent {
  key: string;
  peer: string;
  message: string | Uint8Array;
}

/**
 *
 * An application level Datachannel, which should not be confused with the internal WebRTC Datachannel.
 * While normal WebRTC Channel can only operate in P2P, this however, is an abstracted room based channel. Meaning
 * everyone that subscribes to this channel that are in the same room, will have 2-way communication.
 *
 **/
export class VirtualDataChannel extends EventEmitter {
  opened: boolean = false;
  textEncoder = new TextEncoder();
  textDecoder = new TextDecoder();
  constructor(
    public key: string,
    private dc: Datachannel,
    private config?: VirtualDataChannelConfig | undefined,
  ) {
    super();
    this.dc.on(DatachannelEvent.ROOM, (roomEvent: ServerEvent_Room) => {
      if (
        roomEvent.channelMessage &&
        roomEvent.channelMessage.key === this.key
      ) {
        const message = this.config?.raw
          ? roomEvent.channelMessage!.message
          : this.textDecoder.decode(roomEvent.channelMessage!.message);

        const newEvent = {
          ...roomEvent.channelMessage,
          message,
        };
        this.emit("message", newEvent);
      }
    });
  }

  async init() {
    await this.dc.ready();
    const res = await this.dc.request_subscribe_channel({ key: this.key });
    this.emit("opened", res);
    this.opened = true;
  }

  async publish(message: string | Uint8Array) {
    await this.dc.ready();
    return this.dc.request_publish_channel({
      key: this.key,
      message:
        typeof message === "string"
          ? this.textEncoder.encode(message)
          : message,
    });
  }

  async close() {
    const res = await this.dc.request_unsubscribe_channel({ key: this.key });
    this.emit("closed", res);
    this.opened = false;
  }
}
