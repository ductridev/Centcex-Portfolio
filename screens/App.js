import "react-native-gesture-handler";
import React, { useEffect } from "react";
import BottomBar from "../components/BottomBar";
import TopBar from "../components/TopBar";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../screens/Login";
import Dashboard from "../screens/Dashboard";
import Market from "../screens/Market";
import Holdings from "../screens/Holdings";
import Activity from "../screens/Activity";
import Settings from "../screens/Settings";
import { ThemeProvider } from "../utils/theme";

const Stack = createStackNavigator();

const horizontalAnimation = {
	gestureDirection: "horizontal",
	cardStyleInterpolator: ({ current, layouts }) => {
		return {
			cardStyle: {
				transform: [{
					translateX: current.progress.interpolate({
						inputRange: [0, 1],
						outputRange: [layouts.screen.width, 0],
					}),
				}],
			}
		};
	},
};

function navigate(name, params) {
	navigationRef.current?.navigate(name, params);
}

export default function App() {
	const navigationRef = React.createRef();
	const routeNameRef = React.createRef();

	const [active, setActive] = React.useState("Login");

	return (
		<ThemeProvider>
			<NavigationContainer ref={navigationRef} onStateChange={() => checkState()} onReady={() =>
				(routeNameRef.current = navigationRef.current.getCurrentRoute().name)}>
				{active !== "Login" &&
					<TopBar title={active}></TopBar>
				}
				<Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
					{active === "Login" &&
						<Stack.Screen name="Login" component={Login}></Stack.Screen>
					}
					<Stack.Screen name="Dashboard" component={Dashboard} options={horizontalAnimation}></Stack.Screen>
					<Stack.Screen name="Market" component={Market} options={horizontalAnimation}></Stack.Screen>
					<Stack.Screen name="Holdings" component={Holdings} options={horizontalAnimation}></Stack.Screen>
					<Stack.Screen name="Activity" component={Activity} options={horizontalAnimation}></Stack.Screen>
					<Stack.Screen name="Settings" component={Settings} options={horizontalAnimation}></Stack.Screen>
				</Stack.Navigator>
				{active !== "Login" &&
					<BottomBar navigation={navigationRef} screen={{ active: active, setActive: setActive }}></BottomBar>
				}
			</NavigationContainer>
		</ThemeProvider>
	);

	async function checkState() {
		let currentRouteName = navigationRef.current.getCurrentRoute().name;

		setActive(currentRouteName);
	}
}