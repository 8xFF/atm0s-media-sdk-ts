import { StackActions, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/home";
import { RoomScreen } from "../screens/room";


const Stack = createNativeStackNavigator();

export const AppNavigation = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{
                    headerShown: false,
                    title: "Home"
                }}
            />

            <Stack.Screen
                name="RoomScreen"
                component={RoomScreen}
                options={{
                    headerShown: false,
                    title: "Room"
                }}
            />


        </Stack.Navigator>
    )
}