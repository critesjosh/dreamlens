DreamLens

Product Requirements Document

  ----------------- -----------------------------------------------------
  **Version**       1.0

  **Date**          December 2024

  **Product Type**  Progressive Web Application (PWA)
  ----------------- -----------------------------------------------------

Executive Summary

DreamLens is a progressive web application that enables users to record,
analyze, and understand their dreams through multiple psychological and
cultural interpretation frameworks. The application leverages large
language models from multiple providers (OpenAI, Anthropic, Google) to
deliver personalized dream interpretations, while maintaining robust
offline functionality and a sleep-friendly interface.

The product differentiates itself by offering comparative analysis
across interpretation methodologies (Jungian, Freudian, Gestalt,
Islamic, Indigenous, Cognitive Neuroscience, and Existential
approaches), allowing users to gain multifaceted insights into their
dream content. A personal dream dictionary and recurring theme detection
system helps users build a longitudinal understanding of their
subconscious patterns.

Product Vision

Problem Statement

Dreams offer a window into our subconscious, but interpreting them
requires knowledge across multiple psychological traditions. Most people
lack access to this specialized knowledge, and existing dream apps offer
only superficial symbol lookups without contextual analysis.
Additionally, the fleeting nature of dream memories means details are
often lost before they can be recorded.

Solution

DreamLens provides immediate voice-to-text dream capture optimized for
the moments after waking, combined with AI-powered interpretation
through multiple psychological lenses. Users can compare how different
frameworks analyze the same dream, engage in follow-up conversations to
explore deeper meanings, and track patterns over time through
intelligent theme detection.

Goals

1.  Enable frictionless dream capture immediately upon waking

2.  Provide comprehensive interpretation through seven distinct
    psychological and cultural frameworks

3.  Allow comparative analysis between interpretation methods and LLM
    models

4.  Support deep exploration through conversational follow-up

5.  Build personalized understanding through dream dictionaries and
    pattern detection

6.  Function reliably offline with full synchronization when connected

Target Users

Primary Personas

1.  **The Curious Self-Explorer:** Individuals interested in personal
    growth and self-understanding who want to use dreams as a tool for
    insight. They appreciate multiple perspectives and enjoy comparing
    different interpretive frameworks.

2.  **The Spiritual Seeker:** Users who view dreams as spiritually
    significant and want access to traditional interpretation methods
    (Islamic, Indigenous) alongside modern psychological approaches.

3.  **The Therapy-Adjacent User:** People currently in or considering
    therapy who want to prepare dream content for discussion with their
    therapist, or supplement therapeutic work between sessions.

4.  **The Pattern Tracker:** Analytically-minded users interested in
    identifying recurring themes, symbols, and patterns in their dreams
    over time.

Feature Requirements

F1: Dream Capture System

F1.1 Voice-to-Text Recording

**Priority:** P0 (Critical)

**Description:** Users can record dreams verbally immediately upon
waking. The system transcribes speech to text in real-time with support
for mumbled or half-awake speech patterns.

**Requirements:**

-   One-tap activation from lock screen or home screen widget

-   Real-time transcription with visual feedback

-   Support for pauses, corrections, and additions

-   Offline transcription capability using on-device models

-   Audio file retention for later review/correction

-   Automatic timestamp and date assignment

F1.2 Tagging System

**Priority:** P0 (Critical)

**Description:** Flexible tagging system for categorizing dreams by
emotions, themes, people, places, and custom categories.

**Requirements:**

-   Pre-defined tag categories: Emotions, Themes, People, Places,
    Objects, Actions

-   Custom tag creation with color coding

-   AI-suggested tags based on dream content

-   Tag autocomplete from personal tag history

-   Multi-select tag application

-   Tag-based filtering and search across dream journal

F2: Interpretation Engine

F2.1 Interpretation Frameworks

**Priority:** P0 (Critical)

**Description:** Seven distinct interpretation methodologies, each with
specialized prompting and contextual knowledge.

**Supported Frameworks:**

  ------------------------------------------------------------------------------
  **Framework**             **Description & Focus**
  ------------------------- ----------------------------------------------------
  **Carl Jung**             Archetypes, collective unconscious, shadow work,
                            anima/animus, individuation process, symbolic
                            amplification

  **Sigmund Freud**         Wish fulfillment, latent vs manifest content,
                            psychosexual symbolism, defense mechanisms,
                            childhood experiences

  **Gestalt**               Every element as a projection of self,
                            present-moment awareness, integration of fragmented
                            parts, role-playing dialogue

  **Islamic (Ibn Sirin)**   Traditional Islamic dream interpretation, prophetic
                            symbolism, spiritual guidance, moral implications,
                            Quranic references

  **Indigenous/Shamanic**   Spirit communication, ancestral messages, nature
                            symbolism, healing journeys, community significance

  **Cognitive               Memory consolidation, emotional processing, threat
  Neuroscience**            simulation, problem-solving activation, neural
                            pattern analysis

  **Existential**           Meaning-making, authentic self, freedom and
                            responsibility, death awareness, lived experience,
                            phenomenological exploration
  ------------------------------------------------------------------------------

