import DeliveryHistoryScreen from "../screens/DeliveryHistoryScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function DeliveriesRoute() {
    return (
        <RequireAuth>
            <DeliveryHistoryScreen navigate={navigate} goBack={goBack} />
        </RequireAuth>
    );
}
