import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  PlusCircle,
  Search,
  Eye,
  MessageSquare,
  Send,
  Headphones,
  Inbox,
  XCircle,
  CheckCircle,
  Trash2,
  X,
} from "lucide-react-native";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import Footer from "../../components/Footer";
import Toast from "react-native-toast-message";

// ── Brand tokens (matches web ticket module) ──
const ACCENT = "#ec5b13";
const ACCENT_DARK = "#d44f0f";
const BG = "#f8f9fa";

type Priority = "low" | "medium" | "high" | "urgent";
type Status = "Open" | "In Progress" | "Resolved" | "Rejected";

type Reply = {
  message: string;
  sender_role: "admin" | "user";
  created_at?: string;
};

type Ticket = {
  id: string;
  subject: string;
  description: string;
  priority: Priority;
  status: Status;
  created_at?: string;
  updated_at?: string;
  user_email?: string;
  user_name?: string;
  replies?: Reply[];
};

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; dot: string }> = {
  low: { bg: "#ecfdf5", text: "#065f46", dot: "#10b981" },
  medium: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
  high: { bg: "#fff7ed", text: "#9a3412", dot: "#f97316" },
  urgent: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
};

const STATUS_STYLES: Record<Status, { bg: string; text: string; label: string }> = {
  Open: { bg: "#fefce8", text: "#854d0e", label: "Pending" },
  "In Progress": { bg: "#eff6ff", text: "#1e3a8a", label: "In Progress" },
  Rejected: { bg: "#fef2f2", text: "#991b1b", label: "Rejected" },
  Resolved: { bg: "#f0fdf4", text: "#166534", label: "Resolved" },
};

const STATUS_FILTERS: Array<Status | "all"> = ["all", "Open", "In Progress", "Resolved", "Rejected"];
const PRIORITY_FILTERS: Array<Priority | "all"> = ["all", "low", "medium", "high", "urgent"];

const initialForm = { subject: "", description: "", priority: "medium" as Priority };

