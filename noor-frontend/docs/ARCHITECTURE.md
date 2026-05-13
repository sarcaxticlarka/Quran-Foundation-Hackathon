# Noor — System Architecture Diagrams

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Device["Mobile Device (iOS / Android)"]
        subgraph ExpoRN["React Native — Expo 54"]
            Router["Expo Router\nFile-based routing\n43 screens"]
            Comp["Component Library\n21 reusable components"]
            Hooks["Custom Hooks\nuseQuran · useStreak\nuseNetworkStatus · etc."]
            Stores["Zustand Stores\n8 persisted stores\nAsyncStorage backend"]
            RQ["TanStack React Query\nServer cache\nstaleTime: Infinity"]
        end

        subgraph NativeModules["Native Modules"]
            AV["expo-av\nAudio playback"]
            LOC["expo-location\nGPS coordinates"]
            NOTIF["expo-notifications\nLocal push"]
            ML["expo-media-library\nPhoto library save"]
            VS["react-native-view-shot\nCard capture"]
        end
    end

    subgraph External["External Services"]
        QB["quran.com v4 API\n/verses · /surahs\n/tafsirs · /recitations\n/search"]
        SB["Supabase\nAuth (JWT)\nPostgreSQL DB\nRealtime WS"]
        GQ["Groq LLM API\nchat completions\njournal reflections"]
        AL["Aladhan API\nprayer times\nby GPS coordinates"]
        MCP["Quran MCP Server\ngrounded AI search\nno hallucination"]
    end

    Router --> Comp & Hooks
    Hooks --> RQ & Stores
    RQ -->|"HTTP GET"| QB
    RQ -->|"HTTP GET"| AL
    Stores -->|"read/write"| SB
    Hooks -->|"chat completion"| GQ
    Hooks -->|"tool calls"| MCP
    Comp --> NativeModules
```

---

## 2. Layer Architecture (Clean Architecture view)

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer (app/)"]
        Screens["Screens\n(Expo Router pages)"]
        Components["Components\n(UI + domain)"]
    end

    subgraph Application["Application Layer (src/hooks/ + src/stores/)"]
        Hooks2["Custom Hooks\nbusiness logic + data wiring"]
        Stores2["Zustand Stores\nlocal state machine + persistence"]
    end

    subgraph Infrastructure["Infrastructure Layer (src/services/)"]
        APIs["API Services\nquranApi · tafsirApi\naudioApi · prayerTimes"]
        Auth["Auth Service\nsupabase.auth"]
        DB["DB Service\nsupabase.from()"]
        AI["AI Service\ngroqAI · mcpService"]
        Notifs["Notification Service\nnotifications.ts"]
    end

    subgraph Platform["Platform Layer"]
        RNRuntime["React Native Runtime"]
        ExpoSDK["Expo SDK Modules"]
        AsyncSt["AsyncStorage / MMKV"]
    end

    Screens --> Hooks2
    Components --> Hooks2
    Hooks2 --> Stores2
    Hooks2 --> APIs & Auth & DB & AI & Notifs
    Stores2 --> AsyncSt
    APIs & Auth & DB --> RNRuntime
    Notifs --> ExpoSDK
```

---

## 3. State Store Class Diagram

