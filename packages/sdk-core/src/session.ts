import {
  ConnectRequest,
  ConnectResponse,
  RemoteIceRequest,
  RemoteIceResponse,
} from "./generated/protobuf/gateway";
import { TrackReceiver } from "./receiver";
import { TrackSender, TrackSenderConfig } from "./sender";
import { EventEmitter, postProtobuf } from "./utils";
import { Datachannel, DatachannelEvent } from "./data";
import {
  Request_Session_UpdateSdp,
  ServerEvent_Room, ServerEvent_Room_PeerLeaved, ServerEvent_Room_TrackStopped,
} from "./generated/protobuf/session";
import * as mixer from "./features/audio_mixer";
import {Kind, Receiver_Status} from "./generated/protobuf/shared";
import { kindToString } from "./types";
import {TrackSenderStatus} from "./lib";

export interface JoinInfo {
  room: string;
  peer: string;
  metadata?: string;
  publish: { peer: boolean; tracks: boolean };
  subscribe: { peers: boolean; tracks: boolean };
  features?: {
    mixer?: mixer.AudioMixerConfig;
  };
}

export interface SessionConfig {
  token: string;
  join?: JoinInfo;
}

export enum SessionEvent {
  ROOM_CHANGED = "room.changed",
  ROOM_PEER_JOINED = "room.peer.joined",
  ROOM_PEER_UPDATED = "room.peer.updated",
  ROOM_PEER_LEAVED = "room.peer.leaved",
  ROOM_TRACK_STARTED = "room.track.started",
  ROOM_TRACK_UPDATED = "room.track.updated",
  ROOM_TRACK_STOPPED = "room.track.stopped",
  ROOM_DISCONNECTED = 'room.disconnected',
}

export class Session extends EventEmitter {
  ice_lite: boolean = false;
  created_at: number;
  version?: string;
  conn_id?: string;
  peer: RTCPeerConnection;
  dc: Datachannel;
  receivers: TrackReceiver[] = [];
  senders: TrackSender[] = [];
  _mixer?: mixer.AudioMixer;

  /// Prepaer state for flagging when ever this peer is created offer.
  /// This flag is useful for avoiding tranceiver config is changed before it connect
  prepareState: boolean = true;

  constructor(
    private gateway: string,
    private cfg: SessionConfig,
  ) {
    super();
    this.created_at = new Date().getTime();
    console.warn("Create session", this.created_at);
    this.peer = new RTCPeerConnection();
    this.dc = new Datachannel(
      this.peer.createDataChannel("data", { negotiated: true, id: 1000 }),
    );
    this.dc.on(DatachannelEvent.ROOM, async (event: ServerEvent_Room) => {
      if (event.peerJoined) {
        this.emit(SessionEvent.ROOM_PEER_JOINED, event.peerJoined);
      } else if (event.peerUpdated) {
        this.emit(SessionEvent.ROOM_PEER_UPDATED, event.peerUpdated);
      } else if (event.peerLeaved) {
        await this.onAfterPeerLeave(event.peerLeaved);
      } else if (event.trackStarted) {
        this.emit(SessionEvent.ROOM_TRACK_STARTED, event.trackStarted);
      } else if (event.trackUpdated) {
        this.emit(SessionEvent.ROOM_TRACK_UPDATED, event.trackUpdated);
      } else if (event.trackStopped) {
        await this.onRoomTrackStopped(event.trackStopped);
      }
    });

    //TODO add await to throtle for avoiding too much update in short time
    this.peer.onnegotiationneeded = () => {
      if (this.dc.connected)
        this.syncSdp().then(console.log).catch(console.error);
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
        if (receiver.webrtcTrackId == event.track.id) {
          console.log(
            "[Session] found receiver for track",
            receiver.name,
            event.track,
          );
          receiver.setTrackReady();
          return;
        }
      }
      console.warn("[Session] not found receiver for track", event.track);
    };

