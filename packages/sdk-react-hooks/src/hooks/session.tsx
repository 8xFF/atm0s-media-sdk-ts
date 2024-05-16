import { useContext, useEffect, useMemo, useState } from "react";
import { Atm0sMediaContext } from "../provider";
import { Context, ContextEvent } from "../context";
import { JoinInfo } from "@atm0s-media-sdk/sdk-core/lib";

const VERSION = "react@0.0.0"; //TODO auto version

class SessionWrap {
  constructor(private ctx: Context) {}
  connect = () => {
    return this.ctx.connect(VERSION);
  };
  restartIce = () => {
    return this.ctx.restartIce();
  };
  join = async (info: any, token: string) => {
    await this.ctx.join(info, token);
  };
  leave = async () => {
    await this.ctx.leave();
  };
  disconnect = () => {
    this.ctx.disconnect();
  };
}

export function useSession() {
  const ctx = useContext(Atm0sMediaContext);
  return useMemo(() => {
    return new SessionWrap(ctx);
  }, [ctx]);
}

export function useRoom(): JoinInfo | undefined {
  const ctx = useContext(Atm0sMediaContext);
  const [room, setRoom] = useState(() => ctx.room);
  useEffect(() => {
    const handler = (room?: JoinInfo) => {
      setRoom(room);
    };
    ctx.on(ContextEvent.RoomUpdated, handler);
    return () => {
      ctx.off(ContextEvent.RoomUpdated, handler);
    };
  }, [ctx]);
  return room;
}
