import { View, Text, Button, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { getDoc, doc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
  const [data, setData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [image, setImage] = useState(null);
  const userEmail = auth.currentUser.email;
  useEffect(() => {
    getDataUser();
  }, []);
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
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log("Выбранное изображение:", uri);
    }
  };

  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileName}>
        <Text style={styles.profileText}>Никнейм:</Text>
        <Text style={styles.profileText}>{dataLoaded ? data.userName : "Loading..."}</Text>
      </View>
      <View style={styles.profileAvatar}></View>
      <Button title="Выйти" onPress={() => signOut(auth)}></Button>
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
    marginTop: 70,
  },
  profileName: {
    width: "100%",
    height: 100,
  },
  profileAvatar: {
    height: 300,
    aspectRatio: 1,
  },
  profileText: {
    textAlign: "center",
    fontSize: 25,
  },
});
