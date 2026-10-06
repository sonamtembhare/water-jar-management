import React from "react";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useVendorLoginMutation } from "../store/api";
import * as SecureStore from "expo-secure-store";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";

export default function LoginScreen() {
    const dispatch = useDispatch();

    const [vendorLogin, { isLoading }] = useVendorLoginMutation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert("Login", "Please enter email and password.");
            return;
        }

        try {
            const response = await vendorLogin({
                email: email.trim(),
                password,
            }).unwrap();

            await SecureStore.setItemAsync(
                "accessToken",
                response.token
            );

            dispatch(
                setCredentials({
                    token: response.token,
                    user: response.user,
                })
            );

            Alert.alert(
                "Login Successful",
                `Welcome ${response.user.name}`
            );
        } catch (error: any) {
            const message =
                error?.data?.error?.message ||
                error?.data?.message ||
                "Invalid email or password.";

            Alert.alert("Login Failed", message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Water Jar Management</Text>

            <Text style={styles.subtitle}>Vendor Login</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f0f9ff",
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        color: "#0284c7",
    },

    subtitle: {
        marginTop: 8,
        marginBottom: 30,
        fontSize: 20,
        textAlign: "center",
        fontWeight: "600",
    },

    input: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 13,
        marginBottom: 15,
        fontSize: 16,
    },

    button: {
        backgroundColor: "#0284c7",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 5,
    },

    buttonText: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },
});