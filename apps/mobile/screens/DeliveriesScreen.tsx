import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DeliveriesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Deliveries Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
});