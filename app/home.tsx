import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { colors, fonts, ff, CalendarIcon } from "../lib/appTheme";
import { supabase } from "../lib/supabase";

/* ---------------- ข้อมูลตัวอย่าง ---------------- */

type Room = {
  id: string;
  name: string;
  location: string;
  capacity: string;
  capMin: number;
  capMax: number;
  image: string;
};

type Booking = {
  id: number;
  roomId: string;
  roomName: string;
  dateKey: string;
  dateLabel: string;
  slot: string;
  attendees: number;
  purpose: string;
  status: "pending" | "cancelled";
};

type Notice = {
  id: number;
  title: string;
  detail: string;
  time: string;
  read: boolean;
};

const ROOMS: Room[] = [
  {
    id: "301",
    name: "CITU Study Room 301",
    location: "อาคาร CITU ชั้น 3",
    capacity: "4-6 คน",
    capMin: 4,
    capMax: 6,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500",
  },
  {
    id: "404",
    name: "Meeting Room 404",
    location: "อาคาร CITU ชั้น 4",
    capacity: "6-8 คน",
    capMin: 6,
    capMax: 8,
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500",
  },
  {
    id: "501",
    name: "CITU Study Room 501",
    location: "อาคาร CITU ชั้น 5",
    capacity: "4-6 คน",
    capMin: 4,
    capMax: 6,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500",
  },
];

const SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

const TABS = [
  { key: "home", icon: "🏠", label: "หน้าหลัก" },
  { key: "rooms", icon: "🚪", label: "ห้องทั้งหมด" },
  { key: "bookings", icon: "📅", label: "การจอง" },
  { key: "profile", icon: "👤", label: "โปรไฟล์" },
];

const DAY_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTH_TH = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function pad(n: number) {
  return n < 10 ? "0" + n : String(n);
}

function nowLabel() {
  const d = new Date();
  return pad(d.getHours()) + ":" + pad(d.getMinutes()) + " น.";
}

function buildDates() {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({
      key: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()),
      day: DAY_TH[d.getDay()],
      num: d.getDate(),
      label: d.getDate() + " " + MONTH_TH[d.getMonth()],
    });
  }
  return out;
}

/* ---------------- การ์ดห้อง ---------------- */

