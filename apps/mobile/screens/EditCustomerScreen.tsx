import React, { useEffect } from "react";
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
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    vendorCustomerUpdateSchema,
    type VendorCustomerUpdateInput,
} from "@repo/types";

import {
    getApiErrorMessage,
    useUpdateVendorCustomerMutation,
    useVendorCustomerDetailQuery,
} from "../store/api";
import type { NavProps } from "../App";

export default function EditCustomerScreen({
    id,
    goBack,
}: NavProps & { id: string }) {
    const { data: customer, isLoading, isError, error, refetch } =
        useVendorCustomerDetailQuery(id);

    const [updateCustomer, { isLoading: saving }] =
        useUpdateVendorCustomerMutation();

    const {
        control,
        setValue,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<VendorCustomerUpdateInput>({
        resolver: zodResolver(vendorCustomerUpdateSchema),
        defaultValues: { name: "", phone: "", address: undefined },
    });

    const formValues = useWatch({ control });

    useEffect(() => {
        if (customer) {
            reset({
                name: customer.name,
                phone: customer.phone ?? "",
                address: customer.address ?? undefined,
            });
        }
    }, [customer, reset]);

    const onSubmit = async (values: VendorCustomerUpdateInput) => {
        try {
            await updateCustomer({ id, body: values }).unwrap();
            Alert.alert("Customer updated", "Changes were saved.");
            goBack();
        } catch (err) {
            Alert.alert("Could not update customer", getApiErrorMessage(err));
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#0284c7" />
                <Text style={styles.stateText}>Loading customer...</Text>
            </View>
        );
    }

    if (isError || !customer) {
        return (
            <View style={styles.centerBox}>
                <Text style={styles.errorText}>
                    {getApiErrorMessage(error, "Could not load this customer.")}
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => refetch()}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelLink} onPress={goBack}>
                    <Text style={styles.cancelLinkText}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const field = (
        label: string,
        key: keyof VendorCustomerUpdateInput,
        props: Partial<React.ComponentProps<typeof TextInput>> = {},
    ) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                {...props}
                value={formValues[key] ?? ""}
                onChangeText={(text) =>
                    setValue(
                        key,
                        text === "" && key === "address" ? undefined : text,
                        { shouldDirty: true, shouldValidate: true },
                    )
                }
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
                <Text style={styles.title}>Edit Customer</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.hint}>{customer.email}</Text>

                {field("Full name", "name", {
                    placeholder: "Customer name",
                    autoCapitalize: "words",
                })}
                {field("Mobile", "phone", {
                    placeholder: "10-digit mobile number",
                    keyboardType: "phone-pad",
                })}
                {field("Address", "address", {
                    placeholder: "Delivery address",
                    autoCapitalize: "sentences",
                })}

                <TouchableOpacity
                    style={[styles.submitButton, saving && styles.submitDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitText}>Save Changes</Text>
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

    centerBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f0f9ff",
    },

    stateText: {
        marginTop: 8,
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
    },

    errorText: {
        color: "#b91c1c",
        fontSize: 15,
        textAlign: "center",
    },

    retryButton: {
        marginTop: 14,
        backgroundColor: "#0284c7",
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 10,
    },

    retryText: {
        color: "#ffffff",
        fontWeight: "700",
    },

    cancelLink: {
        marginTop: 16,
    },

    cancelLinkText: {
        color: "#0284c7",
        fontWeight: "600",
    },
});
