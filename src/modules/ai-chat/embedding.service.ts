import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}`;
const BATCH_SIZE = 90;
const MAX_RETRIES = 3;

type EmbedResponse = { embedding: { values: number[] } };
type BatchEmbedResponse = { embeddings: { values: number[] }[] };
type GoogleErrorBody = {
  error?: { details?: { retryDelay?: string }[] };
};

/** Lấy retryDelay từ Google 429 response (dạng "30s") → milliseconds */
function parseRetryDelay(body: GoogleErrorBody, fallbackMs = 65000): number {
  const details = body?.error?.details ?? [];
  for (const d of details) {
    if (d.retryDelay) {
      const seconds = parseInt(d.retryDelay.replace('s', ''), 10);
      if (!isNaN(seconds)) return (seconds + 5) * 1000; // +5s buffer
    }
  }
  return fallbackMs;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey = process.env.GOOGLE_AI_API_KEY ?? '';

  async embedText(text: string): Promise<number[]> {
    const res = await fetch(`${BASE_URL}:embedContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.trim() }] },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Embed failed: ${res.status} ${err}`);
      throw new InternalServerErrorException('Embedding request failed');
    }

    const data = (await res.json()) as EmbedResponse;
    return data.embedding.values;
  }

  private async batchEmbedWithRetry(chunk: string[], attempt = 1): Promise<number[][]> {
    const res = await fetch(`${BASE_URL}:batchEmbedContents?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: chunk.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: text.trim() }] },
        })),
      }),
    });

    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const body = (await res.json()) as GoogleErrorBody;
      const delayMs = parseRetryDelay(body);
      this.logger.warn(`Rate limited (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.batchEmbedWithRetry(chunk, attempt + 1);
    }

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Batch embed failed: ${res.status} ${err}`);
      throw new InternalServerErrorException('Batch embedding request failed');
    }

    const data = (await res.json()) as BatchEmbedResponse;
    return data.embeddings.map((e) => e.values);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    this.logger.log(`Embedding batch: ${texts.length} texts`);
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const chunk = texts.slice(i, i + BATCH_SIZE);
      const batchNum = i / BATCH_SIZE + 1;

      if (i > 0) {
        this.logger.log(`Waiting 62s before batch ${batchNum} (rate limit)...`);
        await new Promise((resolve) => setTimeout(resolve, 62000));
      }

      const embeddings = await this.batchEmbedWithRetry(chunk);
      results.push(...embeddings);
      this.logger.log(`Batch ${batchNum} done: ${results.length}/${texts.length} embeddings`);
    }

    return results;
  }
}