    this.peer.onicecandidate = async (event) => {
      if (event.candidate && !this.ice_lite) {
        const req = RemoteIceRequest.create({
          candidates: [event.candidate.candidate],
        });
        console.log("Send ice-candidate", event.candidate.candidate);
        const res = await postProtobuf(
          RemoteIceRequest,
          RemoteIceResponse,
          this.gateway + "/webrtc/" + this.conn_id + "/ice-candidate",
          req,
          {
            "Content-Type": "application/grpc",
          },
        );
        console.log("Sent ice-candidate", res);
      }
    };

    //init audios
    if (cfg.join?.features?.mixer) {
      this._mixer = new mixer.AudioMixer(
        this,
        this.dc,
        cfg.join?.features.mixer,
      );
    }
  }

  get room() {
    return this.cfg.join;
  }

  get mixer() {
    return this._mixer;
  }

  receiver(kind: Kind): TrackReceiver {
    const kind_str = kindToString(kind);
    const track_name = kind_str + "_" + this.receivers.length;
    const receiver = new TrackReceiver(this.dc, track_name, kind);
    if (!this.prepareState) {
      receiver.prepare(this.peer);
    }
    this.receivers.push(receiver);
    console.log("Created receiver", kind, track_name);
    return receiver;
  }

  sender(
    track_name: string,
    track_or_kind: MediaStreamTrack | Kind,
    cfg?: TrackSenderConfig,
  ) {
    for (let i = 0; i < this.senders.length; i++) {
      const sender = this.senders[i]
      if (sender && sender.name === track_name) {
        // we already have same sender track with track_name
        // so, we'll just return it
        return sender;
      }
    }

    const sender = new TrackSender(this.dc, track_name, track_or_kind, cfg);
    if (!this.prepareState) {
      sender.prepare(this.peer);
    }
    this.senders.push(sender);
    console.log("Created sender", sender.kind, track_name);
    return sender;
  }

  async connect(version?: string) {
    if (!this.prepareState) {
      throw new Error("Not in prepare state");
    }
    this.prepareState = false;
    this.version = version;
    console.warn("Prepare senders and receivers to connect");
    //prepare for senders. We need to lazy prepare because some transceiver dont allow update before connected
    for (let i = 0; i < this.senders.length; i++) {
      console.log("Prepare sender ", this.senders[i]!.name);
      this.senders[i]!.prepare(this.peer);
    }
    //prepare for receivers. We need to lazy prepare because some transceiver dont allow update before connected
    for (let i = 0; i < this.receivers.length; i++) {
      console.log("Prepare receiver ", this.receivers[i]!.name);
      this.receivers[i]!.prepare(this.peer);
    }
    console.log("Prepare offer for connect");
    const local_desc = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    const req = ConnectRequest.create({
      version: version || "pure-ts@0.0.0", //TODO auto get from package.json
      join: this.cfg.join && {
        room: this.cfg.join.room,
        peer: this.cfg.join.peer,
        metadata: this.cfg.join.metadata,
        publish: this.cfg.join.publish,
        subscribe: this.cfg.join.subscribe,
        features: { mixer: this.mixer?.state() },
      },
      tracks: {
        receivers: this.receivers.map((r) => r.state),
        senders: this.senders.map((r) => r.state),
      },
      sdp: local_desc.sdp,
    });
    console.log("Connecting");
    const res = await postProtobuf(
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
    this.ice_lite = res.iceLite;
    await this.peer.setLocalDescription(local_desc);
    await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp });
    await this.dc.ready();
    console.log("Connected");
  }

  async restartIce() {
    //TODO detect disconnect state and call restart-ice
    const local_desc = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    const req = ConnectRequest.create({
      version: this.version || "pure-ts@0.0.0", //TODO auto get from package.json
      join: this.cfg.join && {
        room: this.cfg.join.room,
        peer: this.cfg.join.peer,
        metadata: this.cfg.join.metadata,
        publish: this.cfg.join.publish,
        subscribe: this.cfg.join.subscribe,
        features: { mixer: this.mixer?.state() },
      },
      tracks: {
        receivers: this.receivers.map((r) => r.state),
        senders: this.senders.map((r) => r.state),
      },
      sdp: local_desc.sdp,
    });
    console.log("Sending restart-ice request");
    const res = await postProtobuf(
      ConnectRequest,
      ConnectResponse,
      this.gateway + "/webrtc/" + this.conn_id + "/restart-ice",
      req,
      {
        Authorization: "Bearer " + this.cfg.token,
        "Content-Type": "application/grpc",
      },
    );
    this.ice_lite = res.iceLite;
    console.log("Apply restart-ice response");
    if (this.conn_id !== res.connId) {
      console.log(
        "Session connect to new server, reset receivers for handling new recv tracks",
      );
      this.conn_id = res.connId;
      this.receivers.map((r) => {
        r.media_stream.removeTrack(r.media_stream.getTracks()[0]!);
      }, []);
    }
    await this.peer.setLocalDescription(local_desc);
    await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp });
  }

  async join(info: JoinInfo, token: string) {
    // We need to create new mixer or reconfig it according to new info.
    // In case of newer room dont have mixer, we just reject it and remain old mixer,
    // the server don't send any update in this case.
    if (info.features?.mixer) {
      if (this._mixer) {
        this._mixer.reconfig(info.features.mixer);
      } else {
        this._mixer = new mixer.AudioMixer(this, this.dc, info.features.mixer);
      }
    }
    await this.dc.requestSession({
      join: {
        info: {
          room: info.room,
          peer: info.peer,
          metadata: info.metadata,
          publish: info.publish,
          subscribe: info.subscribe,
          features: { mixer: this.mixer?.state() },
        },
        token,
      },
    });
    this.cfg.join = info;
    this.cfg.token = token;
    this.emit(SessionEvent.ROOM_CHANGED, info);
  }

  async syncSdp() {
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
    const res = await this.dc.requestSession({
      sdp: update_sdp,
    });
    console.log("Request update sdp success", res);
    await this.peer.setLocalDescription(local_desc);
    await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp!.sdp });
  }

  async leave() {
    //reset local here
    this.receivers.map((r) => r.leaveRoom());
    this.mixer?.leave_room();

    await this.dc.requestSession({
      leave: {},
    });
    this.cfg.join = undefined;
    this.emit(SessionEvent.ROOM_CHANGED, undefined);
  }

  public disconnect = async () => {
    console.warn('Disconnect session', this.created_at);

    // first let's close all the remote tracks
    for (let i = 0; i < this.receivers.length; i++) {
      const receiver = this.receivers[i];
      if (receiver && receiver.status === Receiver_Status.ACTIVE) {
        await receiver.detach();
      }
    }
    this.receivers = [];

    // local tracks
    for (let i = 0; i < this.senders.length; i++) {
      const sender = this.senders[i];
      if (sender && sender.status === TrackSenderStatus.ACTIVE) {
        // now detach
        await sender.detach();
      }
    }
    this.senders = [];

    // leave from session
    await this.leave();

    // now close the peer
    this.peer.close();
    // finally emit event
    this.emit(SessionEvent.ROOM_DISCONNECTED);
  };

  private onAfterPeerLeave = async (event: ServerEvent_Room_PeerLeaved) => {
    // we'll look for this peer's medias & remove those
    for (let i = 0; i < this.receivers.length; i++) {
      const receiver = this.receivers[i];
      if (
          receiver &&
          receiver.attachedSource?.peer === event.peer &&
          receiver.status === Receiver_Status.ACTIVE
      ) {
        await receiver.detach();
        receiver.leaveRoom();
        this.receivers = this.receivers.splice(i, 1);
      }
    }
    this.emit(SessionEvent.ROOM_PEER_LEAVED, event);
  };

  private onRoomTrackStopped = async (event: ServerEvent_Room_TrackStopped) => {
    //we'll look for this peer's medias & remove those
    for (let i = 0; i < this.receivers.length; i++) {
      const receiver = this.receivers[i];
      if (
          receiver &&
          receiver.attachedSource?.peer === event.peer &&
          receiver.attachedSource?.track === event.track &&
          receiver.status === Receiver_Status.ACTIVE
      ) {
        await receiver.detach();
        this.receivers = this.receivers.splice(i, 1);
      }
    }
    this.emit(SessionEvent.ROOM_TRACK_STOPPED, event);
  };
}