```mermaid
classDiagram
    class authStore {
        +User | null user
        +string | null session
        +setUser(user: User) void
        +clearUser() void
        +updatePreferences(prefs: Partial~UserProfile~) void
    }

    class UserProfile {
        +string id
        +string email
        +string name
        +string madhab
        +string reading_level
        +number daily_goal
        +number translationId
        +boolean nudgesEnabled
        +string[] nudgeTimes
        +boolean reviewReminders
        +boolean halaqaAlerts
    }

    class streakStore {
        +number currentStreak
        +number longestStreak
        +Record~string,DayRecord~ history
        +recordDay(data: DayRecord) void
        +getActiveDays() number
    }

    class DayRecord {
        +boolean completed
        +number versesRead
        +number dhikrCount
        +number sessionMinutes
    }

    class reviewStore {
        +ReviewCard[] cards
        +addCard(verseKey: string) void
        +getDueCards() ReviewCard[]
        +updateCard(id: string, rating: Rating) void
    }

    class ReviewCard {
        +string id
        +string verseKey
        +number easeFactor
        +number intervalDays
        +number repetitions
        +Date nextReviewAt
    }

    class engagementStore {
        +Record~FeatureKey,number~ taps
        +recordTap(feature: FeatureKey) void
        +getOrderedFeatures() FeatureKey[]
    }

    class halaqaStore {
        +Halaqa[] myCircles
        +Halaqa | null activeCircle
        +createHalaqa(data) void
        +joinHalaqa(id: string) void
        +postInsight(halaqaId, content) void
    }

    class crisisStore {
        +CrisisSession[] sessions
        +logSession(session: CrisisSession) void
        +getRecentSessions(n: number) CrisisSession[]
    }

    class savedStore {
        +Bookmark[] bookmarks
        +Collection[] collections
        +addBookmark(verseKey, note?) void
        +removeBookmark(verseKey) void
        +createCollection(name) void
        +addToCollection(colId, verseKey) void
    }

    class notificationStore {
        +Notification[] queue
        +markDelivered(id: string) void
        +addNotification(n: Notification) void
    }

    authStore --> UserProfile : contains
    streakStore --> DayRecord : history values
    reviewStore --> ReviewCard : contains
```

---

## 4. React Query Cache Architecture

```mermaid
flowchart LR
    subgraph QueryKeys["Query Key Space"]
        K1["['surahs']\nstale: Infinity"]
        K2["['surah', id]\nstale: Infinity"]
        K3["['verses', surahId, page, translationId]\nstale: Infinity"]
        K4["['verse', verseKey, translationId]\nstale: Infinity"]
        K5["['verseOfDay', key, translationId]\nstale: 12 hours"]
        K6["['tafsir', verseKey, tafsirId]\nstale: Infinity"]
        K7["['search', query]\nstale: 5 minutes"]
    end

    subgraph Invalidation["Cache Invalidation Triggers"]
        T1["User changes translationId\n→ invalidates K3, K4, K5"]
        T2["App foregrounded\n→ K5 refetched if stale"]
        T3["Search query changes\n→ K7 refetched if query.length >= 2"]
    end

    subgraph Sources["Data Sources"]
        QA["quran.com v4 API"]
    end

    K1 & K2 & K3 & K4 & K5 & K6 & K7 --> QA
    T1 --> K3 & K4 & K5
```

---

## 5. Authentication & Session Flow

```mermaid
sequenceDiagram
    participant App as React Native App
    participant AS as authStore
    participant SB as Supabase Auth
    participant DB as Supabase DB

    Note over App,DB: Cold start
    App->>SB: supabase.auth.getSession()
    SB-->>App: { session: null } or { session: { user, access_token } }

    alt No session
        App->>App: Navigate to /auth/login
    else Valid session
        App->>AS: setUser(session.user)
        App->>DB: SELECT * FROM profiles WHERE id = user.id
        DB-->>App: UserProfile row
        App->>AS: updatePreferences(profile)
        App->>App: Navigate to /(tabs)
    end

    Note over App,DB: Sign up
    App->>SB: supabase.auth.signUp({ email, password })
    SB-->>App: { user, session }
    SB->>DB: INSERT INTO profiles (id, email) [trigger]
    App->>AS: setUser(user)
    App->>App: Navigate to /auth/onboarding

    Note over App,DB: Onboarding complete
    App->>DB: UPSERT profiles SET madhab, reading_level, daily_goal, translation_id
    DB-->>App: Updated profile
    App->>AS: updatePreferences(...)
    App->>App: Navigate to /(tabs)

    Note over App,DB: Sign out
    App->>SB: supabase.auth.signOut()
    SB-->>App: OK
    App->>AS: clearUser()
    App->>App: Navigate to /auth/login
```

---

## 6. Offline Resilience Architecture

