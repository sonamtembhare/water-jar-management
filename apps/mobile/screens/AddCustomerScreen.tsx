import React from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    vendorCustomerCreateSchema,
    type VendorCustomerCreateInput,
} from "@repo/types";

import {
    getApiErrorMessage,
    useCreateVendorCustomerMutation,
} from "../store/api";
import type { NavProps } from "../App";

export default function AddCustomerScreen({ goBack }: NavProps) {
    const [createCustomer, { isLoading: saving }] =
        useCreateVendorCustomerMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VendorCustomerCreateInput>({
        resolver: zodResolver(vendorCustomerCreateSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phone: "",
            address: "",
        },
    });

    const onSubmit = async (values: VendorCustomerCreateInput) => {
        try {
            await createCustomer(values).unwrap();
            Alert.alert("Customer added", `${values.name} was added successfully.`);
            goBack();
        } catch (error) {
            Alert.alert(
                "Could not add customer",
                getApiErrorMessage(
                    error,
                    "Could not add customer. The email may already exist.",
                ),
            );
        }
    };

    const field = (
        label: string,
        key: keyof VendorCustomerCreateInput,
        props: Partial<React.ComponentProps<typeof TextInput>> = {},
    ) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                {...props}
                {...register(key)}
            />
            {errors[key] && (
                <Text style={styles.error}>{errors[key]?.message}</Text>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Add Customer</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.hint}>
                    The customer gets login access with the password you set here.
                </Text>

                {field("Full name", "name", {
                    placeholder: "Customer name",
                    autoCapitalize: "words",
                })}
                {field("Email", "email", {
                    placeholder: "customer@example.com",
                    keyboardType: "email-address",
                })}
                {field("Mobile", "phone", {
                    placeholder: "10-digit mobile number",
                    keyboardType: "phone-pad",
                })}
                {field("Address", "address", {
                    placeholder: "Delivery address",
                    autoCapitalize: "sentences",
                })}
                {field("Password", "password", {
                    placeholder: "Minimum 8 characters",
                    secureTextEntry: true,
                })}

                <TouchableOpacity
                    style={[styles.submitButton, saving && styles.submitDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitText}>Save Customer</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f0f9ff",
    },

    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
        gap: 12,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
    },

    backText: {
        fontSize: 20,
        color: "#0284c7",
        fontWeight: "700",
    },

    title: {
        flex: 1,
        fontSize: 22,
        fontWeight: "700",
        color: "#0f172a",
    },

    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    hint: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 18,
    },

    field: {
        marginBottom: 16,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 6,
    },

    input: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },

    error: {
        marginTop: 5,
        fontSize: 13,
        color: "#b91c1c",
    },

    submitButton: {
        marginTop: 8,
        backgroundColor: "#0284c7",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
    },

    submitDisabled: {
        opacity: 0.7,
    },

    submitText: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },
});
