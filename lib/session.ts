import { GatewayClientImpl, GrpcWebImpl } from "./generated/protobuf/gateway";
import { BitrateControlMode } from "./generated/protobuf/shared";

export class Session {
  gatewayClient?: GatewayClientImpl;

  constructor(gateway: string) {
    const rpc = new GrpcWebImpl(gateway, {});
    this.gatewayClient = new GatewayClientImpl(rpc);
  }

  async connect() {
    const res = await this.gatewayClient?.Connect({
      version: "0.2.0",
      token: "token",
      room: "room1",
      peer: "peer1",
      metadata: "metadata value",
      bitrate: BitrateControlMode.MAX_BITRATE,
      features: {},
      info: {
        publish: {
          peer: true,
          room: true,
        },
        subscribe: {
          peer: true,
          room: true,
        },
      },
      tracks: {
        receivers: [],
        senders: [],
      },
      sdp: "sdp value",
    });
    console.log(res);
  }
}
