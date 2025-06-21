import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

export default function AdminLine({ onSort, onCreatePost, theme }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.container, theme === "dark" ? styles.dark : styles.light]}>
      <TouchableOpacity onPress={() => onSort("username")} style={styles.button}>
        <Text style={styles.buttonText}>{t("adminline.username")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onSort("created_at")} style={styles.button}>
        <Text style={styles.buttonText}>{t("adminline.date")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCreatePost} style={styles.buttonPost}>
        <Text style={styles.buttonText}>{t("adminline.post")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#1976d2",
  },
  buttonPost: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#b52a41",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  light: {
    backgroundColor: "#e0e0e0",
    borderColor: "#ccc",
  },
  dark: {
    backgroundColor: "#2c2c2c",
    borderColor: "#555",
  },
});
