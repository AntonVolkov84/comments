import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Button,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import "./i18n";
import Login from "./components/Login";
import Profile from "./components/Profile";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import AdminLine from "./components/AdminLine";
import PostModal from "./components/PostModal";

export default function App() {
  const [user, setUser] = useState(null);
  const [profileVisibility, setProfileVisibility] = useState(false);
  const [location, setLocation] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState("");
  const [theme, setTheme] = useState("light");
  const { t } = useTranslation();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
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

  const handleCreatePost = (token) => {
    console.log("Captcha token:", token);
    if (!postText.trim()) return;
    setPostText("");
    setModalVisible(false);
  };
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  const onSort = () => {};
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
  if (!user || user?.emailVerified === false) {
    return (
      <>
        <Login onLoginSuccess={(user) => setUser(user)} />
      </>
    );
  } else {
    return (
      <View style={[styles.container, theme === "dark" ? styles.dark : styles.light]}>
        <PostModal
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleCreatePost}
          postText={postText}
          setPostText={setPostText}
        />
        <View style={styles.profileBtn}>
          <Button title={t("profile.title")} onPress={() => setProfileVisibility(!profileVisibility)}></Button>
        </View>
        {profileVisibility && <Profile toggleTheme={toggleTheme} theme={theme} />}
        <View style={styles.adminLine}>
          <AdminLine theme={theme} onSort={onSort} onCreatePost={handleOpenPostModal} />
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
});
