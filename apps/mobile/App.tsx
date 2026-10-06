import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Provider, useSelector } from "react-redux";

import { store, RootState } from "./store/store";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AddDeliveryScreen from "./screens/AddDeliveryScreen";
import CustomersScreen from "./screens/CustomersScreen";
import AddCustomerScreen from "./screens/AddCustomerScreen";
import EditCustomerScreen from "./screens/EditCustomerScreen";
import CustomerDetailsScreen from "./screens/CustomerDetailsScreen";

/**
 * Minimal route stack: the app has no navigation library wired up, so the
 * authenticated flow is kept as an in-memory stack (deepest screen first).
 * Screens receive `navigate`/`goBack` and never talk to each other directly.
 */
export type Route =
    | { name: "dashboard" }
    | { name: "addDelivery" }
    | { name: "customers" }
    | { name: "addCustomer" }
    | { name: "editCustomer"; id: string }
    | { name: "customerDetails"; id: string };

export type NavProps = {
    navigate: (route: Route) => void;
    goBack: () => void;
};

// Mounted only while a token exists. Because it unmounts on logout, each new
// login starts on a fresh dashboard stack (no stale deep screen left behind).
function VendorApp() {
    const [stack, setStack] = useState<Route[]>([{ name: "dashboard" }]);

    const navigate = (route: Route) =>
        setStack((prev) => [...prev, route]);
    const goBack = () =>
        setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

    const route = stack[stack.length - 1] ?? { name: "dashboard" as const };

    switch (route.name) {
        case "addDelivery":
            return <AddDeliveryScreen navigate={navigate} goBack={goBack} />;
        case "customers":
            return <CustomersScreen navigate={navigate} goBack={goBack} />;
        case "addCustomer":
            return <AddCustomerScreen navigate={navigate} goBack={goBack} />;
        case "editCustomer":
            return (
                <EditCustomerScreen
                    id={route.id}
                    navigate={navigate}
                    goBack={goBack}
                />
            );
        case "customerDetails":
            return (
                <CustomerDetailsScreen
                    id={route.id}
                    navigate={navigate}
                    goBack={goBack}
                />
            );
        case "dashboard":
        default:
            return <DashboardScreen navigate={navigate} goBack={goBack} />;
    }
}

function AppContent() {
    const token = useSelector((state: RootState) => state.auth.token);

    if (!token) {
        return <LoginScreen />;
    }

    return <VendorApp />;
}

export default function App() {
    return (
        <Provider store={store}>
            <AppContent />
            <StatusBar style="auto" />
        </Provider>
    );
}