```mermaid
flowchart TD
    subgraph Detection["Network Detection (useNetworkStatus)"]
        POLL["Poll every 15s\nfetch('https://1.1.1.1', {method:'HEAD'})\nAbortController timeout: 4s"]
        APP["AppState listener\nre-check on foreground resume"]
        POLL & APP --> STATUS{isOnline?}
    end

    STATUS -- false --> BANNER["OfflineBanner renders\nAnimated.timing slides down\nred strip at top of tabs"]
    STATUS -- true --> HIDE["Banner hides\nAnimated.timing slides up"]

    subgraph DataAvailability["What Works Offline"]
        RQC["React Query cache\nAll Quran data cached stale:Infinity\nAvailable without network"]
        ZUST["Zustand stores\nAll user data persisted locally\nstreak · bookmarks · review cards"]
        OPT["Optimistic updates\nSession logs written locally\nSynced to Supabase on reconnect"]
    end

    subgraph CrashRecovery["Error Boundary"]
        EB["ErrorBoundary (class component)\nwraps entire tab navigator"]
        EB --> ERR{componentDidCatch\nerror?}
        ERR -- Yes --> UI["Render recovery screen\n'Something went wrong'\n'Try Again' button"]
        UI --> RESET["setState({ hasError: false })\nAttempts to re-render tabs"]
    end
```

---

## 7. Notification Pipeline

```mermaid
sequenceDiagram
    participant App as App _layout.tsx
    participant Svc as notifications.ts
    participant Const as expo-constants
    participant NotifMod as expo-notifications
    participant OS as iOS / Android OS

    App->>Const: Constants.executionEnvironment
    Const-->>App: 'storeClient' (Expo Go) or 'standalone'

    alt Expo Go detected
        App->>App: Skip all notification setup
        Note over App: Module never required
    else Standalone build
        App->>Svc: schedulePrayerReminders(times)
        Svc->>NotifMod: requestPermissionsAsync()
        NotifMod->>OS: Show permission dialog
        OS-->>NotifMod: granted / denied
        NotifMod-->>Svc: { status }

        alt Granted
            loop For each prayer time
                Svc->>NotifMod: scheduleNotificationAsync({ trigger: DateTriggerInput, repeat: true })
                NotifMod-->>Svc: notificationId
            end
            Svc->>NotifMod: scheduleNotificationAsync (8pm review reminder)
        end

        App->>App: Watch authStore.user.reviewReminders
        alt reviewReminders toggled OFF
            App->>Svc: cancelReviewReminder()
            Svc->>NotifMod: cancelScheduledNotificationAsync(reviewId)
        else reviewReminders toggled ON
            App->>Svc: scheduleReviewReminder()
        end
    end
```

---

## 8. Share Card Rendering Pipeline

```mermaid
flowchart LR
    subgraph CardConstruct["Card Construction (View tree)"]
        BG["4-layer LinearGradient\nbase parchment · gold shimmer\nvignette · centre glow"]
        DEC["Decorative elements\nMosqueSkyline (pure Views, 11% opacity)\nMoonAndStar (pure Views, 10% opacity)\nArabic 'الله' watermark (5% opacity)"]
        FRAME["Double gold frame\nframeOuter (1.5px)\nframeInner (0.5px)\nCornerBracket × 4"]
        CONTENT["Content stack\nBismillah header band\nBrand row (نور / N·O·O·R)\nRub el-Hizb emblem\nUsername + Madhab\nRank badge\nDivider\nStats box (4 columns)\nActive days pill\nQuranic ayah\nFooter band"]
    end

    subgraph Capture["Capture (react-native-view-shot)"]
        WAIT["await 250ms\n(ensure render complete)"]
        CAP["captureRef(cardRef,\n{ format:'png', quality:1,\n  result:'tmpfile' })"]
        URI["tmpfile:// URI"]
    end

    subgraph Output["Output"]
        GAL["MediaLibrary.saveToLibraryAsync(uri)\nSaves PNG to Camera Roll"]
        SHR["Share.share({ url: uri })\nNative share sheet"]
    end

    BG & DEC & FRAME & CONTENT --> WAIT
    WAIT --> CAP --> URI
    URI --> GAL
    URI --> SHR
```
