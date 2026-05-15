# GodMode AI: Comprehensive Technical Reference (Updated)

This document details the libraries, functions, use cases, and the exact data flow of how user input is transformed into AI-generated arguments.

---

## 1. System Use Cases
*   **Strategic Decision Making:** Evaluating business proposals (e.g., "Should we expand to APAC?").
*   **Policy Analysis:** Examining organizational policies for balanced middle grounds.
*   **Educational Debating:** Understanding opposing viewpoints on ethical or technical topics.
*   **Content Refining:** Stress-testing a thesis statement or argument.

---

## 2. File Locations & Directory Mapping
| Component | Primary File Location |
| :--- | :--- |
| **Frontend Input** | `src/components/TopicInput.jsx` (or similar) |
| **API Endpoint** | `backend/routers/debate.py` |
| **Dialogue Orchestrator**| `backend/services/debate_service.py` |
| **Agent Logic** | `backend/agents/supporter.py` & `critic.py` |
| **LLM Interface** | `backend/services/llm_service.py` |
| **Prompt Templates** | `backend/core/constants.py` |

---

## 3. Data Flow: How the Argument Gets Its Input
This section traces the path of a single "Topic" from the user's keyboard to the LLM's brain.

### Step 1: User Submission (Frontend)
The user types a topic into the UI. The frontend sends a JSON request to the backend:
```json
{ "topic": "Should we use AI for legal advice?", "exchanges": 4 }
```

### Step 2: Request Reception (Router)
The `backend/routers/debate.py` receives this as a `DebateStartRequest`. It extracts the `topic` and passes it to the `run_debate` service.

### Step 3: Orchestration (Service)
The `backend/services/debate_service.py` starts the debate loop.
*   **Context Building:** It maintains a `context` string that grows with every turn.
*   **Agent Call:** It calls the Supporter/Critic agents, passing both the **Topic** and the current **Context**.

### Step 4: Persona & Topic Injection (Agents)
In `backend/agents/supporter.py`, the code merges the topic into the system prompt:
```python
# The {topic} placeholder in constants.py is replaced here
system_prompt = SUPPORTER_PROMPT.format(topic=topic)

# The conversation history (context) is added as the 'user' prompt
prompt = f"Previous debate context:\n{context}\n\nProvide your next strong argument..."
```

### Step 5: Final LLM Execution (LLM Service)
The `llm_service.py` takes the **Formatted System Prompt** (Topic + Persona) and the **User Prompt** (Context + Call to action) and sends them to Ollama.
*   **Input Result:** The LLM now knows exactly what it is arguing about (The Topic), who it is (The Persona), and what has already been said (The Context).

---

## 4. Deep Dive: How the LLM Engine Works
GodMode AI orchestrates a complex dialogue state machine using local inference.

### A. The Local Inference Layer (Ollama)
*   **Interaction:** Communicates via HTTP POST to `/api/generate`.
*   **Model Loading:** Llama 3 or Mistral are loaded into VRAM on-demand.
*   **Parameters:** `temperature: 0.7` balances creativity with argumentative coherence.

### B. Asynchronous Execution Pipeline
*   **Non-Blocking:** Uses `asyncio` and `httpx` to handle long generations.
*   **Streaming:** Uses `async generator` (`yield`) to push messages to the UI in real-time.

### C. Resilience Logic
*   **Timeout:** 120s limit per model call.
*   **Retry Loop:** 3 attempts per turn to handle transient hardware or connection errors.

---

## 5. Function & Parameter Reference

### `nlp_service.py` -> `perform_analysis`
*   **File:** `backend/services/nlp_service.py`
*   **Logic:** Uses **TF-IDF** and **Cosine Similarity** to mathematically measure the overlap between the Supporter and Critic's full text.

### `config.py` -> `Settings`
*   **File:** `backend/core/config.py`
*   **Tunables:** `SUPPORTER_MODEL`, `CRITIC_MODEL`, `MAX_CONTEXT_EXCHANGES`.

---

**Summary:** The "Input" to an argument is a composite of the **User's Topic**, the **Agent's Persona**, and the **Ongoing Conversation History**. This ensures every turn is relevant, grounded, and intensely focused on the subject.
