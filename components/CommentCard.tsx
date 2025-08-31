import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CommentCardProps {
  user: string;
  initials: string;
  timeAgo: string;
  timestamp: string;
  text: string;
}

export default function CommentCard({
  user,
  initials,
  timeAgo,
  timestamp,
  text,
}: CommentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.user}>{user}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>

        <View style={styles.commentRow}>
          <View style={styles.timestampBox}>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          <Text style={styles.comment}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#1c1c1c",
    padding: 10,
    marginVertical: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  user: {
    color: "#fff",
    fontWeight: "bold",
    marginRight: 6,
  },
  time: {
    color: "#aaa",
    fontSize: 12,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  timestampBox: {
    backgroundColor: "#333",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  timestamp: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  comment: {
    color: "#fff",
    fontSize: 14,
    flexShrink: 1,
  },
  reply: {
    color: "#4A90E2",
    fontSize: 13,
    fontWeight: "500",
  },
});
