import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiPrompt } from './ai-prompt.entity';

@Injectable()
export class AiPromptsService {
  private readonly logger = new Logger(AiPromptsService.name);

  constructor(
    @InjectRepository(AiPrompt)
    private readonly repo: Repository<AiPrompt>,
  ) {}

  // ── Public API used by other modules ─────────────────────────────────────

  /**
   * Loads a prompt template from the database and fills in {{variable}} placeholders.
   * Falls back to `defaultTemplate` if the key is not found or is inactive.
   *
   * The {{knowledge_context}} placeholder is reserved for Phase 2 RAG enrichment.
   * For now it is replaced with an empty string.
   */
  async buildPrompt(
    key: string,
    variables: Record<string, string>,
    defaultTemplate: string,
  ): Promise<string> {
    let template = defaultTemplate;

    try {
      const prompt = await this.repo.findOne({ where: { key, isActive: true } });
      if (prompt) {
        template = prompt.template;
      } else {
        this.logger.warn(`Prompt key "${key}" not found in DB — using hardcoded default`);
      }
    } catch (err) {
      this.logger.error(`Failed to load prompt "${key}" from DB: ${err.message} — using default`);
    }

    // Fill {{variable}} placeholders
    let result = template;
    for (const [varName, value] of Object.entries(variables)) {
      result = result.replaceAll(`{{${varName}}}`, value ?? '');
    }

    // Phase 2: {{knowledge_context}} will be replaced by RAG-retrieved chunks.
    // For now, remove the placeholder cleanly.
    result = result.replaceAll('{{knowledge_context}}', '');

    // Collapse multiple consecutive blank lines left by removed placeholders
    result = result.replace(/\n{3,}/g, '\n\n').trim();

    return result;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  findAll(): Promise<AiPrompt[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: string): Promise<AiPrompt> {
    const prompt = await this.repo.findOne({ where: { key } });
    if (!prompt) throw new NotFoundException(`Prompt "${key}" not found`);
    return prompt;
  }

  async update(key: string, body: { template?: string; name?: string; description?: string; kbQueryTemplate?: string; kbTopK?: number; isActive?: boolean }): Promise<AiPrompt> {
    const prompt = await this.findByKey(key);
    Object.assign(prompt, body);
    // Bump version on template change
    if (body.template && body.template !== prompt.template) {
      prompt.version = (prompt.version ?? 1) + 1;
    }
    return this.repo.save(prompt);
  }

  async resetToDefault(key: string): Promise<{ message: string }> {
    // Deletes the DB row — next call to buildPrompt will use the hardcoded default.
    const prompt = await this.findByKey(key);
    await this.repo.remove(prompt);
    return { message: `Prompt "${key}" removed from DB. Hardcoded default will be used.` };
  }
}
