import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

/* =====================================================
   ธีมกลางของ CITUMATE — แก้สี/น้ำหนักตัวอักษรที่นี่ที่เดียว
   ทุกหน้า (index, login, signup) จะเปลี่ยนตามทันที
   ===================================================== */

export const colors = {
  primary: "#7B1A2D", // แดงเลือดหมู (ปุ่ม, หัวข้อ, ลิงก์)
  bg: "#F9F6F0", // พื้นหลังครีม
  white: "#FFFFFF",
  card: "#FFFFFF",
  cardBorder: "#EDE6DE",
  inputBg: "#FAF7F3",
  inputBorder: "#E8E0D8",
  divider: "#F3EEE8",
  text: "#333333",
  textSoft: "#5C5560",
  textMuted: "#777777",
  textFaint: "#8A857F",
  tagline: "#7A7570",
  placeholder: "#A09A94",
  brandDivider: "#D8C8CC",
  brandText: "#6C3B4E",
};

// น้ำหนักตัวอักษร
export const fonts = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// ชื่อฟอนต์ Prompt ตามน้ำหนัก
export const fontFamily = {
  "400": "Prompt_400Regular",
  "500": "Prompt_500Medium",
  "600": "Prompt_500Medium", // ไม่ได้โหลด SemiBold จึงใช้ Medium แทน
  "700": "Prompt_700Bold",
} as const;

// helper: ff(fonts.bold) -> { fontFamily: "Prompt_700Bold" }
export const ff = (weight: keyof typeof fontFamily) => ({
  fontFamily: fontFamily[weight],
});

/* ไอคอนปฏิทิน + ประตู */
export function CalendarIcon({ size = 36 }: { size?: number }) {
  const b = Math.max(2, size * 0.08);
  return (
    <View style={{ width: size, height: size * 0.95 }}>
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: size,
          height: size * 0.82,
          borderWidth: b,
          borderColor: colors.primary,
          borderRadius: size * 0.22,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            width: size * 0.22,
            height: size * 0.4,
            backgroundColor: colors.primary,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            alignItems: "flex-end",
            justifyContent: "center",
            paddingRight: size * 0.03,
          }}
        >
          <View
            style={{
              width: size * 0.035,
              height: size * 0.035,
              borderRadius: size,
              backgroundColor: colors.bg,
            }}
          />
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: size * 0.22,
          width: b,
          height: size * 0.18,
          borderRadius: b,
          backgroundColor: colors.primary,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: size * 0.22,
          width: b,
          height: size * 0.18,
          borderRadius: b,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}

/* แถบโลโก้ด้านบน (ใช้ซ้ำในหน้า Login และ Sign Up) */
export function TopLogo({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.topLogo}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <CalendarIcon size={36} />
      <Text style={styles.logoTitle}>CITUMATE</Text>
      <View style={styles.university}>
        <Text style={styles.smallText}>COLLEGE OF</Text>
        <Text style={styles.universityTitle}>INNOVATION</Text>
        <Text style={styles.smallText}>THAMMASAT UNIVERSITY</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topLogo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 22,
    paddingLeft: 22,
  },
  logoTitle: {
    ...ff(fonts.bold),
    fontSize: 20,
    letterSpacing: 1,
    color: colors.primary,
    marginLeft: 10,
  },
  university: {
    borderLeftWidth: 1,
    borderLeftColor: colors.brandDivider,
    paddingLeft: 8,
    marginLeft: 10,
  },
  smallText: {
    ...ff(fonts.regular),
    fontSize: 6,
    color: colors.brandText,
  },
  universityTitle: {
    ...ff(fonts.bold),
    fontSize: 8,
    color: colors.primary,
  },
});

