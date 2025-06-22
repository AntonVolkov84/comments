import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from "react-native";
import React from "react";

export default function CommentItem({ comment, level, theme }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [datePart, timePartWithMs] = dateString.split(" ");
    const timePart = timePartWithMs?.split(".")[0]; // убираем миллисекунды и зону
    if (!datePart || !timePart) return "";
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };
  const isDark = theme === "dark";

  return (
    <View style={[styles.postContainer, isDark && styles.postContainerDark, { marginLeft: 5 + level * 5 }]}>
      <View style={styles.leftColumn}>
        <Image source={{ uri: comment.avatar_url }} style={styles.avatar} />
        <Text style={[styles.username, isDark && styles.textDark]}>{comment.username}</Text>
      </View>
      <View style={styles.rightColumnPreview}>
        <View style={styles.homepageContainer}>
          {!!comment.homepage && (
            <Text style={[styles.homepage, isDark && styles.textDark]} numberOfLines={1}>
              {comment.homepage}
            </Text>
          )}
          <Text style={[styles.postText, isDark ? styles.textDark : styles.textLight]}>
            {formatDate(comment.created_at)}
          </Text>
        </View>
        <Text style={[styles.commentText, isDark && styles.textDark]}>{comment.text}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  postContainer: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    marginTop: 10,
  },
  postContainerDark: {
    backgroundColor: "#444",
  },
  leftColumn: {
    width: 60,
    alignItems: "center",
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  textDark: {
    color: "#fff",
  },
  homepageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  homepage: {
    color: "#007aff",
    fontSize: 13,
    flex: 1,
    marginRight: 8,
    width: 100,
    overflow: "hidden",
  },
  rightColumnPreview: {
    flex: 1,
  },
  postText: {
    fontSize: 12,
    color: "#000",
  },
  textLight: {
    color: "#000",
  },
  commentText: {
    fontSize: 15,
    color: "#000",
    marginTop: 4,
  },
});
