import { View, Text, Button, StyleSheet, TextInput, Alert } from "react-native";
import { useState } from "react";
import Registration from "./Registration";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

export default function Login({ onLoginSuccess }) {
  const [registrationShow, setRegistrationShow] = useState(false);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const handleSubmit = (email, password) => {
    loginUser(email, password);
    setEmail(null);
    setPassword(null);
  };
  const loginUser = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await user.reload();
      if (!user.emailVerified) {
        Alert.alert("Ваша почта не подтверждена");
        return;
      }
      onLoginSuccess(user);
    } catch (error) {
      console.log("error in loginUser", error.code, error.message);
      Alert.alert("Wrong email or password");
    }
  };

  return (
    <View style={styles.container}>
      {registrationShow ? (
        <Registration setRegistrationShow={setRegistrationShow} />
      ) : (
        <View>
          <Text style={styles.loginTitle}>Вход</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.loginInput} placeholder="Email"></TextInput>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.loginInput}
            placeholder="Password"
          ></TextInput>
          <View style={styles.loginButtonSubmit}>
            <Button title="Войти" onPress={() => handleSubmit(email, password)}></Button>
          </View>
          <Button onPress={() => setRegistrationShow(true)} title="Registration"></Button>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
  },
  loginTitle: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 15,
  },
  loginInput: {
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  loginButtonSubmit: {
    marginBottom: 50,
  },
});
