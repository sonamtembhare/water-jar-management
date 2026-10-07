import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import type { OrderStatus, VendorDeliveryListResponse } from "@repo/types";

import {
    getApiErrorMessage,
    useUpdateVendorDeliveryStatusMutation,
    useVendorDeliveriesQuery,
} from "../store/api";
import type { NavProps } from "../App";

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

function shouldShowAdvance(status: string): boolean {
    return ["pending", "accepted", "out_for_delivery"].includes(status);
}

// Mirrors the web vendor app + the server's allowed transitions:
// pending → accepted → out_for_delivery → delivered.
function nextStatus(status: string): OrderStatus | null {
    if (status === "pending") return "accepted";
    if (status === "accepted") return "out_for_delivery";
    if (status === "out_for_delivery") return "delivered";
    return null;
}

type Delivery = VendorDeliveryListResponse["deliveries"][number];

export default function DeliveryHistoryScreen({ goBack }: NavProps) {
    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useVendorDeliveriesQuery({ pageSize: 100 });

    const [updateStatus, { isLoading: saving }] =
        useUpdateVendorDeliveryStatusMutation();
    const [advancingId, setAdvancingId] = useState<string | null>(null);

    const deliveries = data?.deliveries ?? [];

    const onAdvance = async (delivery: Delivery) => {
        const next = nextStatus(delivery.status);
        if (!next || advancingId) return;

        setAdvancingId(delivery.id);
        try {
            await updateStatus({ id: delivery.id, status: next }).unwrap();
            Alert.alert(
                "Updated",
                `Order ${delivery.orderNumber} marked as ${next.replaceAll("_", " ")}.`,
            );
        } catch (err) {
            Alert.alert(
                "Could not update delivery",
                getApiErrorMessage(err, "Could not update the delivery status."),
            );
        } finally {
            setAdvancingId(null);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#0284c7" />
                <Text style={styles.stateText}>Loading deliveries...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.centerBox}>
                <Text style={styles.errorText}>
                    {getApiErrorMessage(error, "Could not load deliveries.")}
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => refetch()}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderItem = ({ item }: { item: Delivery }) => {
        const next = nextStatus(item.status);
        const busy = advancingId === item.id;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <View
                        style={[
                            styles.badge,
                            item.status === "delivered"
                                ? styles.badgeDelivered
                                : item.status === "cancelled"
                                  ? styles.badgeCancelled
                                  : styles.badgeOpen,
                        ]}
                    >
                        <Text style={styles.badgeText}>
                            {STATUS_LABEL[item.status] ?? item.status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.customer}>{item.customerName}</Text>
                <Text style={styles.meta}>
                    {item.items.map((i) => `${i.quantity} × ${i.productName}`).join(", ")}
                </Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>
                        ₹{item.grandTotal} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                        })}
                    </Text>
                    {shouldShowAdvance(item.status) && next && (
                        <TouchableOpacity
                            style={[styles.advanceButton, busy && styles.advanceBusy]}
                            onPress={() => onAdvance(item)}
                            disabled={saving || busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={styles.advanceText}>
                                    Mark {next.replaceAll("_", " ")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Delivery History</Text>
            </View>

            {deliveries.length === 0 ? (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyTitle}>No deliveries yet.</Text>
                    <Text style={styles.stateText}>
                        Orders you record from the dashboard appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={() => refetch()}
                            tintColor="#0284c7"
                        />
                    }
                />
            )}
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

    list: {
        paddingHorizontal: 16,
        paddingBottom: 32,
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

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 6,
    },

    orderNumber: {
        flex: 1,
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
    },

    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },

    badgeDelivered: {
        backgroundColor: "#dcfce7",
    },

    badgeCancelled: {
        backgroundColor: "#fee2e2",
    },

    badgeOpen: {
        backgroundColor: "#e0f2fe",
    },

    badgeText: {
        fontSize: 12,
        fontWeight: "700",
    },

    customer: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 2,
    },

    meta: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 10,
    },

    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },

    footerText: {
        flex: 1,
        fontSize: 13,
        color: "#64748b",
    },

    advanceButton: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 9,
        minWidth: 128,
        alignItems: "center",
    },

    advanceBusy: {
        opacity: 0.7,
    },

    advanceText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 13,
    },

    centerBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },

    stateText: {
        marginTop: 8,
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
    },

    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
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
});