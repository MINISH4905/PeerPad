# GodMode AI: Tech Stack Documentation

This document outlines the technologies, frameworks, and libraries used to build GodMode AI.

## 1. Frontend Architecture
The frontend is a modern, high-performance Single Page Application (SPA) built with **React** and **Vite**.

*   **Framework:** [React 19](https://react.dev/)
*   **Build Tool:** [Vite 8](https://vitejs.dev/) (Optimized for speed and HMR)
*   **Routing:** [React Router 7](https://reactrouter.com/) (Handles navigation between Home, Login, and Workspace)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) (Used for smooth transitions and micro-interactions)
*   **3D Elements:** [Spline](https://spline.design/) (`@splinetool/react-spline`) (Used for the immersive background and landing page assets)
*   **Icons:** [Lucide React](https://lucide.dev/) (Consistent, clean iconography)
*   **Styling:** Vanilla CSS3 (Using modern features like CSS Variables/Tokens for theming)

## 2. Backend Infrastructure
The backend is a lightweight, asynchronous API built with **Python** and **FastAPI**.

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (High performance, standard Python type hints)
*   **Server:** [Uvicorn](https://www.uvicorn.org/) (ASGI server for high concurrency)
*   **Data Validation:** [Pydantic](https://docs.pydantic.dev/) (Ensures strict request/response data structures)
*   **Asynchronous HTTP:** [HTTPX](https://www.python-httpx.org/) (Used for non-blocking communication with the Ollama API)

## 3. AI & NLP Layer
GodMode AI uses a "Hybrid Intelligence" approach, combining large language models with deterministic statistical NLP.

*   **Local Inference:** [Ollama](https://ollama.com/) (Runs Llama 3 and Mistral locally to ensure privacy and low latency)
*   **LLM 1 (Supporter):** [Llama 3](https://llama.meta.com/llama3/) (8B model optimized for dialogue and argument generation)
*   **LLM 2 (Critic):** [Mistral](https://mistral.ai/) (Known for its concise reasoning and critical capabilities)
*   **NLP Heuristics:** [Scikit-learn](https://scikit-learn.org/) (Used for TF-IDF vectorization and Cosine Similarity calculation to detect debate overlap)
*   **Text Processing:** [NLTK](https://www.nltk.org/) (Used for tokenization and basic linguistic processing)

## 4. Development & Tooling
*   **Runtime:** Node.js (Frontend development server)
*   **Package Manager:** npm
*   **Environment:** Windows (PowerShell)
*   **Logging:** Custom Python logging module for backend tracking.

---

## System Workflow Overview
1.  **Frontend (React)** sends a debate topic to the **Backend (FastAPI)**.
2.  **Backend** orchestrates a multi-turn dialogue by calling **Ollama (Llama 3/Mistral)** via **HTTPX**.
3.  The **Analyst Service** processes the final transcript using **Scikit-learn** to generate lexical similarity metrics.
4.  A final recommendation is generated and streamed back to the user via **Server-Sent Events (SSE)** for a real-time experience.
