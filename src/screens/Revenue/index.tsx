import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Filter,
  Send,
  Wallet,
  X,
  XCircle,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";

/* ─────────────────────────────────────────
   TYPES + STATIC DATA
   Replace with GET /api/user/revenue and
   GET /api/user/payout-history once wired up.
───────────────────────────────────────── */

type PayoutStatus = "approved" | "pending" | "rejected";
type Role = "user" | "admin";

interface Payout {
  id: string;
  date: string; // ISO
  amount: number;
  status: PayoutStatus;
  notes?: string;
}

interface PlatformRevenue {
  platform: string;
  rawAmount: number;
  color: string; // hex
}

const ROLE: Role = "user";

const STATIC_STATS = {
  totalRevenue: 18450.32,
  lastTransaction: 1240.5,
  outstandingBalance: 4230.1,
};

const STATIC_BREAKDOWN: PlatformRevenue[] = [
  { platform: "Spotify", rawAmount: 9200, color: "#22c55e" },
  { platform: "Apple Music", rawAmount: 5200, color: "#ec4899" },
  { platform: "Amazon Music", rawAmount: 2400, color: "#0ea5e9" },
  { platform: "Others", rawAmount: 1650, color: "#eab308" },
];

const STATIC_PAYOUTS: Payout[] = [
  { id: "p1", date: "2026-07-02", amount: 620.0, status: "approved", notes: "Monthly payout" },
  { id: "p2", date: "2026-06-14", amount: 340.5, status: "pending", notes: "Requested" },
  { id: "p3", date: "2026-06-01", amount: 980.0, status: "approved", notes: "Monthly payout" },
  { id: "p4", date: "2026-05-19", amount: 210.0, status: "rejected", notes: "Insufficient info" },
  { id: "p5", date: "2025-12-08", amount: 1150.75, status: "approved", notes: "Monthly payout" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const YEAR_OPTIONS = ["2024", "2025", "2026", "2027"];

const ACCENT_FROM = "#ca8a04"; // yellow-600
const ACCENT_TO = "#ec5b13";

const STATUS_STYLES: Record<PayoutStatus, { bg: string; text: string; icon: any; label: string }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2, label: "Approved" },
  pending: { bg: "bg-amber-50", text: "text-amber-600", icon: AlertCircle, label: "Pending" },
  rejected: { bg: "bg-red-50", text: "text-red-600", icon: XCircle, label: "Rejected" },
};

