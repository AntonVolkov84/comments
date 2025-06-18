import { StyleSheet, Text, View, Button } from "react-native";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import Login from "./components/Login";
import Profile from "./components/Profile";

export default function App() {
  const [user, setUser] = useState(null);
  const [profileVisibility, setProfileVisibility] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user || user?.emailVerified === false) {
    return (
      <>
        <Login onLoginSuccess={(user) => setUser(user)} />
      </>
    );
  } else {
    return (
      <View style={styles.container}>
        <View style={styles.profileBtn}>
          <Button title="Профиль" onPress={() => setProfileVisibility(!profileVisibility)}></Button>
        </View>
        {profileVisibility && <Profile />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
    paddingTop: 50,
    position: "relative",
  },
  profileBtn: {
    width: "100%",
    position: "absolute",
    top: 50,
  },
});
