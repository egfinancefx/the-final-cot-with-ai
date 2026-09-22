// Utility to parse streaming incomplete JSON payloads incrementally as tokens arrive

export function cleanAndCompleteJson(str: string): any {
  if (!str) return null;
  let s = str.trim();
  s = s.replace(/^```json\s*/i, "").replace(/```\s*$/, "");

  // Try direct parse first
  try {
    return JSON.parse(s);
  } catch (_) {}

  // Automatically balance unclosed quotes, brackets, and braces
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length && stack[stack.length - 1] === "{") stack.pop();
      } else if (char === "]") {
        if (stack.length && stack[stack.length - 1] === "[") stack.pop();
      }
    }
  }

  let patched = s;
  if (inString) {
    patched += '"';
  }
  // Trim trailing comma or dangling colon
  patched = patched.replace(/,\s*$/, "").replace(/:\s*$/, ': ""');

  while (stack.length > 0) {
    const open = stack.pop();
    patched += open === "{" ? "}" : "]";
  }

  try {
    return JSON.parse(patched);
  } catch (_) {
    return null;
  }
}

// Regex fallback extractions for robust mid-chunk resilience
export function extractRegexFields(raw: string): any {
  if (!raw) return {};
  const result: any = {};

  const sentMatch = raw.match(/"sentiment"\s*:\s*\{[\s\S]*?"label"\s*:\s*"([^"]+)"/);
  const reasonMatch = raw.match(/"sentiment"[\s\S]*?"reason"\s*:\s*"([^"]+)"/);
  if (sentMatch || reasonMatch) {
    result.sentiment = {
      label: sentMatch ? sentMatch[1] : "Analyzing...",
      reason: reasonMatch ? reasonMatch[1] : ""
    };
  }

  const perspMatch = raw.match(/"perspective"\s*:\s*"([^"]+)"/);
  if (perspMatch) result.perspective = perspMatch[1];

  const adviceMatch = raw.match(/"actionable_advice"\s*:\s*"([^"]+)"/);
  if (adviceMatch) result.actionable_advice = adviceMatch[1];

  const suppMatch = raw.match(/"support"\s*:\s*"([^"]+)"/);
  const resMatch = raw.match(/"resistance"\s*:\s*"([^"]+)"/);
  const pivMatch = raw.match(/"pivot_point"\s*:\s*"([^"]+)"/);
  if (suppMatch || resMatch || pivMatch) {
    result.key_levels = {
      support: suppMatch ? suppMatch[1] : "--",
      resistance: resMatch ? resMatch[1] : "--",
      pivot_point: pivMatch ? pivMatch[1] : "--"
    };
  }

  const biasMatch = raw.match(/"institutional_bias"\s*:\s*"([^"]+)"/);
  if (biasMatch) result.institutional_bias = biasMatch[1];

  const impactMatch = raw.match(/"weekly_impact"\s*:\s*"([^"]+)"/);
  const scoreMatch = raw.match(/"market_sentiment_score"\s*:\s*(\d+)/);
  if (impactMatch || scoreMatch) {
    result.global_context = {
      weekly_impact: impactMatch ? impactMatch[1] : "",
      market_sentiment_score: scoreMatch ? parseInt(scoreMatch[1], 10) : 50,
      news_highlights: [],
      key_risks: []
    };
  }

  return result;
}

export function parseIncrementalAnalysis(prev: any, raw: string): any {
  if (!raw) return prev;
  const parsed = cleanAndCompleteJson(raw) || extractRegexFields(raw);
  if (!parsed || typeof parsed !== "object") return prev;

  const next = prev ? { ...prev } : {};

  if (parsed.sentiment) {
    next.sentiment = {
      label: parsed.sentiment.label || next.sentiment?.label || "",
      reason: parsed.sentiment.reason || next.sentiment?.reason || ""
    };
  }

  if (typeof parsed.perspective === "string" && parsed.perspective.length > 0) {
    next.perspective = parsed.perspective;
  }

  if (typeof parsed.actionable_advice === "string" && parsed.actionable_advice.length > 0) {
    next.actionable_advice = parsed.actionable_advice;
  }

  if (parsed.institutional_bias) {
    next.institutional_bias = parsed.institutional_bias;
  }

  if (parsed.key_levels) {
    next.key_levels = {
      support: parsed.key_levels.support || next.key_levels?.support || "--",
      resistance: parsed.key_levels.resistance || next.key_levels?.resistance || "--",
      pivot_point: parsed.key_levels.pivot_point || next.key_levels?.pivot_point || "--",
      support_2: parsed.key_levels.support_2 || next.key_levels?.support_2,
      resistance_2: parsed.key_levels.resistance_2 || next.key_levels?.resistance_2,
      current_price: parsed.key_levels.current_price || next.key_levels?.current_price
    };
  }

  if (parsed.global_context) {
    next.global_context = {
      weekly_impact: parsed.global_context.weekly_impact || next.global_context?.weekly_impact || "",
      market_sentiment_score: typeof parsed.global_context.market_sentiment_score === "number"
        ? parsed.global_context.market_sentiment_score
        : next.global_context?.market_sentiment_score || 50,
      news_highlights: Array.isArray(parsed.global_context.news_highlights) 
        ? parsed.global_context.news_highlights 
        : next.global_context?.news_highlights || [],
      key_risks: Array.isArray(parsed.global_context.key_risks) 
        ? parsed.global_context.key_risks 
        : next.global_context?.key_risks || []
    };
  }

  if (Array.isArray(parsed.playbook) && parsed.playbook.length > 0) {
    next.playbook = parsed.playbook;
  }

  return next;
}

export interface StreamGeminiParams {
  prompt: string;
  model?: string;
  thinkingLevel?: string;
  responseMimeType?: string;
  systemInstruction?: string;
}

export async function streamGemini(
  params: StreamGeminiParams,
  onChunk: (chunkText: string, accumulatedText: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch('/api/gemini-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to initiate stream: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataContent = trimmed.slice(5).trim();
        if (dataContent === '[DONE]') {
          return accumulated;
        }
        try {
          const parsedEvent = JSON.parse(dataContent);
          if (parsedEvent.error) {
            throw new Error(parsedEvent.error);
          }
          if (parsedEvent.text) {
            accumulated += parsedEvent.text;
            onChunk(parsedEvent.text, accumulated);
          }
        } catch (e: any) {
          if (e.message && (e.message.includes("quota") || e.message.includes("exceeded"))) {
            throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}
