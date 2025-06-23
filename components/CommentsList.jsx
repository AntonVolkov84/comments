import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Linking,
  Image,
  Modal,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CommentItem from "./CommentItem";
import axios from "axios";
import Captcha from "./Captcha";
import { getCommentsByPostIdOffline, addCommentOffline } from "../db/localDb";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

export default function CommentsList({
  viewComments,
  setCommentsVisible,
  onCreateComment,
  theme,
  onLike,
  likeVisibleForPost,
  userEmail,
  isOnline,
  userSqlId,
}) {
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [commentsData, setCommentsData] = useState([]);
  const isDark = theme === "dark";
  const item = viewComments;
  const isAuthor = item.email === userEmail;
  const { t } = useTranslation();
  console.log(commentsData);
  useEffect(() => {
    if (!isOnline) {
      return;
    }
    getUser(userEmail);
  }, []);
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        const originalUri = result.assets[0].uri;
        const fileInfo = await fetch(originalUri);
        const blob = await fileInfo.blob();
        const maxFileSize = 2 * 1024 * 1024;
        if (blob.size > maxFileSize) {
          alert("Файл слишком большой. Максимальный размер — 2 МБ.");
          return;
        }
        const resizedImage = await ImageManipulator.manipulateAsync(
          originalUri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const uploadResult = await uploadImageToCloudinary(resizedImage.uri);
        if (uploadResult) {
          return uploadResult.url;
        }
      }
    } catch (error) {
      console.log("pickImage", error.message);
    }
  };
  const handlePickImage = async () => {
    const imageUrl = await pickImage();
    if (imageUrl) {
      setPhotoUrl(imageUrl);
    }
  };
  const uploadImageToCloudinary = async (imageUri) => {
    const data = new FormData();
    data.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    data.append("upload_preset", "mobile_unsigned");

    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/dmmixwibz/upload", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        return { url: result.secure_url, publicId: result.public_id };
      } else {
        console.error("Cloudinary upload error:", result);
        return null;
      }
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };
  const getComments = async (id) => {
    try {
      const res = await axios.post("https://comments-server-production.up.railway.app/commeby-postnts/create", {
        post_id: id,
      });
      setCommentsData(res.data);
    } catch (error) {
      console.log("getComments", error.message);
    }
  };
  const addCommentsOffline = async () => {
    const newComment = await addCommentOffline(item.id, userSqlId, text);
    console.log(newComment);
    if (newComment) {
      setCommentsData((prevComments) => [newComment, ...prevComments]);
    }
  };
  const checkCaptcha = (event) => {
    const token = event.nativeEvent.data;
    if (!token) {
      return Alert.alert(`${t("app.alertcaptcha")}`);
    } else {
      setModalVisible(false);
      onCreateComment(text, item.id, photoUrl);
      setText("");
      setShowCaptcha(false);
      setPhotoUrl(null);
    }
  };
  useEffect(() => {
    if (!isOnline) {
      const fetchOfflineComments = async () => {
        try {
          const res = await getCommentsByPostIdOffline(item.id);
          setCommentsData(res);
        } catch (error) {
          console.error("Offline getComments error:", error.message);
        }
      };
      fetchOfflineComments();
      return;
    }
    if (!item?.id) return;
    if (isOnline) {
      getComments(item.id);
    }
    const socket = new WebSocket("wss://comments-server-production.up.railway.app");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "subscribe_comments", post_id: item.id }));
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_comment" && message.data.post_id === item.id) {
          const comment = message.data;
          setCommentsData((prev) => [...(prev || []), comment]);
        }
      } catch (err) {
        console.log("WS comment parse error", err);
      }
    };
    socket.onclose = () => {};
    return () => {
      socket.close();
    };
  }, [item?.id]);

  const getUser = async (email) => {
    try {
      fetch("https://comments-server-production.up.railway.app/users/getUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => setUserData(data));
    } catch (error) {
      "getUser", error.message;
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.dark : styles.light]}>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]}>
            {!showPreview && (
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t("commentslist.placeholder")}
                placeholderTextColor={isDark ? "#aaa" : "#666"}
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                multiline
              />
            )}
            <View style={styles.previewRow}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowPreview(!showPreview);
                }}
                style={styles.previewButton}
              >
                <Text style={styles.previewButtonText}>
                  {showPreview ? t("commentslist.hidepreview") : t("commentslist.preview")}
                </Text>
              </TouchableOpacity>

              <View style={styles.previewIcons}>
                <TouchableOpacity onPress={() => handlePickImage()} style={styles.iconButton}>
                  <AntDesign name="picture" size={20} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => console.log("File upload pressed")} style={styles.iconButton}>
                  <Feather name="paperclip" size={20} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>
            </View>

            {showPreview && userData && (
              <View style={[styles.previewBox, isDark ? styles.previewDark : styles.previewLight]}>
                <View style={[styles.postContainer, isDark && styles.postContainerDark]}>
                  <View style={styles.leftColumn}>
                    <Image source={{ uri: userData.avatar_url }} style={styles.avatar} />
                    <Text style={[styles.username, isDark && styles.textDark]}>{userData.username}</Text>
                  </View>

                  <View style={styles.rightColumnPreview}>
                    <View style={styles.postHeader}>
                      <View style={styles.homepageContainer}>
                        {userData.homepage ? (
                          <Text style={[styles.homepage, isDark && styles.textDark]} numberOfLines={1}>
                            {userData.homepage}
                          </Text>
                        ) : (
                          <View style={{ flex: 1 }} />
                        )}
                      </View>
                    </View>
                    <Text
                      style={[styles.postText, isDark ? styles.textDark : styles.textLight, styles.previewTextLimited]}
                    >
                      {text}
                    </Text>
                    {photoUrl && <Image source={{ uri: photoUrl }} style={styles.previewImage} resizeMode="cover" />}
                  </View>
                </View>
              </View>
            )}
            <TouchableOpacity
              onPress={
                isOnline
                  ? () => {
                      setShowCaptcha(true);
                    }
                  : () => {
                      addCommentsOffline();
                      setModalVisible(false);
                      setText("");
                    }
              }
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>{t("send")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setText("");
                setModalVisible(false);
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showCaptcha && (
          <View style={{ position: "absolute", height: 0, width: 0, overflow: "hidden" }}>
            <Captcha action="create_post" onVerify={checkCaptcha} />
          </View>
        )}
      </Modal>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setCommentsVisible(false)} style={styles.button}>
          <Text style={styles.buttonText}>{t("back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>{t("comments")}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.buttonCreate}>
          <Text style={styles.buttonText}>{t("comment")}</Text>
        </TouchableOpacity>
      </View>
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
              <Text style={[styles.likesCount, isDark && styles.textDark]}>{item.likescount}</Text>
              {!isAuthor && likeVisibleForPost[item.id] !== false && (
                <TouchableOpacity onPress={() => onLike(item)}>
                  <AntDesign name="arrowup" size={18} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={[styles.postText, isDark ? styles.textDark : styles.textLight]}>{item.text}</Text>
        </View>
      </View>
      <FlatList
        data={commentsData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <CommentItem theme={theme} comment={item} level={index} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1 }}
      />
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
  rightColumn: {
    flex: 1,
  },
  rightColumnPreview: {
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
  },
  postText: {
    fontSize: 15,
    color: "#000",
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
  dateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  topBar: {
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#1976d2",
  },
  buttonCreate: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#b52a41",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  light: {
    backgroundColor: "#fff",
  },
  dark: {
    backgroundColor: "#2c2c2c",
  },
  textLight: {
    color: "#000",
  },
  textDark: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
  },
  modalLight: {
    backgroundColor: "#fff",
  },
  modalDark: {
    backgroundColor: "#2c2c2c",
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  inputLight: {
    borderColor: "#ccc",
    color: "#000",
  },
  inputDark: {
    borderColor: "#666",
    color: "#fff",
  },
  previewButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  previewButtonText: {
    color: "#1976d2",
    fontWeight: "bold",
  },
  previewBox: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
  },
  previewDark: {
    backgroundColor: "#333",
  },
  previewLight: {
    backgroundColor: "#eee",
  },
  previewText: {
    fontSize: 15,
  },

  submitButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#b52a41",
    fontWeight: "bold",
  },
  previewTextLimited: {
    maxHeight: 200,
    overflow: "hidden",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  previewIcons: {
    flexDirection: "row",
    gap: 12,
  },

  iconButton: {
    padding: 5,
  },
  previewImage: {
    aspectRatio: 1,
    height: 100,
    borderRadius: 10,
  },
});
