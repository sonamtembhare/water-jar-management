import AddCustomerScreen from "../screens/AddCustomerScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function AddCustomerRoute() {
    return (
        <RequireAuth>
            <AddCustomerScreen navigate={navigate} goBack={goBack} />
        </RequireAuth>
    );
}
