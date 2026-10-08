import React from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../store/store";
import { clearCredentials } from "../store/authSlice";
import {
    getApiErrorMessage,
    useVendorOverviewQuery,
} from "../store/api";
import type { NavProps } from "../App";

export default function DashboardScreen({ navigate }: NavProps) {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useVendorOverviewQuery(undefined, { refetchOnMountOrArgChange: true });

    const vendorName = user?.name?.trim() || "Vendor";

    const stats = [
        { label: "Total Orders", value: data?.todaysOrders ?? 0 },
        { label: "Delivered", value: data?.todaysDelivered ?? 0 },
        { label: "Pending", value: data?.todaysPending ?? 0 },
        { label: "Total Customers", value: data?.totalCustomers ?? 0 },
    ];

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={isFetching && !isLoading}
                    onRefresh={() => refetch()}
                    tintColor="#0284c7"
                />
            }
        >
            <View style={styles.headerRow}>
                <Text style={styles.title}>💧 Water Jar Management</Text>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => dispatch(clearCredentials())}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.welcome}>Welcome, {vendorName}</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>{"Today's Summary"}</Text>

                {isLoading ? (
                    <ActivityIndicator
                        size="large"
                        color="#0284c7"
                        style={styles.loader}
                    />
                ) : isError ? (
                    <View style={styles.stateBox}>
                        <Text style={styles.errorText}>
                            {getApiErrorMessage(error, "Could not load dashboard statistics.")}
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => refetch()}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.statsGrid}>
                        {stats.map((stat) => (
                            <View key={stat.label} style={styles.statTile}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigate({ name: "addDelivery" })}
            >
                <Text style={styles.primaryButtonText}>Add New Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigate({ name: "customers" })}
            >
                <Text style={styles.secondaryButtonText}>View Customers</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.secondaryButton, styles.deliveriesButton]}
                onPress={() => navigate({ name: "deliveries" })}
            >
                <Text style={styles.secondaryButtonText}>Delivery History</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f0f9ff",
    },

    content: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },

    title: {
        flex: 1,
        fontSize: 24,
        fontWeight: "700",
        color: "#0284c7",
    },

    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#fee2e2",
    },

    logoutText: {
        color: "#dc2626",
        fontSize: 14,
        fontWeight: "600",
    },

    welcome: {
        marginTop: 12,
        marginBottom: 24,
        fontSize: 20,
        fontWeight: "600",
        color: "#334155",
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 24,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 16,
    },

    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },

    statTile: {
        backgroundColor: "#f0f9ff",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: "center",
        minWidth: "45%",
        flexGrow: 1,
    },

    statValue: {
        fontSize: 26,
        fontWeight: "700",
        color: "#0284c7",
    },

    statLabel: {
        marginTop: 4,
        fontSize: 13,
        color: "#475569",
        textAlign: "center",
    },

    loader: {
        marginVertical: 24,
    },

    stateBox: {
        alignItems: "center",
        paddingVertical: 12,
    },

    errorText: {
        color: "#b91c1c",
        fontSize: 14,
        textAlign: "center",
    },

    retryButton: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#0284c7",
    },

    retryText: {
        color: "#ffffff",
        fontWeight: "600",
    },

    primaryButton: {
        backgroundColor: "#0284c7",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },

    primaryButtonText: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },

    secondaryButton: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#0284c7",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },

    secondaryButtonText: {
        color: "#0284c7",
        fontSize: 17,
        fontWeight: "700",
    },

    deliveriesButton: {
        marginTop: 12,
    },
});