function RoomCard({ room, onBook }: { room: Room; onBook: (r: Room) => void }) {
  return (
    <View style={styles.roomCard}>
      <Image source={{ uri: room.image }} style={styles.roomImage} />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomDetail}>👥 {room.capacity}</Text>
        <Text style={styles.roomDetail}>📍 {room.location}</Text>
        <View style={styles.roomBottom}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>● ว่างวันนี้</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.85}
            onPress={() => onBook(room)}
          >
            <Text style={styles.bookButtonText}>จอง</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ---------------- หน้าจอหลัก ---------------- */

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const identifier = (params.identifier as string) || "";

  // ข้อมูลผู้ใช้จาก Supabase (รีเฟรชทุกครั้งที่กลับมาหน้านี้)
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!active || !user) return;
        setUserEmail(user.email ?? "");
        setUserName(((user.user_metadata as any)?.username as string) ?? "");
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const loginEmail = userEmail || identifier;
  const displayName =
    userName || (loginEmail ? loginEmail.split("@")[0] : "นักศึกษา");

  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);

  // การแจ้งเตือน
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 1,
      title: "ยินดีต้อนรับสู่ CITUMATE",
      detail: 'เลือกห้องที่ต้องการแล้วกดปุ่ม "จอง" ได้เลย',
      time: "ตอนนี้",
      read: false,
    },
  ]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const unread = notices.filter((n) => !n.read).length;

  const addNotice = (title: string, detail: string) =>
    setNotices((prev) => [
      { id: Date.now(), title, detail, time: nowLabel(), read: false },
      ...prev,
    ]);

  // ฟอร์มจอง
  const dates = useMemo(buildDates, []);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [dateKey, setDateKey] = useState(dates[0].key);
  const [slot, setSlot] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [formError, setFormError] = useState("");

  const filteredRooms = ROOMS.filter((room) => {
    const text = room.name + " " + room.id + " " + room.location;
    return text.toLowerCase().includes(search.toLowerCase());
  });
  const homeRooms = search ? filteredRooms : ROOMS.slice(0, 2);

  const isTaken = (roomId: string, dKey: string, s: string) =>
    bookings.some(
      (b) =>
        b.roomId === roomId &&
        b.dateKey === dKey &&
        b.slot === s &&
        b.status !== "cancelled"
    );

  const openBooking = (room: Room) => {
    setBookingRoom(room);
    setDateKey(dates[0].key);
    setSlot("");
    setAttendees(room.capMin);
    setPurpose("");
    setFormError("");
  };

  const confirmBooking = () => {
    if (!bookingRoom) return;
    if (!slot) {
      setFormError("กรุณาเลือกช่วงเวลา");
      return;
    }
    if (isTaken(bookingRoom.id, dateKey, slot)) {
      setFormError("ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น");
      return;
    }
    const d = dates.find((x) => x.key === dateKey);
    setBookings([
      {
        id: Date.now(),
        roomId: bookingRoom.id,
        roomName: bookingRoom.name,
        dateKey,
        dateLabel: d ? d.label : dateKey,
        slot,
        attendees,
        purpose: purpose.trim(),
        status: "pending",
      },
      ...bookings,
    ]);
    addNotice(
      "ส่งคำขอจองแล้ว",
      bookingRoom.name + " · " + (d ? d.label : dateKey) + " · " + slot + " (รออนุมัติ)"
    );
    setBookingRoom(null);
    setTab("bookings");
  };

  const cancelBooking = (id: number) => {
    const target = bookings.find((b) => b.id === id);
    if (target) {
      addNotice(
        "ยกเลิกการจองแล้ว",
        target.roomName + " · " + target.dateLabel + " · " + target.slot
      );
    }
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    router.replace("/login");
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  /* ---- เนื้อหาแต่ละแท็บ ---- */

  const searchBox = (
    <View style={styles.searchBox}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาห้องหรืออาคาร"
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
      />
    </View>
  );

  const renderHome = () => (
    <>
      <Text style={styles.greeting}>สวัสดี, {displayName} 👋</Text>
      <Text style={styles.subtitle}>วันนี้อยากใช้พื้นที่แบบไหน?</Text>

      {searchBox}

      <TouchableOpacity
        style={styles.banner}
        activeOpacity={0.9}
        onPress={() => setTab("rooms")}
      >
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900",
          }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerLabel}>BOOK YOUR SPACE</Text>
          <Text style={styles.bannerTitle}>
            พื้นที่ดี ๆ{"\n"}เริ่มต้นได้ที่นี่
          </Text>
          <View style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>ค้นหาห้องเลย →</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {search ? "ผลการค้นหา" : "ห้องแนะนำ"}
          </Text>
          <Text style={styles.sectionSubtitle}>
            เลือกพื้นที่สำหรับกิจกรรมของคุณ
          </Text>
        </View>
        <TouchableOpacity onPress={() => setTab("rooms")}>
          <Text style={styles.seeAll}>ดูทั้งหมด ›</Text>
        </TouchableOpacity>
      </View>

      {homeRooms.length === 0 ? (
        <Text style={styles.emptyText}>ไม่พบห้องที่ค้นหา</Text>
      ) : (
        homeRooms.map((room) => (
          <RoomCard key={room.id} room={room} onBook={openBooking} />
        ))
      )}
    </>
  );

  const renderRooms = () => (
    <>
      <Text style={styles.pageTitle}>ห้องทั้งหมด</Text>
      <Text style={styles.subtitle}>มี {filteredRooms.length} ห้องที่จองได้</Text>
      {searchBox}
      {filteredRooms.length === 0 ? (
        <Text style={styles.emptyText}>ไม่พบห้องที่ค้นหา</Text>
      ) : (
        filteredRooms.map((room) => (
          <RoomCard key={room.id} room={room} onBook={openBooking} />
        ))
      )}
    </>
  );

  const renderBookings = () => (
    <>
      <Text style={styles.pageTitle}>การจองของฉัน</Text>
      <Text style={styles.subtitle}>
        {bookings.length === 0
          ? "ยังไม่มีรายการจอง"
          : "ทั้งหมด " + bookings.length + " รายการ"}
      </Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีการจอง</Text>
          <Text style={styles.emptyDesc}>เลือกห้องที่ต้องการแล้วกดปุ่ม "จอง"</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => setTab("rooms")}
          >
            <Text style={styles.primaryButtonText}>ดูห้องทั้งหมด</Text>
          </TouchableOpacity>
        </View>
      ) : (
        bookings.map((b) => {
          const cancelled = b.status === "cancelled";
          return (
            <View key={b.id} style={[styles.bookingCard, cancelled && styles.dim]}>
              <View style={styles.bookingTop}>
                <Text style={styles.bookingRoom}>{b.roomName}</Text>
                <View
                  style={[
                    styles.pill,
                    cancelled ? styles.pillGray : styles.pillAmber,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      cancelled ? styles.pillTextGray : styles.pillTextAmber,
                    ]}
                  >
                    {cancelled ? "ยกเลิกแล้ว" : "รออนุมัติ"}
                  </Text>
                </View>
              </View>
              <Text style={styles.roomDetail}>📅 {b.dateLabel}   🕒 {b.slot}</Text>
              <Text style={styles.roomDetail}>👥 {b.attendees} คน</Text>
              {b.purpose ? (
                <Text style={styles.roomDetail}>📝 {b.purpose}</Text>
              ) : null}
              {!cancelled && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => cancelBooking(b.id)}
                >
                  <Text style={styles.cancelButtonText}>ยกเลิกการจอง</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </>
  );

  const renderProfile = () => (
    <>
      <View style={styles.profileTop}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileSub}>
          {loginEmail || "นักศึกษา วิทยาลัยนวัตกรรม"}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{bookings.length}</Text>
          <Text style={styles.statLabel}>ทั้งหมด</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pendingCount}</Text>
          <Text style={styles.statLabel}>รออนุมัติ</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{cancelledCount}</Text>
          <Text style={styles.statLabel}>ยกเลิก</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        {[
          ["ชื่อผู้ใช้", displayName],
          ["อีเมลที่ล็อกอิน", loginEmail || "-"],
        ].map(([label, value], i) => (
          <View key={label} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.outlineButton, { marginTop: 16 }]}
        activeOpacity={0.8}
        onPress={() => router.push("/edit_profile")}
      >
        <Text style={styles.outlineButtonText}>แก้ไขโปรไฟล์</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleLogout}
      >
        <Text style={styles.primaryButtonText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </>
  );

  /* ---- หน้าจอ ---- */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <CalendarIcon size={32} />
          <Text style={styles.brandTitle}>CITUMATE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.8}
            onPress={() => setNoticeOpen(true)}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.8}
            onPress={() => setTab("profile")}
          >
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "home" && renderHome()}
        {tab === "rooms" && renderRooms()}
        {tab === "bookings" && renderBookings()}
        {tab === "profile" && renderProfile()}

        <Text style={styles.footer}>
          College of Innovation · Thammasat University
        </Text>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabIcon, !active && styles.tabIconOff]}>
                {t.icon}
              </Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* หน้าต่างการแจ้งเตือน */}
      <Modal
        visible={noticeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNoticeOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.noticeHeader}>
              <Text style={styles.sheetTitle}>การแจ้งเตือน</Text>
              <TouchableOpacity onPress={() => setNoticeOpen(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {notices.length > 0 && (
              <View style={styles.noticeActions}>
                <TouchableOpacity
                  onPress={() =>
                    setNotices(notices.map((n) => ({ ...n, read: true })))
                  }
                >
                  <Text style={styles.noticeAction}>อ่านทั้งหมด</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNotices([])}>
                  <Text style={styles.noticeAction}>ล้างทั้งหมด</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {notices.length === 0 ? (
                <View style={styles.noticeEmpty}>
                  <Text style={styles.emptyIcon}>🔔</Text>
                  <Text style={styles.emptyTitle}>ยังไม่มีการแจ้งเตือน</Text>
                </View>
              ) : (
                notices.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.noticeItem, !n.read && styles.noticeItemUnread]}
                    activeOpacity={0.8}
                    onPress={() =>
                      setNotices(
                        notices.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                      )
                    }
                  >
                    <View style={[styles.dot, n.read && styles.dotRead]} />
                    <View style={styles.noticeBody}>
                      <Text style={styles.noticeTitle}>{n.title}</Text>
                      <Text style={styles.noticeDetail}>{n.detail}</Text>
                      <Text style={styles.noticeTime}>{n.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* หน้าต่างจองห้อง */}
      <Modal
        visible={bookingRoom !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingRoom(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sheetTitle}>จองห้อง</Text>
              <Text style={styles.sheetRoom}>
                {bookingRoom ? bookingRoom.name : ""}
              </Text>

              <Text style={styles.fieldLabel}>เลือกวันที่</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dates.map((d) => {
                  const active = d.key === dateKey;
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[styles.dateChip, active && styles.chipActive]}
                      onPress={() => {
                        setDateKey(d.key);
                        setSlot("");
                        setFormError("");
                      }}
                    >
                      <Text style={[styles.dateDay, active && styles.chipTextActive]}>
                        {d.day}
                      </Text>
                      <Text style={[styles.dateNum, active && styles.chipTextActive]}>
                        {d.num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>เลือกเวลา</Text>
              <View style={styles.slotWrap}>
                {SLOTS.map((s) => {
                  const taken = bookingRoom
                    ? isTaken(bookingRoom.id, dateKey, s)
                    : false;
                  const active = s === slot;
                  return (
                    <TouchableOpacity
                      key={s}
                      disabled={taken}
                      style={[
                        styles.slotChip,
                        active && styles.chipActive,
                        taken && styles.slotTaken,
                      ]}
                      onPress={() => {
                        setSlot(s);
                        setFormError("");
                      }}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          active && styles.chipTextActive,
                          taken && styles.slotTextTaken,
                        ]}
                      >
                        {s}
                        {taken ? " (จองแล้ว)" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>
                จำนวนผู้ใช้ห้อง
                {bookingRoom ? " (รับได้ " + bookingRoom.capacity + ")" : ""}
              </Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setAttendees(Math.max(1, attendees - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{attendees}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    setAttendees(
                      Math.min(bookingRoom ? bookingRoom.capMax : 99, attendees + 1)
                    )
                  }
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>วัตถุประสงค์ (ไม่บังคับ)</Text>
              <TextInput
                style={styles.purposeInput}
                placeholder="เช่น ติวหนังสือ, ประชุมกลุ่มโปรเจกต์"
                placeholderTextColor={colors.placeholder}
                value={purpose}
                onChangeText={setPurpose}
              />

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <View style={styles.sheetButtons}>
                <TouchableOpacity
                  style={[styles.outlineButton, styles.sheetBtn]}
                  onPress={() => setBookingRoom(null)}
                >
                  <Text style={styles.outlineButtonText}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.sheetBtn]}
                  activeOpacity={0.85}
                  onPress={confirmBooking}
                >
                  <Text style={styles.primaryButtonText}>ยืนยันการจอง</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
  },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    ...ff(fonts.bold),
    fontSize: 20,
    letterSpacing: 1,
    color: colors.primary,
    marginLeft: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...ff(fonts.bold),
    fontSize: 15,
    color: colors.white,
  },

  /* titles */
  greeting: {
    ...ff(fonts.bold),
    fontSize: 24,
    color: colors.text,
  },
  pageTitle: {
    ...ff(fonts.bold),
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    ...ff(fonts.regular),
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },

  /* search */
  searchBox: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },

  /* banner */
  banner: {
    height: 190,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 22,
    backgroundColor: colors.primary,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(75,12,37,0.68)",
    padding: 20,
    justifyContent: "center",
  },
  bannerLabel: {
    ...ff(fonts.semibold),
    fontSize: 10,
    letterSpacing: 2,
    color: "#FFDCA1",
    marginBottom: 6,
  },
  bannerTitle: {
    ...ff(fonts.bold),
    fontSize: 24,
    lineHeight: 34,
    color: colors.white,
  },
  bannerButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  bannerButtonText: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.primary,
  },

  /* section */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    ...ff(fonts.bold),
    fontSize: 19,
    color: colors.text,
  },
  sectionSubtitle: {
    ...ff(fonts.regular),
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 3,
  },
  seeAll: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.primary,
  },

  /* room card */
  roomCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  roomImage: {
    width: 96,
    height: 112,
    borderRadius: 14,
    backgroundColor: colors.divider,
  },
  roomInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  roomName: {
    ...ff(fonts.semibold),
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  roomDetail: {
    ...ff(fonts.regular),
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
  },
  roomBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  statusBadge: {
    backgroundColor: "#E6F7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...ff(fonts.semibold),
    fontSize: 10,
    color: "#16834F",
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bookButtonText: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.white,
  },
  emptyText: {
    ...ff(fonts.regular),
    textAlign: "center",
    padding: 25,
    color: colors.textFaint,
  },

  /* bookings */
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dim: {
    opacity: 0.6,
  },
  bookingTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bookingRoom: {
    flex: 1,
    ...ff(fonts.semibold),
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillAmber: {
    backgroundColor: "#FFF3D6",
  },
  pillGray: {
    backgroundColor: "#ECECEE",
  },
  pillText: {
    ...ff(fonts.semibold),
    fontSize: 10,
  },
  pillTextAmber: {
    color: "#9A6200",
  },
  pillTextGray: {
    color: colors.textMuted,
  },
  cancelButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cancelButtonText: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.primary,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  emptyTitle: {
    ...ff(fonts.semibold),
    fontSize: 16,
    color: colors.text,
  },
  emptyDesc: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 18,
    textAlign: "center",
  },

  /* profile */
  profileTop: {
    alignItems: "center",
    marginBottom: 20,
  },
  bigAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bigAvatarText: {
    ...ff(fonts.bold),
    fontSize: 34,
    color: colors.white,
  },
  profileName: {
    ...ff(fonts.bold),
    fontSize: 20,
    color: colors.text,
  },
  profileSub: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  statNum: {
    ...ff(fonts.bold),
    fontSize: 22,
    color: colors.primary,
  },
  statLabel: {
    ...ff(fonts.regular),
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  infoLabel: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
    ...ff(fonts.medium),
    fontSize: 13,
    color: colors.text,
  },
  note: {
    ...ff(fonts.regular),
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 10,
    marginBottom: 18,
    textAlign: "center",
  },

  /* buttons */
  primaryButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  primaryButtonText: {
    ...ff(fonts.semibold),
    fontSize: 15,
    lineHeight: 24,
    color: colors.white,
  },
  outlineButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  outlineButtonText: {
    ...ff(fonts.semibold),
    fontSize: 15,
    lineHeight: 24,
    color: colors.primary,
  },

  footer: {
    ...ff(fonts.regular),
    textAlign: "center",
    color: colors.placeholder,
    fontSize: 11,
    paddingTop: 18,
  },

  /* tab bar */
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconOff: {
    opacity: 0.45,
  },
  tabLabel: {
    ...ff(fonts.regular),
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 2,
  },
  tabLabelActive: {
    ...ff(fonts.semibold),
    color: colors.primary,
  },

  /* booking sheet */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    maxHeight: "88%",
  },
  sheetTitle: {
    ...ff(fonts.bold),
    fontSize: 20,
    color: colors.primary,
  },
  sheetRoom: {
    ...ff(fonts.regular),
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  fieldLabel: {
    ...ff(fonts.semibold),
    fontSize: 13,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  dateChip: {
    width: 54,
    height: 66,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  dateDay: {
    ...ff(fonts.regular),
    fontSize: 11,
    color: colors.textMuted,
  },
  dateNum: {
    ...ff(fonts.bold),
    fontSize: 20,
    color: colors.text,
    marginTop: 2,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTextActive: {
    color: colors.white,
  },
  slotWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  slotChip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  slotTaken: {
    backgroundColor: "#ECECEE",
  },
  slotText: {
    ...ff(fonts.medium),
    fontSize: 12,
    color: colors.textSoft,
  },
  slotTextTaken: {
    color: colors.placeholder,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    ...ff(fonts.semibold),
    fontSize: 20,
    color: colors.primary,
    lineHeight: 24,
  },
  stepValue: {
    ...ff(fonts.bold),
    fontSize: 18,
    color: colors.text,
    minWidth: 52,
    textAlign: "center",
  },
  purposeInput: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 18,
    ...ff(fonts.regular),
    fontSize: 14,
    color: colors.text,
  },
  errorText: {
    ...ff(fonts.medium),
    fontSize: 12,
    color: "#B3261E",
    marginTop: 12,
  },
  sheetButtons: {
    flexDirection: "row",
    marginTop: 22,
  },
  sheetBtn: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 0,
  },

  /* notifications */
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  bellIcon: {
    fontSize: 17,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    ...ff(fonts.bold),
    fontSize: 10,
    color: colors.white,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
    padding: 4,
  },
  noticeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    marginBottom: 10,
  },
  noticeAction: {
    ...ff(fonts.semibold),
    fontSize: 12,
    color: colors.primary,
    marginLeft: 18,
  },
  noticeEmpty: {
    alignItems: "center",
    paddingVertical: 36,
  },
  noticeItem: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  noticeItemUnread: {
    borderColor: colors.primary,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 12,
  },
  dotRead: {
    backgroundColor: colors.inputBorder,
  },
  noticeBody: {
    flex: 1,
  },
  noticeTitle: {
    ...ff(fonts.semibold),
    fontSize: 14,
    color: colors.text,
  },
  noticeDetail: {
    ...ff(fonts.regular),
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  noticeTime: {
    ...ff(fonts.regular),
    fontSize: 10,
    color: colors.textFaint,
    marginTop: 5,
  },
});