F2.2 LLM Provider Integration

**Priority:** P0 (Critical)

**Description:** Support for multiple LLM providers with
user-configurable API keys and model selection.

**Supported Providers:**

-   **OpenAI:** GPT-4o, GPT-4o-mini, GPT-4 Turbo

-   **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku

-   **Google:** Gemini 1.5 Pro, Gemini 1.5 Flash

**Requirements:**

-   Secure API key storage with encryption at rest

-   Per-provider rate limiting and error handling

-   Cost estimation display before interpretation

-   Fallback provider configuration

-   Response streaming for real-time display

F3: Comparison Features

F3.1 Side-by-Side Framework Comparison

**Priority:** P0 (Critical)

**Description:** Display interpretations from multiple frameworks
simultaneously for the same dream.

**Requirements:**

-   Select 2-4 frameworks for parallel interpretation

-   Synchronized scrolling between interpretation panels

-   Highlight common themes identified across frameworks

-   Collapsible panels for focused reading

-   Export comparison as unified report

F3.2 Side-by-Side Model Comparison

**Priority:** P1 (High)

**Description:** Compare interpretations from different LLM models using
the same framework.

**Requirements:**

-   Select 2-3 models for parallel interpretation

-   Display cost and response time per model

-   User rating system for interpretation quality

-   Aggregated quality metrics over time per model

F4: Conversational Features

F4.1 Follow-Up Conversation Mode

**Priority:** P0 (Critical)

**Description:** Enable users to ask follow-up questions and explore
specific aspects of their dream interpretation in a conversational
interface.

**Requirements:**

-   Persistent conversation context within dream entry

-   Suggested follow-up questions based on interpretation

-   Ability to switch frameworks mid-conversation

-   Symbol deep-dive: tap any symbol for expanded analysis

-   Conversation history saved with dream entry

-   Voice input for follow-up questions

F5: Personal Dream Dictionary

**Priority:** P0 (Critical)

**Description:** User-curated dictionary of personal symbol meanings
that informs future interpretations.

**Requirements:**

-   Manual symbol entry with personal meaning

-   Auto-suggested symbols from dream history

-   Association linking between related symbols

-   Emotional valence tagging (positive/negative/neutral)

-   Personal context notes (why this symbol matters to you)

-   Dictionary integration into interpretation prompts

-   Frequency tracking per symbol

-   Import/export dictionary functionality

F6: Recurring Theme Detection

**Priority:** P0 (Critical)

**Description:** Automated analysis identifying patterns, recurring
symbols, and themes across the user\'s dream history.

**Requirements:**

-   Automatic symbol extraction from all dreams

-   Frequency analysis with temporal visualization

-   Theme clustering using semantic similarity

-   Correlation detection between themes and tags (emotions, life
    events)

-   Pattern alerts when recurring themes reach significance threshold

-   Monthly/quarterly pattern reports

-   Cross-reference with personal dream dictionary

F7: Offline Support & Dark Mode

F7.1 Offline Functionality

**Priority:** P0 (Critical)

**Description:** Full dream capture and journaling capability without
internet connection.

**Requirements:**

-   Service worker implementation for full PWA offline support

-   On-device speech-to-text using Web Speech API or downloaded models

-   IndexedDB storage for dreams, dictionary, and settings

-   Queued interpretation requests that process when online

-   Conflict resolution for multi-device sync

-   Clear online/offline status indicator

F7.2 Aggressive Dark Mode

**Priority:** P0 (Critical)

**Description:** Sleep-optimized dark interface designed for use in dark
rooms immediately after waking.

**Requirements:**

