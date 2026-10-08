import DashboardScreen from "../screens/DashboardScreen";
import { navigate, goBack, RequireAuth } from "../App";

export default function DashboardRoute() {
    return (
        <RequireAuth>
            <DashboardScreen navigate={navigate} goBack={goBack} />
        </RequireAuth>
    );
}
