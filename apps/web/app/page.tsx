import Link from "next/link";
import "./globals.css";
import { env } from "./env";

export default function Page(): JSX.Element {
  return (
    <main className="p-6">
      <div>
        Gateways:
        <div className="p-2">
          {env.GATEWAY_ENDPOINTS.map((g) => (
            <div>{g}</div>
          ))}
        </div>
      </div>
      <div>Typescript sample</div>
      <div className="pl-3">
        <div>
          <Link href="/ts_samples/echo_fast">Echo fast</Link>
        </div>
        <div>
          <Link href="/ts_samples/echo_restart_ice">Echo restart ice</Link>
        </div>
        <div>
          <Link href="/ts_samples/echo_lazy">Echo lazy</Link>
        </div>
        <div>
          <Link href="/ts_samples/echo_simulcast">Echo simulcast</Link>
        </div>
        <div>
          <Link href="/ts_samples/multi_track_receivers">
            Multi track receivers
          </Link>
        </div>
        <div>
          <Link href="/ts_samples/switch_sender_track">
            Switch sender track
          </Link>
        </div>
        <div>
          <Link href="/ts_samples/audio_mixer_auto">
            Audio_mixer with mix-minus Auto mode
          </Link>
        </div>
        <div>
          <Link href="/ts_samples/audio_mixer_manual">
            Audio_mixer with mix-minus Manual mode
          </Link>
        </div>
      </div>
      <div>React sample</div>
      <div className="pl-3">
        <div>
          <Link href="/react_samples/echo_fast">Echo fast</Link>
        </div>
      </div>
      <div>React-ui sample</div>
      <div className="pl-3">
        <div>
          <Link href="/react_ui_samples/meet">Meet</Link>
        </div>
      </div>
    </main>
  );
}
