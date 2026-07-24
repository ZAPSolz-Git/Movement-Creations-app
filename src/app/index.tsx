// src/app/login.tsx
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useAuth } from "@/contexts/SupabaseAuthContext";
import { BiometricService } from "@/services/BiometricService";

interface FormErrors {
  email?: string;
  password?: string;
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Note: Animated.View/Animated.Text are intentionally never given a
// `className` here — NativeWind has no cssInterop registered for
// react-native-reanimated in this project, so className on those
// components is silently dropped. Animated.View is only ever used as a
// bare transform/opacity shell around a normally-styled plain View.
const shake = (sv: SharedValue<number>) => {
  sv.value = withSequence(
    withTiming(-10, { duration: 55 }),
    withTiming(10, { duration: 55 }),
    withTiming(-8, { duration: 55 }),
    withTiming(8, { duration: 55 }),
    withTiming(0, { duration: 55 }),
  );
};

const pressIn = (sv: SharedValue<number>) => {
  sv.value = withTiming(0.97, { duration: 100 });
};

const pressOut = (sv: SharedValue<number>) => {
  sv.value = withSpring(1, { damping: 12, stiffness: 200 });
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Biometric state ──
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const {
    signIn,
    needsBiometricUnlock,
    biometricEnabled,
    biometricAvailability,
    setHoldAutoRedirect,
    checkBiometricAvailability,
    enableBiometric,
    authenticateBiometric,
  } = useAuth();

  const logoScale = useSharedValue(1);
  const emailShake = useSharedValue(0);
  const passwordShake = useSharedValue(0);
  const cardShake = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1800 }),
        withTiming(1, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, [logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardShake.value }],
  }));
  const emailShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: emailShake.value }],
  }));
  const passwordShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: passwordShake.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const bioKind = biometricAvailability?.primaryType ?? "none";
  const bioIconName = bioKind === "fingerprint" ? "fingerprint" : "face";
  const biometricLabel = BiometricService.labelFor(bioKind);
  const showLockedView = needsBiometricUnlock && !showPasswordForm;

  const handleBiometricUnlock = async () => {
    setBiometricBusy(true);
    setBiometricError(null);
    const result = await authenticateBiometric(`Unlock with ${biometricLabel}`);
    setBiometricBusy(false);
    if (!result.success && !result.cancelled) {
      setBiometricError(result.message ?? "Authentication failed.");
    }
    // On success, context flips needsBiometricUnlock off and the root
    // layout's auth gate takes over navigation to /home.
  };

  useEffect(() => {
    if (needsBiometricUnlock && !autoTriggered.current) {
      autoTriggered.current = true;
      handleBiometricUnlock();
    }
    if (!needsBiometricUnlock) {
      autoTriggered.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsBiometricUnlock]);

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address";
    }

    if (!password) {
      next.password = "Secret key is required";
    }

    if (next.email) shake(emailShake);
    if (next.password) shake(passwordShake);

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    // Held for the whole post-login window so the root layout's own
    // auto-redirect-to-/home effect can't race ahead of the "Enable Face ID?"
    // modal the instant `user` becomes truthy — see SupabaseAuthContext.
    setHoldAutoRedirect(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      setServerError(error);
      shake(cardShake);
      setHoldAutoRedirect(false);
      return;
    }

    if (!biometricEnabled) {
      const availability = await checkBiometricAvailability();
      if (availability.available) {
        setShowEnableModal(true);
        return; // still held — released in handleEnableBiometric/handleSkipBiometric
      }
    }

    setHoldAutoRedirect(false);
    router.replace("/home");
  };

  const handleEnableBiometric = async () => {
    setBiometricBusy(true);
    await enableBiometric();
    setBiometricBusy(false);
    setShowEnableModal(false);
    setHoldAutoRedirect(false);
    router.replace("/home");
  };

  const handleSkipBiometric = () => {
    setShowEnableModal(false);
    setHoldAutoRedirect(false);
    router.replace("/home");
  };

  const emailBorderClass = errors.email
    ? "border-red-400 bg-red-50"
    : emailFocused
      ? "border-violet-400"
      : "border-gray-200";

  const passwordBorderClass = errors.password
    ? "border-red-400 bg-red-50"
    : passwordFocused
      ? "border-violet-400"
      : "border-gray-200";

  return (
    <LinearGradient
      colors={["#F5EEFF", "#F8F8FC", "#FFFFFF"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 80}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 32,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-md">
              <Animated.View entering={FadeInDown.duration(500)}>
                <View className="items-center">
                  <Animated.View style={logoStyle}>
                    <Image
                      source={require("../../assets/images/logo.png")}
                      style={{ width: 110, height: 110 }}
                      resizeMode="contain"
                    />
                  </Animated.View>

                  <View className="mt-1 flex-row items-center gap-1.5">
                    <Feather name="lock" size={13} color="#8b5cf6" />
                    <Text className="text-base text-gray-500">
                       Studio Login
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(120).duration(500)}
                style={cardStyle}
              >
                <View className="mt-8 w-full rounded-3xl bg-white p-6 shadow-lg">
                  {showLockedView ? (
                    <View className="items-center py-4">
                      <View className="h-20 w-20 items-center justify-center rounded-full bg-violet-50">
                        <MaterialIcons
                          name={bioIconName}
                          size={36}
                          color="#7c3aed"
                        />
                      </View>

                      <Text className="mt-5 text-lg font-semibold text-gray-800">
                        Welcome back
                      </Text>
                      <Text className="mt-1 text-center text-sm text-gray-500">
                        Use {biometricLabel} to unlock your studio account
                      </Text>

                      {biometricError ? (
                        <View className="mt-4 w-full flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                          <Feather
                            name="alert-circle"
                            size={16}
                            color="#dc2626"
                          />
                          <Text className="flex-1 text-sm font-medium text-red-600">
                            {biometricError}
                          </Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        onPress={handleBiometricUnlock}
                        disabled={biometricBusy}
                        activeOpacity={0.9}
                        className="mt-6 h-14 w-full flex-row items-center justify-center rounded-xl bg-violet-600 shadow"
                      >
                        {biometricBusy ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <View className="flex-row items-center gap-2">
                            <MaterialIcons
                              name={bioIconName}
                              size={20}
                              color="#fff"
                            />
                            <Text className="text-base font-bold text-white">
                              Unlock with {biometricLabel}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowPasswordForm(true)}
                        disabled={biometricBusy}
                        className="mt-4"
                      >
                        <Text className="font-semibold text-violet-600">
                          Use email & password instead
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {serverError ? (
                        <Animated.View
                          entering={FadeInDown.duration(250)}
                          exiting={FadeOutUp.duration(200)}
                        >
                          <View className="mb-5 flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <Feather
                              name="alert-circle"
                              size={16}
                              color="#dc2626"
                            />
                            <Text className="flex-1 text-sm font-medium text-red-600">
                              {serverError}
                            </Text>
                          </View>
                        </Animated.View>
                      ) : null}

                      <Text className="mb-2 font-semibold text-gray-700">
                        Artist Email
                      </Text>

                      <Animated.View style={emailShakeStyle}>
                        <View
                          className={`flex-row items-center rounded-xl border px-4 ${emailBorderClass}`}
                        >
                          <MaterialIcons
                            name="alternate-email"
                            size={20}
                            color={errors.email ? "#ef4444" : "#888"}
                          />

                          <TextInput
                            className="ml-3 flex-1 py-4 text-gray-900"
                            placeholder="artist@movementcreations.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={(v) => {
                              setEmail(v);
                              if (errors.email)
                                setErrors((e) => ({ ...e, email: undefined }));
                            }}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="emailAddress"
                            editable={!loading}
                          />
                        </View>
                      </Animated.View>
                      {errors.email ? (
                        <Text className="mb-4 mt-1 ml-1 text-xs text-red-500">
                          {errors.email}
                        </Text>
                      ) : (
                        <View className="mb-5" />
                      )}

                      <View className="mb-2 flex-row items-center justify-between">
                        <Text className="font-semibold text-gray-700">
                          Secret Key
                        </Text>

                        <TouchableOpacity disabled={loading}>
                          <Text className="font-semibold text-violet-600">
                            Forgot Credentials?
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Animated.View style={passwordShakeStyle}>
                        <View
                          className={`flex-row items-center rounded-xl border px-4 ${passwordBorderClass}`}
                        >
                          <Feather
                            name="key"
                            size={18}
                            color={errors.password ? "#ef4444" : "#888"}
                          />

                          <TextInput
                            className="ml-3 flex-1 py-4 text-gray-900"
                            secureTextEntry={hidePassword}
                            placeholder="Enter your secret key"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={(v) => {
                              setPassword(v);
                              if (errors.password)
                                setErrors((e) => ({
                                  ...e,
                                  password: undefined,
                                }));
                            }}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="password"
                            textContentType="password"
                            editable={!loading}
                          />

                          <TouchableOpacity
                            onPress={() =>
                              setHidePassword((current) => !current)
                            }
                            disabled={loading}
                            hitSlop={8}
                          >
                            <Feather
                              name={hidePassword ? "eye-off" : "eye"}
                              size={20}
                              color="#777"
                            />
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                      {errors.password ? (
                        <Text className="mt-1 ml-1 text-xs text-red-500">
                          {errors.password}
                        </Text>
                      ) : null}

                      <View className="mt-8">
                        <Animated.View style={btnStyle}>
                          <TouchableOpacity
                            onPress={handleLogin}
                            onPressIn={() => pressIn(btnScale)}
                            onPressOut={() => pressOut(btnScale)}
                            disabled={loading}
                            activeOpacity={0.9}
                            className={`h-14 flex-row items-center justify-center rounded-xl shadow ${
                              loading ? "bg-violet-400" : "bg-violet-600"
                            }`}
                          >
                            {loading ? (
                              <View className="flex-row items-center gap-3">
                                <ActivityIndicator color="#fff" />
                                <Text className="text-base font-semibold text-white">
                                  Signing in…
                                </Text>
                              </View>
                            ) : (
                              <Text className="text-xl font-bold text-white">
                                Login to Studio
                              </Text>
                            )}
                          </TouchableOpacity>
                        </Animated.View>
                      </View>

                      {biometricEnabled && biometricAvailability?.available ? (
                        <TouchableOpacity
                          onPress={handleBiometricUnlock}
                          disabled={biometricBusy}
                          activeOpacity={0.9}
                          className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200"
                        >
                          {biometricBusy ? (
                            <ActivityIndicator color="#7c3aed" />
                          ) : (
                            <>
                              <MaterialIcons
                                name={bioIconName}
                                size={18}
                                color="#7c3aed"
                              />
                              <Text className="font-semibold text-violet-600">
                                Sign in with {biometricLabel}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </>
                  )}
                </View>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(350).duration(500)}>
                <View className="mt-8 items-center">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-medium text-gray-500">
                      Terms of Service
                    </Text>
                    <Text className="text-gray-300">|</Text>
                    <Text className="text-sm font-medium text-gray-500">
                      Privacy Policy
                    </Text>
                  </View>

                  <Text className="mt-5 text-xs text-gray-400">
                    Movement Creations Studio - v2.4.0
                  </Text>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={showEnableModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipBiometric}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6">
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-violet-50">
                <MaterialIcons name={bioIconName} size={30} color="#7c3aed" />
              </View>
              <Text className="mt-4 text-lg font-bold text-gray-900">
                Enable {biometricLabel} Login?
              </Text>
              <Text className="mt-2 text-center text-sm text-gray-500">
                Skip typing your password next time — sign in instantly and
                securely with {biometricLabel}.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEnableBiometric}
              disabled={biometricBusy}
              activeOpacity={0.9}
              className="mt-6 h-14 flex-row items-center justify-center rounded-xl bg-violet-600"
            >
              {biometricBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">Enable</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkipBiometric}
              disabled={biometricBusy}
              activeOpacity={0.9}
              className="mt-3 h-12 items-center justify-center rounded-xl"
            >
              <Text className="font-semibold text-gray-500">Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