-   True black (#000000) background for OLED screens

-   Maximum contrast reduction: dim amber/red text options

-   Auto-activation based on time of day (configurable)

-   No white flashes during transitions or loading states

-   Adjustable brightness independent of system settings

-   Large touch targets for half-awake interaction

-   Blue light filter integration

User Stories

Dream Capture

1.  As a user who just woke from a vivid dream, I want to tap one button
    and start speaking so that I can capture details before they fade.

2.  As a user recording a dream, I want to see my words transcribed in
    real-time so that I know the system is capturing my account
    accurately.

3.  As a user in a dark room, I want the interface to be extremely dim
    so that I don\'t hurt my eyes or fully wake up.

Interpretation

1.  As a user curious about Jungian psychology, I want to see my dream
    interpreted through Jung\'s framework so that I can understand its
    archetypal significance.

2.  As a Muslim user, I want access to traditional Islamic dream
    interpretation so that I can understand my dreams within my faith
    tradition.

3.  As a scientifically-minded user, I want a cognitive neuroscience
    perspective so that I can understand what my brain might be
    processing.

Comparison

1.  As a user interested in multiple perspectives, I want to see Jungian
    and Freudian interpretations side-by-side so that I can compare
    their insights.

2.  As a power user with multiple API keys, I want to compare how
    different AI models interpret the same dream so that I can find the
    most insightful model.

3.  As a user exploring a complex dream, I want to ask follow-up
    questions about specific symbols so that I can dig deeper into their
    meaning.

Personal Journal

1.  As a long-term user, I want to see which symbols appear most
    frequently in my dreams so that I can understand my recurring
    themes.

2.  As a user who dreams frequently about water, I want to define what
    water means to me personally so that future interpretations
    incorporate my context.

3.  As a user without internet access, I want to record and tag my
    dreams offline so that I never miss capturing a significant dream.

Technical Requirements

Architecture

1.  **Frontend:** React/Next.js with PWA capabilities (service workers,
    manifest, offline storage)

2.  **State Management:** IndexedDB for persistent local storage, React
    Query for server state

3.  **Backend:** Edge functions (Vercel/Cloudflare) for API proxy and
    key management

4.  **Database:** PostgreSQL with row-level security for user data

5.  **Authentication:** Auth.js (NextAuth) with email magic links and
    OAuth providers

6.  **Speech-to-Text:** Web Speech API with Whisper fallback for offline

API Integration

-   Unified LLM interface abstracting provider differences

-   Streaming response handling for all providers

-   Token counting and cost calculation pre-request

-   Retry logic with exponential backoff

-   Request queuing for offline-to-online transitions

Security & Privacy

-   End-to-end encryption option for dream content

-   API keys encrypted at rest, never logged

-   GDPR/CCPA compliant data export and deletion

-   No dream content used for training without explicit consent

-   Local-only mode option (no cloud sync)

Non-Functional Requirements

  -----------------------------------------------------------------------
  **Requirement**       **Target**
  --------------------- -------------------------------------------------
  Time to Record        \< 3 seconds from app launch to recording

  Offline Reliability   100% of capture features available offline

  Interpretation Speed  First token \< 2 seconds, full response \< 30
                        seconds

  Dark Mode Brightness  \< 5 nits maximum screen brightness in night mode

  Accessibility         WCAG 2.1 AA compliance

  Browser Support       Chrome, Safari, Firefox, Edge (latest 2 versions)
  -----------------------------------------------------------------------

MVP Scope

The minimum viable product focuses on core dream capture and
interpretation with a subset of features to validate market fit.

MVP Features (Phase 1)

1.  Voice-to-text dream capture with basic text editing

2.  Simple tagging system (emotions, manual tags)

3.  Three interpretation frameworks: Jung, Freud, Cognitive Neuroscience

4.  Single LLM provider (OpenAI GPT-4o)

5.  Basic follow-up conversation (3 turns)

6.  Aggressive dark mode

7.  Offline dream capture (interpretation requires connectivity)

Phase 2 Additions

-   All seven interpretation frameworks

-   Multi-provider LLM support

-   Side-by-side framework comparison

-   Personal dream dictionary

-   AI-suggested tags

Phase 3 Additions

-   Side-by-side model comparison

-   Recurring theme detection and analytics

-   Full offline support including queued interpretations

-   Pattern reports and visualization

Success Metrics

1.  **Activation:** 60% of signups record at least one dream within
    first week

2.  **Engagement:** Active users record average 3+ dreams per week

3.  **Retention:** 40% monthly retention at 6 months

4.  **Feature Usage:** 50% of interpretations use follow-up conversation

5.  **Comparison Usage:** 30% of users try framework comparison within
    first month

6.  **Dictionary Adoption:** 25% of 30-day active users create 5+
    personal symbol entries

Risks & Mitigations

  -----------------------------------------------------------------------
  **Risk**                **Impact**              **Mitigation**
  ----------------------- ----------------------- -----------------------
  LLM API costs exceed    High                    Cost estimation UI,
  expectations                                    usage caps, smaller
                                                  model defaults

  Offline speech-to-text  Medium                  Audio retention for
  quality issues                                  later re-transcription
                                                  when online

  Cultural sensitivity in High                    Expert review of
  interpretations                                 prompts, user feedback
                                                  system, disclaimers

  Users interpret         High                    Clear disclaimers,
  psychological content                           mental health resource
  as medical advice                               links, ToS
  -----------------------------------------------------------------------

Appendix: Prompt Engineering Notes

Each interpretation framework requires a specialized system prompt that
establishes the theoretical foundation, key concepts to apply, and
output structure. Prompts should incorporate user\'s personal dream
dictionary when available and maintain the framework\'s authentic voice
while remaining accessible to non-experts.

The follow-up conversation system should maintain framework consistency
across turns while allowing users to request framework switches.
Suggested follow-up questions should be generated based on identified
symbols and themes that warrant deeper exploration.
