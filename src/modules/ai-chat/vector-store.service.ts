import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

type VectorEntry = {
  id: number;
  productId: number;
  content: string;
  vector: number[];
};

export type RetrievalResult = {
  productId: number;
  content: string;
  score: number;
};

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private cache: VectorEntry[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async loadCache(): Promise<void> {
    this.logger.log('Loading vector cache from DB...');
    const embeddings = await this.prisma.productEmbedding.findMany({
      select: {
        id: true,
        productId: true,
        content: true,
        embeddingVector: true,
      },
    });

    this.cache = embeddings.map((e) => ({
      id: e.id,
      productId: e.productId,
      content: e.content ?? '',
      vector: JSON.parse(e.embeddingVector) as number[],
    }));

    this.logger.log(`Vector cache loaded: ${this.cache.length} entries`);
  }

  invalidateCache(): void {
    this.cache = null;
    this.logger.log('Vector cache invalidated');
  }

  async search(queryVector: number[], topK = 5, minScore = 0.3): Promise<RetrievalResult[]> {
    if (!this.cache) {
      await this.loadCache();
    }

    return (this.cache ?? [])
      .map((entry) => ({
        productId: entry.productId,
        content: entry.content,
        score: this.cosineSimilarity(queryVector, entry.vector),
      }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async upsertEmbedding(productId: number, content: string, vector: number[]): Promise<void> {
    const vectorJson = JSON.stringify(vector);
    const existing = await this.prisma.productEmbedding.findFirst({
      where: { productId, content },
    });

    if (existing) {
      await this.prisma.productEmbedding.update({
        where: { id: existing.id },
        data: { embeddingVector: vectorJson },
      });
    } else {
      await this.prisma.productEmbedding.create({
        data: { productId, content, embeddingVector: vectorJson },
      });
    }
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.prisma.productEmbedding.deleteMany({ where: { productId } });
  }
}
