import { Session } from "../lib/main";

async function boot() {
  const test = new Session("http://localhost:3000");
  await test.connect();
}

boot();
