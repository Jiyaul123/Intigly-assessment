import { User } from "@/lib/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { Video } from "expo-av";
import React, { useRef, useState } from "react";
import {
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

interface VideoPlayerCardProps {
  userData: User;
}

export default function VideoPlayerCard({ userData }: VideoPlayerCardProps) {
  const playerRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [duration, setDuration] = useState(0);

  // Drawing state
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [drawMode, setDrawMode] = useState(false);

  const formatTimestamp = (seconds: number) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const initials = userData.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // PanResponder for drawing
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => drawMode,
    onPanResponderMove: (_, gesture) => {
      const { moveX, moveY } = gesture;
      setCurrentPath((prev) => prev + ` L${moveX} ${moveY}`);
    },
    onPanResponderRelease: () => {
      if (currentPath) {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath("");
      }
    },
  });

  return (
    <View style={styles.card}>
      {/* Video */}
      <View style={{ position: "relative" }}>
        <Video
          ref={playerRef}
          source={{ uri: "https://www.w3schools.com/html/mov_bbb.mp4" }}
          style={styles.video}
          useNativeControls={false}
          onPlaybackStatusUpdate={(s: any) => {
            setStatus(s);
            if (s.durationMillis) {
              setDuration(s.durationMillis / 1000);
            }
          }}
        />

        {/* Drawing overlay */}
        {drawMode && (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
            {...panResponder.panHandlers}
          >
            <Svg style={{ flex: 1 }}>
              {paths.map((d, i) => (
                <Path
                  key={i}
                  d={`M${d}`}
                  stroke="red"
                  strokeWidth={3}
                  fill="none"
                />
              ))}
              {currentPath ? (
                <Path d={`M${currentPath}`} stroke="red" strokeWidth={3} fill="none" />
              ) : null}
            </Svg>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={status.positionMillis ? status.positionMillis / 1000 : 0}
        minimumTrackTintColor="#4A90E2"
        maximumTrackTintColor="#888"
        onSlidingComplete={(val: any) =>
          playerRef.current?.setPositionAsync(val * 1000)
        }
      />

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.timestamp}>
          {formatTimestamp(status.positionMillis ? status.positionMillis / 1000 : 0)}
        </Text>

        <View style={styles.icons}>
          {/* Play/Pause */}
          <TouchableOpacity
            onPress={() =>
              status.isPlaying
                ? playerRef.current?.pauseAsync()
                : playerRef.current?.playAsync()
            }
          >
            <Ionicons
              name={status.isPlaying ? "pause" : "play"}
              size={20}
              color="#fff"
              style={styles.icon}
            />
          </TouchableOpacity>

          {/* Toggle Draw */}
          <TouchableOpacity onPress={() => setDrawMode((prev) => !prev)}>
            <Ionicons
              name="pencil"
              size={20}
              color={drawMode ? "#4CAF50" : "#fff"}
              style={styles.icon}
            />
          </TouchableOpacity>

          {/* Clear Drawings */}
          <TouchableOpacity onPress={() => setPaths([])}>
            <Ionicons
              name="trash-outline"
              size={20}
              color="#fff"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: 220,
  },
  slider: {
    width: "100%",
    height: 30,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#111",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  timestamp: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 8,
  },
});
