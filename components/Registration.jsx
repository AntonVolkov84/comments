import { View, Text, Button, StyleSheet, TextInput, Alert } from "react-native";
import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { sendEmailVerification, signOut, createUserWithEmailAndPassword } from "firebase/auth";

export default function Registration({ setRegistrationShow }) {
  const [email, setEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [password, setPassword] = useState(null);
  const [confirmedPassword, setConfirmedPassword] = useState(null);
  const [homePage, setHomePage] = useState(null);
  const addToUsers = async (email, userName, homePage) => {
    const emailInLowerCase = email.toLowerCase();
    try {
      const user = {
        email: emailInLowerCase,
        userName,
        ...(homePage ? { homePage } : {}),
      };
      await setDoc(doc(db, "users", emailInLowerCase), user);
    } catch (error) {
      console.log("add to users", error.message);
    }
  };
  const handleRegister = async (email, userName, password, homePage) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user.uid) {
        await addToUsers(email, userName, homePage);
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Вам на почту отправлено письмо подтверждениe");

        await signOut(auth);
        setRegistrationShow(false);
      }
    } catch (error) {
      console.log("handleRegister", error.message);
    }
  };
  const checkPasswordConfirm = (password, confirmedPassword) => {
    if (password === confirmedPassword) {
      return true;
    }
    return false;
  };
  const validatePasswordLength = (password) => {
    if (password.length < 6) {
      return false;
    } else return true;
  };
  const handleClearForm = () => {
    setEmail(null);
    setUserName(null);
    setPassword(null);
    setConfirmedPassword(null);
    setHomePage(null);
  };
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const validateInput = (email, userName, password, confirmedPassword) => {
    if (!email || !userName || !password || !confirmedPassword) {
      return false;
    } else return true;
  };
  const validateUrl = (url) => {
    if (!url) return true;
    const pattern = new RegExp(
      "^https?:\\/\\/" +
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
        "localhost|" +
        "\\d{1,3}(\\.\\d{1,3}){3})" +
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
        "(\\?[;&a-z\\d%_.~+=-]*)?" +
        "(\\#[-a-z\\d_]*)?$",
      "i"
    );
    return pattern.test(url);
  };
  const handleSubmit = (email, userName, password, confirmedPassword, homePage) => {
    if (!validateEmail(email)) {
      Alert.alert("Введите корректный email");
      return;
    }
    if (!validateInput(email, userName, password, confirmedPassword)) {
      return Alert.alert("Не все поля заполнены, опциональное только Home page");
    }
    if (!validateUrl(homePage)) {
      return Alert.alert("Не верно указан путь к домашней странице");
    }
    if (!validatePasswordLength(password)) {
      return Alert.alert("Пароль должен быть не менее 6 символов");
    }
    if (!checkPasswordConfirm(password, confirmedPassword)) {
      return Alert.alert("Ваши пароли не совпадают");
    } else {
      handleRegister(email, userName, password, confirmedPassword, homePage);
      handleClearForm();
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.registrationTitle}>Регистрация</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.registrationInput} placeholder="Email"></TextInput>
      <TextInput
        value={userName}
        onChangeText={setUserName}
        style={styles.registrationInput}
        placeholder="User name"
      ></TextInput>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.registrationInput}
        placeholder="Password"
      ></TextInput>
      <TextInput
        secureTextEntry
        value={confirmedPassword}
        onChangeText={setConfirmedPassword}
        style={styles.registrationInput}
        placeholder="Confirm your password"
      ></TextInput>
      <TextInput
        value={homePage}
        onChangeText={setHomePage}
        style={styles.registrationInput}
        placeholder="Home page (optional)"
        keyboardType="url"
      />
      <View style={styles.registrationButtonSubmit}>
        <Button
          title="Зарегистрироваться"
          onPress={() => handleSubmit(email, userName, password, confirmedPassword, homePage)}
        ></Button>
      </View>
      <Button onPress={() => setRegistrationShow(false)} title="Назад"></Button>
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
  registrationTitle: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 15,
  },
  registrationInput: {
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  registrationButtonSubmit: {
    marginBottom: 50,
  },
});
