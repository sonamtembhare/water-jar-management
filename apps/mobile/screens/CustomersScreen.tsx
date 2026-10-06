import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    getApiErrorMessage,
    useVendorCustomersQuery,
} from "../store/api";
import type { VendorCustomerListItem } from "@repo/types";
import type { NavProps } from "../App";

export default function CustomersScreen({ navigate, goBack }: NavProps) {
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useVendorCustomersQuery({ search: search || undefined, pageSize: 100 });

    const customers = data?.customers ?? [];

    const renderHeader = () => (
        <View>
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email or mobile..."
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={() => setSearch(searchText.trim())}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => setSearch(searchText.trim())}
                >
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.count}>
                {data ? `${data.total} customer${data.total === 1 ? "" : "s"}` : " "}
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: VendorCustomerListItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigate({ name: "customerDetails", id: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <View
                    style={[
                        styles.badge,
                        item.status === "running" ? styles.badgeRunning : styles.badgeClosed,
                    ]}
                >
                    <Text
                        style={[
                            styles.badgeText,
                            item.status === "running"
                                ? styles.badgeTextRunning
                                : styles.badgeTextClosed,
                        ]}
                    >
                        {item.status === "running" ? "Active" : "Closed"}
                    </Text>
                </View>
            </View>

            <Text style={styles.detail}>{item.phone ?? "No phone number"}</Text>
            <Text style={styles.detail} numberOfLines={2}>
                {item.address ?? "No address on file"}
            </Text>

            <View style={styles.metaRow}>
                <Text style={styles.meta}>
                    Orders: {item.totalOrders} · Delivered: {item.deliveredOrders}
                </Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigate({ name: "editCustomer", id: item.id })}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.screen}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Customers</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigate({ name: "addCustomer" })}
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.stateText}>Loading customers...</Text>
                </View>
            ) : isError ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>
                        {getApiErrorMessage(error, "Could not load customers.")}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetch()}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : customers.length === 0 ? (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyTitle}>No customers found.</Text>
                    <Text style={styles.stateText}>
                        Add your first customer to get started.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigate({ name: "addCustomer" })}
                    >
                        <Text style={styles.emptyButtonText}>Add Customer</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={customers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeader}
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
        backgroundColor: "#f0f9ff",
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

    addButton: {
        backgroundColor: "#0284c7",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },

    addButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 14,
    },

    searchRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },

    searchInput: {
        flex: 1,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
    },

    searchButton: {
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 14,
        borderRadius: 10,
        justifyContent: "center",
    },

    searchButtonText: {
        color: "#0284c7",
        fontWeight: "700",
        fontSize: 14,
    },

    count: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 10,
        marginLeft: 4,
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

    name: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: "#0f172a",
    },

    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },

    badgeRunning: {
        backgroundColor: "#dcfce7",
    },

    badgeClosed: {
        backgroundColor: "#fee2e2",
    },

    badgeText: {
        fontSize: 12,
        fontWeight: "700",
    },

    badgeTextRunning: {
        color: "#15803d",
    },

    badgeTextClosed: {
        color: "#b91c1c",
    },

    detail: {
        fontSize: 14,
        color: "#475569",
        marginBottom: 2,
    },

    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 10,
        gap: 8,
    },

    meta: {
        flex: 1,
        fontSize: 13,
        color: "#64748b",
    },

    editButton: {
        backgroundColor: "#f0f9ff",
        borderWidth: 1,
        borderColor: "#0284c7",
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
    },

    editButtonText: {
        color: "#0284c7",
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

    emptyButton: {
        marginTop: 16,
        backgroundColor: "#0284c7",
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 10,
    },

    emptyButtonText: {
        color: "#ffffff",
        fontWeight: "700",
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
