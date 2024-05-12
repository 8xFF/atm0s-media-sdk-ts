import { ConnectRequest, ConnectResponse } from "./generated/protobuf/gateway";
import { MediaKind } from "./types";
import { TrackReceiver } from "./receiver";
import { TrackSender, TrackSenderConfig } from "./sender";
import EventEmitter, { post_protobuf } from "./utils";
import { Datachannel, DatachannelEvent } from "./data";
import {
  Request_Session_UpdateSdp,
  ServerEvent_Room,
} from "./generated/protobuf/conn";

export interface JoinInfo {
  room: string;
  peer: string;
  publish: { peer: boolean; tracks: boolean };
  subscribe: { peers: boolean; tracks: boolean };
}

export interface SessionConfig {
  token: string;
  join?: JoinInfo;
}

export enum SessionEvent {
  ROOM_PEER_JOINED = "room.peer.joined",
  ROOM_PEER_UPDATED = "room.peer.updated",
  ROOM_PEER_LEAVED = "room.peer.leaved",
  ROOM_TRACK_STARTED = "room.track.started",
  ROOM_TRACK_UPDATED = "room.track.updated",
  ROOM_TRACK_STOPPED = "room.track.stopped",
}

export class Session extends EventEmitter {
  conn_id?: string;
  peer: RTCPeerConnection;
  dc: Datachannel;
  receivers: TrackReceiver[] = [];
  senders: TrackSender[] = [];

  constructor(
    private gateway: string,
    private cfg: SessionConfig,
  ) {
    super();
    this.peer = new RTCPeerConnection();
    this.dc = new Datachannel(this.peer.createDataChannel("data"));
    this.dc.on(DatachannelEvent.ROOM, (event: ServerEvent_Room) => {
      if (event.peerJoined) {
        this.emit(SessionEvent.ROOM_PEER_JOINED, event.peerJoined);
      } else if (event.peerUpdated) {
        this.emit(SessionEvent.ROOM_PEER_UPDATED, event.peerUpdated);
      } else if (event.peerLeaved) {
        this.emit(SessionEvent.ROOM_PEER_LEAVED, event.peerLeaved);
      } else if (event.trackStarted) {
        this.emit(SessionEvent.ROOM_TRACK_STARTED, event.trackStarted);
      } else if (event.trackUpdated) {
        this.emit(SessionEvent.ROOM_TRACK_UPDATED, event.trackUpdated);
      } else if (event.trackStopped) {
        this.emit(SessionEvent.ROOM_TRACK_STOPPED, event.trackStopped);
      }
    });

    //TODO add await to throtle for avoiding too much update in short time
    this.peer.onnegotiationneeded = () => {
      if (this.dc.connected)
        this.sync_sdp().then(console.log).catch(console.error);
    };

    this.peer.onconnectionstatechange = (_event) => {
      console.log(
        "[Session] RTCPeer connection state changed",
        this.peer.connectionState,
      );
    };

    this.peer.oniceconnectionstatechange = (_event) => {
      console.log(
        "[Session] RTCPeer ice state changed",
        this.peer.iceConnectionState,
      );
    };

    this.peer.ontrack = (event) => {
      for (let i = 0; i < this.receivers.length; i++) {
        const receiver = this.receivers[i]!;
        if (!receiver.has_track()) {
          console.log(
            "[Session] found receiver for track",
            receiver.name,
            event.track,
          );
          receiver.set_track(event.track);
          return;
        }
      }
      console.warn("[Session] not found receiver for track", event.track);
    };
  }

  receiver(kind: MediaKind): TrackReceiver {
    const track_name = kind + "_" + this.receivers.length;
    const transceiver = this.peer.addTransceiver(kind, {
      direction: "recvonly",
    });
    const receiver = new TrackReceiver(this.dc, transceiver, track_name, kind);
    this.receivers.push(receiver);
    console.log("Created receiver", track_name);
    return receiver;
  }

  async sender(
    track_name: string,
    track_or_kind: MediaStreamTrack | MediaKind,
    cfg: TrackSenderConfig,
  ) {
    const transceiver = this.peer.addTransceiver(track_or_kind, {
      direction: "sendonly",
      sendEncodings: !!cfg.simulcast
        ? [
            { rid: "0", active: true, scaleResolutionDownBy: 4 },
            { rid: "1", active: true, scaleResolutionDownBy: 2 },
            { rid: "2", active: true },
          ]
        : undefined,
    });
    const kind =
      track_or_kind instanceof MediaStreamTrack
        ? track_or_kind.kind == "audio"
          ? "audio"
          : "video"
        : track_or_kind;
    const sender = new TrackSender(this.dc, transceiver, track_name, kind, cfg);
    this.senders.push(sender);
    console.log("Created sender", track_name);
    return sender;
  }

  async connect(version?: string) {
    console.log("Prepare to connect");
    const local_desc = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    const req = ConnectRequest.create({
      version: version || "pure-ts@0.0.0", //TODO auto get from package.json
      join: this.cfg.join,
      features: {},
      tracks: {
        receivers: this.receivers.map((r) => r.state),
        senders: this.senders.map((r) => r.state),
      },
      sdp: local_desc.sdp,
    });
    console.log("Connecting");
    const res = await post_protobuf(
      ConnectRequest,
      ConnectResponse,
      this.gateway + "/webrtc/connect",
      req,
      {
        Authorization: "Bearer " + this.cfg.token,
        "Content-Type": "application/grpc",
      },
    );
    this.conn_id = res.connId;
    await this.peer.setLocalDescription(local_desc);
    await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp });
    await this.dc.ready();
    console.log("Connected");
  }

  async join(info: JoinInfo, token: string) {
    this.cfg.join = info;
    this.cfg.token = token;
    return this.dc.request_session({
      join: {
        info,
        token,
      },
    });
  }

  async sync_sdp() {
    const local_desc = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    const update_sdp = Request_Session_UpdateSdp.create({
      tracks: {
        receivers: this.receivers.map((r) => r.state),
        senders: this.senders.map((r) => r.state),
      },
      sdp: local_desc.sdp,
    });

    console.log("Requesting update sdp", update_sdp);
    const res = await this.dc.request_session({
      sdp: update_sdp,
    });
    console.log("Request update sdp success", res);
    await this.peer.setLocalDescription(local_desc);
    await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp!.sdp });
  }

  async leave() {
    this.cfg.join = undefined;
    return this.dc.request_session({
      leave: {},
    });
  }

  disconnect() {
    this.peer.close();
  }
}