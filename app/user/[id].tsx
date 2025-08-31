// app/users/[id].tsx
import CommentCard from "@/components/CommentCard";
import VideoPlayerCard from "@/components/VideoPlayer";
import { fetchUserById, User } from "@/lib/user";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function UserDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const [currentTime, setCurrentTime] = useState(3.05); 
    const [comment, setComment] = useState("");

    const formatTimestamp = (seconds: number) => {
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
        const ms = String(Math.floor((seconds % 1) * 100)).padStart(2, "0");
        return `${hrs}:${mins}:${secs}:${ms}`;
    };

    const handleSend = () => {
        if (!comment.trim()) return;
        console.log("Saved:", { timestamp: currentTime, text: comment });
        setComment("");
    };

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setError(null);
                const data = await fetchUserById(Number(id));
                setUser(data);
            } catch (e: any) {
                setError(e?.message ?? "Failed to load user");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading user…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>User not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Content Area */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <VideoPlayerCard userData = {user} />

                <CommentCard
                    user="CAZZ INC"
                    initials="CI"
                    timeAgo="2d"
                    timestamp="00:00:01:01"
                    text="So you can give changes based on timestamp"
                />
            </ScrollView>

            {/* Fixed Footer (Comment Bar) */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
                <View style={styles.commentBar}>
                    {/* Row 1: timestamp + input */}
                    <View style={styles.row}>
                        <View style={styles.timestampBox}>
                            <Text style={styles.timestamp}>
                                {formatTimestamp(currentTime)}
                            </Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Write a comment..."
                            placeholderTextColor="#777"
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>

                    {/* Row 2: actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.iconButton}>
                            <EvilIcons name="pencil" size={26} color="#aaa" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                            <EvilIcons name="sc-telegram" size={30} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },
    scrollContent: {
        paddingBottom: 140, // space so comments not hidden behind footer
    },
    commentBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#111",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    timestampBox: {
        backgroundColor: "#333",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginRight: 8,
    },
    timestamp: {
        color: "#FFD700",
        fontSize: 12,
        fontWeight: "600",
    },
    input: {
        flex: 1,
        color: "#fff",
        backgroundColor: "#222",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 14,
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    iconButton: {
        padding: 6,
    },
    sendBtn: {
        padding: 6,
        borderRadius: 20,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { color: "#666", marginTop: 6 },
    error: { color: "red" },
});