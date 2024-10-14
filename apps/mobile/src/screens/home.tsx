import { useCallback, useRef, useState } from "react";
import { Button, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native"
import { generate_token } from "../actions/token";
import { GatewaySelectors } from "../components/GatewaySelector";
import { useNavigation } from "@react-navigation/native";

export const HomeScreen = () => {
    const roomRef = useRef<any>(null);
    const peerRef = useRef<any>(null);
    const [room, setRoom] = useState('123');
    const [peer, setPeer] = useState('B');
    const [gatewayIndex, setGatewayIndex] = useState(0);
    const navigation = useNavigation<any>();
    const onEnter = useCallback(async () => {
        const token = await generate_token(room, peer);
        navigation.navigate('RoomScreen', {
            gatewayIndex,
            room,
            peer,
            token
        });
    }, [gatewayIndex, room, peer]);

    return <View style={{
        flex: 1,
        alignItems: 'center', justifyContent: 'center',
        padding: 16
    }}>
        <Text style={{ fontSize: 20 }}>Enter your information</Text>
        <Text>Select gateway which closest to your location</Text>
        <GatewaySelectors onChanged={setGatewayIndex} />
        <TextInput
            value={room}
            onChangeText={setRoom}
            style={styles.input}
            placeholder="Room"
        />
        <TextInput
            value={peer}
            onChangeText={setPeer}
            style={styles.input}
            placeholder="Username"
        />
        <Button title="Join"
            onPress={onEnter}
        />
    </View>
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: "#000",
        width: "100%",
        borderRadius: 8,
        marginBottom: 8,
        padding: 8,
    }
});