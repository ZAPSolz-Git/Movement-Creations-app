# Production-Grade Audit Report

## Movement Creations — Expo / React Native App

**Audit Date:** July 15, 2026
**Codebase:** `d:\Movement-Creations-app`
**Stack:** Expo SDK 56 · React Native 0.85 · Supabase Auth · Axios · NativeWind

---

> **CRITICAL ISSUES REMAIN** — Several findings below are active security vulnerabilities. Items marked ✅ have been fixed by the developer. Items marked ❌ are still open.

---

## Executive Summary

| Category        | Total  | Fixed ✅      | Remaining ❌ |
| --------------- | ------ | ------------- | ------------ |
| 🔐 Security     | 9      | 2 (1 partial) | 7            |
| ⚡ Performance  | 7      | 2             | 5            |
| 🏗️ Architecture | 8      | 2             | 6            |
| 🧪 Code Quality | 6      | 0             | 6            |
| 🚀 DevOps / CI  | 4      | 0             | 4            |
| **Total**       | **34** | **6 ✅**      | **28 ❌**    |

---

## 🔐 SECTION 1 — Security Issues

---

### ✅ CRIT-SEC-01 — Real Secrets Committed to Repository _(Partially Fixed)_

**Severity:** CRITICAL
**File:** `.env` · `.gitignore`

**Status:** `.env` has been added to `.gitignore` — future commits will no longer track this file.

**STILL REQUIRED:**

1. **Rotate all three secrets immediately** — the `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` are already in git history. Anyone who cloned the repo before this fix has them.
   - Go to: Supabase Dashboard → Settings → API → Rotate anon key
   - Go to: Supabase Dashboard → Settings → API → Rotate JWT secret
   - Update your backend server's environment variables with the new values
2. Create a `.env.example` file with placeholder values for other developers:

```
# .env.example
EXPO_PUBLIC_API_URL=https://your-backend.example.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Remove `SUPABASE_JWT_SECRET` from `.env` entirely — it is a backend-only secret and must never be near the client.

---

### ❌ CRIT-SEC-02 — No Route-Level Authentication Guards

**Severity:** CRITICAL
**File:** `src/app/_layout.tsx`

**Problem:**
Every route — `home`, `Release`, `revenue`, `reports`, `rights`, `profile` — is registered with zero authentication protection. A user who deep-links or navigates directly to `/home` bypasses login entirely. The `setOnAuthExpired` redirect only triggers **after** a failed API call, not on initial navigation.

**Fix:**
Use Expo Router's route groups to create a protected zone. Rename the `src/app` structure:

```
src/app/
  index.tsx          ← public (login)
  (protected)/
    _layout.tsx      ← auth guard lives here
    home.tsx
    release.tsx
    revenue.tsx
    reports.tsx
    rights.tsx
    profile.tsx
```

```tsx
// src/app/(protected)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { ActivityIndicator, View } from "react-native";

