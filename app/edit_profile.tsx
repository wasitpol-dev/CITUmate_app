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
import { colors, fonts, ff } from "../lib/appTheme";
import { supabase } from "../lib/supabase";

function showMessage(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? "");
      setUsername(
        (user.user_metadata as any)?.username ?? (user.email?.split("@")[0] ?? "")
      );
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (saving) return;

    const name = username.trim();
    if (!name) {
      showMessage("กรุณากรอกชื่อผู้ใช้");
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        showMessage("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
      if (newPassword !== confirmPassword) {
        showMessage("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = { data: { username: name } };
      if (newPassword) payload.password = newPassword;

      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        showMessage("บันทึกไม่สำเร็จ", error.message);
        return;
      }

      showMessage("บันทึกโปรไฟล์เรียบร้อย");
      router.replace({
        pathname: "/home",
        params: { identifier: email },
      });
    } catch (e: any) {
      showMessage("เกิดข้อผิดพลาด", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const initial = (username || email || "?").trim().charAt(0).toUpperCase();

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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹ กลับ</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>แก้ไขโปรไฟล์</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="ชื่อผู้ใช้"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>อีเมล (เปลี่ยนไม่ได้)</Text>
            <View style={[styles.inputBox, styles.inputDisabled]}>
              <TextInput
                style={[styles.input, { color: colors.textMuted }]}
                value={email}
                editable={false}
              />
            </View>

            <Text style={styles.sectionTitle}>เปลี่ยนรหัสผ่าน (ไม่บังคับ)</Text>

            <Text style={styles.label}>รหัสผ่านใหม่</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <Text style={styles.label}>ยืนยันรหัสผ่านใหม่</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (saving || loading) && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={saving || loading}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 60, padding: 6 },
  backText: { ...ff(fonts.medium), fontSize: 14, color: colors.primary },
  headerTitle: {
    ...ff(fonts.bold),
    fontSize: 18,
    lineHeight: 28,
    color: colors.primary,
  },
  avatarWrap: { alignItems: "center", marginVertical: 18 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...ff(fonts.bold),
    fontSize: 38,
    lineHeight: 50,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 22,
  },
  label: {
    ...ff(fonts.medium),
    fontSize: 12,
    color: colors.textSoft,
    marginBottom: 6,
    marginLeft: 6,
  },
  sectionTitle: {
    ...ff(fonts.semibold),
    fontSize: 14,
    lineHeight: 22,
    color: colors.primary,
    marginTop: 8,
    marginBottom: 12,
  },
  inputBox: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  inputDisabled: { opacity: 0.7 },
  input: {
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },
  saveButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    ...ff(fonts.bold),
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 24,
    color: colors.white,
  },
  cancelButton: { alignSelf: "center", marginTop: 14, padding: 6 },
  cancelText: {
    ...ff(fonts.regular),
    fontSize: 13,
    color: colors.textFaint,
  },
});