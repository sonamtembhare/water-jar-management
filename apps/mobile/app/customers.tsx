import CustomersScreen from "../screens/CustomersScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function CustomersRoute() {
    return (
        <RequireAuth>
            <CustomersScreen navigate={navigate} goBack={goBack} />
        </RequireAuth>
    );
}
