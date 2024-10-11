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
  ServerEvent_Room,
} from "./generated/protobuf/session";
import * as mixer from "./features/audio_mixer";
import { Kind } from "./generated/protobuf/shared";
import { RoomMessageChannel, MessageChannelConfig } from "./features/msg_channel";
import { kindToString } from "./types";
import config from "../package.json";
import {
  RTCPeerConnection,
  MediaStreamTrack,
} from 'react-native-webrtc';

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
}

export class Session extends EventEmitter {
  peer: RTCPeerConnection;
  dc: Datachannel;

  ice_lite: boolean = false;
  restarting_ice: boolean = false;
  created_at: number;
  version?: string;
  conn_id?: string;
  receivers: TrackReceiver[] = [];
  senders: TrackSender[] = [];
  msgChannels: Map<string, RoomMessageChannel> = new Map();
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
    let dataChannel = this.peer.createDataChannel("datachannel");
    this.dc = new Datachannel(dataChannel as any);
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

    this.peer.addEventListener('connectionstatechange', event => {
      console.log(
        "[Session] RTCPeer connectionstatechange",
        this.peer.connectionState,
      );
    });
    this.peer.addEventListener('icecandidate', async event => {
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
    });
    this.peer.addEventListener('icecandidateerror', event => {
      console.log(
        "[Session] RTCPeer icecandidateerror",
        this.peer.connectionState,
      );
    });
    this.peer.addEventListener('iceconnectionstatechange', event => {
      console.log(
        "[Session] RTCPeer connection state changed",
        this.peer.connectionState,
      );
    });
    this.peer.addEventListener('icegatheringstatechange', event => {
      console.log(
        "[Session] RTCPeer icegatheringstatechange",
        this.peer.connectionState,
      );
    });
    this.peer.addEventListener('negotiationneeded', event => {
      console.log(
        "[Session] RTCPeer negotiationneeded",
        this.peer.connectionState,
      );
    });
    this.peer.addEventListener('signalingstatechange', event => {
      console.log(
        "[Session] RTCPeer signalingstatechange",
        this.peer.connectionState,
      );
    });
    this.peer.addEventListener('track', event => {
      for (let i = 0; i < this.receivers.length; i++) {
        const receiver = this.receivers[i]!;
        if (receiver.webrtcTrackId == event.track?.id) {
          console.log(
            "[Session] found receiver for track",
            receiver.name,
            event.track,
          );
          receiver.setTrackReady();
          return;
        }
      }
    });

    //TODO:web
    // //TODO add await to throtle for avoiding too much update in short time
    // this.peer.onnegotiationneeded = (event) => {
    //   console.log("[Session] RTCPeer negotiation needed", event);
    //   if (this.dc.connected && !this.restarting_ice)
    //     this.syncSdp().then(console.log).catch(console.error);
    // };

    // this.peer.onconnectionstatechange = (_event) => {
    //   console.log(
    //     "[Session] RTCPeer connection state changed",
    //     this.peer.connectionState,
    //   );
    // };

    // this.peer.oniceconnectionstatechange = (_event) => {
    //   console.log(
    //     "[Session] RTCPeer ice state changed",
    //     this.peer.iceConnectionState,
    //   );
    // };

    // this.peer.ontrack = (event) => {
    //   for (let i = 0; i < this.receivers.length; i++) {
    //     const receiver = this.receivers[i]!;
    //     if (receiver.webrtcTrackId == event.track.id) {
    //       console.log(
    //         "[Session] found receiver for track",
    //         receiver.name,
    //         event.track,
    //       );
    //       receiver.setTrackReady();
    //       return;
    //     }
    //   }
    //   console.warn("[Session] not found receiver for track", event.track);
    // };

    // this.peer.onicecandidate = async (event) => {
    //   if (event.candidate && !this.ice_lite) {
    //     const req = RemoteIceRequest.create({
    //       candidates: [event.candidate.candidate],
    //     });
    //     console.log("Send ice-candidate", event.candidate.candidate);
    //     const res = await postProtobuf(
    //       RemoteIceRequest,
    //       RemoteIceResponse,
    //       this.gateway + "/webrtc/" + this.conn_id + "/ice-candidate",
    //       req,
    //       {
    //         "Content-Type": "application/grpc",
    //       },
    //     );
    //     console.log("Sent ice-candidate", res);
    //   }
    // };

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
    const sender = new TrackSender(this.dc, track_name, track_or_kind, cfg);
    if (!this.prepareState) {
      sender.prepare(this.peer);
    }
    this.senders.push(sender);
    console.log("Created sender", sender.kind, track_name);
    return sender;
  }

  async connect(version?: string) {
    try {
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
        version: version || "pure-ts@" + config.version,
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
      console.log("res postProtobuf", res);
      this.conn_id = res.connId;
      this.ice_lite = res.iceLite;
      await this.peer.setLocalDescription(local_desc);
      await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp });
      await this.dc.ready();
      console.log("Connected");
    } catch (e) {
      console.log("Error in connect", e);
    }
  }

  async restartIce() {
    //TODO detect disconnect state and call restart-ice
    this.restarting_ice = true;
    this.peer.restartIce();
    const local_desc = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    const req = ConnectRequest.create({
      version: this.version || "pure-ts@" + config.version,
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
        r.afterRestartIce();
      }, []);
    }
    await this.peer.setLocalDescription(local_desc);
    await this.peer.setRemoteDescription({ type: "answer", sdp: res.sdp });
    this.restarting_ice = false;
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

  /**
   *
   * Create a new MessageChannel for room based message passing. If a channel already exist with the same key, it will return the existing channel.
   *
   */
  async createMessageChannel(
    key: string,
    config?: MessageChannelConfig | undefined,
  ) {
    await this.dc.ready();
    console.warn("[MessageChannel] creating a new channel:", key);
    if (this.msgChannels.has(key)) {
      console.warn("[MessageChannel] a channel already exist with key:", key);
      return this.msgChannels.get(key)!;
    }
    const msgChannel = new RoomMessageChannel(key, this.dc, config);
    msgChannel.on("close", () => {
      console.log("[MessageChannel] a channel has closed, removing from registry:", key);
      this.msgChannels.delete(key);
    })
    await msgChannel.init();
    this.msgChannels.set(key, msgChannel);
    return msgChannel;
  }

  async leave() {
    //reset local here
    this.receivers.map((r) => r.leaveRoom());
    this.mixer?.leave_room();
    this.msgChannels.forEach((d) => d.opened ?? d.close());

    await this.dc.requestSession({
      leave: {},
    });
    this.cfg.join = undefined;
    this.emit(SessionEvent.ROOM_CHANGED, undefined);
  }

  async disconnect() {
    console.warn("Disconnecting session", this.created_at);
    await this.dc.requestSession({
      disconnect: {},
    });
    console.warn("Disconnected session", this.created_at);
    this.peer.close();
  }
}
