import { useContext, useMemo } from "react";
import { Atm0sMediaContext } from "../provider";
import { Context } from "../context";

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
