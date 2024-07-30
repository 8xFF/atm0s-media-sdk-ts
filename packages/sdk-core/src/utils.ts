export interface Writer {
  finish(): Uint8Array;
}

export interface RequestBuilder<Request> {
  encode(message: Request): Writer;
}

export interface ResponseParse<Response> {
  decode(message: Uint8Array): Response;
}

export async function postProtobuf<Request, Response>(
  req_ser: RequestBuilder<Request>,
  res_parse: ResponseParse<Response>,
  url: string,
  req: Request,
  headers?: any,
): Promise<Response> {
  let res = await fetch(url, {
    method: "POST",
    headers,
    body: req_ser.encode(req).finish(),
  });
  let buf = await res.arrayBuffer();
  return res_parse.decode(new Uint8Array(buf));
}

export interface IEventEmitter {
  emit(event: string, ...args: any): void;
  on(event: string, cb: any): void;
  off(event: string, cb: any): void;
  offAllListeners(): void;

  removeAllListeners(): void;
  removeListener(event: string, cb: any): void;
}

export class EventEmitter implements IEventEmitter {
  events: any = {};

  emit(event: string, ...args: any) {
    for (let i of this.events[event] || []) {
      i(...args);
    }
  }

  on(event: string, cb: any) {
    (this.events[event] = this.events[event] || []).push(cb);
    return () =>
      (this.events[event] = this.events[event].filter((i: any) => i !== cb));
  }

  off(event: string, cb: any) {
    this.events[event] = this.events[event].filter((i: any) => i !== cb);
  }

  offAllListeners() {
    this.events = {};
  }

  removeAllListeners() {
    this.offAllListeners();
  }

  removeListener(event: string, cb: any) {
    this.off(event, cb);
  }
}

export class ReadyWaiter {
  ready = false;
  waits: [() => any, (err: any) => any][] = [];

  setReady = () => {
    this.ready = true;
    this.waits.map(([ready, _err]) => ready());
    this.waits = [];
  };

  setError = (e: any) => {
    this.waits.map(([_ready, err]) => err(e));
    this.waits = [];
  };

  waitReady = () => {
    if (this.ready) {
      return Promise.resolve();
    } else {
      return new Promise<void>((resolve, reject) => {
        this.waits.push([resolve, reject]);
      });
    }
  };
}
