import { useEffect, useState, type ReactNode } from "react";
import { router } from "expo-router";
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
import DeliveryHistoryScreen from "./screens/DeliveryHistoryScreen";

/**
 * Minimal route stack: the app has no navigation library wired up, so the
 * authenticated flow is kept as an in-memory stack (deepest screen first).
 * Screens receive `navigate`/`goBack` and never talk to each other directly.
 */
export type Route =
    | { name: "dashboard" }
    | { name: "addDelivery" }
    | { name: "deliveries" }
    | { name: "customers" }
    | { name: "addCustomer" }
    | { name: "editCustomer"; id: string }
    | { name: "customerDetails"; id: string };

export type NavProps = {
    navigate: (route: Route) => void;
    goBack: () => void;
};

// Expo Router implementations of the NavProps contract, used by the route
// files in app/ so the screens keep receiving navigate/goBack unchanged.
export function navigate(route: Route) {
    switch (route.name) {
        case "dashboard":
            router.push("/dashboard");
            break;
        case "addDelivery":
            router.push("/add-delivery");
            break;
        case "deliveries":
            router.push("/deliveries");
            break;
        case "customers":
            router.push("/customers");
            break;
        case "addCustomer":
            router.push("/add-customer");
            break;
        case "editCustomer":
            router.push({
                pathname: "/edit-customer",
                params: { id: route.id },
            });
            break;
        case "customerDetails":
            router.push({
                pathname: "/customer-details",
                params: { id: route.id },
            });
            break;
    }
}

export function goBack() {
    if (router.canGoBack()) {
        router.back();
    }
}

export function RequireAuth({ children }: { children: ReactNode }) {
    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (!token) {
            router.replace("/");
        }
    }, [token]);

    if (!token) {
        return null;
    }

    return <>{children}</>;
}

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
        case "deliveries":
            return <DeliveryHistoryScreen navigate={navigate} goBack={goBack} />;
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