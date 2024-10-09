import React, { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { env } from "../../env";

interface Props {
  onChanged: (index: number) => void;
}

export function GatewaySelectors({ onChanged }: Props) {
  const [selected, setSelected] = useState(0);

  const change = useCallback((value: number) => {
    onChanged(value);
    setSelected(value);
  }, [onChanged]);
  return (
    <View style={{ width: '100%' }}>
      <Text>Gateways:</Text>
      <Picker
        selectedValue={selected}
        onValueChange={(itemValue, itemIndex) => change(itemIndex)}
      >
        {env.GATEWAY_ENDPOINTS.map((g, i) => (
          <Picker.Item key={i} label={g} value={i} />
        ))}
      </Picker>
    </View>
  );
}

export function GatewaySelectorUrl({ onChanged }: { onChanged: (url: string) => void }) {
  const [selected, setSelected] = useState(env.GATEWAY_ENDPOINTS[0]);

  const change = useCallback((value: string) => {
    onChanged(value);
    setSelected(value);
  }, [onChanged]);

  return (
    <View style={{ width: '100%' }}>
      <Text>Gateway:</Text>
      <Picker
        selectedValue={selected}
        onValueChange={(itemValue) => change(itemValue)}
      >
        {env.GATEWAY_ENDPOINTS.map((g, i) => (
          <Picker.Item key={i} label={g} value={g} />
        ))}
      </Picker>
    </View>
  );
}
