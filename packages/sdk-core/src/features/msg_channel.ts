import { Datachannel, DatachannelEvent } from "../data";
import { ServerEvent_Room } from "../generated/protobuf/session";
import { EventEmitter } from "../utils";

export interface MessageChannelConfig {
  /**
   * By default the message received from the channel will be automatically convert from UInt8Array to String.
   * You can turn this off by setting this setting to true
   *
   * @default false
   */
  raw?: boolean;

  /**
   * By default, the channel will automatically be able to publish message to the room.
   * You can turn this off by setting this setting to false
   */
  publish?: boolean;
}

const DefaultConfig: MessageChannelConfig = {
  publish: true,
};

export interface MessageChannelEvent {
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
export class MessageChannel extends EventEmitter {
  opened: boolean = false;
  textEncoder = new TextEncoder();
  textDecoder = new TextDecoder();
  config = DefaultConfig;
  constructor(
    public label: string,
    private dc: Datachannel,
    _config?: MessageChannelConfig | undefined,
  ) {
    super();
    this.config = { ...this.config, ..._config };
    this.dc.on(DatachannelEvent.ROOM, (roomEvent: ServerEvent_Room) => {
      if (
        roomEvent.channelMessage &&
        roomEvent.channelMessage.label === this.label
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

  get canPublish() {
    return this.config?.publish;
  }

  async startPublish() {
    if (!this.opened) {
      throw new Error("Channel not opened yet");
    }
    if (this.config.publish) {
      throw new Error("Already publishing");
    }
    await this.dc.request_start_publish_channel({ label: this.label });
    this.config.publish = true;
  }

  async stopPublish() {
    if (!this.opened) {
      throw new Error("Channel not opened yet");
    }
    if (!this.config.publish) {
      throw new Error("Not publishing");
    }
    await this.dc.request_stop_publish_channel({ label: this.label });
    this.config.publish = false;
  }

  async init() {
    await this.dc.ready();
    await this.dc.request_subscribe_channel({ label: this.label });
    if (this.config?.publish) {
      await this.dc.request_start_publish_channel({ label: this.label });
    }

    this.emit("opened");
    this.opened = true;
  }

  async publish(message: string | Uint8Array) {
    await this.dc.ready();
    if (!this.opened) {
      throw new Error("Channel not opened yet");
    }
    if (!this.config.publish) {
      throw new Error("Channel not publishing");
    }
    return this.dc.request_publish_data_channel({
      label: this.label,
      data:
        typeof message === "string"
          ? this.textEncoder.encode(message)
          : message,
    });
  }

  async close() {
    await this.dc.request_unsubscribe_channel({ label: this.label });
    await this.dc.request_stop_publish_channel({ label: this.label });
    this.emit("closed");
    this.opened = false;
  }
}
