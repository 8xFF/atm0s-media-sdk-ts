export const Gateways = (
  process.env.NEXT_PUBLIC_GATEWAYS || "http://localhost:3001"
).split(";");
