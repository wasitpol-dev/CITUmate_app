import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, ff, TopLogo } from "../lib/appTheme";

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email.trim()) {
      alert("กรุณากรอกอีเมล");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      alert("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    // TODO: เชื่อมต่อ Supabase ตรงนี้
    // await supabase.auth.resetPasswordForEmail(email.trim())
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TopLogo onPress={() => router.replace("/")} />

          <View style={styles.pageContent}>
            <View style={styles.card}>
              <Text style={styles.heading}>FORGOT PASSWORD</Text>

              {sent ? (
                <>
                  <Text style={styles.desc}>
                    ส่งลิงก์รีเซ็ตรหัสผ่านไปที่
                  </Text>
                  <Text style={styles.sentEmail}>{email.trim()}</Text>
                  <Text style={styles.desc}>
                    กรุณาตรวจสอบกล่องจดหมายของคุณ (รวมถึงโฟลเดอร์สแปม)
                  </Text>

                  <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={() => router.replace("/login")}
                  >
                    <Text style={styles.buttonText}>BACK TO LOGIN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => setSent(false)}
                  >
                    <Text style={styles.linkText}>ส่งอีกครั้ง / เปลี่ยนอีเมล</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.desc}>
                    กรอกอีเมลที่ใช้สมัคร แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
                  </Text>

                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      onSubmitEditing={handleSend}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.85}
                    onPress={handleSend}
                  >
                    <Text style={styles.buttonText}>SEND RESET LINK</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.back()}
                  >
                    <Text style={styles.linkText}>‹ กลับไปหน้าเข้าสู่ระบบ</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <Text style={styles.footer}>
            College of Innovation · Thammasat University
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  pageContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 25,
    elevation: 3,
  },
  heading: {
    ...ff(fonts.bold),
    fontSize: 24,
    letterSpacing: 2,
    lineHeight: 36,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    ...ff(fonts.regular),
    fontSize: 13,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 18,
  },
  sentEmail: {
    ...ff(fonts.semibold),
    fontSize: 14,
    lineHeight: 22,
    color: colors.primary,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 12,
  },
  inputBox: {
    width: "100%",
    height: 52,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: "100%",
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },
  button: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...ff(fonts.bold),
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 1.5,
    color: colors.white,
  },
  linkButton: {
    marginTop: 16,
    padding: 6,
  },
  linkText: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textFaint,
  },
  footer: {
    ...ff(fonts.regular),
    textAlign: "center",
    color: colors.placeholder,
    fontSize: 11,
    paddingVertical: 15,
  },
});