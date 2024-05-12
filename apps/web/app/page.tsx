import Link from "next/link";
import styles from "./page.module.css";

export default function Page(): JSX.Element {
  return (
    <main className={styles.main}>
      <Link href="/ts_samples/echo_fast">
        Pure typescript: echo fast sample
      </Link>
    </main>
  );
}
