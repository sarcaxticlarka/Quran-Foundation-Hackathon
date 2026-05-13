# Noor — Use Case Diagrams

All actors, use cases, and relationships across the full application.

---

## Actors

| Actor | Description |
|-------|-------------|
| **Guest** | Unauthenticated visitor — can only reach auth screens |
| **Authenticated User** | Logged-in user with full app access |
| **Halaqa Host** | Authenticated user who created a circle (extends Authenticated User) |
| **quran.com API** | External system providing verse, translation, tafsir, audio data |
| **Supabase** | Backend system handling auth, database, realtime |
| **Groq AI** | External LLM system for journal reflection |
| **expo-notifications** | Platform system for push notification delivery |

---

## Master Use Case Diagram

```mermaid
flowchart TD
    Guest([Guest])
    User([Authenticated User])
    Host([Halaqa Host\nextends User])
    QA([quran.com API])
    SB([Supabase])
    GQ([Groq AI])
    PN([expo-notifications])

    subgraph AuthUC[Authentication]
        UC_SIGNUP[Sign Up with Email]
        UC_LOGIN[Log In with Email]
        UC_GOOGLE[Log In with Google OAuth]
        UC_ONBOARD[Complete Onboarding Wizard]
        UC_LOGOUT[Sign Out]
        UC_REFRESH[Auto-refresh JWT Session]
    end

    subgraph QuranUC[Quran Study]
        UC_BROWSE[Browse 114 Surahs]
        UC_READ[Read Verses]
        UC_TRANS[Switch Translation Language]
        UC_TAFSIR[Open Tafsir Commentary]
        UC_AUDIO[Stream Audio Recitation]
        UC_SEARCH[Search Verses & Surahs]
        UC_WORD[Explore Word Morphology]
        UC_ROOT[Browse Arabic Root Cards]
        UC_GRAPH[View Concept Knowledge Graph]
        UC_BOOKMARK[Bookmark a Verse]
        UC_COLLECT[Add Verse to Collection]
    end

    subgraph WorshipUC[Daily Worship]
        UC_SESSION[Log Daily Reading Session]
        UC_DHIKR[Use Dhikr Counter]
        UC_STREAK[View Streak & Heatmap]
        UC_GOAL[Set Daily Goal]
        UC_RINGS[View Growth Rings]
        UC_BEST[View Personal Best]
    end

    subgraph ReviewUC[Spaced Repetition]
        UC_QUEUE[Open Review Queue]
        UC_FLASH[Run Flashcard Session]
        UC_RATE[Rate Card Difficulty]
        UC_HIST[View Review History]
    end

    subgraph CommunityUC[Community]
        UC_CREATE[Create Halaqa Circle]
        UC_JOIN[Join Halaqa Circle]
        UC_INSIGHT[Post Circle Insight]
        UC_LANTERN[Start Lantern Ceremony]
        UC_RECITE[Group Recitation]
        UC_MEMBERS[View Member Activity]
    end

    subgraph CrisisUC[Wellbeing & Crisis]
        UC_CRISIS[Enter Crisis Flow]
        UC_MOOD[Select Mood]
        UC_GUIDE[Follow Guided Dhikr]
        UC_MOODLOG[View Mood History]
    end

    subgraph ProfileUC[Profile & Identity]
        UC_EDIT[Edit Profile Preferences]
        UC_RANK[View Spiritual Rank]
        UC_CARD[Generate Journey Share Card]
        UC_SAVE[Save Card to Gallery]
        UC_SHARE[Share Card Externally]
        UC_LIBRARY[Browse Saved Library]
    end

    subgraph JournalUC[Journal & Reflection]
        UC_JOURNAL[Write Journal Entry]
        UC_AI[Receive AI Reflection]
        UC_REFLHIST[Browse Reflection History]
    end

    subgraph NotifUC[Notifications]
        UC_PRAYER[Enable Prayer Reminders]
        UC_REVIEWNOTIF[Set Review Reminder]
        UC_HALAQANOTIF[Receive Halaqa Alert]
    end

    %% Guest flows
    Guest --> UC_SIGNUP & UC_LOGIN & UC_GOOGLE
    UC_SIGNUP --> UC_ONBOARD --> User
    UC_LOGIN --> User
    UC_GOOGLE --> User

    %% Authenticated user flows
    User --> UC_LOGOUT & UC_REFRESH
    User --> UC_BROWSE & UC_READ & UC_TRANS & UC_TAFSIR & UC_AUDIO & UC_SEARCH
    User --> UC_WORD & UC_ROOT & UC_GRAPH & UC_BOOKMARK & UC_COLLECT
    User --> UC_SESSION & UC_DHIKR & UC_STREAK & UC_GOAL & UC_RINGS & UC_BEST
    User --> UC_QUEUE & UC_FLASH & UC_RATE & UC_HIST
    User --> UC_JOIN & UC_INSIGHT & UC_RECITE & UC_MEMBERS
    User --> UC_CRISIS & UC_MOOD & UC_GUIDE & UC_MOODLOG
    User --> UC_EDIT & UC_RANK & UC_CARD & UC_SAVE & UC_SHARE & UC_LIBRARY
    User --> UC_JOURNAL & UC_AI & UC_REFLHIST
    User --> UC_PRAYER & UC_REVIEWNOTIF & UC_HALAQANOTIF

    %% Host-only
    Host --> UC_CREATE & UC_LANTERN

    %% External system interactions
    UC_READ & UC_BROWSE --> QA
    UC_TAFSIR --> QA
    UC_AUDIO --> QA
    UC_TRANS --> QA
    UC_WORD & UC_ROOT & UC_GRAPH --> QA
    UC_SESSION & UC_STREAK --> SB
    UC_BOOKMARK & UC_COLLECT --> SB
    UC_JOURNAL --> SB
    UC_AI --> GQ
    UC_PRAYER & UC_REVIEWNOTIF & UC_HALAQANOTIF --> PN
```

