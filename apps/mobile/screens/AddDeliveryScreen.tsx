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
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    vendorDeliveryCreateSchema,
    type VendorDeliveryCreateInput,
} from "@repo/types";

import {
    getApiErrorMessage,
    useCreateVendorDeliveryMutation,
    useVendorCustomersQuery,
    useVendorProductsQuery,
} from "../store/api";
import type { NavProps } from "../App";

export default function AddDeliveryScreen({ goBack }: NavProps) {
    const { data: customerData, isLoading: customersLoading } =
        useVendorCustomersQuery({ pageSize: 100 });
    const { data: productData, isLoading: productsLoading } =
        useVendorProductsQuery();
    const [createDelivery, { isLoading: saving }] =
        useCreateVendorDeliveryMutation();

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<VendorDeliveryCreateInput>({
        // z.coerce.number() types the schema input as unknown; the quantities
        // this form produces are always numbers, so narrow it back.
        resolver: zodResolver(
            vendorDeliveryCreateSchema,
        ) as unknown as Resolver<VendorDeliveryCreateInput>,
        defaultValues: { customerId: "", items: [] },
    });

    const customerId = useWatch({ control, name: "customerId" });
    const items = useWatch({ control, name: "items" }) ?? [];
    const notes = useWatch({ control, name: "notes" });

    // Only accounts that are linked to this vendor and still active can be
    // picked — the server re-checks the same rules against the JWT vendor.
    const customers = (customerData?.customers ?? []).filter(
        (c) => c.status === "running",
    );
    const products = (productData?.products ?? []).filter((p) => p.active);

    const changeQuantity = (productId: string, quantity: number) => {
        const next =
            quantity <= 0
                ? items.filter((i) => i.productId !== productId)
                : items.map((i) =>
                      i.productId === productId ? { ...i, quantity } : i,
                  );
        setValue("items", next, { shouldValidate: true, shouldDirty: true });
    };

    const addProduct = (productId: string) =>
        setValue(
            "items",
            [...items, { productId, quantity: 1 }],
            { shouldValidate: true, shouldDirty: true },
        );

    const onSubmit = async (values: VendorDeliveryCreateInput) => {
        try {
            await createDelivery({
                ...values,
                notes: values.notes?.trim() ? values.notes.trim() : undefined,
            }).unwrap();
            Alert.alert(
                "Order confirmed successfully",
                "The order was recorded successfully.",
            );
            goBack();
        } catch (error) {
            Alert.alert("Could not create delivery", getApiErrorMessage(error));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Add New Order</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Customer</Text>
                {customersLoading ? (
                    <ActivityIndicator color="#0284c7" style={styles.loader} />
                ) : customers.length === 0 ? (
                    <Text style={styles.emptyText}>
                        No active customers yet. Add one from Customers first.
                    </Text>
                ) : (
                    customers.map((customer) => {
                        const selected = customerId === customer.customerId;
                        return (
                            <TouchableOpacity
                                key={customer.id}
                                style={[
                                    styles.option,
                                    selected && styles.optionSelected,
                                ]}
                                onPress={() =>
                                    setValue("customerId", customer.customerId, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    })
                                }
                            >
                                <Text
                                    style={[
                                        styles.optionTitle,
                                        selected && styles.optionTitleSelected,
                                    ]}
                                >
                                    {customer.name}
                                </Text>
                                <Text style={styles.optionSubtitle}>
                                    {customer.phone ?? "No phone"}
                                    {customer.address ? ` · ${customer.address}` : ""}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
                {errors.customerId && (
                    <Text style={styles.error}>{errors.customerId.message}</Text>
                )}

                <Text style={styles.sectionTitle}>Jars</Text>
                {productsLoading ? (
                    <ActivityIndicator color="#0284c7" style={styles.loader} />
                ) : products.length === 0 ? (
                    <Text style={styles.emptyText}>
                        No active jar sizes available for your business.
                    </Text>
                ) : (
                    products.map((product) => {
                        const line = items.find(
                            (i) => i.productId === product.id,
                        );
                        return (
                            <View key={product.id} style={styles.jarRow}>
                                <View style={styles.jarInfo}>
                                    <Text style={styles.jarName}>
                                        {product.name}
                                    </Text>
                                    <Text style={styles.jarMeta}>
                                        {product.sizeLiters} L · ₹
                                        {product.pricePerJar} · {product.availableStock}{" "}
                                        in stock
                                    </Text>
                                </View>

                                {line ? (
                                    <View style={styles.stepper}>
                                        <TouchableOpacity
                                            style={styles.stepButton}
                                            onPress={() =>
                                                changeQuantity(
                                                    product.id,
                                                    line.quantity - 1,
                                                )
                                            }
                                        >
                                            <Text style={styles.stepButtonText}>
                                                −
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.stepValue}>
                                            {line.quantity}
                                        </Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.stepButton,
                                                line.quantity >=
                                                    product.availableStock &&
                                                    styles.stepButtonDisabled,
                                            ]}
                                            disabled={
                                                line.quantity >=
                                                product.availableStock
                                            }
                                            onPress={() =>
                                                changeQuantity(
                                                    product.id,
                                                    line.quantity + 1,
                                                )
                                            }
                                        >
                                            <Text style={styles.stepButtonText}>
                                                +
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[
                                            styles.addButton,
                                            product.availableStock === 0 &&
                                                styles.stepButtonDisabled,
                                        ]}
                                        disabled={product.availableStock === 0}
                                        onPress={() => addProduct(product.id)}
                                    >
                                        <Text style={styles.addButtonText}>
                                            Add
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })
                )}
                {errors.items && (
                    <Text style={styles.error}>{errors.items.message}</Text>
                )}

                <Text style={styles.sectionTitle}>Delivery note (optional)</Text>
                <TextInput
                    style={styles.textarea}
                    placeholder="e.g. Left with the security guard"
                    multiline
                    value={notes ?? ""}
                    onChangeText={(text) =>
                        setValue("notes", text, { shouldDirty: true })
                    }
                />

                <TouchableOpacity
                    style={[styles.submitButton, saving && styles.submitDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitText}>Record Delivery</Text>
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
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginTop: 16,
        marginBottom: 10,
        marginLeft: 4,
    },

    loader: {
        marginVertical: 16,
    },

    emptyText: {
        fontSize: 14,
        color: "#64748b",
        marginLeft: 4,
    },

    option: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },

    optionSelected: {
        borderColor: "#0284c7",
        backgroundColor: "#e0f2fe",
    },

    optionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
    },

    optionTitleSelected: {
        color: "#0369a1",
    },

    optionSubtitle: {
        marginTop: 3,
        fontSize: 13,
        color: "#64748b",
    },

    jarRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        gap: 10,
    },

    jarInfo: {
        flex: 1,
    },

    jarName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
    },

    jarMeta: {
        marginTop: 3,
        fontSize: 13,
        color: "#64748b",
    },

    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    stepButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#e0f2fe",
        alignItems: "center",
        justifyContent: "center",
    },

    stepButtonDisabled: {
        opacity: 0.4,
    },

    stepButtonText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0284c7",
    },

    stepValue: {
        minWidth: 24,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
    },

    addButton: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 9,
    },

    addButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
    },

    textarea: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 90,
        textAlignVertical: "top",
    },

    error: {
        marginTop: 4,
        marginBottom: 6,
        fontSize: 13,
        color: "#b91c1c",
        marginLeft: 4,
    },

    submitButton: {
        marginTop: 24,
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
