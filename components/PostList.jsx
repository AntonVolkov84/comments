import { FlatList, Text, View, StyleSheet, Image, TouchableOpacity, Linking } from "react-native";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { AntDesign } from "@expo/vector-icons";

const PostsList = ({ posts, theme, onLike, likeVisibleForPost, addComment }) => {
  const isDark = theme === "dark";
  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => {
    const currentUser = auth.currentUser;
    setUserEmail(currentUser?.email || null);
  }, []);

  const renderItem = ({ item }) => {
    const isAuthor = item.email === userEmail;
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => addComment(item)}>
        <View style={[styles.postContainer, isDark && styles.postContainerDark]}>
          <View style={styles.leftColumn}>
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            <Text style={[styles.username, isDark && styles.textDark]}>{item.username}</Text>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.postHeader}>
              <View style={styles.homepageContainer}>
                {item.homepage ? (
                  <TouchableOpacity onPress={() => Linking.openURL(item.homepage)}>
                    <Text style={[styles.homepage, isDark && styles.textDark]} numberOfLines={1}>
                      {item.homepage}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                <Text style={[styles.dateText, isDark && styles.textDark]}>
                  {new Date(item.created_at).toLocaleDateString()}{" "}
                  {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>

              <View style={styles.likesContainer}>
                <Text style={[styles.likesCount]}>{item.likescount}</Text>
                {!isAuthor && likeVisibleForPost[item.id] !== false && (
                  <TouchableOpacity onPressIn={(e) => e.stopPropagation()} onPress={() => onLike(item)}>
                    <AntDesign name="arrowup" size={18} color={isDark ? "#fff" : "#000"} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={[styles.postText, isDark && styles.textDark]}>{item.text}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
    paddingHorizontal: 10,
  },
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
  rightColumn: {
    flex: 1,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  homepage: {
    color: "#007aff",
    fontSize: 13,
    flex: 1,
    marginRight: 8,
    width: 100,
    overflow: "hidden",
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  likesCount: {
    fontSize: 14,
    marginRight: 2,
    color: "#b52a41",
    fontWeight: "bold",
  },
  postText: {
    fontSize: 15,
    color: "#000",
  },
  textDark: {
    color: "#fff",
    fontWeight: "bold",
  },
  homepageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
});

export default PostsList;
