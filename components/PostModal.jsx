import { useState, useEffect } from "react";
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
import * as Network from "expo-network";

export default function PostModal({
  isModalVisible,
  handlePostSubmitOffline,
  postText,
  setPostText,
  setModalVisible,
  onSubmit,
  checkInternetAccess,
}) {
  const { t } = useTranslation();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const handleCaptchaVerified = (event) => {
    const token = event.nativeEvent.data;
    onSubmit(token);
    setShowCaptcha(false);
    setModalVisible(false);
  };
  useEffect(() => {
    checkNet();
  }, []);
  const checkNet = async () => {
    const net = await Network.getNetworkStateAsync();
    const res = net.isConnected && net.isInternetReachable && (await checkInternetAccess());
    console.log(res);
    setIsOnline(res);
  };

  return (
    <Modal visible={isModalVisible} transparent animationType="slide">
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
            <TouchableOpacity
              onPress={
                isOnline
                  ? () => setShowCaptcha(true)
                  : () => {
                      handlePostSubmitOffline();
                      setModalVisible(false);
                      setPostText("");
                    }
              }
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>{t("postmodal.post")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowCaptcha(true);
                setModalVisible(false);
                setPostText("");
              }}
              style={[styles.modalButton, { backgroundColor: "gray" }]}
            >
              <Text style={styles.modalButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {showCaptcha && (
        <View style={{ position: "absolute", height: 0, width: 0, overflow: "hidden" }}>
          <Captcha action="create_post" onVerify={handleCaptchaVerified} />
        </View>
      )}
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
