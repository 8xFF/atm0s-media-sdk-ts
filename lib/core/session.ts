import { ConnectRequest, ConnectResponse } from "../generated/protobuf/gateway";
import { MediaKind } from "./types";
import { TrackReceiver } from "./receiver";
import { TrackSender } from "./sender";
import EventEmitter, { post_protobuf } from "../utils";
import { Datachannel, DatachannelEvent } from "./data";
import { ServerEvent_Room } from "../generated/protobuf/conn";

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
        const receiver = this.receivers[i];
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

  receiver(kind: MediaKind, priority: number): TrackReceiver {
    const track_name = kind + "_" + this.receivers.length;
    const transceiver = this.peer.addTransceiver(kind, {
      direction: "recvonly",
    });
    const receiver = new TrackReceiver(
      this.dc,
      track_name,
      kind,
      priority,
      transceiver,
    );
    this.receivers.push(receiver);
    return receiver;
  }

  sender(track_name: string, track: MediaStreamTrack, priority: number) {
    const transceiver = this.peer.addTransceiver(track, {
      direction: "sendonly",
    });
    const kind = track.kind == "audio" ? "audio" : "video";
    const sender = new TrackSender(
      this.dc,
      track_name,
      kind,
      priority,
      transceiver,
    );
    this.senders.push(sender);
    return sender;
  }

  async connect() {
    const local_desc = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    const req = ConnectRequest.create({
      version: SDK_VERSION,
      join: this.cfg.join,
      features: {},
      tracks: {
        receivers: this.receivers.map((r) => r.state),
        senders: this.senders.map((r) => r.state),
      },
      sdp: local_desc.sdp,
    });
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
    await this.dc.wait_connect();
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
