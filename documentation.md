# GodMode AI: System Architecture and Logic Documentation

GodMode AI is an advanced multi-agent debate system designed to evaluate topics from multiple perspectives before arriving at a balanced, actionable solution. The system orchestrates a simulated debate between AI agents using different Large Language Models (LLMs) and concludes with an analysis powered by a hybrid approach combining traditional Natural Language Processing (NLP) and Generative AI.

## 1. System Overview

The core architecture consists of three distinct agents, each with a specific role:

1. **The Supporter (Optimax):** Argues in favor of the given topic.
2. **The Critic (Skeptis):** Argues against the topic, countering the Supporter's points.
3. **The Analyst (Synthesys):** Reviews the entire debate transcript, calculates metrics, determines a winner, and generates a final balanced recommendation.

The system utilizes local LLM inference via **Ollama**, optimizing for privacy and eliminating API costs. To manage VRAM usage, the system truncates the context history passed to the agents during long debates.

---

## 2. LLM Integration: Llama 3 and Mistral

GodMode AI explicitly pairs different state-of-the-art models against each other to foster a more robust and diverse debate.

### The Supporter Model: Llama 3
* **Role:** Generates arguments supporting the topic.
* **Implementation:** The `generate_supporter_argument` function in `agents/supporter.py` calls the `call_llama` function in `services/llm_service.py`.
* **Why Llama 3?** It is used as the default Supporter (`settings.SUPPORTER_MODEL`) to provide coherent, strong, and highly structured arguments in favor of the premise.

### The Critic Model: Mistral
* **Role:** Generates counter-arguments and identifies flaws in the Supporter's logic.
* **Implementation:** The `generate_critic_argument` function in `agents/critic.py` calls the `call_mistral` function in `services/llm_service.py`.
* **Why Mistral?** Assigned as the default Critic (`settings.CRITIC_MODEL`), Mistral is known for its strong reasoning and critical analysis capabilities, making it ideal for finding loopholes and presenting opposing viewpoints.

*Note: The LLM service communicates asynchronously with the local Ollama instance (`http://localhost:11434/api/generate`) using the `httpx` library, including retry logic and timeout handling to ensure stability.*

---

## 3. The Hybrid Model & NLP Logic (The Analyst)

The Analyst agent does not rely solely on an LLM to evaluate the debate. Instead, it employs a **Hybrid Model** within `services/nlp_service.py`, combining traditional, deterministic NLP heuristics (using `scikit-learn`) with the generative power of an LLM.

### Phase 1: Traditional NLP Processing (Scikit-Learn)
Before asking an LLM for an opinion, the system computes objective metrics about the debate text.

1. **TF-IDF Vectorization:**
   * The Supporter's full text and the Critic's full text are processed using `TfidfVectorizer(stop_words='english')`.
   * This converts the raw text into a matrix of TF-IDF (Term Frequency-Inverse Document Frequency) features, highlighting the most important keywords used by each side while filtering out common English stop words.

2. **Cosine Similarity:**
   * The system calculates the `cosine_similarity` between the Supporter's TF-IDF vector and the Critic's TF-IDF vector.
   * **Purpose:** This measures how closely the two arguments align in terminology. A high similarity score suggests the Critic is directly addressing the Supporter's specific points (or that the arguments are overlapping), while a low score suggests they are talking past each other.

3. **Scoring and Winner Determination:**
   * **Word Count Heuristic:** The system counts the unique words (`len(set(words))`) used by both the Supporter and the Critic.
   * **Winner Selection:** If one side's unique word count exceeds the other's by a margin of 10 or more, they are declared the "winner". Otherwise, the debate is considered a "tie".
   * **Confidence Score Calculation:** A confidence score is calculated based on the relative difference in unique word counts, penalized by the cosine similarity (i.e., higher similarity reduces confidence in a clear winner, as the arguments are too entangled). The score is bounded between `0.1` and `0.95`.

4. **Summary Generation:**
   * Based on the calculated winner and similarity score, the system dynamically generates a structured summary paragraph explaining the outcome.

### Phase 2: Generative AI Processing (Llama 3)
After computing the metrics and summary, the system uses Generative AI to formulate a final conclusion.

1. **Solution Generation:**
   * The entire debate transcript is passed back to **Llama 3** (via `call_llama`) with a strict prompt: *"Based on the following debate transcript, provide a precise and optimum solution (max 3 lines) that balances both perspectives."*
   * The system prompt forces Llama 3 into an "expert mediator" persona.

2. **Output Sanitization:**
   * Since LLMs often prepend conversational filler (e.g., "Here is the solution:"), the system strips out a predefined list of common prefixes to ensure the output is purely actionable and concise.

---

## 4. Summary of the Data Flow

1. **Initialization:** User provides a topic.
2. **Debate Loop (N Exchanges):**
   * **Turn A:** Supporter (Llama 3) generates a pro-argument based on context.
   * **Turn B:** Critic (Mistral) generates a counter-argument based on context.
   * Context is truncated to the last `MAX_CONTEXT_EXCHANGES` to save VRAM.
3. **Analysis:**
   * `nlp_service.py` converts arguments to TF-IDF vectors.
   * Calculates Cosine Similarity.
   * Determines winner and confidence based on lexical heuristics.
   * Requests a 1-3 line balanced solution from Llama 3.
4. **Final Output:** The frontend dynamically renders the chat thread, culminating in Synthesys (The Analyst) presenting the final recommendation and debate metrics.
