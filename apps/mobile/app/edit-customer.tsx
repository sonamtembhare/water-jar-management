import { useLocalSearchParams } from "expo-router";

import EditCustomerScreen from "../screens/EditCustomerScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function EditCustomerRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <RequireAuth>
            <EditCustomerScreen
                id={String(id ?? "")}
                navigate={navigate}
                goBack={goBack}
            />
        </RequireAuth>
    );
}
