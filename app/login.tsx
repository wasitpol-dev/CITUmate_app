import React, { useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, ff, TopLogo } from "../lib/appTheme";
import { supabase } from "../lib/supabase";

const REMEMBER_KEY = "citumate_remember_identifier";

let memoryStore: string | null = null;

function loadRemembered(): string | null {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      return localStorage.getItem(REMEMBER_KEY);
    }
  } catch (e) {}
  return memoryStore;
}

function saveRemembered(value: string | null) {
  memoryStore = value;
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      if (value) localStorage.setItem(REMEMBER_KEY, value);
      else localStorage.removeItem(REMEMBER_KEY);
    }
  } catch (e) {}
}

function showMessage(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = loadRemembered();
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  const handleLogin = async () => {
    if (loading) return;

    const id = identifier.trim();
    if (!id || !password) {
      showMessage("กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      let email = id;

      // ถ้าไม่มี @ ถือว่าเป็น username แล้วแปลงเป็นอีเมลก่อน
      if (!id.includes("@")) {
        const { data: found, error: lookupError } = await supabase.rpc(
          "get_email_by_username",
          { uname: id }
        );
        if (lookupError || !found) {
          showMessage("ล็อกอินไม่สำเร็จ", "ไม่พบชื่อผู้ใช้นี้");
          return;
        }
        email = found as string;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("login result:", { user: data?.user?.email, error });

      if (error) {
        showMessage("ล็อกอินไม่สำเร็จ", error.message);
        return;
      }

      saveRemembered(remember ? id : null);

      console.log("navigating to /home");
      router.replace({
        pathname: "/home",
        params: { identifier: email },
      });
    } catch (e: any) {
      console.log("login exception:", e);
      showMessage("เกิดข้อผิดพลาด", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.heading}>LOGIN</Text>

              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Username"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  activeOpacity={0.7}
                  onPress={() => setRemember(!remember)}
                >
                  <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                    {remember && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/forget_password")}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? "กำลังเข้าสู่ระบบ..." : "LOGIN"}
                </Text>
              </TouchableOpacity>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/signup")}>
                  <Text style={styles.signupLink}>Sign up here</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backText}>‹ กลับหน้าแรก</Text>
              </TouchableOpacity>
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
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  pageContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heading: {
    ...ff(fonts.bold),
    fontSize: 28,
    letterSpacing: 2,
    lineHeight: 40,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 22,
  },
  inputBox: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  eyeIcon: { fontSize: 18, marginLeft: 8 },
  input: {
    flex: 1,
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 2,
  },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { fontSize: 12, color: colors.white },
  rememberText: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textSoft,
  },
  forgotText: {
    ...ff(fonts.medium),
    fontSize: 12,
    color: colors.primary,
  },
  loginButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    ...ff(fonts.bold),
    fontSize: 16,
    letterSpacing: 1.5,
    lineHeight: 24,
    color: colors.white,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  signupText: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
  },
  signupLink: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.primary,
  },
  backButton: { alignSelf: "center", marginTop: 14, padding: 6 },
  backText: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textFaint,
  },
  footer: {
    ...ff(fonts.regular),
    textAlign: "center",
    color: colors.placeholder,
    fontSize: 11,
    paddingTop: 10,
  },
});