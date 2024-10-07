export const env = {
  GATEWAY_ENDPOINTS: (
    (process.env.NEXT_PUBLIC_GATEWAYS as string) || "http://localhost:3001"
  ).split(";"),
  SIP_GATEWAY: (process.env.NEXT_PUBLIC_SIP_GATEWAY as string) || "http://localhost:3001",
  APP_SECRET: (process.env.APP_SECRET as string) || "insecure",
};