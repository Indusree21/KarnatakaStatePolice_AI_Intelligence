// API Service Handler for Person A (Backend & AI)
const API_BASE_URL = "http://localhost:5000/api";

export async function sendQueryToAI(query, language = "EN") {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, language }),
    });

    if (!response.ok) {
      throw new Error("Failed to reach AI Backend");
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable, using client-side response mode.", error);
    return null; // Fallback to local mock data inside ChatContainer
  }
}