export default function ProtectedLayout() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator />
      </View>
    );
  if (!session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

---

### ✅ CRIT-SEC-03 — Duplicate & Diverged Sign-In Logic _(FIXED)_

**Severity:** CRITICAL
**Files:** `src/app/index.tsx` · `src/contexts/SupabaseAuthContext.tsx`

**Status:** Fixed. The inline `supabase.auth.signInWithPassword` call has been removed from `index.tsx`. The login screen now calls `useAuth().signIn` exclusively, which correctly stores the token expiry via `tokenStorage.setTokenExpiry()`. The session expiry polling interval in `SupabaseAuthContext` will now work correctly for all login sessions.

---

### ❌ CRIT-SEC-04 — `SUPABASE_JWT_SECRET` Present in Client Environment

**Severity:** CRITICAL
**File:** `.env`

**Problem:**
The `SUPABASE_JWT_SECRET` key in `.env` is a server-side JWT signing secret. The Dockerfile copies the entire project directory — including `.env` — into the image with `COPY . .`, baking the secret into every Docker layer. A JWT signing secret that leaks can be used to forge valid session tokens for **any user**.

**Fix:**

1. Remove `SUPABASE_JWT_SECRET` from `.env` now.
2. Add it only to your backend server's environment (Railway/Render dashboard, AWS Secrets Manager, etc.).
3. Add a `.dockerignore` entry:

```
# .dockerignore
.env
.env.*
.git
node_modules
```

---

### ❌ HIGH-SEC-05 — Web Token Storage Uses `localStorage` (XSS-Vulnerable)

**Severity:** HIGH
**File:** `src/lib/tokenStorage.ts`

**Problem:**
On `Platform.OS === 'web'`, both `tokenStorage` and the Supabase client's `ssrSafeStorage` adapter write `access_token` and `refresh_token` to `window.localStorage`. Any XSS vulnerability in the web bundle can silently exfiltrate these tokens.

**Fix:**
Switch to Supabase's PKCE auth flow for web, which manages tokens in `httpOnly` cookies automatically. Alternatively, keep tokens in memory only (not persisted) for the web build and require re-login on page reload.

---

### ❌ HIGH-SEC-06 — Logout Button Does Not Sign Out or Clear Tokens

**Severity:** HIGH
**File:** `src/app/home.tsx` — lines 50–52

**Problem:**

```tsx
// Current — INSECURE
const handleLogout = () => {
  router.replace("/");
};
```

This only navigates away. It does **not** call `supabase.auth.signOut()`, does not clear tokens from SecureStore, and does not invalidate the server session. Pressing the Android back button after logout navigates back to the dashboard with the live session still active in memory.

**Fix:**

```tsx
import { useAuth } from "../contexts/SupabaseAuthContext";

// Inside HomePage:
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut(); // clears SecureStore + signs out Supabase
  router.replace("/");
};
```

---

### ❌ HIGH-SEC-07 — `user_id` Sent as Client-Controlled Query Param (IDOR Risk)

**Severity:** HIGH
**File:** `src/hooks/useReportsData.ts` — line 78–80

**Problem:**

```ts
const res = await apiClient.get("/api/reports/analytics", {
  params: { user_id: user.id },
});
```

If the backend uses this `user_id` parameter directly in a database query without verifying it matches the JWT's `sub` claim, any authenticated user can retrieve any other user's analytics data by modifying this value. This is an **Insecure Direct Object Reference (IDOR)** — a top-10 OWASP vulnerability.

**Fix (Client):** Remove `user_id` from the request params entirely.
**Fix (Backend — REQUIRED):** Derive the user's ID exclusively from the validated JWT:

```js
// Express example (backend)
app.get("/api/reports/analytics", authenticate, (req, res) => {
  const userId = req.user.sub; // from JWT — never from req.query
  // query DB with userId
});
```

---

### ❌ MED-SEC-08 — No Rate Limiting on Login Attempts

**Severity:** MEDIUM
**File:** `src/app/index.tsx`

**Problem:**
The `handleLogin` function submits immediately on every tap with no debounce or attempt limiter. An automated script can make hundreds of auth requests per second. While Supabase applies some server-side rate limiting, relying on it exclusively is insufficient.

**Fix:**
Track failed attempts in state and apply a client-side lockout:

```tsx
const [failCount, setFailCount] = useState(0);
const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

const handleLogin = async () => {
  if (lockoutUntil && Date.now() < lockoutUntil) return;
  // ... attempt login ...
  // on failure:
  const next = failCount + 1;
  setFailCount(next);
  if (next >= 5) setLockoutUntil(Date.now() + 30_000); // 30s lockout
};
```

---

### ❌ MED-SEC-09 — Untyped `catch (err: any)` Pattern

**Severity:** MEDIUM
**Files:** `src/app/index.tsx` · `src/contexts/SupabaseAuthContext.tsx` · `src/hooks/useRevenueData.ts`

**Problem:**
`catch (err: any)` bypasses TypeScript's type safety. Axios errors have a different shape (`err.response.data.message`) than plain `Error` instances or network failures. Inconsistent error-handling can surface raw stack traces or undefined values to the UI.

**Fix:**

```ts
// src/utils/errorUtils.ts
import axios from "axios";

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
```

Replace all `catch (err: any)` blocks with `catch (err: unknown)` and use this utility.

---

## ⚡ SECTION 2 — Performance Issues

---

### ✅ HIGH-PERF-03 — `useState` Used as `useEffect` in `PlatformBar` _(FIXED)_

**Severity:** HIGH
**File:** `src/screens/Revenue/index.tsx`

**Status:** Fixed. `useState` replaced with `useEffect(() => { ... }, [percentage])`. The animated bars will now correctly animate to the right width and re-animate when data changes.

---

### ❌ HIGH-PERF-01 — Client-Side Pagination on Full Dataset

**Severity:** HIGH
**File:** `src/screens/Release/index.tsx` — lines 86–91

**Problem:**
`useReleasesData` fetches **all submissions** in a single API call. `Release/index.tsx` then slices that full array client-side into pages of 5:

```ts
const paginatedReleases = filteredReleases.slice(
  (page - 1) * PAGE_SIZE,
  page * PAGE_SIZE,
);
```

An artist with 300 releases will download all 300 objects on every mount, burning mobile data and increasing memory pressure — even though only 5 are displayed.

**Fix:**
Add server-side pagination. Pass `page` and `limit` to the API:

```ts
const res = await apiClient.get("/api/submissions", {
  params: {
    page,
    limit: PAGE_SIZE,
    ...(releaseType && releaseType !== "all"
      ? { release_type: releaseType }
      : {}),
  },
});
// expect: { submissions: [...], total: number }
```

---

### ❌ HIGH-PERF-02 — Dashboard Causes Redundant Parallel API Calls

**Severity:** HIGH
**File:** `src/hooks/useDashboardData.ts`

**Problem:**
`useDashboardData` composes `useRevenueData` and `useReleasesData`, firing 4 concurrent fetches on home screen mount. Navigating to the Revenue screen mounts `useRevenueData` **again** — re-fetching `/api/user/revenue` and `/api/user/payout-history` for a second time.

**Fix:**
Introduce TanStack Query for request deduplication and cache sharing across screens:

```bash
npx expo install @tanstack/react-query
```

Wrap `_layout.tsx` with `QueryClientProvider` and convert hooks to `useQuery`. Identical query keys share one cached response regardless of how many components subscribe.

---

### ❌ MED-PERF-04 — No Image Caching (Plain `<Image>` for Cover Art)

**Severity:** MEDIUM
**File:** `src/screens/Release/index.tsx` — lines 487–490 and 536–538

**Problem:**
Native React Native `<Image>` has no persistent disk cache on Android. Scrolling a list of releases re-downloads every cover image on each mount.

**Fix:**
Replace with `expo-image` (already installed), which has multi-tier memory + disk caching:

```tsx
import { Image } from "expo-image";

// List item:
<Image
  source={{ uri: release.cover_url }}
  style={{ height: 56, width: 56, borderRadius: 8 }}
  contentFit="cover"
  recyclingKey={release.id}
/>;
```

---

### ❌ MED-PERF-05 — `refetch` in `useDashboardData` Recreated Every Render

**Severity:** MEDIUM
**File:** `src/hooks/useDashboardData.ts` — lines 49–52

**Problem:**

```ts
const refetch = () => {
  // ← not wrapped in useCallback
  refetchRevenue();
  refetchReleases();
};
```

A new function reference is created on every render. When passed as `RefreshControl`'s `onRefresh`, this causes unnecessary downstream re-renders.

**Fix:**

```ts
const refetch = useCallback(() => {
  refetchRevenue();
  refetchReleases();
}, [refetchRevenue, refetchReleases]);
```

---

### ❌ MED-PERF-06 — Reports Analytics Fetch Creates Unnecessary Waterfall

**Severity:** MEDIUM
**File:** `src/hooks/useReportsData.ts` — lines 89–95

**Problem:**
Two `useEffect` hooks create a sequential waterfall — reports fetch first, React re-renders, then analytics fetch starts. Adds one full render cycle of latency before analytics begins.

```ts
useEffect(() => {
  fetchReports();
}, [fetchReports]);
useEffect(() => {
  if (reports.length) fetchAnalytics(); // waits for reports state to update
}, [reports.length, fetchAnalytics]);
```

**Fix:**
Coordinate both fetches in a single async function:

```ts
useEffect(() => {
  const init = async () => {
    await fetchReports();
    await fetchAnalytics();
  };
  init();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

---

### ✅ LOW-PERF-07 — `KeyboardAvoidingView` `behavior` Undefined on Android _(FIXED)_

**Severity:** LOW
**File:** `src/app/index.tsx`

**Status:** Fixed. Changed from `undefined` to `"height"` on Android. The login form will no longer be obscured by the soft keyboard on Android devices.

---

## 🏗️ SECTION 3 — Architecture Issues

---

### ❌ CRIT-ARCH-01 — Five Stub Screens Shipped as Empty/Placeholder Routes

**Severity:** CRITICAL
**Files:** `src/app/profile.tsx` · `src/app/reports.tsx` · `src/app/revenue.tsx` · `src/app/rights.tsx`

**Problem:**
Several app screens referenced in the navigation footer (`Footer.tsx`) are 125-byte stub files that render blank content or a placeholder `<Text>` component. Users who tap "Profile" or "Reports" in the navigation bar land on a blank white screen with no error or explanation.

**Fix:**
Either implement these screens before shipping, or temporarily remove them from the `Footer.tsx` `menuItems` array. Do not ship navigable dead ends.

---

### ✅ HIGH-ARCH-02 — `FormErrors` Interface Declared Twice _(FIXED)_

**Severity:** HIGH
**File:** `src/app/index.tsx`

**Status:** Fixed. The duplicate `FormErrors` interface declaration has been removed.

---

### ✅ MED-SEC-09 (partial) — Login `catch (err: any)` Cleaned Up _(PARTIALLY FIXED)_

**Severity:** MEDIUM
**File:** `src/app/index.tsx`

**Status:** The `handleLogin` function no longer has a `try/catch` block at all — error handling is now delegated entirely to `useAuth().signIn`, which returns a typed `{ error: string | null }`. The login screen is clean. The pattern still exists in `SupabaseAuthContext.tsx` and `useRevenueData.ts` and should be addressed there.

---

### ❌ HIGH-ARCH-03 — Case-Inconsistent Route Names Break Android Production Builds

**Severity:** HIGH
**Files:** `src/components/Footer.tsx` · `src/app/_layout.tsx` · `src/app/Release.tsx`

**Problem:**
The file is named `Release.tsx` (capital R), but `home.tsx` calls `router.push("/release")` (lowercase). On Windows and macOS the filesystem is case-insensitive and this silently works. On **Linux (Android production builds)** the filesystem is case-sensitive and navigation to `/release` will fail with a "route not found" crash.

**Fix:**
Rename `src/app/Release.tsx` → `src/app/release.tsx` (lowercase) and update all route references:

- `_layout.tsx`: `name="release"`
- `Footer.tsx`: `route: "/release"`
- `home.tsx`: already uses `"/release"` — no change needed

---

### ❌ HIGH-ARCH-04 — `PLATFORM_COLORS` Constant Duplicated in Two Hooks

**Severity:** HIGH
**Files:** `src/hooks/useRevenueData.ts` · `src/hooks/useReportsData.ts`

**Problem:**
The same `PLATFORM_COLORS` map and `getPlatformColor` function are copy-pasted verbatim in both hooks. If a platform is added or a color changes, it must be updated in two places — and they will inevitably diverge.

**Fix:**

```ts
// src/constants/platforms.ts
export const PLATFORM_COLORS: Record<string, string> = {
  Spotify: "#22c55e",
  "Apple Music": "#ec4899",
  "Amazon Music": "#0ea5e9",
  "YouTube Music": "#f43f5e",
};
export const DEFAULT_PLATFORM_COLOR = "#eab308";
export const getPlatformColor = (platform: string): string =>
  PLATFORM_COLORS[platform] ?? DEFAULT_PLATFORM_COLOR;
```

Import from both hooks.

---

### ❌ MED-ARCH-05 — `any[]` State Types Hide Data Contract Bugs

**Severity:** MEDIUM
**File:** `src/hooks/useRevenueData.ts` — lines 65–66

**Problem:**

```ts
const [transactions, setTransactions] = useState<any[]>([]);
const [rawPayouts, setRawPayouts] = useState<any[]>([]);
```

Using `any[]` defeats TypeScript. If the backend renames `amount` to `net_amount`, there is zero compile-time safety — the bug will surface as a silent `NaN` or `$0.00` in production.

**Fix:**

```ts
interface RawTransaction {
  platform?: string;
  source?: string;
  amount?: number | string;
  revenue?: number | string;
}

interface RawPayout {
  id: string;
  created_at: string;
  amount?: number | string;
  status?: string;
  type?: string;
}

const [transactions, setTransactions] = useState<RawTransaction[]>([]);
const [rawPayouts, setRawPayouts] = useState<RawPayout[]>([]);
```

---

### ❌ MED-ARCH-06 — `handleCreate` in Release Screen is a Stub Alert

**Severity:** MEDIUM
**File:** `src/screens/Release/index.tsx` — lines 131–135

**Problem:**

```ts
const handleCreate = (type: ReleaseType) => {
  Alert.alert(
    `New ${type} release`,
    "Hook this up to your form screen when it's ready.",
  );
};
```

A development placeholder committed to the codebase. Users who tap "New Audio Release" see a debug-style alert instead of a form.

**Fix:**
Implement the release creation form and navigate to it, or remove the buttons until the form is ready.

---

### ✅ MED-ARCH-07 — `handleDownload` Read Token from Stale Axios Defaults _(FIXED)_

**Severity:** MEDIUM
**File:** `src/hooks/useReportsData.ts`

**Status:** Fixed. Token is now read via `await tokenStorage.getAccessToken()`, guaranteeing a fresh, current token on every download call.

---

### ❌ LOW-ARCH-08 — `SESSION_DURATION_MS` Hardcoded, Not Derived from JWT

**Severity:** LOW
**File:** `src/utils/Auth.ts`

**Problem:**

```ts
export const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour — match backend JWT expiry
```

If the backend JWT expiry changes (e.g., to 15 minutes for security hardening), this constant won't be updated and the client-side check will be incorrect.

**Fix:**
Use the session's actual expiry timestamp from Supabase, which is provided in `data.session.expires_at`:

```ts
// In SupabaseAuthContext.tsx signIn:
await tokenStorage.setTokenExpiry(sessionData.expires_at * 1000); // convert unix seconds to ms
```

Remove the `SESSION_DURATION_MS` constant entirely.

---

## 🧪 SECTION 4 — Code Quality Issues

---

### ❌ HIGH-QA-01 — `"Forgot Credentials?"` Button Has No Handler

**Severity:** HIGH
**File:** `src/app/index.tsx` — line 185

**Problem:**

```tsx
<TouchableOpacity disabled={loading}>
  {" "}
  {/* No onPress */}
  <Text>Forgot Credentials?</Text>
</TouchableOpacity>
```

The button is completely inert. Users who forget their password have no recovery path within the app.

**Fix:**

```tsx
<TouchableOpacity
  disabled={loading}
  onPress={async () => {
    if (!email.trim()) {
      setErrors({ email: "Enter your email first" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (!error) Alert.alert("Check your email", "Password reset link sent.");
  }}
>
  <Text>Forgot Credentials?</Text>
</TouchableOpacity>
```

---

### ❌ HIGH-QA-02 — `"Secure Sign-in"` Biometric Button Does Nothing

**Severity:** HIGH
**File:** `src/app/index.tsx` — lines 260–269

**Problem:**
The fingerprint sign-in button displays the biometric icon and label but has no `onPress` handler. Tapping it does absolutely nothing — users will tap it multiple times expecting Face ID or fingerprint authentication.

**Fix:**

```bash
npx expo install expo-local-authentication
```

```tsx
import * as LocalAuthentication from "expo-local-authentication";

const handleBiometricLogin = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in to Movement Creations",
  });
  if (result.success) {
    // retrieve stored credentials and call signIn
  }
};

<TouchableOpacity onPress={handleBiometricLogin} disabled={loading}>
  ...
</TouchableOpacity>;
```

---

### ❌ MED-QA-03 — `"Join the collective"` Link Navigates Directly to Dashboard

**Severity:** MEDIUM
**File:** `src/app/index.tsx` — line 274

**Problem:**

```tsx
<TouchableOpacity onPress={() => !loading && router.push("/home")}>
```

"New artist? Join the collective" pushes directly to the authenticated home screen without any login or registration. This is a complete authentication bypass available to anyone on the login screen.

**Fix:**
Route to a registration screen or to the Movement Creations website for artist onboarding:

```tsx
import * as Linking from 'expo-linking';
<TouchableOpacity onPress={() => Linking.openURL('https://movementcreations.in/join')}>
```

---

### ❌ MED-QA-04 — Version Number Hardcoded and Mismatched

**Severity:** MEDIUM
**File:** `src/app/index.tsx` — line 298

**Problem:**

```tsx
<Text>Movement Creations Studio - v2.4.0</Text>
```

Hardcoded and does not match `package.json` (`"version": "1.0.0"`). Will perpetually show the wrong version.

**Fix:**

```tsx
import Constants from "expo-constants";

<Text>
  Movement Creations Studio - v{Constants.expoConfig?.version ?? "—"}
</Text>;
```

---

### ❌ LOW-QA-05 — Footer Uses Array `index` as React `key`

**Severity:** LOW
**File:** `src/components/Footer.tsx` — line 96

**Problem:**

```tsx
{menuItems.map((item, index) => (
  <TouchableOpacity key={index} ...>
```

Using array index as `key` is an anti-pattern. React may incorrectly reuse nodes if the array order changes.

**Fix:**

```tsx
<TouchableOpacity key={item.name} ...>
```

---

### ❌ LOW-QA-06 — File Comment Says `login.tsx`, File is `index.tsx`

**Severity:** LOW
**File:** `src/app/index.tsx` — line 1

**Problem:**

```ts
// src/app/login.tsx   ← incorrect
```

The comment refers to a different filename, indicating copy-paste origin.

**Fix:** Update to `// src/app/index.tsx`

---

## 🚀 SECTION 5 — DevOps / Deployment Issues

---

### ❌ CRIT-DEVOPS-01 — Dockerfile is Broken for Production

**Severity:** CRITICAL
**File:** `Dockerfile`

**Problem:**

```dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install          # installs devDependencies, non-deterministic
COPY . .                 # copies .env secrets into the image
EXPOSE 8081
CMD ["npx", "react-native", "start", "--host", "0.0.0.0"]  # Metro DEV server
```

Five critical flaws:

1. Copies `.env` secrets into the Docker image (every layer is inspectable)
2. Uses `npm install` (non-deterministic) instead of `npm ci`
3. Runs the Metro **development** server, not a production build
4. No multi-stage build — image ships with full dev dependencies and TypeScript source
5. `node:22` base image is not pinned to a digest (supply-chain risk)

**Fix (production multi-stage Dockerfile):**

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# Inject secrets as build args, never from .env
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
RUN npx expo export --platform web

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### ❌ HIGH-DEVOPS-02 — No CI/CD Pipeline Defined

**Severity:** HIGH

**Problem:**
No GitHub Actions, GitLab CI, or other pipeline is configured. There is no automated gate for TypeScript errors, lint failures, or secret scanning. Code can be merged and deployed without any validation.

**Minimum fix — add `.github/workflows/ci.yml`:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
```

---

### ❌ HIGH-DEVOPS-03 — No EAS Build Configuration (`eas.json` Missing)

**Severity:** HIGH

**Problem:**
No `eas.json` exists, so there are no defined build profiles for development, preview, or production. Native iOS/Android builds require manual configuration on every machine. There is no OTA update channel strategy.

**Fix:**

```bash
npx eas build:configure
```

Commit the generated `eas.json`. Store all `EXPO_PUBLIC_*` values in EAS Secrets (not in `.env`).

---

### ❌ MED-DEVOPS-04 — `app.json` Missing Critical Production Fields

**Severity:** MEDIUM
**File:** `app.json`

**Problems:**

- No `bundleIdentifier` — required for iOS App Store submission
- No `package` name — required for Google Play submission
- No `runtimeVersion` — OTA updates may break between app versions
- iOS `"icon": "./assets/expo.icon"` — non-standard path, likely broken

**Fix:**

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "in.movementcreations.studio",
      "icon": "./assets/images/icon.png"
    },
    "android": {
      "package": "in.movementcreations.studio"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

---

## 📋 Remediation Priority Matrix

| Priority                  | When                | Issues                                                                                                                                                 |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P0 — Do not ship**      | Immediately         | CRIT-SEC-01 (rotate keys) · CRIT-SEC-02 · CRIT-SEC-03 · CRIT-SEC-04 · HIGH-SEC-06 · HIGH-QA-01 · HIGH-QA-02 · MED-QA-03 · CRIT-ARCH-01                 |
| **P1 — Current sprint**   | Before next release | HIGH-ARCH-03 · HIGH-SEC-05 · HIGH-SEC-07 · CRIT-DEVOPS-01                                                                                              |
| **P2 — Within 2 sprints** | Scheduled           | HIGH-PERF-01 · HIGH-PERF-02 · MED-PERF-04 · MED-PERF-05 · MED-PERF-06 · HIGH-ARCH-04 · MED-ARCH-05 · MED-ARCH-06 · MED-QA-04 · MED-SEC-08 · MED-SEC-09 |
| **P3 — Tech debt**        | Backlog             | LOW-ARCH-08 · LOW-QA-05 · LOW-QA-06 · HIGH-DEVOPS-02 · HIGH-DEVOPS-03 · MED-DEVOPS-04                                                                  |

---

## ✅ Fixes Already Applied (as of July 15, 2026)

| Issue                 | Fix Applied                                                          |
| --------------------- | -------------------------------------------------------------------- |
| CRIT-SEC-01 (partial) | `.env` added to `.gitignore` — keys still need rotating              |
| HIGH-PERF-03          | `useState` → `useEffect` with `[percentage]` dep in `PlatformBar`    |
| MED-ARCH-07           | `handleDownload` now reads token via `tokenStorage.getAccessToken()` |
| HIGH-ARCH-02          | Duplicate `FormErrors` interface removed from `index.tsx`            |
| LOW-PERF-07           | `KeyboardAvoidingView` behavior set to `"height"` on Android         |

---

## ✅ What Is Done Well

- **Axios token-refresh interceptor** (`apiClient.ts`) — queue-based concurrent request handling with correct flush-on-failure. Well-crafted.
- **SSR-safe Supabase storage adapter** (`supabaseClient.ts`) — correctly guards `typeof window === 'undefined'` for the static web export pass.
- **`safeNum()` utility** — defensively coerces unknown backend values to finite numbers, preventing `NaN` UI renders.
- **`mapSubmissionToRelease`** normalization — handles multiple backend status aliases and release type strings gracefully.
- **`useMemo` / `useCallback`** — used appropriately in most hooks to avoid unnecessary recalculation.
- **Visual design** — cohesive NativeWind-based design system with consistent spacing, color tokens, and loading states.

---

_Audit report — Movement Creations Studio v1.0.0 — July 15, 2026_