export default function SupportScreen() {
  const { user, profile } = useAuth() as any;
  const role = profile?.role || "user";
  const isAdmin = role === "admin" || role === "super-admin";

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [createVisible, setCreateVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch tickets ──
  const fetchTickets = useCallback(async () => {
    try {
      const url = isAdmin ? "/api/admin/tickets" : "/api/tickets";
      const { data } = await apiClient.get(url);
      setAllTickets(data || []);
    } catch (err) {
      try {
        const { data } = await apiClient.get("/api/tickets");
        setAllTickets(data || []);
      } catch {
        Toast.show({ type: "error", text1: "Couldn't load tickets" });
        setAllTickets([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  // ── Apply filters ──
  useEffect(() => {
    let filtered = [...allTickets];
    if (statusFilter !== "all") filtered = filtered.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") filtered = filtered.filter((t) => t.priority === priorityFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.subject?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
      );
    }
    setFilteredTickets(filtered);
  }, [allTickets, statusFilter, priorityFilter, searchTerm]);

  // ── Create ticket ──
  const handleCreateTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      Toast.show({ type: "error", text1: "Subject and description are required" });
      return;
    }
    if (!user) {
      Toast.show({ type: "error", text1: "You need to be logged in" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/tickets", {
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        status: "Open",
        user_id: user.id,
        message: "",
        sender_role: "user",
      });
      Toast.show({ type: "success", text1: "Ticket submitted" });
      setCreateVisible(false);
      setForm(initialForm);
      fetchTickets();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed to create ticket",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplies(ticket.replies || []);
    setViewVisible(true);
  };

  // ── Add reply ──
  const handleAddReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const senderRole = isAdmin ? "admin" : "user";
      const url = isAdmin
        ? `/api/admin/tickets/${selectedTicket.id}/reply`
        : `/api/tickets/${selectedTicket.id}/reply`;
      await apiClient.put(url, { message: newReply.trim(), status: selectedTicket.status });
      setReplies((prev) => [
        ...prev,
        { message: newReply.trim(), sender_role: senderRole, created_at: new Date().toISOString() },
      ]);
      setNewReply("");
      Toast.show({ type: "success", text1: "Reply sent" });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed to send reply",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ticket ──
  const confirmDelete = (ticketId: string) => {
    Alert.alert("Delete ticket?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteTicket(ticketId) },
    ]);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setDeletingId(ticketId);
    try {
      try {
        await apiClient.delete(`/api/admin/tickets/${ticketId}`);
      } catch {
        await apiClient.delete(`/api/tickets/${ticketId}`);
      }
      Toast.show({ type: "success", text1: "Ticket deleted" });
      if (selectedTicket?.id === ticketId) setViewVisible(false);
      setAllTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed to delete ticket",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Update status ──
  const handleStatusChange = async (ticketId: string, newStatus: Status) => {
    try {
      const url = isAdmin ? `/api/admin/tickets/${ticketId}/status` : `/api/tickets/${ticketId}/status`;
      await apiClient.put(url, { status: newStatus });
      Toast.show({ type: "success", text1: `Marked as ${newStatus}` });
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
      fetchTickets();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Failed to update status",
      });
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };
  const formatDateTime = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pageTitle = isAdmin ? "Admin Support Tickets" : "Support Tickets";
  const pageDescription = isAdmin
    ? "Manage and reply to user support tickets."
    : "View your tickets and track responses.";

  // ── Render a ticket card ──
  const renderTicket = ({ item }: { item: Ticket }) => {
    const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.Open;
    const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium;
    const isDeleting = deletingId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openTicket(item)}
        style={{ opacity: isDeleting ? 0.5 : 1 }}
        className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
      >
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-base font-bold text-black flex-1 pr-2" numberOfLines={1}>
            {item.subject}
          </Text>
          <View style={{ backgroundColor: statusStyle.bg }} className="px-2.5 py-1 rounded-md">
            <Text style={{ color: statusStyle.text }} className="text-xs font-bold">
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text className="text-sm text-gray-500 mb-3" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row items-center justify-between">
          <View style={{ backgroundColor: priorityStyle.bg }} className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-md">
            <View style={{ backgroundColor: priorityStyle.dot }} className="w-1.5 h-1.5 rounded-full" />
            <Text style={{ color: priorityStyle.text }} className="text-xs font-bold capitalize">
              {item.priority}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 font-medium">
            {formatDate(item.updated_at || item.created_at)}
          </Text>
        </View>

        {isAdmin && (item.user_email || item.user_name) && (
          <Text className="text-xs text-gray-400 mt-2">{item.user_email || item.user_name}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ flex: 1, paddingBottom: 120 }}>
      {/* ── Header ── */}
      <View className="bg-white border-b border-gray-200 px-5 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3 flex-1">
            <View style={{ backgroundColor: ACCENT }} className="w-11 h-11 rounded-xl items-center justify-center">
              <Headphones size={22} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-black" numberOfLines={1}>
                {pageTitle}
              </Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {pageDescription}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setCreateVisible(true)}
            style={{ backgroundColor: ACCENT }}
            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl"
          >
            <PlusCircle size={16} color="#fff" />
            <Text className="text-white text-sm font-bold">New</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 mb-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search by subject..."
            placeholderTextColor="#9ca3af"
            className="flex-1 px-2 py-2.5 text-sm text-black"
          />
        </View>

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s;
              const label = s === "all" ? "All Status" : STATUS_STYLES[s]?.label || s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatusFilter(s)}
                  style={{ backgroundColor: active ? ACCENT : "#f3f4f6" }}
                  className="px-3.5 py-2 rounded-full"
                >
                  <Text className={`text-xs font-bold ${active ? "text-white" : "text-gray-600"}`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Priority filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {PRIORITY_FILTERS.map((p) => {
              const active = priorityFilter === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriorityFilter(p)}
                  style={{ backgroundColor: active ? "#111827" : "#f3f4f6" }}
                  className="px-3.5 py-2 rounded-full"
                >
                  <Text className={`text-xs font-bold capitalize ${active ? "text-white" : "text-gray-600"}`}>
                    {p === "all" ? "All Priority" : p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── Ticket list ── */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={ACCENT} />
          <Text className="text-sm text-gray-500">Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <Inbox size={28} color="#d1d5db" />
              </View>
              <Text className="text-base font-bold text-black">No tickets found</Text>
              <Text className="text-sm text-gray-400">Create a new ticket or adjust filters</Text>
            </View>
          }
        />
      )}

      {/* ── Create ticket modal ── */}
      <Modal visible={createVisible} animationType="slide" transparent onRequestClose={() => setCreateVisible(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className="bg-white rounded-t-3xl max-h-[88%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                <View>
                  <Text className="text-lg font-bold text-black">Create New Ticket</Text>
                  <Text className="text-xs text-gray-500">Describe your issue in detail</Text>
                </View>
                <TouchableOpacity onPress={() => setCreateVisible(false)} className="p-1">
                  <X size={22} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView className="px-5 py-5" keyboardShouldPersistTaps="handled">
                <Text className="text-sm font-bold text-black mb-1.5">Subject *</Text>
                <TextInput
                  value={form.subject}
                  onChangeText={(v) => setForm((p) => ({ ...p, subject: v }))}
                  placeholder="Brief description of your issue"
                  placeholderTextColor="#9ca3af"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-black mb-4"
                />

                <Text className="text-sm font-bold text-black mb-1.5">Description *</Text>
                <TextInput
                  value={form.description}
                  onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                  placeholder="Provide full details about your issue..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-black mb-4 h-28"
                />

                <Text className="text-sm font-bold text-black mb-1.5">Priority</Text>
                <View className="flex-row gap-2 mb-6">
                  {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => {
                    const active = form.priority === p;
                    const style = PRIORITY_STYLES[p];
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setForm((prev) => ({ ...prev, priority: p }))}
                        style={{ backgroundColor: active ? style.dot : "#f3f4f6" }}
                        className="flex-1 items-center py-2.5 rounded-lg"
                      >
                        <Text className={`text-xs font-bold capitalize ${active ? "text-white" : "text-gray-600"}`}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="flex-row gap-3 pb-8">
                  <TouchableOpacity
                    onPress={() => setCreateVisible(false)}
                    className="flex-1 items-center py-3 rounded-xl border border-gray-300"
                  >
                    <Text className="text-sm font-bold text-black">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateTicket}
                    disabled={isSubmitting}
                    style={{ backgroundColor: ACCENT, opacity: isSubmitting ? 0.6 : 1 }}
                    className="flex-1 items-center py-3 rounded-xl flex-row justify-center gap-2"
                  >
                    {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
                    <Text className="text-sm font-bold text-white">
                      {isSubmitting ? "Submitting..." : "Submit Ticket"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── View / reply ticket modal ── */}
      <Modal visible={viewVisible} animationType="slide" transparent onRequestClose={() => setViewVisible(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ maxHeight: "90%" }}>
            <View className="bg-white rounded-t-3xl" style={{ maxHeight: "100%" }}>
              {/* Header */}
              <View className="px-5 py-4 border-b border-gray-200 flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-bold text-black" numberOfLines={1}>
                    {selectedTicket?.subject || "Ticket Details"}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {selectedTicket?.id ? `Ticket #${selectedTicket.id.slice(0, 8)}...` : ""}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {selectedTicket && (
                    <View
                      style={{ backgroundColor: STATUS_STYLES[selectedTicket.status]?.bg }}
                      className="px-2.5 py-1.5 rounded-lg"
                    >
                      <Text
                        style={{ color: STATUS_STYLES[selectedTicket.status]?.text }}
                        className="text-xs font-bold"
                      >
                        {STATUS_STYLES[selectedTicket.status]?.label}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => selectedTicket && confirmDelete(selectedTicket.id)}
                    disabled={deletingId === selectedTicket?.id}
                    className="bg-red-500 p-2 rounded-lg"
                  >
                    {deletingId === selectedTicket?.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Trash2 size={15} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setViewVisible(false)} className="p-1">
                    <X size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView className="px-5" keyboardShouldPersistTaps="handled">
                {/* Description */}
                <View className="py-4 border-b border-gray-100">
                  <Text className="text-xs font-bold uppercase text-gray-500 mb-2">Description</Text>
                  <View className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <Text className="text-sm text-black">
                      {selectedTicket?.description || "No description provided"}
                    </Text>
                  </View>
                  <View className="flex-row gap-4 mt-3">
                    <Text className="text-xs text-gray-400">
                      Created: {formatDateTime(selectedTicket?.created_at)}
                    </Text>
                    {selectedTicket?.updated_at && (
                      <Text className="text-xs text-gray-400">
                        Updated: {formatDateTime(selectedTicket?.updated_at)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Replies */}
                <View className="py-4">
                  <Text className="text-xs font-bold uppercase text-gray-500 mb-3">
                    Replies ({replies.length})
                  </Text>

                  {replies.length > 0 ? (
                    <View className="gap-3 mb-5">
                      {replies.map((reply, index) => {
                        const fromAdmin = reply.sender_role === "admin";
                        return (
                          <View key={index} className={`flex-row ${fromAdmin ? "justify-start" : "justify-end"}`}>
                            <View
                              style={{
                                backgroundColor: fromAdmin ? "#f3f4f6" : "#ec5b130d",
                                maxWidth: "85%",
                              }}
                              className="p-3 rounded-xl border border-gray-100"
                            >
                              <View className="flex-row items-center justify-between mb-1 gap-3">
                                <Text className="text-[10px] font-bold uppercase text-gray-500">
                                  {fromAdmin ? "Support Team" : "You"}
                                </Text>
                                {reply.created_at && (
                                  <Text className="text-[10px] text-gray-400">
                                    {formatDateTime(reply.created_at)}
                                  </Text>
                                )}
                              </View>
                              <Text className="text-sm text-black">{reply.message}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View className="items-center py-10 mb-5 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <MessageSquare size={32} color="#d1d5db" />
                      <Text className="text-sm font-semibold text-black mt-2">No replies yet</Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {isAdmin ? "Reply to help the user" : "Admin will respond soon"}
                      </Text>
                    </View>
                  )}

                  {/* Reply form or resolved/rejected banner */}
                  {selectedTicket?.status !== "Resolved" && selectedTicket?.status !== "Rejected" ? (
                    <View className="border-t border-gray-200 pt-4 pb-8">
                      <Text className="text-sm font-bold text-black mb-2">
                        {isAdmin ? "Send Response" : "Add Reply"}
                      </Text>
                      <TextInput
                        value={newReply}
                        onChangeText={setNewReply}
                        placeholder={isAdmin ? "Type your response..." : "Type your reply here..."}
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-black h-24"
                      />

                      {isAdmin && selectedTicket?.status === "Open" && (
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            onPress={() => selectedTicket && handleStatusChange(selectedTicket.id, "Resolved")}
                            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200"
                          >
                            <CheckCircle size={14} color="#047857" />
                            <Text className="text-xs font-bold text-emerald-700">Resolve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => selectedTicket && handleStatusChange(selectedTicket.id, "Rejected")}
                            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200"
                          >
                            <XCircle size={14} color="#b91c1c" />
                            <Text className="text-xs font-bold text-red-700">Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={handleAddReply}
                        disabled={isSubmitting || !newReply.trim()}
                        style={{ backgroundColor: ACCENT, opacity: isSubmitting || !newReply.trim() ? 0.5 : 1 }}
                        className="flex-row items-center justify-center gap-2 mt-3 py-3 rounded-lg"
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Send size={16} color="#fff" />
                            <Text className="text-sm font-bold text-white">Send Reply</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor:
                          selectedTicket?.status === "Resolved" ? "#f0fdf4" : "#fef2f2",
                      }}
                      className="flex-row items-center justify-center gap-2 py-3 rounded-lg mb-8"
                    >
                      {selectedTicket?.status === "Resolved" ? (
                        <CheckCircle size={16} color="#166534" />
                      ) : (
                        <XCircle size={16} color="#991b1b" />
                      )}
                      <Text
                        style={{
                          color: selectedTicket?.status === "Resolved" ? "#166534" : "#991b1b",
                        }}
                        className="text-sm font-bold"
                      >
                        {selectedTicket?.status === "Resolved" ? "Ticket resolved." : "Ticket rejected."}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      </View>

      <Footer />
    </View>
  );
}