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
  KeyboardTypeOptions,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, ff, TopLogo } from "../lib/appTheme";
import { supabase } from "../lib/supabase";

// ตัวอย่างรายชื่อสาขา — แก้เป็นสาขาจริงของวิทยาลัยได้ที่นี่
const MAJORS = [
  "BMCI",
  "BSI",
  "DX",
  "Other",
];

/* ช่องกรอกข้อมูล */
type FieldProps = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secure,
  keyboardType,
}: FieldProps) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("");
  const [majorOpen, setMajorOpen] = useState(false);
  const [generation, setGeneration] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;

    if (
      !fullName.trim() ||
      !studentId.trim() ||
      !major ||
      !generation.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirm
    ) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      alert("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    if (password.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      alert("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
        const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          student_id: studentId.trim(),
          major,
          generation: generation.trim(),
          username: username.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      alert("สมัครไม่สำเร็จ: " + error.message);
      return;
    }

    // อีเมลนี้เคยสมัครไว้แล้ว
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      alert("อีเมลนี้ถูกใช้สมัครไปแล้ว");
      return;
    }

    if (data.session) {
      // ปิด Confirm email ไว้: ล็อกอินให้อัตโนมัติ
      alert("สมัครสมาชิกสำเร็จ");
      router.replace({
        pathname: "/home",
        params: { identifier: email.trim() },
      });
    } else {
      // เปิด Confirm email ไว้: ต้องกดลิงก์ในอีเมลก่อน
      alert("สมัครสำเร็จ กรุณาตรวจอีเมลเพื่อกดยืนยันก่อนล็อกอิน");
      router.replace("/login");
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
          {/* Top logo */}
          <TopLogo onPress={() => router.replace("/")} />

          {/* Sign up card */}
          <View style={styles.pageContent}>
            <View style={styles.card}>
              <Text style={styles.heading}>SIGN UP</Text>
              <Text style={styles.subheading}>Create your account</Text>

              <Field
                icon="👤"
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />
              <Field
                icon="🎓"
                placeholder="Student ID"
                value={studentId}
                onChangeText={setStudentId}
                keyboardType="number-pad"
              />

              {/* Select Major */}
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.7}
                onPress={() => setMajorOpen(!majorOpen)}
              >
                <Text style={styles.inputIcon}>📚</Text>
                <Text
                  style={[styles.selectText, !major && styles.selectPlaceholder]}
                >
                  {major || "Select Major"}
                </Text>
                <Text style={styles.chevron}>{majorOpen ? "▴" : "▾"}</Text>
              </TouchableOpacity>

              {majorOpen && (
                <View style={styles.dropdown}>
                  {MAJORS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setMajor(m);
                        setMajorOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          m === major && styles.dropdownTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Field
                icon="👥"
                placeholder="Generation / รุ่น"
                value={generation}
                onChangeText={setGeneration}
                keyboardType="number-pad"
              />
              <Field
                icon="🙂"
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
              />
              <Field
                icon="✉️"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Field
                icon="🔒"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secure
              />
              <Field
                icon="🔒"
                placeholder="Confirm Password"
                value={confirm}
                onChangeText={setConfirm}
                secure
              />

              <TouchableOpacity
                style={[styles.signupButton, loading && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? "กำลังสมัคร..." : "SIGN UP"}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text style={styles.loginLink}>Login here</Text>
                </TouchableOpacity>
              </View>
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
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
  },

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
    fontSize: 28,
    letterSpacing: 2,
    lineHeight: 40,
    color: colors.primary,
  },
  subheading: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  inputIcon: {
    width: 28,
    fontSize: 16,
  },
  input: {
    flex: 1,
    height: "100%",
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },

  selectText: {
    flex: 1,
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },
  selectPlaceholder: {
    color: colors.placeholder,
  },
  chevron: {
    fontSize: 14,
    color: colors.primary,
  },
  dropdown: {
    width: "100%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 18,
    marginTop: -4,
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownText: {
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },
  dropdownTextActive: {
    ...ff(fonts.semibold),
    color: colors.primary,
  },

  signupButton: {
    width: "100%",
    height: 52,
    marginTop: 6,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonText: {
    ...ff(fonts.semibold),
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    letterSpacing: 1,
  },

  loginRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
  },
  loginLink: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.primary,
  },

  footer: {
    ...ff(fonts.regular),
    textAlign: "center",
    color: colors.placeholder,
    fontSize: 11,
    paddingVertical: 15,
  },
});