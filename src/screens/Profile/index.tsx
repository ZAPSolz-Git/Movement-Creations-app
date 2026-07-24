import { LinearGradient } from "expo-linear-gradient";
import {
  Briefcase,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  ListChecks,
  Lock,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
  UserCircle,
  
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
   Linking, 
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabaseClient";
import { Mail, CheckCircle, XCircle } from "lucide-react-native";
/* ─────────────────────────────────────────
   TYPES + STATIC DATA
───────────────────────────────────────── */

type TabKey = "general" | "management" | "finance" | "password" | "contract" | "companylabels";

interface Label {
  id: string;
  name: string;
}

interface ProfileState {
  legal_entity: string;
  cin_reg_no: string;
  dob_doi: string;
  registered_address: string;
  country: string;
  city: string;
  pincode: string;
  correspondence_address: string;
  correspondence_pincode: string;
 
  name_on_pan: string;
  pan_number: string;
  gst_number: string;
  gst_state: string;
  bank_name: string;
  bank_address: string;
  bank_account_name: string;
  bank_account_number: string;
  ifsc_code: string;
  swift_code: string;
  contract_start_date: string;
  contract_end_date: string;
  contract_status: string;
  plans: string[];
  company_labels: Label[];
  company_labels_locked: boolean;
}

type ChangeRequestField = {
  key: string;
  label: string;
  currentValue: string;
  newValue: string;
  selected: boolean;
};


const INITIAL_PROFILE: ProfileState = {
  legal_entity: "",
  cin_reg_no: "",
  dob_doi: "",
  registered_address: "",
  country: "",
  city: "",
  pincode: "",
  correspondence_address: "",
  correspondence_pincode: "",
  
  name_on_pan: "",
  pan_number: "",
  gst_number: "",
  gst_state: "",
  bank_name: "",
  bank_address: "",
  bank_account_name: "",
  bank_account_number: "",
  ifsc_code: "",
  swift_code: "",
  contract_start_date: "",
  contract_end_date: "",
  contract_status: "",
  plans: ["starter"],
  company_labels: [],
  company_labels_locked: false,
};


const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
const TABS_CONFIG: { value: TabKey; label: string; icon: any }[] = [
  { value: "general", label: "General", icon: UserCircle },
  { value: "management", label: "My Plan", icon: Briefcase },
  { value: "finance", label: "Finance", icon: Landmark },
  { value: "password", label: "Password", icon: Lock },
  { value: "contract", label: "Contract", icon: FileText },
  { value: "companylabels", label: "Music Labels", icon: ListChecks },
];

const GENERAL_FIELDS = [
  { name: "legal_entity", label: "Legal Entity Name" },
  { name: "cin_reg_no", label: "CIN / Registration No.", lockable: true },
  { name: "dob_doi", label: "Date of Birth / Incorporation", lockable: true },
  { name: "registered_address", label: "Registered Address", lockable: true },
  { name: "country", label: "Country", lockable: true },
  { name: "city", label: "City", lockable: true },
  { name: "pincode", label: "Pincode", lockable: true },
  { name: "correspondence_address", label: "Correspondence Address (if different)", lockable: true },
  { name: "correspondence_pincode", label: "Correspondence Pincode" },
] as const;

const TAX_FIELDS = [
 
  { name: "name_on_pan", label: "Name on PAN Card", lockable: true },
  { name: "pan_number", label: "PAN Number", lockable: true },
  { name: "gst_number", label: "GST Number (if applicable)", lockable: true },
  { name: "gst_state", label: "GST State", lockable: true },
] as const;

const BANK_FIELDS = [
  { name: "bank_name", label: "Bank Name", lockable: true },
  { name: "bank_address", label: "Bank Address", lockable: true },
  { name: "bank_account_name", label: "Bank Account Name (Beneficiary)", lockable: true },
  { name: "bank_account_number", label: "Bank Account Number", lockable: true },
  { name: "ifsc_code", label: "IFSC Code", lockable: true },
  { name: "swift_code", label: "SWIFT Code (for international payments)", lockable: true },
] as const;

const CONTRACT_FIELDS = [
  { name: "contract_start_date", label: "Contract Start Date", lockable: true },
  { name: "contract_end_date", label: "Contract End Date", lockable: true },
  { name: "contract_status", label: "Contract Status", lockable: true },
] as const;

const USER_FIELDS = [
  "full_name",
  "contact_number",
  "account_number",
  "bank_name",
  "bank_address",
  "ifsc_code",
  "swift_code",
  "registered_address",
];

const PROFILE_FIELDS = [
  "legal_entity",
  "cin_reg_no",
  "dob_doi",
  "country",
  "city",
  "pincode",
  "correspondence_address",
  "correspondence_pincode",
  "authorized_signatory",

  "name_on_pan",
  "pan_number",
  "gst_number",
  "gst_state",
  "youtube_channel_name",
  "youtube_url",
  "contract_start_date",
  "contract_end_date",
  "contract_status",
  "plans",
  "company_labels",
  "company_labels_locked",
];

const PLAN_LIMITS: Record<string, number> = { starter: 1, pro: 2, labels: 5 };
const ACCENT = "#ec5b13";

export default function 
ProfilePage() {
  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
const [changeFields, setChangeFields] = useState<ChangeRequestField[]>([]);
const [additionalNotes, setAdditionalNotes] = useState("");
const [isSendingRequest, setIsSendingRequest] = useState(false);
  // Password States
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const initializeChangeFields = useCallback(() => {
  const allFields = [
    // General fields - only include ones with lockable: true
    ...GENERAL_FIELDS
      .filter(f => 'lockable' in f && f.lockable === true)
      .map(f => ({ 
        key: f.name, 
        label: f.label, 
        currentValue: (profile as any)[f.name] || "" 
      })),
    // Tax fields - only include ones with lockable: true
    ...TAX_FIELDS
      .filter(f => 'lockable' in f && f.lockable === true)
      .map(f => ({ 
        key: f.name, 
        label: f.label, 
        currentValue: (profile as any)[f.name] || "" 
      })),
    // Bank fields - only include ones with lockable: true
    ...BANK_FIELDS
      .filter(f => 'lockable' in f && f.lockable === true)
      .map(f => ({ 
        key: f.name, 
        label: f.label, 
        currentValue: (profile as any)[f.name] || "" 
      })),
    // Contract fields - only include ones with lockable: true
    ...CONTRACT_FIELDS
      .filter(f => 'lockable' in f && f.lockable === true)
      .map(f => ({ 
        key: f.name, 
        label: f.label, 
        currentValue: (profile as any)[f.name] || "" 
      })),
  ];

  setChangeFields(allFields.map(f => ({
    ...f,
    newValue: "",
    selected: false,
  })));
}, [profile]);
// Add this function to handle sending the request
const handleSendChangeRequest = async () => {
  const selectedFields = changeFields.filter(f => f.selected && f.newValue.trim() !== "");
  
  if (selectedFields.length === 0) {
    Alert.alert("No Changes", "Please select at least one field and provide a new value.");
    return;
  }

  setIsSendingRequest(true);
  
  try {
    const userEmail = user?.email || "Unknown User";
    const changesList = selectedFields.map(f => 
      `• ${f.label}: "${f.currentValue}" → "${f.newValue}"`
    ).join("\n");

    const message = `
Dear Support Team,

I, ${userEmail}, would like to request changes to my profile details.

Fields to be changed:
${changesList}

${additionalNotes ? `\nAdditional Notes:\n${additionalNotes}` : ''}

Please update these details at your earliest convenience.

Regards,
${userEmail}
`;

    // Format the email
    const subject = encodeURIComponent("Request to change my details in profile");
    const body = encodeURIComponent(message);
    const mailtoLink = `mailto:Support@movementcreations.in?subject=${subject}&body=${body}`;

    // Check if device can open mailto links
    const canOpen = await Linking.canOpenURL(mailtoLink);
    
    if (canOpen) {
      await Linking.openURL(mailtoLink);
      Alert.alert(
        "Request Sent", 
        "Your email client has been opened. Please send the email to complete your request.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowRequestModal(false);
              setAdditionalNotes("");
              setChangeFields(prev => prev.map(f => ({ ...f, selected: false, newValue: "" })));
            }
          }
        ]
      );
    } else {
      // Fallback: Copy to clipboard
      const fullMessage = `Subject: ${subject}\n\n${message}`;
      await Clipboard.setString(fullMessage);
      Alert.alert(
        "Email Client Not Found", 
        "Your device doesn't support email links. The request details have been copied to your clipboard. Please manually send an email to Support@movementcreations.in",
        [
          {
            text: "Copy to Clipboard",
            onPress: async () => {
              await Clipboard.setString(fullMessage);
              Alert.alert("Copied!", "Request details copied to clipboard.");
            }
          },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  } catch (error) {
    Alert.alert("Error", "Failed to send request. Please try again.");
  } finally {
    setIsSendingRequest(false);
  }
};


  const fetchProfile = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [{ data: userData }, { data: profileData }] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      const labels = Array.isArray(profileData?.company_labels)
        ? profileData.company_labels
        : [];

      const mergedData = {
        ...INITIAL_PROFILE,
        ...(userData || {}),
        ...(profileData || {}),
        company_labels: labels,
        company_labels_locked: profileData?.company_labels_locked || false,
      };

      setProfile({
        ...mergedData,
        dob_doi: mergedData.dob_doi
          ? String(mergedData.dob_doi).split("T")[0]
          : "",
        contract_start_date: mergedData.contract_start_date
          ? String(mergedData.contract_start_date).split("T")[0]
          : "",
        contract_end_date: mergedData.contract_end_date
          ? String(mergedData.contract_end_date).split("T")[0]
          : "",
        company_labels: labels.map((l: any) =>
  typeof l === "string"
    ? { id: generateId(), name: l }
    : {
        id: l.id || generateId(),
        name: l.name || "",
      }
),
      });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getCurrentUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser && isMounted) {
        setUser(authUser);
        fetchProfile(authUser.id);
      } else {
        setIsLoading(false);
      }
    };
    getCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const getCompanyLimit = () => {
    if (profile.plans?.includes("labels")) return 5;
    if (profile.plans?.includes("pro")) return 2;
    return 1;
  };

  const updateCompanyLabel = (index: number, value: string) => {
    setProfile((prev) => {
      const labels = [...prev.company_labels];
      labels[index] = {
        ...labels[index],
        name: value,
      };
      return { ...prev, company_labels: labels };
    });
  };

  const removeCompanyLabel = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      company_labels: prev.company_labels.filter((_, i) => i !== index),
    }));
  };

  const addCompanyLabel = () => {
    const limit = getCompanyLimit();
    if (profile.company_labels.length >= limit) {
      Alert.alert("Plan Limit", `Your plan allows only ${limit} label(s)`);
      return;
    }
 setProfile((prev) => ({
  ...prev,
  company_labels: [
    ...prev.company_labels,
    {
      id: generateId(),
      name: "",
    },
  ],
}));
  };

  const handleFieldChange = (field: string, lockable: boolean | undefined, value: string) => {
    const current = (profile as any)[field];
    
    // Check if field is lockable and already has a value
    if (lockable && current && String(current).trim() !== "") {
      Alert.alert("Locked field", "This field can only be set once and cannot be modified later.");
      return;
    }
    
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0; i < 12; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPasswordData({
      oldPassword: passwordData.oldPassword,
      newPassword: retVal,
      confirmNewPassword: retVal,
    });
    Alert.alert("Success", "Password generated successfully!");
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert("Too short", "Password must be at least 6 characters long.");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify old password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.oldPassword,
      });

      if (signInError) {
        throw new Error("Old password is incorrect.");
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert("Success", "Password changed successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const sanitize = (obj: any) => {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string" && value.trim() === "")
          cleaned[key] = null;
        else if (Array.isArray(value)) {
          cleaned[key] = value
            .filter((item) =>
              typeof item === "object"
                ? Object.values(item).some((v) => String(v).trim() !== "")
                : String(item).trim() !== "",
            )
            .map((item) =>
              typeof item === "object"
                ? Object.fromEntries(
                    Object.entries(item).map(([k, v]) => [
                      k,
                      typeof v === "string" && v.trim() === "" ? null : v,
                    ])
                  )
                : item
            );
        } else cleaned[key] = value;
      }
      return cleaned;
    };

    try {
      let { data: existingUser } = await supabase
        .from("users")
        .select("id, admin_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingUser) {
        const { data: adminRecord } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (adminRecord) {
          await supabase.from("users").upsert(
            {
              id: user.id,
              email: user.email,
              role: "admin",
              status: "approved",
              admin_id: adminRecord.id,
            },
            { onConflict: "id" }
          );
          existingUser = { id: user.id, admin_id: adminRecord.id };
        } else {
          await supabase.from("users").upsert(
            {
              id: user.id,
              email: user.email,
              role: "user",
              status: "pending",
            },
            { onConflict: "id" }
          );
          existingUser = { id: user.id, admin_id: null };
        }
      }

      const sanitizedProfile = sanitize(profile);
      const userPayload = Object.fromEntries(
        Object.entries(sanitizedProfile).filter(([key]) =>
          USER_FIELDS.includes(key)
        )
      );

      const profilePayload = {
        ...Object.fromEntries(
          Object.entries(sanitizedProfile).filter(([key]) =>
            PROFILE_FIELDS.includes(key)
          )
        ),
        company_labels: profile.company_labels,
        company_labels_locked: false,
        id: user.id,
        admin_id: existingUser?.admin_id || null,
        updated_at: new Date().toISOString(),
      };

      const { error: userUpdateError } = await supabase
        .from("users")
        .update(userPayload)
        .eq("id", user.id);

      if (userUpdateError) throw userUpdateError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(profilePayload, {
          onConflict: "id",
        });

      if (profileError) throw profileError;

      Alert.alert("Success", "Profile saved successfully!");
      setShowConfirmDialog(false);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FFF8F1", "#F8F8FC", "#FFFFFF"]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          <ScrollView
           contentContainerStyle={{
    paddingHorizontal:24,
    paddingTop:32,
    paddingBottom:200,
}}
            showsVerticalScrollIndicator={false}
          >
{/* ── HEADER ── */}
<View className="flex-row items-start justify-between">
  {/* Left Side */}
  <View className="flex-row items-center gap-2 flex-1">
    <UserCircle size={34} color={ACCENT} />
    <Text className="text-3xl font-bold text-slate-900">
      My Profile
    </Text>
  </View>

  {/* Right Side */}
  <TouchableOpacity
    onPress={() => setShowConfirmDialog(true)}
    activeOpacity={0.85}
  >
    <View
      className="flex-row items-center gap-2 rounded-xl px-2 py-2"
      style={{ backgroundColor: ACCENT }}
    >
      <Save size={15} color="#fff" />
      <Text className="text-white text-sm font-semibold">
        Save Profile
      </Text>
    </View>
  </TouchableOpacity>
</View>

<Text className="text-base text-slate-500 mt-1">
  Manage your personal, business, and security information.
</Text>


            {/* ── TABS ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 18 }}>
              {TABS_CONFIG.map((tab) => {
                const active = activeTab === tab.value;
                const Icon = tab.icon;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    onPress={() => setActiveTab(tab.value)}
                    className={`flex-row items-center gap-2 px-5 py-3 rounded-xl ${active ? "" : "bg-slate-100"}`}
                    style={active ? { backgroundColor: ACCENT } : undefined}
                  >
                    <Icon size={18} color={active ? "#fff" : "#64748b"} />
                    <Text className={`text-base font-semibold ${active ? "text-white" : "text-slate-600"}`}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── TAB CONTENT ── */}
            <View className="mt-6 bg-white/70 border border-slate-200 rounded-3xl p-7">
              {activeTab === "general" && (
                <ProfileSection title="General Information" fields={GENERAL_FIELDS} profile={profile} onChange={handleFieldChange} />
              )}

              {activeTab === "finance" && (
                <View className="gap-6">
                  <ProfileSection title="Tax Information" fields={TAX_FIELDS} profile={profile} onChange={handleFieldChange} />
                  <ProfileSection title="Bank Account Details" fields={BANK_FIELDS} profile={profile} onChange={handleFieldChange} />
                </View>
              )}

              {activeTab === "management" && (
  <ManagementTab 
    profile={profile} 
    onChange={handleFieldChange}
    onRequestChanges={() => {
      initializeChangeFields();
      setShowRequestModal(true);
    }}
  />
)}

              {activeTab === "password" && (
                <PasswordTab
                  passwordData={passwordData}
                  onPasswordChange={handlePasswordInputChange}
                  onGeneratePassword={handleGeneratePassword}
                  onChangePassword={handleChangePassword}
                  isChangingPassword={isChangingPassword}
                  showOldPassword={showOldPassword}
                  setShowOldPassword={setShowOldPassword}
                  showNewPassword={showNewPassword}
                  setShowNewPassword={setShowNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                />
              )}

              {activeTab === "contract" && (
                <ProfileSection title="Contract Details" fields={CONTRACT_FIELDS} profile={profile} onChange={handleFieldChange} />
              )}

              {activeTab === "companylabels" && (
                <MusicLabelsTab
                  profile={profile}
                  onAddLabel={addCompanyLabel}
                  onUpdateLabel={updateCompanyLabel}
                  onRemoveLabel={removeCompanyLabel}
                  getCompanyLimit={getCompanyLimit}
                />
              )}
            </View>
          </ScrollView>

          <Footer />
        </View>
      </SafeAreaView>

      {/* ── SAVE CONFIRMATION MODAL ── */}
      <Modal visible={showConfirmDialog} animationType="fade" transparent onRequestClose={() => setShowConfirmDialog(false)}>
        <View className="flex-1 bg-black/30 items-center justify-center px-6">
          <View className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8">
            <Text className="text-lg font-bold text-slate-900 mb-1.5">Confirm Profile Submission</Text>
            <Text className="text-base text-slate-500 mb-5">
              Are you sure you want to save your profile? Make sure all details are correct.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowConfirmDialog(false)}
                className="flex-1 items-center px-4 py-2.5 rounded-xl border border-slate-200"
              >
                <Text className="text-slate-600 text-base font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 items-center px-4 py-2.5 rounded-xl flex-row justify-center gap-2"
                style={{ backgroundColor: ACCENT }}
              >
                {isSaving && <ActivityIndicator size="small" color="#fff" />}
                <Text className="text-white text-base font-semibold">{isSaving ? "Saving..." : "Yes, Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

            {/* ── REQUEST CHANGES MODAL ── */}
<Modal 
  visible={showRequestModal} 
  animationType="slide" 
  transparent 
  onRequestClose={() => setShowRequestModal(false)}
>
  <View className="flex-1 bg-black/50 items-center justify-center px-4">
    <View className="w-full max-w-md max-h-[80%] bg-white rounded-3xl border border-slate-200 shadow-2xl p-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-slate-900">Request Profile Changes</Text>
        <TouchableOpacity onPress={() => setShowRequestModal(false)}>
          <XCircle size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="max-h-[60%]">
        <Text className="text-sm text-slate-600 mb-4">
          Select the fields you want to change and enter the new values:
        </Text>

        {changeFields.map((field, index) => (
          <View key={`${field.key}-${index}`} className="mb-4 p-3 rounded-lg border border-slate-200">
            <View className="flex-row items-center gap-2 mb-2">
              <TouchableOpacity
                onPress={() => {
                  setChangeFields(prev => 
                    prev.map((f, i) => 
                      i === index ? { ...f, selected: !f.selected } : f
                    )
                  );
                }}
                className="w-5 h-5 rounded border flex items-center justify-center"
                style={{ 
                  borderColor: field.selected ? ACCENT : '#cbd5e1',
                  backgroundColor: field.selected ? ACCENT : 'transparent'
                }}
              >
                {field.selected && <CheckCircle size={14} color="#fff" />}
              </TouchableOpacity>
              <Text className="flex-1 text-sm font-medium text-slate-700">
                {field.label}
              </Text>
            </View>
            
            <Text className="text-xs text-slate-500 mb-1.5">
              Current: {field.currentValue || "Not set"}
            </Text>
            
            {field.selected && (
              <TextInput
                value={field.newValue}
                onChangeText={(text) => {
                  setChangeFields(prev => 
                    prev.map((f, i) => 
                      i === index ? { ...f, newValue: text } : f
                    )
                  );
                }}
                placeholder="Enter new value"
                placeholderTextColor="#cbd5e1"
                className="rounded-lg px-3 py-2 text-base border border-slate-300 bg-white text-slate-900"
              />
            )}
          </View>
        ))}

        {/* Additional Notes */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-slate-700 mb-1.5">Additional Notes</Text>
          <TextInput
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Any additional information for the support team..."
            placeholderTextColor="#cbd5e1"
            multiline
            numberOfLines={3}
            className="rounded-lg px-3 py-2 text-base border border-slate-300 bg-white text-slate-900 min-h-[80px]"
          />
        </View>
      </ScrollView>

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={() => setShowRequestModal(false)}
          className="flex-1 items-center px-4 py-2.5 rounded-xl border border-slate-200"
        >
          <Text className="text-slate-600 text-base font-medium">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSendChangeRequest}
          disabled={isSendingRequest}
          className="flex-1 items-center px-4 py-2.5 rounded-xl flex-row justify-center gap-2"
          style={{ backgroundColor: ACCENT }}
        >
          {isSendingRequest ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Mail size={16} color="#fff" />
              <Text className="text-white text-base font-semibold">Send Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────
   SUBCOMPONENTS
───────────────────────────────────────── */
function ProfileField({
  label,
  value,
  lockable,
  readOnly = false, // Add this prop
  onChangeText,
}: {
  label: string;
  value: string;
  lockable?: boolean;
  readOnly?: boolean; // Add this type
  onChangeText: (v: string) => void;
}) {
  const disabled = readOnly || (!!lockable && !!value && value.trim() !== "");
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <Text className="text-base font-medium text-slate-700">{label}</Text>
        {disabled && <Lock size={11} color="#94a3b8" />}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        placeholder={label}
        placeholderTextColor="#cbd5e1"
        className={`rounded-lg px-3 py-2.5 text-base border ${
          disabled ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-white border-slate-300 text-slate-900"
        }`}
      />
      {disabled && (
        <View className="flex-row items-center gap-1 mt-1">
          <Lock size={10} color="#94a3b8" />
          <Text className="text-[11px] text-slate-400">
            {readOnly ? "This field is read-only" : "This field cannot be changed once set"}
          </Text>
        </View>
      )}
    </View>
  );
}
function ProfileSection({
  title,
  fields,
  profile,
  onChange,
}: {
  title: string;
  fields: readonly { name: string; label: string; lockable?: boolean }[];
  profile: ProfileState;
  onChange: (field: string, lockable: boolean | undefined, value: string) => void;
}) {
  return (
    <View>
      <Text className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">{title}</Text>
      {fields.map((f) => (
        <ProfileField
          key={f.name}
          label={f.label}
          value={(profile as any)[f.name] || ""}
          lockable={f.lockable}
          onChangeText={(v) => onChange(f.name, f.lockable, v)}
        />
      ))}
    </View>
  );
}
function ManagementTab({
  profile,
  onChange,
  onRequestChanges, // Add this prop
}: {
  profile: ProfileState;
  onChange: (field: string, lockable: boolean | undefined, value: string) => void;
  onRequestChanges: () => void; // Add this
}) {
  const today = new Date();
  const endDate = profile.contract_end_date ? new Date(profile.contract_end_date) : null;
  let status = "Active";
  let statusStyle = "bg-green-100 text-green-700";
  if (endDate) {
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      status = "Expired";
      statusStyle = "bg-red-100 text-red-700";
    } else if (diffDays <= 30) {
      status = "Close To Expire";
      statusStyle = "bg-amber-100 text-amber-700";
    }
  }

  return (
    <View>
      <Text className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Subscription Details</Text>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
          <Text className="text-xs text-slate-500 mb-2">Current Plan</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {profile.plans.map((p) => (
              <View key={p} className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${ACCENT}1A` }}>
                <Text style={{ color: ACCENT }} className="text-xs font-semibold uppercase">
                  {p}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
          <Text className="text-xs text-slate-500 mb-2">Plan Status</Text>
          <View className={`self-start px-2.5 py-1 rounded-full ${statusStyle.split(" ")[0]}`}>
            <Text className={`text-xs font-semibold ${statusStyle.split(" ")[1]}`}>{status}</Text>
          </View>
        </View>
      </View>

      <ProfileField
        label="Plan Start Date"
        value={profile.contract_start_date}
        readOnly={true}
        onChangeText={(v) => onChange("contract_start_date", false, v)}
      />
      <ProfileField
        label="Plan End Date"
        value={profile.contract_end_date}
        readOnly={true}
        onChangeText={(v) => onChange("contract_end_date", false, v)}
      />

      {/* Add Request Changes Button */}
      <TouchableOpacity
        onPress={onRequestChanges}
        className="flex-row items-center justify-center gap-2 rounded-xl px-5 py-3 mt-4"
        style={{ backgroundColor: ACCENT }}
      >
        <Mail size={18} color="#fff" />
        <Text className="text-white text-base font-semibold">Request Changes</Text>
      </TouchableOpacity>
      <Text className="text-xs text-slate-500 text-center mt-2">
        Request changes to any profile field by emailing support
      </Text>
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-slate-700 mb-1.5">{label}</Text>
      <View className="flex-row items-center border border-slate-300 rounded-lg bg-white pr-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholder={label}
          placeholderTextColor="#cbd5e1"
          className="flex-1 px-3 py-2.5 text-base text-slate-900"
        />
        <TouchableOpacity onPress={onToggleShow}>
          {show ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PasswordTab({
  passwordData,
  onPasswordChange,
  onGeneratePassword,
  onChangePassword,
  isChangingPassword,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: {
  passwordData: { oldPassword: string; newPassword: string; confirmNewPassword: string };
  onPasswordChange: (field: string, value: string) => void;
  onGeneratePassword: () => void;
  onChangePassword: () => void;
  isChangingPassword: boolean;
  showOldPassword: boolean;
  setShowOldPassword: (v: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}) {
  return (
    <View>
      <Text className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Change Password</Text>

      <PasswordField
        label="Current Password"
        value={passwordData.oldPassword}
        onChangeText={(v) => onPasswordChange("oldPassword", v)}
        show={showOldPassword}
        onToggleShow={() => setShowOldPassword(!showOldPassword)}
      />
      <PasswordField
        label="New Password"
        value={passwordData.newPassword}
        onChangeText={(v) => onPasswordChange("newPassword", v)}
        show={showNewPassword}
        onToggleShow={() => setShowNewPassword(!showNewPassword)}
      />
      <PasswordField
        label="Confirm New Password"
        value={passwordData.confirmNewPassword}
        onChangeText={(v) => onPasswordChange("confirmNewPassword", v)}
        show={showConfirmPassword}
        onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <View className="flex-row flex-wrap gap-3 mt-2">
        <TouchableOpacity onPress={onGeneratePassword} className="flex-row items-center gap-1.5 border border-slate-300 rounded-lg px-3.5 py-2.5">
          <RefreshCw size={14} color="#475569" />
          <Text className="text-base font-medium text-slate-600">Generate Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onChangePassword}
          disabled={isChangingPassword}
          className="flex-row items-center gap-1.5 rounded-lg px-3.5 py-2.5"
          style={{ backgroundColor: ACCENT }}
        >
          {isChangingPassword ? <ActivityIndicator size="small" color="#fff" /> : <Save size={14} color="#fff" />}
          <Text className="text-white text-base font-semibold">{isChangingPassword ? "Updating..." : "Change Password"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MusicLabelsTab({
  profile,
  onAddLabel,
  onUpdateLabel,
  onRemoveLabel,
  getCompanyLimit,
}: {
  profile: ProfileState;
  onAddLabel: () => void;
  onUpdateLabel: (index: number, value: string) => void;
  onRemoveLabel: (index: number) => void;
  getCompanyLimit: () => number;
}) {
  const limit = getCompanyLimit();
  const atLimit = profile.company_labels.length >= limit;

  return (
    <View>
      <Text className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Music Labels</Text>
      <Text className="text-xs text-slate-500 mb-3">
        {profile.company_labels.length} of {limit} labels used
      </Text>

      <View className="gap-2.5 mb-3">
        {profile.company_labels.map((label, i) => (
          <View key={label.id} className="flex-row items-center gap-2">
            <TextInput
              value={label.name}
              onChangeText={(v) => onUpdateLabel(i, v)}
              placeholder={`Music Label ${i + 1}`}
              placeholderTextColor="#cbd5e1"
              className="flex-1 rounded-lg px-3 py-2.5 text-base border border-slate-300 bg-white text-slate-900"
            />
            <TouchableOpacity 
              onPress={() => onRemoveLabel(i)}
              className="p-2.5 rounded-lg bg-red-100"
            >
              <Trash2 size={15} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        onPress={onAddLabel} 
        disabled={atLimit}
        className={`flex-row items-center gap-1.5 self-start border rounded-lg px-3.5 py-2.5 ${atLimit ? 'opacity-50' : ''}`}
        style={{ borderColor: ACCENT }}
      >
        <PlusCircle size={14} color={ACCENT} />
        <Text style={{ color: ACCENT }} className="text-base font-medium">
          Add Music Label
        </Text>
      </TouchableOpacity>
      {atLimit && (
        <Text className="text-xs text-slate-500 mt-1">
          You've reached the limit of {limit} labels for your current plan
        </Text>
      )}


    </View>
  );
}