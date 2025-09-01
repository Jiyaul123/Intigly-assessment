import CommentCard from "@/components/CommentCard";
import VideoPlayerCard from "@/components/VideoPlayer";
import {
  AnnotationSessionDao,
  CommentDao,
  CommentRow,
  JPUserDao,
  StrokeDao,
  VideoDao,
} from "@/dao";
import { fetchUserById, User as RemoteUser } from "@/lib/user";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const VIDEO_URI = "https://cdn.esawebb.org/archives/videos/hd_1080p25_screen/weic2513d.mp4";

type ViewUser = { id: number; name: string; email: string };

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [user, setUser] = useState<ViewUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [activeStrokes, setActiveStrokes] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [comment, setComment] = useState("");

  const lastQueryRef = useRef(0);
  const THROTTLE_MS = 200;

  const formatTimestamp = useCallback((seconds: number) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
    const ms = String(Math.floor((seconds % 1) * 100)).padStart(2, "0");
    return `${hrs}:${mins}:${secs}:${ms}`;
  }, []);

  const loadLocal = useCallback(async (remoteId: number) => {
    let jp = await JPUserDao.getByRemoteId(remoteId);
    if (!jp) {
      const api: RemoteUser = await fetchUserById(remoteId);
      jp = await JPUserDao.upsert({
        _id: `u_${api.id}`,
        remoteId: api.id,
        name: api.name ?? "",
        email: api.email ?? "",
      });
    }
    setUser({ id: jp.remoteId, name: jp.name, email: jp.email });

    const video = await VideoDao.ensure(VIDEO_URI, { title: "Training Video" });
    const session = await AnnotationSessionDao.getOrCreate(jp._id, video._id);
    setSessionId(session._id);

    const list = await CommentDao.listForSession(session._id);
    setComments(list);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        if (!id) throw new Error("Missing user id");
        await loadLocal(Number(id));
      } catch (e: any) {
        setError(e?.message ?? "Failed to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, loadLocal]);

  // Save comment
  const handleSend = useCallback(async () => {
    if (!comment.trim() || !sessionId) return;
    try {
      const tMillis = Math.round(currentTime * 1000);
      await CommentDao.add(sessionId, comment.trim(), tMillis);
      setComment("");
      const list = await CommentDao.listForSession(sessionId);
      setComments(list);
    } catch (e) {
      console.warn("Failed to save comment", e);
    }
  }, [comment, currentTime, sessionId]);

  const handleStrokeComplete = useCallback(
    async ({ d, tStartMillis, tEndMillis }: { d: string; tStartMillis: number; tEndMillis: number }) => {
      if (!sessionId) return;
      try {
        await StrokeDao.add({ sessionId, d, tStartMillis, tEndMillis });
        const nowMs = Math.round(currentTime * 1000);
        if (nowMs >= tStartMillis && (typeof tEndMillis !== "number" || nowMs <= tEndMillis)) {
          const rows = await StrokeDao.listActiveAt(sessionId, nowMs);
          setActiveStrokes(rows.map((s) => s.d));
        }
      } catch (e) {
        console.warn("Failed to save stroke", e);
      }
    },
    [sessionId, currentTime]
  );

  const handlePosition = useCallback(
    async (sec: number) => {
      setCurrentTime(sec);
      if (!sessionId) return;
      const now = Date.now();
      if (now - lastQueryRef.current < THROTTLE_MS) return;
      lastQueryRef.current = now;

      const atMs = Math.round(sec * 1000);
      try {
        const rows = await StrokeDao.listActiveAt(sessionId, atMs);
        setActiveStrokes(rows.map((s) => s.d));
      } catch (e) {
        console.warn("Failed to load active strokes", e);
      }
    },
    [sessionId]
  );

  const clearActiveStrokes = useCallback(async () => {
    if (!sessionId) return;
    const atMs = Math.round(currentTime * 1000);
    const rows = await StrokeDao.listActiveAt(sessionId, atMs);
    await StrokeDao.deleteByIds(rows.map(r => r._id));
    const refreshed = await StrokeDao.listActiveAt(sessionId, atMs);
    setActiveStrokes(refreshed.map(s => s.d));
  }, [sessionId, currentTime]);

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
      <VideoPlayerCard
        userData={{ name: user.name } as any}
        videoUri={VIDEO_URI}
        onPosition={handlePosition}     // updates current time + queries active strokes
        onStrokeComplete={handleStrokeComplete}
        strokes={activeStrokes}         // render-only strokes for current time
        onClearActiveStrokes={clearActiveStrokes}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {comments.length === 0 ? (
          <View style={{ padding: 12 }}>
            <Text style={{ color: "#666" }}>No comments yet — add one below.</Text>
          </View>
        ) : (
          comments.map((c) => (
            <CommentCard
              key={c._id}
              user={user.name}
              initials={user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              timeAgo={""}
              timestamp={formatTimestamp(c.tMillis / 1000)}
              text={c.text}
            />
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.commentBar}>
          <View style={styles.row}>
            <View style={styles.timestampBox}>
              <Text style={styles.timestamp}>{formatTimestamp(currentTime)}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#777"
              value={comment}
              onChangeText={setComment}
            />
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
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  scrollContent: { paddingBottom: 140 },
  commentBar: {
    position: "absolute",
    bottom: 60, left: 0, right: 0,
    backgroundColor: "#111",
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  timestampBox: { backgroundColor: "#333", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 8 },
  timestamp: { color: "#FFD700", fontSize: 12, fontWeight: "600" },
  input: {
    flex: 1, color: "#fff", backgroundColor: "#222",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14,
  },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconButton: { padding: 6 },
  sendBtn: { padding: 6, borderRadius: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#666", marginTop: 6 },
  error: { color: "red" },
});
