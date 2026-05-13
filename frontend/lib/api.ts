import axios from "axios";

// Primary API URL is the Next.js proxy
const API_URL = "/api";

// Direct URL used as fallback for large uploads that might fail through the proxy
const DIRECT_API_URL = typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:8002' : '')
    : 'http://localhost:8002';

// Extend Axios types for retry functionality
declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: number;
    retryCount?: number;
  }
}

// Add a simple retry interceptor for general requests
axios.interceptors.response.use((response) => response, async (error) => {
    const { config } = error;
    const maxRetries = config?.retry !== undefined ? config.retry : 2;

    if (!config || maxRetries <= 0) return Promise.reject(error);

    config.retryCount = config.retryCount || 0;

    if (config.retryCount >= maxRetries) {
        return Promise.reject(error);
    }

    config.retryCount += 1;
    console.log(`[API] Retrying request (${config.retryCount}/${maxRetries})...`);

    // Backoff delay: 1s, 2s, 3s...
    await new Promise((resolve) => setTimeout(resolve, 1000 * config.retryCount));

    return axios(config);
});

export interface Citation {
    text: string;
    score: number;
    metadata: Record<string, unknown>;
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
    search: async (query: string, maxResults: number = 10, category?: string, year?: string) => {
        return axios.post<{ status: string, results: Paper[] }>(`${API_URL}/search`, {
            query,
            max_results: maxResults,
            category,
            year
        });
    },
    ingest: async (arxivId: string) => {
        return axios.post(`${API_URL}/ingest`, { arxiv_id: arxivId });
    },
    ingestBatch: async (arxivIds: string[]) => {
        return axios.post<{ success: boolean, message?: string }>(`${API_URL}/ingest-batch`, { arxiv_ids: arxivIds });
    },
    chat: async (message: string, conversationId: string = 'default') => {
        return axios.post<ChatResponse>(`${API_URL}/chat`, { message, conversation_id: conversationId });
    },
    // Recommendations
    getRecommendationsByQuery: async (query: string) => {
        // Support both old and new recommendation patterns
        return axios.get<{ recommendations: RecommendedPaper[] }>(`${API_URL}/recommendations/query`, {
            params: { query }
        });
    },
    getRecommendationsByPaper: async (paperId: string) => {
        return axios.get<{ recommendations: RecommendedPaper[] }>(`${API_URL}/recommendations/similar/${paperId}`);
    },
    // Papers Library
    getPapers: async () => {
        return axios.get<{ papers: IngestedPaper[], stats: Record<string, number> }>(`${API_URL}/papers`);
    },
    getPaper: async (arxivId: string) => {
        return axios.get<IngestedPaper>(`${API_URL}/papers/${arxivId}`);
    },
    deletePaper: async (arxivId: string) => {
        return axios.delete(`${API_URL}/papers/${arxivId}`);
    },
    searchLibrary: async (query: string) => {
        return axios.get<{ papers: IngestedPaper[] }>(`${API_URL}/papers/search/${query}`);
    },
    // Chat History
    getChatHistory: async (conversationId: string = 'default') => {
        return axios.get(`${API_URL}/chat-history/${conversationId}`);
    },
    clearChatHistory: async (conversationId: string = 'default') => {
        return axios.delete(`${API_URL}/chat-history/${conversationId}`);
    },
    submitFeedback: async (messageId: string, feedback: 'up' | 'down', conversationId: string = 'default') => {
        return axios.post(`${API_URL}/feedback`, {
            message_id: messageId,
            feedback,
            conversation_id: conversationId
        });
    },
    getAnalytics: async () => {
        return axios.get(`${API_URL}/analytics`);
    },
    // Export functions
    exportChatMarkdown: async (conversationId: string = 'default') => {
        const response = await axios.get(`${API_URL}/export/chat/${conversationId}/markdown`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `chat_${conversationId}.md`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
    getBibtex: async (arxivId: string) => {
        return axios.get<{ arxiv_id: string, bibtex: string }>(`${API_URL}/export/bibtex/${arxivId}`);
    },
    exportAllBibtex: async () => {
        try {
            const response = await axios.get<Blob>(`${API_URL}/export/bibtex/all`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'library.bib');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[API] Bulk export failed:', error);
        }
    },
    
    // Sheet RAG API
    chatV2: async (message: string, options: { conversationId?: string, useCrossValidation?: boolean, topK?: number } = {}) => {
        return axios.post<SheetRAGChatResponse>(`${API_URL}/chat-v2`, {
            message,
            conversation_id: options.conversationId || 'default',
            use_cross_validation: options.useCrossValidation ?? true,
            top_k: options.topK || 5
        });
    },
    sheetRagIngest: async (arxivId: string) => {
        return axios.post(`${API_URL}/sheet-rag/ingest`, { arxiv_id: arxivId });
    },
    sheetRagIngestBatch: async (arxivIds: string[]) => {
        return axios.post(`${API_URL}/sheet-rag/ingest-batch`, { arxiv_ids: arxivIds });
    },
    sheetRagStats: async () => {
        return axios.get<SheetRAGStats>(`${API_URL}/sheet-rag/stats`);
    },
    
    runEvaluation: async (customQueries?: string[]) => {
        return axios.post(`${API_URL}/evaluate`, customQueries);
    },

    uploadPapers: async (files: File[]) => {
        // Strategy: try the Next.js proxy first. Fall back to direct backend connection.
        const urls = [`${API_URL}/upload-paper`, `${DIRECT_API_URL}/upload-paper`];

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (!url) continue;
            
            try {
                console.log(`[API] Upload attempt ${i + 1}/${urls.length}: ${url}`);
                const fd = new FormData();
                files.forEach(file => fd.append('files', file));
                const response = await axios.post(url, fd, {
                    timeout: 300000, 
                });
                console.log(`[API] Upload succeeded via: ${url}`);
                return response;
            } catch (error: unknown) {
                const isLast = i === urls.length - 1;
                if (isLast) throw error;
                console.warn('[API] Retrying with fallback URL...');
            }
        }
        throw new Error('[API] All upload attempts failed.');
    }
};

// Sheet RAG Types
export interface SheetRAGSource {
    text: string;
    level: string;
    score: number;
    chunk_id: string;
    metadata: Record<string, unknown>;
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
    layers: Record<string, { chunk_count: number, collection_name: string }>;
    total_chunks: number;
    persist_dir: string;
}
