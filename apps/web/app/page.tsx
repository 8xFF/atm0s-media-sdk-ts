import Link from "next/link";
import "./globals.css";

export default function Page(): JSX.Element {
  return (
    <main className="p-6">
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
      </div>
      <div>React sample</div>
      <div className="pl-3">
        <div>
          <Link href="/react_samples/echo_fast">Echo fast</Link>
        </div>
        <div>
          <Link href="/react_samples/echo_lazy">Echo lazy</Link>
        </div>
        <div>
          <Link href="/react_samples/echo_simulcast">Echo simulcast</Link>
        </div>
        <div>
          <Link href="/react_samples/multi_track_receivers">
            Multi track receivers
          </Link>
        </div>
        <div>
          <Link href="/react_samples/switch_sender_track">
            Switch sender track
          </Link>
        </div>
      </div>
    </main>
  );
}
