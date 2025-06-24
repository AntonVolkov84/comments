import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system";
import { useTranslation } from "react-i18next";

export default function CommentItem({ comment, level, theme, isOnline }) {
  const { t } = useTranslation();
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [datePart, timePartWithMs] = dateString.split(" ");
    const timePart = timePartWithMs?.split(".")[0];
    if (!datePart || !timePart) return "";
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };
  const isDark = theme === "dark";
  const downloadAsync = async (fileUri) => {
    try {
      const fileName = fileUri.split("/").pop();
      const tempUri = FileSystem.documentDirectory + fileName;
      const downloadResumable = FileSystem.createDownloadResumable(fileUri, tempUri);
      const { uri: localUri } = await downloadResumable.downloadAsync();
      if (!localUri) {
        Alert.alert(`${t("commentsitem.alertuploaderror")}`);
        return;
      }
      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert(`${t("commentsitem.alertinsofpermission")}`);
          return;
        }
        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "text/plain"
        );
        const fileData = await FileSystem.readAsStringAsync(localUri);
        await FileSystem.writeAsStringAsync(destUri, fileData, { encoding: FileSystem.EncodingType.UTF8 });
        Alert.alert(`${t("commentsitem.alertfileupload")}`);
      } else {
        Alert.alert("Ограничение", "Сохранение в загрузки доступно только на Android.");
      }
    } catch (err) {
      console.log("downloadAsync", err);
    }
  };
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
        {comment.photo_uri && (
          <Image source={{ uri: comment.photo_uri }} style={styles.commentImage} resizeMode="cover" />
        )}
        {comment.file_uri && (
          <TouchableOpacity
            disabled={!isOnline}
            onPress={() => downloadAsync(comment.file_uri)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 3,
              padding: 10,
              backgroundColor: "#007aff",
              borderRadius: 5,
              alignSelf: "flex-start",
            }}
          >
            <Icon name="file-download" size={24} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 8 }}>{isOnline ? t("download") : t("offline")}</Text>
          </TouchableOpacity>
        )}
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
  commentImage: {
    marginTop: 8,
    aspectRatio: 1,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
});
