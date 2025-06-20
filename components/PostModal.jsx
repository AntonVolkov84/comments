import { useState } from "react";
import Captcha from "./Captcha";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";

export default function PostModal({ visible, onClose, onSubmit, postText, setPostText }) {
  const { t } = useTranslation();
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handlePostPress = () => {
    if (!postText.trim()) return;
    setShowCaptcha(true);
  };
  const handleCaptchaVerified = (token) => {
    setShowCaptcha(false);
    console.log("token", token);
    onSubmit(token);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("postmodal.title")}</Text>
          <TextInput
            placeholder={t("postmodal.textplaceholder")}
            style={styles.input}
            value={postText}
            multiline
            onChangeText={setPostText}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => handlePostPress()} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>{t("postmodal.post")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.modalButton, { backgroundColor: "gray" }]}>
              <Text style={styles.modalButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showCaptcha && <Captcha action="create_post" onVerify={handleCaptchaVerified} />}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
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
