import { fetchUsers } from "@/lib/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

type User = {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
};

export default function UsersScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const data = await fetchUsers();
            setUsers(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load users");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const renderItem = ({ item }: { item: User }) => {
        const initials = item.name
            .split(" ")
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();

        return (
            <Link href={`/user/${item.id}`} asChild>
                <Pressable style={styles.card} onPress={() => console.log("Open", item)}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.sub}>
                            {item.email}
                        </Text>
                        <Text style={styles.sub}>{item.phone}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#999" />
                </Pressable>
            </Link>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading users…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {error ? (
                <View style={styles.errorBox}>
                    <Ionicons name="warning-outline" size={18} color="#b00020" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable onPress={load} style={styles.retry}>
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                data={users}
                keyExtractor={(u) => String(u.id)}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.empty}>No users found</Text>
                    </View>
                }
                contentContainerStyle={{ paddingVertical: 12 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f6f6f6", paddingHorizontal: 12 },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    loadingText: { color: "#666" },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: { color: "#fff", fontWeight: "700" },
    content: { flex: 1 },
    name: { fontSize: 16, fontWeight: "700", color: "#111" },
    sub: { color: "#666", marginTop: 2 },
    sep: { height: 10 },
    errorBox: {
        backgroundColor: "#fdecec",
        borderColor: "#f5c2c7",
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
        marginTop: 12,
        marginBottom: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    errorText: { color: "#b00020", flex: 1 },
    retry: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#b00020",
        borderRadius: 8,
    },
    retryText: { color: "#fff", fontWeight: "600" },
    empty: { color: "#666" },
});
