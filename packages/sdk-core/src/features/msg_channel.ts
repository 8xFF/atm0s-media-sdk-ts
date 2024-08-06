import { Datachannel, DatachannelEvent } from "../data";
import { ServerEvent_MessageChannel } from "../generated/protobuf/session";
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
export class RoomMessageChannel extends EventEmitter {
  opened: boolean = false;
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();
  config = DefaultConfig;
  constructor(
    public label: string,
    private dc: Datachannel,
    _config?: MessageChannelConfig | undefined
  ) {
    super();
    this.config = { ...this.config, ..._config };
    this.dc.on(
      DatachannelEvent.MESSAGE_CHANNEL + this.label,
      (msgChanEvent: ServerEvent_MessageChannel) => {
        if (msgChanEvent.label === this.label && msgChanEvent.message) {
          const message = this.config?.raw
            ? msgChanEvent.message.message
            : this.textDecoder.decode(msgChanEvent.message.message);

          const newEvent = {
            ...msgChanEvent.message,
            message,
          };
          this.emit("message", newEvent);
        }
      }
    );
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
    await this.dc.requestMessageChannel({ label: this.label, startPub: {} });
    this.config.publish = true;
  }

  async stopPublish() {
    if (!this.opened) {
      throw new Error("Channel not opened yet");
    }
    if (!this.config.publish) {
      throw new Error("Not publishing");
    }
    await this.dc.requestMessageChannel({ label: this.label, stopPub: {} });
    this.config.publish = false;
  }

  async init() {
    await this.dc.ready();
    await this.dc.requestMessageChannel({ label: this.label, sub: {} });
    if (this.config?.publish) {
      await this.dc.requestMessageChannel({ label: this.label, startPub: {} });
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
    return this.dc.requestMessageChannel({
      label: this.label,
      pub: {
        data:
          typeof message === "string"
            ? this.textEncoder.encode(message)
            : message,
      },
    });
  }

  async close() {
    if (!this.opened) {
      return;
    }
    await this.dc.requestMessageChannel({ label: this.label, stopPub: {} });
    await this.dc.requestMessageChannel({ label: this.label, unsub: {} });
    this.emit("closed");
    this.opened = false;
  }
}