---

## Authentication Use Cases (Detail)

```mermaid
flowchart TD
    G([Guest])

    G --> A[Sign Up with Email]
    G --> B[Log In with Email]
    G --> C[Log In with Google OAuth]

    A --> A1["Enter email + password\nsupabase.auth.signUp()"]
    A1 --> A2["Supabase creates auth.users row\n+ triggers profile insert"]
    A2 --> A3["Navigate to Onboarding"]
    A3 --> A4["Step 1: Choose Madhab"]
    A4 --> A5["Step 2: Reading Level + Daily Goal"]
    A5 --> A6["Step 3: Translation Preference"]
    A6 --> A7["Write to authStore + Supabase profiles"]
    A7 --> Home([Home Screen])

    B --> B1["Enter credentials\nsupabase.auth.signInWithPassword()"]
    B1 --> B2{Valid?}
    B2 -- Yes --> Home
    B2 -- No --> B3[Show error toast]

    C --> C1["expo-auth-session\nstarts OAuth PKCE flow"]
    C1 --> C2["expo-web-browser\nopens Google consent screen"]
    C2 --> C3["Callback → supabase.auth.exchangeCodeForSession()"]
    C3 --> Home
```

---

## Quran Reading Use Cases (Detail)

```mermaid
flowchart TD
    U([User])

    U --> BR[Browse Surahs]
    BR --> BRL["quranApi.listSurahs()\n→ 114 surahs cached stale:Infinity"]
    BRL --> SEL[Select Surah]
    SEL --> VR[Read Verses]
    VR --> VRL["quranApi.getVerses(surahId, page, translationId)\n→ 50 verses/page"]

    U --> TRANS[Change Translation]
    TRANS --> TS["authStore.setTranslationId(id)\n→ invalidates all ['verse', *, oldId] keys\n→ React Query re-fetches automatically"]

    VR --> TV[Tap a Verse]
    TV --> TAF[Open Tafsir]
    TAF --> TAFL["tafsirApi.getTafsirForVerse(key, 169)\nIbn Kathir commentary"]

    TV --> SAVE[Bookmark Verse]
    SAVE --> SAVEL["savedStore.addBookmark(verseKey)\n→ bookmarksApi.create() → Supabase"]

    TV --> AUD[Play Recitation]
    AUD --> AUDL["audioApi.getStreamUrl(verseKey, reciterId)\n→ expo-av playback\n→ MiniPlayer persists cross-screen"]

    TV --> WORD[Tap Arabic Word]
    WORD --> WORDL["quranApi.getWordDetail(wordKey)\nmorphology: root · POS · transliteration"]
    WORDL --> ROOT[View Root]
    ROOT --> ROOTL["quranApi.getVersesByRoot(root)\nall Quran occurrences of this root"]
```

---

## Spaced Repetition Use Cases (Detail)

```mermaid
flowchart TD
    U([User])

    U --> Q[Open Review Queue]
    Q --> QL["reviewStore.getDueCards()\nfilter: next_review_at <= today"]

    QL --> F[Run Flashcard]
    F --> FA["Show front: Arabic verse\nUser attempts recall"]
    FA --> FB["Show back: translation + tafsir hint"]
    FB --> RATE[Rate Difficulty]
    RATE --> R1[Again] & R2[Hard] & R3[Good] & R4[Easy]

    R1 --> SM2A["ease_factor -= 0.2\ninterval = 1 day\nrepetitions = 0"]
    R2 --> SM2H["ease_factor -= 0.15\ninterval = max(1, prev×0.8)"]
    R3 --> SM2G["ease_factor unchanged\ninterval = prev × ease_factor"]
    R4 --> SM2E["ease_factor += 0.1\ninterval = prev × ease_factor × 1.3"]

    SM2A & SM2H & SM2G & SM2E --> SAVE["reviewStore.updateCard()\n→ AsyncStorage persist\n→ Supabase sync"]

    SAVE --> NEXT{More due\ncards?}
    NEXT -- Yes --> F
    NEXT -- No --> DONE[Review Complete Screen]
    DONE --> SUMMARY["Show: cards reviewed\ntime spent · next due date"]
```

