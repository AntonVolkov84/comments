import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export default function Profile({ toggleTheme, theme }) {
  const [data, setData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { t } = useTranslation();
  const userEmail = auth.currentUser.email;

  useEffect(() => {
    getDataUser();
    return () => {
      setData(null);
      setDataLoaded(false);
    };
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "ru" ? "en" : "ru";
    i18n.changeLanguage(newLang);
  };

  const getDataUser = async () => {
    try {
      const docSnap = await getDoc(doc(db, "users", userEmail));
      if (docSnap.exists()) {
        setData(docSnap.data());
        setDataLoaded(true);
      }
    } catch (error) {
      console.log("getDataUser", error.message);
    }
  };
  const updateUser = async (uri, publicId) => {
    try {
      await updateDoc(doc(db, "users", userEmail), { uri, publicId });
    } catch (error) {
      console.log("updateUser", error.message);
    }
  };
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
        if (data?.publicId) {
          await deleteFileFromStorage(data.publicId);
        }
        const uploadResult = await uploadImageToCloudinary(resizedImage.uri);
        if (uploadResult) {
          await updateUser(uploadResult.url, uploadResult.publicId);
          await updateUserSql(userEmail, uploadResult.url);
          getDataUser();
        }
      }
    } catch (error) {
      console.log("pickImage", error.message);
    }
  };

  const updateUserSql = async (email, avatar_url) => {
    const data = {
      email,
      avatar_url,
    };
    try {
      await fetch("https://comments-server-production.up.railway.app/users/avatar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log("deleteFileFromStorage error:", error.message);
    }
  };
  const deleteFileFromStorage = async (publicId) => {
    try {
      await fetch("https://comments-server-production.up.railway.app/delete-image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });
    } catch (error) {
      console.log("deleteFileFromStorage error:", error.message);
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
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileName}>
        <Text style={[styles.profileText, theme === "dark" && styles.profileTextDark]}>{t("profile.nikname")}</Text>
        <Text style={[styles.profileText, theme === "dark" && styles.profileTextDark]}>
          {dataLoaded ? data.userName : `${t("loading")}`}
        </Text>
      </View>
      <TouchableOpacity onPress={() => toggleLanguage()} style={styles.profileLanguage}>
        <Text style={{ fontSize: 18 }}>{t("profile.switchLanguage")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggleTheme()} style={styles.profileLanguage}>
        <Text style={{ fontSize: 18 }}>{t("profile.switchTheme")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => pickImage()} style={styles.profileAvatar}>
        {dataLoaded && data.uri ? (
          <Image source={{ uri: data.uri }} style={styles.profileImage}></Image>
        ) : (
          <Text style={styles.profileImageText}>{t("profile.avatarinfo")}</Text>
        )}
      </TouchableOpacity>
      <Button title={t("profile.logout")} onPress={() => signOut(auth)}></Button>
    </View>
  );
}
const styles = StyleSheet.create({
  profileContainer: {
    width: "100%",
    height: "100%",
    zIndex: 3,
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    marginTop: 10,
  },
  profileName: {
    width: "100%",
    height: 50,
  },
  profileAvatar: {
    height: 300,
    aspectRatio: 1,
    borderRadius: 150,
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "grey",
  },
  profileLanguage: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 10,
  },
  profileText: {
    textAlign: "center",
    fontSize: 25,
  },
  profileTextDark: {
    color: "#fff",
  },
  profileImageText: {
    textAlign: "center",
    justifySelf: "center",
    fontSize: 25,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
    zIndex: 2,
  },
});
