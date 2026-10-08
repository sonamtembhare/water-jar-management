import AddDeliveryScreen from "../screens/AddDeliveryScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function AddDeliveryRoute() {
    return (
        <RequireAuth>
            <AddDeliveryScreen navigate={navigate} goBack={goBack} />
        </RequireAuth>
    );
}
