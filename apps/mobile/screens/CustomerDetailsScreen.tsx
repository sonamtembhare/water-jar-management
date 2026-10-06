import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    getApiErrorMessage,
    useVendorCustomerDetailQuery,
} from "../store/api";
import type { NavProps } from "../App";

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

export default function CustomerDetailsScreen({
    id,
    navigate,
    goBack,
}: NavProps & { id: string }) {
    const { data, isLoading, isError, error, refetch } =
        useVendorCustomerDetailQuery(id);

    if (isLoading) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#0284c7" />
                <Text style={styles.stateText}>Loading customer...</Text>
            </View>
        );
    }

    if (isError || !data) {
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

    const rows = [
        { label: "Phone", value: data.phone ?? "Not provided" },
        { label: "Address", value: data.address ?? "Not provided" },
        { label: "Status", value: data.status === "running" ? "Active" : "Closed" },
        { label: "Total orders", value: String(data.totalOrders) },
        { label: "Delivered", value: String(data.deliveredOrders) },
        { label: "Total spent", value: `₹${data.totalSpent}` },
        {
            label: "Last order",
            value: data.lastOrderAt
                ? new Date(data.lastOrderAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                  })
                : "No orders yet",
        },
    ];

    return (
        <View style={styles.screen}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Customer Details</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigate({ name: "editCustomer", id })}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.name}>{data.name}</Text>
                    <Text style={styles.email}>{data.email}</Text>
                </View>

                <View style={styles.card}>
                    {rows.map((row) => (
                        <View key={row.label} style={styles.row}>
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <Text style={styles.rowValue}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Recent orders</Text>
                {data.recentOrders.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.stateText}>No orders yet.</Text>
                    </View>
                ) : (
                    data.recentOrders.map((order) => (
                        <View key={order.id} style={styles.card}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderNumber}>
                                    {order.orderNumber}
                                </Text>
                                <Text style={styles.orderTotal}>
                                    ₹{order.grandTotal}
                                </Text>
                            </View>
                            <View style={styles.orderMeta}>
                                <Text style={styles.orderStatus}>
                                    {STATUS_LABEL[order.status] ?? order.status}
                                </Text>
                                <Text style={styles.orderDate}>
                                    {new Date(order.createdAt).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        },
                                    )}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
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

    editButton: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },

    editButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
    },

    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#0f172a",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },

    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0f172a",
    },

    email: {
        marginTop: 4,
        fontSize: 14,
        color: "#64748b",
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 7,
    },

    rowLabel: {
        fontSize: 14,
        color: "#64748b",
    },

    rowValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#0f172a",
        textAlign: "right",
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 10,
        marginLeft: 4,
    },

    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },

    orderNumber: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
    },

    orderTotal: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0284c7",
    },

    orderMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
        gap: 8,
    },

    orderStatus: {
        fontSize: 13,
        color: "#475569",
    },

    orderDate: {
        fontSize: 13,
        color: "#64748b",
    },

    centerBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f0f9ff",
    },

    stateText: {
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
