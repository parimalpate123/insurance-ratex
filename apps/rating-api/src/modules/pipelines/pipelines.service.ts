import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pipeline } from '../../entities/pipeline.entity';
import { PipelineStep } from '../../entities/pipeline-step.entity';
import { RoutingRule } from '../../entities/routing-rule.entity';

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline)
    private readonly pipelineRepo: Repository<Pipeline>,
    @InjectRepository(PipelineStep)
    private readonly stepRepo: Repository<PipelineStep>,
    @InjectRepository(RoutingRule)
    private readonly routingRepo: Repository<RoutingRule>,
  ) {}

  findAll(): Promise<Pipeline[]> {
    return this.pipelineRepo.find({
      relations: ['steps', 'routingRules'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pipeline> {
    const p = await this.pipelineRepo.findOne({
      where: { id },
      relations: ['steps', 'routingRules'],
    });
    if (!p) throw new NotFoundException(`Pipeline ${id} not found`);
    return p;
  }

  async create(dto: {
    name: string;
    description?: string;
    productLineCode?: string;
    sourceSystemCode?: string;
    targetSystemCode?: string;
    status?: string;
    steps?: Array<{
      stepOrder: number;
      stepType: string;
      name?: string;
      config: Record<string, any>;
    }>;
    routingRules?: Array<{
      productLine?: string;
      sourceSystem?: string;
      transactionType?: string;
      priority?: number;
    }>;
  }): Promise<Pipeline> {
    const { steps = [], routingRules = [], ...rest } = dto;
    const pipeline = this.pipelineRepo.create(rest as any);
    const saved: Pipeline = (await this.pipelineRepo.save(pipeline as any)) as unknown as Pipeline;
    const savedId: string = saved.id;

    if (steps.length) {
      for (const s of steps) {
        const step = this.stepRepo.create({
          stepOrder: s.stepOrder,
          stepType: s.stepType as any,
          name: s.name,
          config: s.config,
          pipelineId: savedId,
        });
        await this.stepRepo.save(step);
      }
    }

    if (routingRules.length) {
      for (const r of routingRules) {
        const rule = this.routingRepo.create({
          productLine: r.productLine,
          sourceSystem: r.sourceSystem,
          transactionType: r.transactionType,
          priority: r.priority ?? 0,
          pipelineId: savedId,
        });
        await this.routingRepo.save(rule);
      }
    }

    return this.findOne(savedId);
  }

  async update(id: string, dto: any): Promise<Pipeline> {
    const { steps, routingRules, ...rest } = dto;
    await this.pipelineRepo.update(id, rest);

    if (steps !== undefined) {
      await this.stepRepo.delete({ pipelineId: id });
      if (steps.length) {
        const stepEntities = steps.map((s: any) =>
          this.stepRepo.create({ ...s, pipelineId: id }),
        );
        await this.stepRepo.save(stepEntities);
      }
    }

    if (routingRules !== undefined) {
      await this.routingRepo.delete({ pipelineId: id });
      if (routingRules.length) {
        const ruleEntities = routingRules.map((r: any) =>
          this.routingRepo.create({ ...r, pipelineId: id }),
        );
        await this.routingRepo.save(ruleEntities);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.pipelineRepo.delete(id);
  }
}
