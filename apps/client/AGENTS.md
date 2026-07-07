# Tether Developers Cup Rules

All development within this workspace must strictly adhere to the official Tether Developers Cup rules. Keep these guidelines in mind during planning, implementation, and code modifications.

---

## 1. Project Theme: Football Ecosystem
* **Requirement:** The project must relate to football and the global tournament ecosystem.
* **Examples of valid themes:** Fan engagement, teams/clubs/coaches/matches, predictions, watch parties, ticketing, fantasy experiences, communities, and tipping.
* *Do not implement features or applications that fall outside the tournament/football theme.*

---

## 2. Technical and Track Requirements

### Pears Track (Peer-to-Peer)
* Networking must use the **Pears / Holepunch stack** running on Bare (e.g., Hyperswarm, Bare runtime).
* **Warning:** Pure WebRTC alone does **not** satisfy this requirement.

### QVAC Track (On-device AI)
* **Crucial:** All AI workloads (including inference, embeddings, Retrieval-Augmented Generation (RAG), multimodal processing, and speech models) **must execute locally on the user's device** using the **QVAC SDK**.
* **Forbidden:** Cloud AI APIs (such as OpenAI, Gemini, Anthropic cloud endpoints, etc.) are **not permitted**.

### WDK Track (Self-custodial Wallet)
* Utilize the **Wallet Development Kit (WDK)** for self-custodial wallet features.

---

## 3. General Requirements and Setup
* **Open Source:** The codebase must be compatible with release under the **Apache 2.0 License**.
* **Deployability:** Keep setup and execution simple. Ensure the build remains functional and the application runs with clear setup/test instructions.

---

## Design Context

- **Register**: `product` (PitchOS client application).
- **Core Identity**: "The Sovereign Terminal" (High-density, cryptographic, tactile deck for P2P/self-custodial operations).
- **Brand Personality**: Minimalist, high-tech terminal/decentralized style. Dark-mode optimized, high contrast, cyber-cryptographic.
- **Design Guidelines**:
  - Refer to [PRODUCT.md](file:///home/lviffy/Projects/PitchOS/apps/client/PRODUCT.md) for strategy, purpose, and strategic principles.
  - Refer to [DESIGN.md](file:///home/lviffy/Projects/PitchOS/apps/client/DESIGN.md) for colors (OKLCH), typography (Inter/Geist Mono), components, and Do's/Don'ts.
  - Strictly adhere to "The Flat Boundary Rule" (no drop shadows; use flat slate backgrounds and thin borders instead) and "The Rarity of Pitch Green Rule" (primary accent green is <=10% of any viewport).

---

## 4. Reference Resources & Track SDK Docs
* **Official Rules File Path:** [TETHER_DEVELOPERS_CUP_RULES.md](file:///home/lviffy/Projects/PitchOS/TETHER_DEVELOPERS_CUP_RULES.md)
* **Pears Stack SDK Documentation:** [pear-docs.md](file:///home/lviffy/Projects/PitchOS/.agents/skills/Tracks/pear-docs.md)
* **QVAC SDK Documentation:** [qvac-docs.md](file:///home/lviffy/Projects/PitchOS/.agents/skills/Tracks/qvac-docs.md)
* **WDK SDK Documentation:** [wdk-docs.md](file:///home/lviffy/Projects/PitchOS/.agents/skills/Tracks/wdk-docs.md)


