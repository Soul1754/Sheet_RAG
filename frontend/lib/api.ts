import axios from "axios";

const API_URL = "/api";

// Add a simple retry interceptor
axios.interceptors.response.use(undefined, async (error) => {
  const { config } = error;

  // Set default retry count if not present
  const maxRetries = config.retry !== undefined ? config.retry : 2;

  if (!config || maxRetries <= 0) return Promise.reject(error);

  config.retryCount = config.retryCount || 0;

  if (config.retryCount >= maxRetries) {
    return Promise.reject(error);
  }

  config.retryCount += 1;
  console.log(`Retrying request (${config.retryCount}/${maxRetries})...`);

  // Backoff delay: 1s, 2s, 3s...
  await new Promise((resolve) => setTimeout(resolve, 1000 * config.retryCount));

  return axios(config);
});

export interface Citation {
  text: string;
  score: number;
  metadata: any;
}

export interface ChatResponse {
  response: string;
  citations: Citation[];
}

export interface Paper {
  arxiv_id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  pdf_url: string;
  categories?: string[];
}

export interface RecommendedPaper {
  arxiv_id: string;
  title: string;
  summary: string;
  url: string;
  year: string;
  score: number;
}

export interface IngestedPaper {
  arxiv_id: string;
  title: string;
  authors: string[];
  summary: string;
  pages: number;
  ingested_at: string;
  updated_at: string;
}

export const api = {
  search: async (
    query: string,
    maxResults: number = 10,
    category?: string,
    year?: string,
  ) => {
    return axios.post<{ status: string; results: Paper[] }>(
      `${API_URL}/search`,
      {
        query,
        max_results: maxResults,
        category,
        year,
      },
    );
  },
  ingest: async (arxivId: string) => {
    return axios.post(`${API_URL}/ingest`, { arxiv_id: arxivId });
  },
  ingestBatch: async (arxivIds: string[]) => {
    return axios.post(`${API_URL}/ingest-batch`, { arxiv_ids: arxivIds });
  },
  chat: async (message: string, conversationId: string = "default") => {
    return axios.post<ChatResponse>(`${API_URL}/chat`, {
      message,
      conversation_id: conversationId,
    });
  },
  // Recommendations
  getRecommendationsByQuery: async (query: string) => {
    return axios.get<{ recommendations: RecommendedPaper[] }>(
      `${API_URL}/recommendations/query`,
      {
        params: { query },
      },
    );
  },
  getRecommendationsByPaper: async (paperId: string) => {
    return axios.get<{ recommendations: RecommendedPaper[] }>(
      `${API_URL}/recommendations/similar/${paperId}`,
    );
  },
  // Papers Library
  getPapers: async () => {
    return axios.get<{ papers: IngestedPaper[]; stats: any }>(
      `${API_URL}/papers`,
    );
  },
  getPaper: async (arxivId: string) => {
    return axios.get<IngestedPaper>(`${API_URL}/papers/${arxivId}`);
  },
  deletePaper: async (arxivId: string) => {
    return axios.delete(`${API_URL}/papers/${arxivId}`);
  },
  searchLibrary: async (query: string) => {
    return axios.get(`${API_URL}/papers/search/${query}`);
  },
  // Chat History
  getChatHistory: async (conversationId: string = "default") => {
    return axios.get(`${API_URL}/chat-history/${conversationId}`);
  },
  clearChatHistory: async (conversationId: string = "default") => {
    return axios.delete(`${API_URL}/chat-history/${conversationId}`);
  },
  submitFeedback: async (
    messageId: string,
    feedback: "up" | "down",
    conversationId: string = "default",
  ) => {
    return axios.post(`${API_URL}/feedback`, {
      message_id: messageId,
      feedback,
      conversation_id: conversationId,
    });
  },
  getAnalytics: async () => {
    return axios.get(`${API_URL}/analytics`);
  },
  // Export functions
  exportChatMarkdown: async (conversationId: string = "default") => {
    const response = await axios.get(
      `${API_URL}/export/chat/${conversationId}/markdown`,
      {
        responseType: "blob",
      },
    );
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `chat_${conversationId}.md`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  getBibtex: async (arxivId: string) => {
    return axios.get<{ arxiv_id: string; bibtex: string }>(
      `${API_URL}/export/bibtex/${arxivId}`,
    );
  },
  exportAllBibtex: async () => {
    const response = await axios.get(`${API_URL}/export/bibtex/all`, {
      responseType: "blob",
    });
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "library.bib");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Sheet RAG API
  chatV2: async (
    message: string,
    options: {
      conversationId?: string;
      useCrossValidation?: boolean;
      topK?: number;
    } = {},
  ) => {
    return axios.post<SheetRAGChatResponse>(`${API_URL}/chat-v2`, {
      message,
      conversation_id: options.conversationId || "default",
      use_cross_validation: options.useCrossValidation ?? true,
      top_k: options.topK || 5,
    });
  },

  sheetRagIngest: async (arxivId: string) => {
    return axios.post(`${API_URL}/sheet-rag/ingest`, { arxiv_id: arxivId });
  },

  sheetRagIngestBatch: async (arxivIds: string[]) => {
    return axios.post(`${API_URL}/sheet-rag/ingest-batch`, {
      arxiv_ids: arxivIds,
    });
  },

  sheetRagStats: async () => {
    return axios.get<SheetRAGStats>(`${API_URL}/sheet-rag/stats`);
  },

  runEvaluation: async (customQueries?: string[]) => {
    return axios.post(`${API_URL}/evaluate`, customQueries);
  },
  uploadPapers: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return axios.post(`${API_URL}/upload-paper`, formData);
  },
};

// Sheet RAG Types
export interface SheetRAGSource {
  text: string;
  level: string;
  score: number;
  chunk_id: string;
  metadata: any;
  validation?: {
    confidence: number;
    layer_coverage: number;
    supporting_layers: string[];
  };
}

export interface SheetRAGValidation {
  count: number;
  avg_confidence: number;
  avg_layer_coverage: number;
  fully_validated: number;
}

export interface SheetRAGChatResponse {
  response: string;
  sources: SheetRAGSource[];
  validation: SheetRAGValidation;
  layers_searched: Record<string, number>;
  conversation_id: string;
  engine: string;
}

export interface SheetRAGStats {
  layers: Record<string, { chunk_count: number; collection_name: string }>;
  total_chunks: number;
  persist_dir: string;
}
