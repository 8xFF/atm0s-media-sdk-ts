import { useCallback, useState } from "react";
import { env } from "../env";

interface Props {
  onChanged: (index: number) => void;
}

export function GatewaySelectors({ onChanged }: Props) {
  const [selected, setSelected] = useState(0);
  const change = useCallback((e: any) => {
    onChanged(e.target.options[e.target.selectedIndex].value);
    setSelected(e.target.options[e.target.selectedIndex].value);
  }, []);

  return (
    <div>
      Gateways:{" "}
      <select onChange={change} value={selected}>
        {env.GATEWAY_ENDPOINTS.map((g, i) => (
          <option key={i} value={i}>
            {g}
          </option>
        ))}
      </select>
    </div>
  );
}
