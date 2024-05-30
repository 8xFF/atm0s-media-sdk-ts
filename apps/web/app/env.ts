export const env = {
  GATEWAY_ENDPOINTS: (
    (process.env.NEXT_PUBLIC_GATEWAYS as string) || "http://localhost:3001"
  ).split(";"),
  APP_SECRET: (process.env.APP_SECRET as string) || "insecure",
};
