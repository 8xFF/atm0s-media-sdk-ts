import { useCallback, useEffect, useState } from "react";
import { Gateways } from "../constants";

export const SelectedGateway = {
  url: Gateways[0]!,
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
        {Gateways.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </div>
  );
}
