import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import LoginScreen from "../screens/LoginScreen";
import type { RootState } from "../store/store";

export default function IndexRoute() {
    const token = useSelector((state: RootState) => state.auth.token);
    const router = useRouter();

    useEffect(() => {
        if (token) {
            router.replace("/dashboard");
        }
    }, [token, router]);

    if (!token) {
        return <LoginScreen />;
    }

    return null;
}
