import { User } from "@/lib/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { ResizeMode, Video } from "expo-av";
import React, { useRef, useRef as useRefAlias, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

type VideoPlayerCardProps = {
  userData: User;
  videoUri?: string;
  onPosition?: (sec: number) => void;
  onStrokeComplete?: (payload: { d: string; tStartMillis: number; tEndMillis: number }) => void;
  strokes?: string[];

  onClearActiveStrokes?: () => void;  // single tap
  onClearAllStrokes?: () => void;     // long press
};

export default function VideoPlayerCard({
  userData,
  videoUri = "https://cdn.esawebb.org/archives/videos/hd_1080p25_screen/weic2513d.mp4",
  onPosition,
  onStrokeComplete,
  strokes = [],
  onClearActiveStrokes,     // NEW
  onClearAllStrokes,        // NEW
}: VideoPlayerCardProps) {
  const playerRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [duration, setDuration] = useState(0);

  const [currentPath, setCurrentPath] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const strokeStartMsRef = useRefAlias<number>(0);

  const formatTimestamp = (seconds: number) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const initials = (userData?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => drawMode,
    onMoveShouldSetPanResponder: () => drawMode,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent as any;
      setCurrentPath(`M${locationX} ${locationY}`);
      playerRef.current?.pauseAsync().catch(() => { });
      strokeStartMsRef.current = Math.round(status?.positionMillis ?? 0);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent as any;
      setCurrentPath((prev) => `${prev} L${locationX} ${locationY}`);
    },
    onPanResponderRelease: () => {
      const d = currentPath.trim();
      if (d) {
        const tEnd = Math.round(status?.positionMillis ?? strokeStartMsRef.current);
        onStrokeComplete?.({ d, tStartMillis: strokeStartMsRef.current, tEndMillis: tEnd });
      }
      setCurrentPath("");
    },
    onPanResponderTerminate: () => {
      const d = currentPath.trim();
      if (d) {
        const tEnd = Math.round(status?.positionMillis ?? strokeStartMsRef.current);
        onStrokeComplete?.({ d, tStartMillis: strokeStartMsRef.current, tEndMillis: tEnd });
      }
      setCurrentPath("");
    },
  });


  const handleTrash = () => {
    setCurrentPath("");
    onClearActiveStrokes?.();
  };


  const toggleDraw = async () => {
    const next = !drawMode;
    setDrawMode(next);
    if (next) await playerRef.current?.pauseAsync().catch(() => { });
  };

  return (
    <View style={styles.card}>
      <View style={{ position: "relative" }}>
        <Video
          ref={playerRef}
          source={{ uri: videoUri }}
          style={styles.video}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={(s: any) => {
            if (!("isLoaded" in s) || !s.isLoaded) return;
            setStatus(s);
            if (s.durationMillis) setDuration(s.durationMillis / 1000);
            if (typeof s.positionMillis === "number") onPosition?.(s.positionMillis / 1000);
          }}
          onLoad={(meta: any) => {
            if (meta?.durationMillis) setDuration(meta.durationMillis / 1000);
          }}
        />

        {/* Overlay: render strokes passed from parent + current drawing preview */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
          collapsable={false}
          pointerEvents={drawMode ? "box-only" : "none"}
          {...(drawMode ? panResponder.panHandlers : {})}
        >
          <Svg style={{ flex: 1 }}>
            {strokes.map((d, i) => (
              <Path
                key={i}
                d={d}
                stroke="red"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {!!currentPath && (
              <Path
                d={currentPath}
                stroke="red"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={status.positionMillis ? status.positionMillis / 1000 : 0}
        minimumTrackTintColor="#4A90E2"
        maximumTrackTintColor="#888"
        onSlidingStart={async () => {
          if (status.isPlaying) await playerRef.current?.pauseAsync().catch(() => { });
        }}
        onSlidingComplete={(val: number) => playerRef.current?.setPositionAsync(val * 1000)}
      />

      <View style={styles.controls}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.timestamp}>
          {formatTimestamp(status.positionMillis ? status.positionMillis / 1000 : 0)}
        </Text>

        <View style={styles.icons}>
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

          <TouchableOpacity onPress={toggleDraw}>
            <Ionicons
              name="pencil"
              size={20}
              color={drawMode ? "#4CAF50" : "#fff"}
              style={styles.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTrash}
          >

            <Ionicons name="trash-outline" size={20} color="#fff" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#000", overflow: "hidden" },
  video: { width: "100%", height: 220 },
  slider: { width: "100%", height: 30 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#111",
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  timestamp: { color: "#fff", fontSize: 14, fontWeight: "500" },
  icons: { flexDirection: "row", alignItems: "center" },
  icon: { marginHorizontal: 8 },
});
