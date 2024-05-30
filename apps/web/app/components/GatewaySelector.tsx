import { useCallback, useState } from "react";
import { env } from "../env";

export const SelectedGateway = {
  url: env.GATEWAY_ENDPOINTS[0]!,
};

export function GatewaySelectors() {
  const [selected, setSelected] = useState(SelectedGateway.url);
  const change = useCallback((e: any) => {
    (window as any).selectoio = e;
    SelectedGateway.url = e.target.options[e.target.selectedIndex].value;
    setSelected(SelectedGateway.url);
  }, []);

  return (
    <div>
      Gateways:{" "}
      <select onChange={change} value={selected}>
        {env.GATEWAY_ENDPOINTS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </div>
  );
}
