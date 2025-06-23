import { StyleSheet, Alert, View, Button, experimental_LayoutConformance } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import "./i18n";
import Login from "./components/Login";
import CommentsList from "./components/CommentsList";
import Profile from "./components/Profile";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import AdminLine from "./components/AdminLine";
import PostModal from "./components/PostModal";
import axios from "axios";
import PostsList from "./components/PostList";
import { validateHtmlText } from "./validate";
import * as Network from "expo-network";
import {
  addUser,
  addPost,
  getPostsFromDb,
  getLocalUserId,
  addPostLike,
  syncCommentToDb,
  likePostOffline,
  createPostOffline,
} from "./db/localDb";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [user, setUser] = useState(null);
  const [userSqlId, setUserSqlId] = useState(null);
  const [profileVisibility, setProfileVisibility] = useState(false);
  const [location, setLocation] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [theme, setTheme] = useState("light");
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [sortType, setSortType] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [likeVisibleForPost, setLikeVisibleForPost] = useState({});
  const [viewComments, setViewComments] = useState({});
  const [isOnline, setIsOnLine] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [ws, setWs] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    checkNet();
    async function checkUser() {
      const hasInternet = await Network.getNetworkStateAsync();
      const hasRealAccess = await checkInternetAccess();
      if (!hasInternet.isConnected || !hasInternet.isInternetReachable || !hasRealAccess) {
        const cachedUserJSON = await AsyncStorage.getItem("cachedUser");
        if (cachedUserJSON.length) {
          const cachedUser = JSON.parse(cachedUserJSON);
          setUser(cachedUser);
          const localUserId = await getLocalUserId(cachedUser.email);
          if (localUserId) {
            setUserSqlId(localUserId);
          } else {
            console.warn("User not found in local DB");
          }
        } else {
          setUser(null);
        }
      }
    }
    checkUser();
  }, []);

  const checkNet = async () => {
    const net = await Network.getNetworkStateAsync();
    const res = net.isConnected && net.isInternetReachable && (await checkInternetAccess());
    setIsOnLine(res);
  };
  const checkInternetAccess = async () => {
    try {
      const res = await fetch("https://clients3.google.com/generate_204");
      return res.status === 204;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    async function syncAllData() {
      const net = await Network.getNetworkStateAsync();
      const online = net.isConnected && net.isInternetReachable && (await checkInternetAccess());
      if (!online) {
        console.log("Offline mode – loading local data...");
        const localPosts = await getPostsFromDb();
        setPosts(localPosts);
        return;
      }
      try {
        const usersRes = await fetch("https://comments-server-production.up.railway.app/users/getallUsers");
        const users = await usersRes.json();
        for (const user of users) await addUser(user);

        const postsRes = await fetch("https://comments-server-production.up.railway.app/posts");
        const posts = await postsRes.json();
        for (const post of posts) await addPost(post);
        setPosts(posts);

        const commentsRes = await fetch("https://comments-server-production.up.railway.app/comments/getAllComments");
        const comments = await commentsRes.json();
        for (const comment of comments) await syncCommentToDb(comment);

        const likesRes = await fetch("https://comments-server-production.up.railway.app/post/likes");
        const likes = await likesRes.json();
        for (const like of likes) await addPostLike(like);

        console.log("Data synchronized");
      } catch (error) {
        console.error("Data sync failed:", error);
      }
    }
    syncAllData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await AsyncStorage.setItem("cachedUser", JSON.stringify(currentUser));
        const currentUserEmail = currentUser.email;
        if (!isOnline) {
          getUserSqlId(currentUserEmail);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem("cachedUser");
      }
    });

    return () => unsubscribe();
  }, []);
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedPosts = React.useMemo(() => {
    return [...posts].sort((a, b) => {
      let comp = 0;
      if (sortType === "created_at") {
        comp = new Date(a.created_at) - new Date(b.created_at);
      } else if (sortType === "username") {
        comp = a.username.localeCompare(b.username);
      }
      return sortOrder === "asc" ? comp : -comp;
    });
  }, [posts, sortType, sortOrder]);

  useEffect(() => {
    if (!user) return;
    const socket = new WebSocket("wss://comments-server-production.up.railway.app");
    socket.onopen = () => {};
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_post") {
          const newPost = message.data;
          setPosts((prevPosts) => [newPost, ...prevPosts]);
        }
        if (message.type === "like_updated") {
          const updatedPost = message.data;
          setPosts((prevPosts) => prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
        }
      } catch (err) {
        console.log("WS message parse error", err);
      }
    };
    socket.onclose = () => {};
    setWs(socket);
    return () => {
      socket.close();
    };
  }, [user]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);
  useEffect(() => {
    if (!location) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    const updateThemeBasedOnSun = async () => {
      try {
        const weatherData = await fetchWeather(lat, lon);
        if (!weatherData) return;
        const nowUnix = Math.floor(Date.now() / 1000);
        const sunrise = weatherData.sys.sunrise;
        const sunset = weatherData.sys.sunset;
        if (nowUnix >= sunrise && nowUnix < sunset) {
          setTheme("light");
        } else {
          setTheme("dark");
        }
      } catch (error) {
        console.log("updateThemeBasedOnSun", error.message);
      }
    };
    updateThemeBasedOnSun();
  }, [location]);
  const handleOpenPostModal = () => {
    setModalVisible(true);
  };
  const handlePostSubmitOffline = async () => {
    const newPost = await createPostOffline(userSqlId, postText);
    if (newPost) {
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    }
  };
  const handlePostSubmit = async (token) => {
    if (!token) {
      return Alert.alert(`${t("app.alertcaptcha")}`);
    }
    if (!postText) {
      return Alert.alert(`${t("app.alertnotext")}`);
    }
    const resultValidatePost = validateHtmlText(postText);
    if (!resultValidatePost.valid) {
      return Alert.alert(`Validation failed: , ${resultValidatePost.error}`);
    }
    try {
      const response = await axios.post("https://comments-server-production.up.railway.app/post/createpost", {
        user_id: userSqlId,
        text: postText,
      });
      console.log("Post created:", response.data);
      return response.data;
    } catch (error) {
      console.log("handlePostSubmit", error.message);
    }
  };
  const getUserSqlId = async (email) => {
    try {
      const response = await fetch("https://comments-server-production.up.railway.app/user/by-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setUserSqlId(data.id);
      setPostText("");
    } catch (error) {
      console.log("getUserSqlId", error.message);
    }
  };

  const onLike = async (item) => {
    try {
      if (!isOnline) {
        console.log("offline", item.id, userSqlId);
        const result = await likePostOffline(item.id, userSqlId);
        if (result.error === "User has already liked this post") {
          Alert.alert(`${t("app.alertlike")}`);
          setLikeVisibleForPost((prev) => ({
            ...prev,
            [item.id]: false,
          }));
        } else {
          console.log("Liked offline:", result);
        }
        return;
      }
      const response = await fetch("https://comments-server-production.up.railway.app/post/like", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: item.id, userId: userSqlId }),
      });
      if (!response.ok) {
        const err = await response.json();
        if (err?.error === "User has already liked this post") {
          Alert.alert(`${t("app.alertlike")}`);
          setLikeVisibleForPost((prev) => ({
            ...prev,
            [item.id]: false,
          }));
        } else {
          console.warn("Like failed", err);
        }
      }
    } catch (error) {
      console.error("onLike error:", error.message);
    }
  };
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  const onSort = (type) => {
    if (type === sortType) {
      toggleSortOrder();
    } else {
      setSortType(type);
      setSortOrder("asc");
    }
  };
  const onCreateComment = async (comment, postId, file_uri, photo_uri) => {
    const resultValidateComments = validateHtmlText(comment);
    if (!resultValidateComments.valid) {
      return Alert.alert(`Validation failed: , ${resultValidateComments.error}`);
    }
    try {
      await axios.post("https://comments-server-production.up.railway.app/comments/create", {
        text: comment,
        post_id: postId,
        author_id: userSqlId,
        file_uri: file_uri || null,
        photo_uri: photo_uri || null,
      });
    } catch (error) {
      console.log("onCreateComment", error.message);
    }
  };
  const addComment = (item) => {
    setViewComments(item);
    setCommentsVisible(true);
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.EXPO_PUBLIC_APPLICATION_KEY_OPENWEATHER}&units=metric&lang=ru`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  };
  if (!user || !user.emailVerified) {
    return (
      <>
        <Login onLoginSuccess={(user) => setUser(user)} />
      </>
    );
  } else {
    return (
      <View style={[styles.container, theme === "dark" ? styles.dark : styles.light]}>
        <PostModal
          postText={postText}
          setPostText={setPostText}
          isModalVisible={isModalVisible}
          setModalVisible={setModalVisible}
          onSubmit={handlePostSubmit}
          handlePostSubmitOffline={handlePostSubmitOffline}
          isOnline={isOnline}
        />
        <View style={styles.profileBtn}>
          <Button title={t("profile.title")} onPress={() => setProfileVisibility(!profileVisibility)}></Button>
        </View>
        {profileVisibility && <Profile toggleTheme={toggleTheme} theme={theme} />}
        {!commentsVisible && (
          <View style={styles.adminLine}>
            <AdminLine theme={theme} onSort={onSort} onCreatePost={handleOpenPostModal} />
          </View>
        )}

        <View style={styles.postblock}>
          {commentsVisible ? (
            <CommentsList
              onCreateComment={onCreateComment}
              viewComments={viewComments}
              setCommentsVisible={setCommentsVisible}
              theme={theme}
              onLike={onLike}
              likeVisibleForPost={likeVisibleForPost}
              userEmail={user.email}
              isOnline={isOnline}
              userSqlId={userSqlId}
            />
          ) : (
            <PostsList
              posts={sortedPosts}
              addComment={addComment}
              theme={theme}
              onLike={onLike}
              likeVisibleForPost={likeVisibleForPost}
            />
          )}
        </View>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 70,
    position: "relative",
  },
  light: {
    backgroundColor: "#fff",
  },
  dark: {
    backgroundColor: "#3b3939",
  },
  profileBtn: {
    width: "100%",
    position: "absolute",
    top: 30,
  },
  adminLine: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  postblock: {
    width: "100%",
    height: "100%",
  },
});
