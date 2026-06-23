// BİTİG AI - Safe Server-side Gemini API Proxy Layer
// This completely avoids instantiating GoogleGenAI on the client-side to prevent CORS/iframe unhandled cross-origin runtime Script errors.

export async function* askCopilotStream(
  prompt: string, 
  history: { role: 'user' | 'model', text: string }[] = [], 
  companies: any[] = []
) {
  const response = await fetch('/api/gemini/copilot-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history, companies }),
  });
  
  if (!response.ok) {
    throw new Error('Copilot stream error on server');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No body reader');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(dataStr);
          yield { text: parsed.text };
        } catch (e) {
          console.warn('Error parsing stream chunk:', e);
        }
      }
    }
  }
}

export async function askCopilot(prompt: string, history: { role: 'user' | 'model', text: string }[] = []) {
  const response = await fetch('/api/gemini/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history })
  });
  if (!response.ok) throw new Error('Copilot error on server');
  const data = await response.json();
  return data.reply;
}

export async function fetchLatestLegislation() {
  const response = await fetch('/api/gemini/legislation');
  if (!response.ok) throw new Error('Failed to fetch legislation');
  return response.json();
}

export async function fetchLatestNews(forceRefresh = false): Promise<any[]> {
  const cacheKey = 'daily_news';

  // Client-side same-day cache optimization
  if (!forceRefresh) {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        const cacheDate = new Date(cached.timestamp);
        const nowDate = new Date();
        const isSameDay = cacheDate.getFullYear() === nowDate.getFullYear() &&
                          cacheDate.getMonth() === nowDate.getMonth() &&
                          cacheDate.getDate() === nowDate.getDate();
        if (isSameDay) {
          return cached.data;
        }
      }
    } catch (e) {
      console.warn("localStorage cache read failed:", e);
    }
  }

  const response = await fetch('/api/gemini/news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: forceRefresh })
  });
  if (!response.ok) throw new Error('Failed to fetch latest news');
  const data = await response.json();
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Failed to write to localStorage cache:", e);
  }

  return data;
}

export async function fetchSGKParameters() {
  const response = await fetch('/api/gemini/sgk-params');
  if (!response.ok) throw new Error('Failed to fetch SGK parameters');
  return response.json();
}

export async function generateIncentiveReport(profile: any, parameters: any) {
  const response = await fetch('/api/gemini/incentive-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, parameters })
  });
  if (!response.ok) throw new Error('Failed to generate incentive report');
  const data = await response.json();
  return data.report;
}

export async function analyzeLegislation(text: string) {
  const response = await fetch('/api/gemini/legislation-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!response.ok) throw new Error('Failed to analyze legislation');
  const data = await response.json();
  return data.report;
}

export async function analyzeDocumentForContent(
  fileData?: string, 
  mimeType?: string, 
  rawText?: string, 
  profile?: any
) {
  const response = await fetch('/api/gemini/document-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileData, mimeType, rawText, profile })
  });
  if (!response.ok) throw new Error('Failed to analyze document');
  return response.json();
}

export async function analyzeVoucher(
  fileData: string, 
  mimeType: string, 
  docType?: string, 
  isDeepScan?: boolean
) {
  const response = await fetch('/api/gemini/voucher-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileData, mimeType, docType, isDeepScan })
  });
  if (!response.ok) throw new Error('Failed to analyze voucher');
  return response.json();
}

export async function analyzeFinancialStatements(
  files: { data: string, mimeType: string, name: string }[], 
  profile: any
) {
  const response = await fetch('/api/gemini/financial-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, profile })
  });
  if (!response.ok) throw new Error('Failed to analyze financial statements');
  return response.json();
}

export async function analyzeKdvRefundPotential(mizanData: any, manualData: any, profile: any) {
  const response = await fetch('/api/gemini/kdv-refund-potential', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mizanData, manualData, profile })
  });
  if (!response.ok) throw new Error('Failed to analyze KDV refund potential');
  const data = await response.json();
  return data.report;
}

export async function processProductivityAnalysis(profile: any, files: any[]) {
  const response = await fetch('/api/gemini/productivity-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, files })
  });
  if (!response.ok) throw new Error('Failed to process productivity analysis');
  const data = await response.json();
  return data.report;
}
