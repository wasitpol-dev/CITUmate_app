// ไฟล์นี้มีเฉพาะใน Snack — ทำหน้าที่เปิด Expo Router
// (บนเครื่องตัวเองไม่ต้องมี เพราะ expo-router/entry ทำให้)
import { ExpoRoot } from "expo-router";

export default function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} location="/" />;
}
