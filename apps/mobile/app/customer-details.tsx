import { useLocalSearchParams } from "expo-router";

import CustomerDetailsScreen from "../screens/CustomerDetailsScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function CustomerDetailsRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <RequireAuth>
            <CustomerDetailsScreen
                id={String(id ?? "")}
                navigate={navigate}
                goBack={goBack}
            />
        </RequireAuth>
    );
}