---

## Crisis Flow Use Cases (Detail)

```mermaid
flowchart TD
    U([User]) --> ENTRY[Enter Crisis Flow]

    ENTRY --> MOOD[Select Mood]
    MOOD --> M1[Overwhelmed] & M2[Anxious] & M3[Sad] & M4[Grateful] & M5[Hopeful]

    M1 & M2 & M3 & M4 & M5 --> AI[AI Verse Selection]
    AI --> AIL["groqAI / mcpService\nsemantic search: mood → relevant verse"]
    AIL --> SEQ[CrisisSequence Component]

    SEQ --> S1["Step 1: Verse of Comfort\nArabic + translation revealed"]
    S1 --> S2["Step 2: Tafsir Context\n1-paragraph Ibn Kathir insight"]
    S2 --> S3["Step 3: Dhikr Timer\nLottie breathing animation\nSubhanAllah × 33"]
    S3 --> S4["Step 4: Reflection Prompt\n'What does this verse mean to you right now?'"]

    S4 --> RESULT[Result Screen]
    RESULT --> MOODAFTER[Select Mood After]
    MOODAFTER --> LOG["crisisStore.logSession()\n→ Supabase crisis_sessions\nmood_before · mood_after · dhikr_used"]
    LOG --> DELTA["Show mood delta\n+2 better · 0 same · -1 worse"]
```

---

## Community (Halaqa) Use Cases (Detail)

```mermaid
flowchart TD
    U([User]) & H([Host])

    H --> CREATE[Create Halaqa]
    CREATE --> CL["halaqaStore.createHalaqa(name, desc, scheduledAt)\n→ Supabase INSERT halaqas\nhost_id = auth.uid()"]
    CL --> NOTIFY["Schedule halaqa_alert notification\n15 min before scheduled_at"]

    U --> JOIN[Join Halaqa]
    JOIN --> JL["halaqaStore.joinHalaqa(halaqaId)\n→ Supabase INSERT halaqa_members\nrole = 'member'"]

    U --> VIEW[View Halaqa Detail]
    VIEW --> VL["Supabase realtime subscription\nhalaqas + halaqa_members + halaqa_insights"]

    VIEW --> INSIGHT[Post Insight]
    INSIGHT --> IL["INSERT halaqa_insights\n{halaqa_id, user_id, content, verse_key}"]

    H --> LANTERN[Start Lantern Ceremony]
    LANTERN --> LL["LanternGlow component\nbrightness = (completedMembers / totalMembers)\nAnimated.loop pulse"]
```

---

## Share Card Use Cases (Detail)

```mermaid
flowchart TD
    U([User]) --> OPEN[Open Profile / Share Card]

    OPEN --> RENDER[Render Journey Card]
    RENDER --> R1["CARD_W = screenWidth - 28\nCARD_H = CARD_W × 1.42"]
    R1 --> R2["4-layer LinearGradient\ndark parchment · gold shimmer\nvignette · centre glow"]
    R2 --> R3["Decorative layers:\nArabic 'الله' watermark\nMosque skyline (11% opacity)\nCrescent + star (10% opacity)"]
    R3 --> R4["Content layers:\nBismillah header\nBrand row (نور / N·O·O·R)\nRub el Hizb emblem\nUsername · Madhab\nRank badge (Seeker→Scholar)\nStats box (streak · best · verses · dhikr)\nActive days pill\nQuranic ayah (2:186)\nFooter band"]

    RENDER --> BUTTONS[Action Buttons]

    BUTTONS --> GALLSAVE[Save to Gallery]
    GALLSAVE --> G1["MediaLibrary.requestPermissionsAsync()"]
    G1 --> G2{Granted?}
    G2 -- No --> G3[Alert: permission needed]
    G2 -- Yes --> G4["captureRef(cardRef, {format:'png', quality:1})\n→ react-native-view-shot"]
    G4 --> G5["MediaLibrary.saveToLibraryAsync(uri)"]
    G5 --> G6["Alert: 'Saved ✦ to your gallery'"]

    BUTTONS --> EXTERNAL[Share Externally]
    EXTERNAL --> E1["captureRef() → tmpfile URI"]
    E1 --> E2["Share.share({url, message})\nnative iOS/Android share sheet"]
```
