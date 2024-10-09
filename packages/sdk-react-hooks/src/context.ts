import {
  MediaStreamTrack,
} from 'react-native-webrtc';

import {
  Session,
  SessionConfig,
  EventEmitter,
  RoomPeerJoined,
  SessionEvent,
  RoomPeerLeaved,
  RoomTrackStarted,
  RoomTrackStopped,
  Kind,
  TrackReceiver,
  TrackSender,
  BitrateControlMode,
  Sender_Config,
  stringToKind,
  JoinInfo,
} from "@atm0s-media-sdk/core";

export enum ContextEvent {
  RoomUpdated = "room.updated",
  PeersUpdated = "peers.updated",
  TracksUpdated = "tracks.updated",
  PeerTracksUpdated = "peer.tracks.updated.",
}

export interface PublisherConfig {
  priority: number;
  bitrate: BitrateControlMode;
  simulcast?: boolean;
}

export class Publisher {
  constructor(private _sender: TrackSender) { }

  get sender() {
    return this._sender;
  }

  get attached() {
    return this._sender.attached;
  }

  async attach(track: MediaStreamTrack) {
    await this._sender.attach(track);
  }

  async config(config: Sender_Config) {
    await this._sender.config(config);
  }

  async detach() {
    await this._sender.detach();
  }
}

export class Context extends EventEmitter {
  session: Session;
  peers: Map<string, RoomPeerJoined> = new Map();
  tracks: Map<string, RoomTrackStarted> = new Map();

  free_audio_receivers: TrackReceiver[] = [];
  free_video_receivers: TrackReceiver[] = [];

  audio_publisher: Map<string, Publisher> = new Map();
  video_publisher: Map<string, Publisher> = new Map();

  constructor(
    gateway: string,
    cfg: SessionConfig,
    private prepareAudioReceivers: number = 1,
    private prepareVideoReceivers: number = 1,
  ) {
    super();
    this.session = new Session(gateway, cfg);
    this.init();
  }

  init() {
    for (let i = 0; i < (this.prepareAudioReceivers || 0); i++) {
      console.log("[SessionContext] prepare audio reicever", i);
      this.free_audio_receivers.push(this.session.receiver(Kind.AUDIO));
    }

    for (let i = 0; i < (this.prepareVideoReceivers || 0); i++) {
      console.log("[SessionContext] prepare video receiver", i);
      this.free_video_receivers.push(this.session.receiver(Kind.VIDEO));
    }

    this.session.on(SessionEvent.ROOM_PEER_JOINED, (peer: RoomPeerJoined) => {
      this.peers.set(peer.peer, peer);
      this.emit(ContextEvent.PeersUpdated);
    });
    this.session.on(SessionEvent.ROOM_PEER_LEAVED, (peer: RoomPeerLeaved) => {
      this.peers.delete(peer.peer);
      this.emit(ContextEvent.PeersUpdated);
    });
    this.session.on(
      SessionEvent.ROOM_TRACK_STARTED,
      (track: RoomTrackStarted) => {
        this.tracks.set(track.peer + "/" + track.track, track);
        this.emit(ContextEvent.TracksUpdated);
        this.emit(ContextEvent.PeerTracksUpdated + track.peer);
      },
    );
    this.session.on(
      SessionEvent.ROOM_TRACK_STOPPED,
      (track: RoomTrackStopped) => {
        this.tracks.delete(track.peer + "/" + track.track);
        this.emit(ContextEvent.TracksUpdated);
        this.emit(ContextEvent.PeerTracksUpdated + track.peer);
      },
    );
    this.session.on(SessionEvent.ROOM_CHANGED, (e?: JoinInfo) => {
      this.emit(ContextEvent.RoomUpdated, e);
    });
  }

  get room(): JoinInfo | undefined {
    return this.session.room;
  }

  takeReceiver(kind: Kind): TrackReceiver {
    let receiver =
      kind == Kind.AUDIO
        ? this.free_audio_receivers.shift()
        : this.free_video_receivers.shift();
    if (receiver) {
      return receiver;
    }
    return this.session.receiver(kind);
  }

  backReceiver(receiver: TrackReceiver) {
    if (receiver.kind == Kind.AUDIO) {
      this.free_audio_receivers.push(receiver);
    } else {
      this.free_video_receivers.push(receiver);
    }
  }

  getOrCreatePublisher(
    name: string,
    media_or_kind: Kind | MediaStreamTrack,
    cfg?: PublisherConfig,
  ) {
    //TODO check if publisher already created with same name but wrong kind
    let publisher =
      getKind(media_or_kind) == Kind.AUDIO
        ? this.audio_publisher.get(name)
        : this.video_publisher.get(name);

    if (!publisher) {
      let sender = this.session.sender(name, media_or_kind, cfg);
      publisher = new Publisher(sender);
      if (getKind(media_or_kind) == Kind.AUDIO) {
        this.audio_publisher.set(name, publisher);
      } else {
        this.video_publisher.set(name, publisher);
      }
      return publisher;
    } else {
      return publisher;
    }
  }

  connect(version: string) {
    return this.session.connect(version);
  }

  restartIce() {
    return this.session.restartIce();
  }

  async join(info: any, token: string) {
    await this.session.join(info, token);
  }

  async leave() {
    await this.session.leave();
  }

  disconnect() {
    this.session.disconnect();
  }
}

function getKind(media_or_kind: Kind | MediaStreamTrack): Kind {
  if (media_or_kind instanceof MediaStreamTrack) {
    return stringToKind(media_or_kind.kind as any);
  } else {
    return media_or_kind;
  }
}
