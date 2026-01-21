const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatRequest {
  message: string;
  session_id?: string;
  conversation_history?: Array<{ user: string; assistant: string }>;
}

export interface NewsArticle {
  title: string;
  description?: string;
  source: string;
  published?: string;
  url?: string;
}

export interface ChatResponse {
  response: string;
  chart_request?: {
    needs_chart: boolean;
    countries?: string[];
    date_range?: { start: string; end: string };
    chart_type?: string;
    title?: string;
  };
  session_id: string;
  blocked: boolean;
  error?: string;
  news?: NewsArticle[];
  countries_mentioned?: string[];
}

export interface ChartRequest {
  countries: string[];
  date_range: { start: string; end: string };
  chart_type: string;
  title: string;
}

export interface ChartResponse {
  chart_url: string;
  base64_image: string;
  filename: string;
}

export interface HealthResponse {
  status: string;
  data_loaded: boolean;
  countries_count: number;
  date_range: { start: string; end: string };
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

export async function generateChart(request: ChartRequest): Promise<ChartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-chart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}