export default function RevenuePage() {
  const now = new Date();
  const [month, setMonth] = useState(MONTH_NAMES[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const [payouts, setPayouts] = useState<Payout[]>(STATIC_PAYOUTS);
  const [outstandingBalance, setOutstandingBalance] = useState(STATIC_STATS.outstandingBalance);

  const [showDialog, setShowDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const d = new Date(p.date);
      const payoutMonth = MONTH_NAMES[d.getMonth()];
      const payoutYear = String(d.getFullYear());
      return payoutMonth === month && payoutYear === year;
    });
  }, [payouts, month, year]);

  const breakdownTotal = STATIC_BREAKDOWN.reduce((sum, p) => sum + p.rawAmount, 0);

  const handleWithdrawConfirm = () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > outstandingBalance) return;
    setOutstandingBalance((b) => b - amt);
    setPayouts((prev) => [
      { id: `p${Date.now()}`, date: new Date().toISOString(), amount: amt, status: "pending", notes: "Requested" },
      ...prev,
    ]);
    setWithdrawAmount("");
    setShowDialog(false);
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${STATIC_STATS.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "#059669",
    },
    {
      title: "Last Transaction",
      value: `$${STATIC_STATS.lastTransaction.toFixed(2)}`,
      icon: CalendarDays,
      color: "#6366f1",
    },
    {
      title: ROLE === "user" ? "Outstanding Balance" : "Outstanding Commission",
      value: `$${outstandingBalance.toFixed(2)}`,
      icon: ROLE === "user" ? Clock : Wallet,
      color: ROLE === "user" ? "#059669" : "#f59e0b",
      highlight: true,
      subtitle: ROLE === "user" ? "Available for withdrawal." : "Commission you can withdraw.",
    },
  ];

  return (
    <LinearGradient colors={["#F5F3FF", "#F8F8FC", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 170 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── HEADER ── */}
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-2xl font-bold text-slate-900">Revenue Overview</Text>
                <Text className="text-sm text-slate-400 mt-0.5">
                  Track all collected revenue from music platforms.
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setShowDialog(true)} activeOpacity={0.85} className="mt-4 self-start">
              <LinearGradient
                colors={[ACCENT_FROM, ACCENT_TO]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
              >
                <View className="flex-row items-center gap-2">
                  <Send size={16} color="#fff" />
                  <Text className="text-white text-sm font-semibold">
                    {ROLE === "user" ? "Request Payout" : "Withdraw Commission"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* ── STAT CARDS ── */}
            <View className="gap-3 mt-6">
              {statCards.map((s) => (
                <StatCard key={s.title} {...s} />
              ))}
            </View>

            {/* ── PAYOUT HISTORY ── */}
            <View className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <View className="px-5 pt-4 pb-4 border-b border-slate-100">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-indigo-100 items-center justify-center">
                    <Filter size={16} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-slate-800">Payout History</Text>
                    <Text className="text-xs text-slate-400">Filter by month and year</Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mt-3">
                  <SelectField label={month} onPress={() => setMonthPickerOpen(true)} />
                  <SelectField label={year} onPress={() => setYearPickerOpen(true)} />
                </View>
              </View>

              <View className="p-3">
                {filteredPayouts.length > 0 ? (
                  <View className="gap-2">
                    {filteredPayouts.map((payout) => (
                      <PayoutRow key={payout.id} payout={payout} />
                    ))}
                  </View>
                ) : (
                  <View className="items-center justify-center py-12 gap-2">
                    <AlertCircle size={28} color="#cbd5e1" />
                    <Text className="text-sm text-slate-400">
                      No payouts found for {month} {year}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── REVENUE BREAKDOWN ── */}
            <View className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <Text className="text-base font-semibold text-slate-800 mb-1">
                Revenue Breakdown by Platform
              </Text>
              <Text className="text-xs text-slate-400 mb-4">
                Earnings distributed across streaming services
              </Text>
              <View className="gap-4">
                {STATIC_BREAKDOWN.map((item) => (
                  <PlatformBar
                    key={item.platform}
                    platform={item.platform}
                    amount={item.rawAmount}
                    percentage={(item.rawAmount / breakdownTotal) * 100}
                    color={item.color}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>

      {/* ── WITHDRAW DIALOG ── */}
      <WithdrawDialog
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        role={ROLE}
        balance={outstandingBalance}
        amount={withdrawAmount}
        setAmount={setWithdrawAmount}
        onConfirm={handleWithdrawConfirm}
      />

      {/* ── MONTH / YEAR PICKERS ── */}
      <PickerModal
        visible={monthPickerOpen}
        title="Select Month"
        options={MONTH_NAMES}
        selected={month}
        onSelect={(v) => setMonth(v)}
        onClose={() => setMonthPickerOpen(false)}
      />
      <PickerModal
        visible={yearPickerOpen}
        title="Select Year"
        options={YEAR_OPTIONS}
        selected={year}
        onSelect={(v) => setYear(v)}
        onClose={() => setYearPickerOpen(false)}
      />
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────
   SUBCOMPONENTS
───────────────────────────────────────── */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  highlight,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  highlight?: boolean;
  subtitle?: string;
}) {
  if (highlight) {
    return (
      <LinearGradient
        colors={["#ecfdf5", "#f0fdfa"]}
        style={{ borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#a7f3d0" }}
      >
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {title}
            </Text>
            <Text className="text-2xl font-bold text-emerald-700">{value}</Text>
            {!!subtitle && <Text className="text-xs text-emerald-500 mt-1">{subtitle}</Text>}
          </View>
          <View className="w-11 h-11 rounded-xl bg-emerald-100 items-center justify-center">
            <Icon size={20} color={color} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-[18px] shadow-sm">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </Text>
          <Text className="text-2xl font-bold text-slate-800">{value}</Text>
        </View>
        <View className="w-11 h-11 rounded-xl bg-slate-100 items-center justify-center">
          <Icon size={20} color={color} />
        </View>
      </View>
    </View>
  );
}

function SelectField({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
    >
      <Text className="text-xs text-slate-700 font-medium">{label}</Text>
      <ChevronDown size={14} color="#94a3b8" />
    </TouchableOpacity>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <Text className="text-base font-bold text-slate-900">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                className={`px-4 py-3 rounded-lg mb-1 ${selected === opt ? "bg-indigo-50" : ""}`}
              >
                <Text
                  className={`text-sm ${selected === opt ? "text-indigo-600 font-semibold" : "text-slate-700"}`}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PayoutRow({ payout }: { payout: Payout }) {
  const s = STATUS_STYLES[payout.status];
  const Icon = s.icon;
  const d = new Date(payout.date);
  const dateLabel = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
      <View className="flex-1">
        <Text className="text-sm text-slate-700">{dateLabel}</Text>
        <Text className="text-xs text-slate-400 mt-0.5">{payout.notes || "—"}</Text>
      </View>
      <Text className="text-sm font-semibold text-slate-800 mr-3">${payout.amount.toFixed(2)}</Text>
      <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${s.bg}`}>
        <Icon size={12} color={s.text.includes("emerald") ? "#059669" : s.text.includes("amber") ? "#d97706" : "#dc2626"} />
        <Text className={`text-xs font-semibold ${s.text}`}>{s.label}</Text>
      </View>
    </View>
  );
}

function PlatformBar({
  platform,
  amount,
  percentage,
  color,
}: {
  platform: string;
  amount: number;
  percentage: number;
  color: string;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 700,
      useNativeDriver: false,
    }).start();
  });

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
          <Text className="text-sm font-semibold text-slate-700">{platform}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-slate-400">{percentage.toFixed(1)}%</Text>
          <Text className="text-sm font-bold text-slate-800">${amount.toFixed(2)}</Text>
        </View>
      </View>
      <View className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 999,
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>
    </View>
  );
}

function WithdrawDialog({
  visible,
  onClose,
  role,
  balance,
  amount,
  setAmount,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  role: Role;
  balance: number;
  amount: string;
  setAmount: (v: string) => void;
  onConfirm: () => void;
}) {
  const remaining = balance - (Number(amount) || 0);
  const isValid = !!amount && Number(amount) > 0 && remaining >= 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center">
              <Send size={18} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-800">
                {role === "user" ? "Withdraw Earnings" : "Withdraw Commission"}
              </Text>
              <Text className="text-xs text-slate-400">Funds processed within 3–5 days</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <View className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
            <Text className="text-xs text-slate-400 mb-1">
              {role === "user" ? "Available Balance" : "Total Commission"}
            </Text>
            <Text className="text-2xl font-bold text-slate-800">${balance.toFixed(2)}</Text>
          </View>

          {/* Input */}
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Amount to Withdraw</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-3 mb-4">
            <Text className="text-slate-400 font-semibold mr-1">$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#cbd5e1"
              className="flex-1 py-2.5 text-slate-800 text-sm"
            />
          </View>

          {/* Remaining */}
          <View
            className={`flex-row items-center justify-between rounded-lg px-4 py-2.5 mb-5 border ${
              remaining < 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <Text className={`text-sm font-medium ${remaining < 0 ? "text-red-600" : "text-emerald-700"}`}>
              Remaining after withdrawal
            </Text>
            <Text className={`text-sm font-medium ${remaining < 0 ? "text-red-600" : "text-emerald-700"}`}>
              ${remaining.toFixed(2)}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center px-4 py-2.5 rounded-xl border border-slate-200"
            >
              <Text className="text-slate-600 text-sm font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={!isValid}
              className="flex-1"
              activeOpacity={0.85}
            >
              {isValid ? (
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, paddingVertical: 10, alignItems: "center" }}
                >
                  <Text className="text-white text-sm font-semibold">Confirm</Text>
                </LinearGradient>
              ) : (
                <View className="rounded-xl py-2.5 items-center bg-slate-300">
                  <Text className="text-white text-sm font-semibold">Confirm</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}