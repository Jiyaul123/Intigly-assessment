import { JPUserDao, openRealm } from "@/dao";
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
    _id: string;        
    remoteId: number;   
    name: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
};

export default function UsersScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [offline, setOffline] = useState(false);

    const loadFromLocal = useCallback(async () => {
        await openRealm(); 
        const rows = await JPUserDao.listAll();
        setUsers(rows as User[]);
    }, []);

    const syncFromRemote = useCallback(async () => {
        try {
            setError(null);
            setOffline(false);
            const remote = await fetchUsers(); 
            await Promise.all(
                remote.map((u: any) =>
                    JPUserDao.upsert({
                        _id: `u_${u.id}`,
                        remoteId: u.id,
                        name: u.name ?? "",
                        email: u.email ?? "",
                    })
                )
            );
        } catch (e: any) {
            setError(e?.message ?? "Failed to refresh from server");
            setOffline(true);
        } finally {
            await loadFromLocal(); // show the latest local snapshot
        }
    }, [loadFromLocal]);

    const load = useCallback(async () => {
        try {
            // 1) always show local immediately
            await loadFromLocal();
            // 2) then attempt remote sync once on first mount
            await syncFromRemote();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loadFromLocal, syncFromRemote]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        syncFromRemote().finally(() => setRefreshing(false));
    };

    console.log(error)

    const renderItem = ({ item }: { item: User }) => {
        const initials = item.name
            .split(" ")
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();

        return (
            <Link href={`/user/${item.remoteId}`} asChild>
                <Pressable style={styles.card}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <View style={styles.content}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            <View style={styles.localPill}>
                                <Ionicons name="download-outline" size={12} color="#166534" />
                                <Text style={styles.localPillText}>Saved locally</Text>
                            </View>
                        </View>
                        <Text style={styles.sub}>{item.email}</Text>
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
            {(error || offline) ? (
                <View style={styles.bannerRow}>
                    {offline ? (
                        <View style={styles.offlinePill}>
                            <Ionicons name="cloud-offline-outline" size={14} color="#b45309" />
                            <Text style={styles.offlineText}>Offline — showing local data</Text>
                        </View>
                    ) : null}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="warning-outline" size={16} color="#b00020" />
                            <Text style={styles.errorText}>{error}</Text>
                            <Pressable onPress={syncFromRemote} style={styles.retry}>
                                <Text style={styles.retryText}>Retry</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </View>
            ) : null}

            <FlatList
                data={users}
                keyExtractor={(u) => u._id}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.empty}>No users saved locally</Text>
                    </View>
                }
                contentContainerStyle={{ paddingVertical: 12 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f6f6f6", paddingHorizontal: 12 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
    loadingText: { color: "#666" },
    bannerRow: { marginTop: 12, gap: 8 },
    offlinePill: {
        alignSelf: "flex-start",
        backgroundColor: "#fffbeb",
        borderColor: "#f59e0b55",
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    offlineText: { color: "#92400e", fontWeight: "600" },
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
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: "#4CAF50", alignItems: "center", justifyContent: "center",
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
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    errorText: { color: "#b00020", flex: 1 },
    retry: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#b00020", borderRadius: 8 },
    retryText: { color: "#fff", fontWeight: "600" },
    empty: { color: "#666" },
    localPill: {
        marginLeft: 2,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: "#ecfdf5",
        borderWidth: 1,
        borderColor: "#10b98155",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    localPillText: { color: "#166534", fontSize: 11, fontWeight: "700" },
});
