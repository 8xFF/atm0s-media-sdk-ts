import Config from 'react-native-config';
export const env = {
  GATEWAY_ENDPOINTS: (
    (Config.NEXT_PUBLIC_GATEWAYS as string) || "http://localhost:3001"
  ).split(";"),
  APP_SECRET: (Config.APP_SECRET as string) || "insecure",
};
