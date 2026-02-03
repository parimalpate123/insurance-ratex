import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConditionalRule } from '../../entities/conditional-rule.entity';
import { RuleCondition } from '../../entities/rule-condition.entity';
import { RuleAction } from '../../entities/rule-action.entity';

export interface CreateRuleDto {
  name: string;
  description?: string;
  productLine: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: string;
    field: string;
    value: any;
  }>;
}

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(ConditionalRule)
    private rulesRepository: Repository<ConditionalRule>,
    @InjectRepository(RuleCondition)
    private conditionsRepository: Repository<RuleCondition>,
    @InjectRepository(RuleAction)
    private actionsRepository: Repository<RuleAction>,
  ) {}

  async findAll(type?: string): Promise<ConditionalRule[]> {
    // For now, we only have conditional rules
    // Later we'll add lookup and decision tables
    return this.rulesRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<ConditionalRule> {
    const rule = await this.rulesRepository.findOne({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return rule;
  }

  async create(dto: CreateRuleDto): Promise<ConditionalRule> {
    // Create the rule
    const rule = this.rulesRepository.create({
      name: dto.name,
      description: dto.description,
      productLine: dto.productLine,
      status: 'draft',
      version: '1.0.0',
    });

    const savedRule = await this.rulesRepository.save(rule);

    // Create conditions
    if (dto.conditions && dto.conditions.length > 0) {
      const conditions = dto.conditions.map((cond, index) =>
        this.conditionsRepository.create({
          ruleId: savedRule.id,
          fieldPath: cond.field,
          operator: cond.operator,
          value: cond.value,
          conditionOrder: index,
        }),
      );
      await this.conditionsRepository.save(conditions);
    }

    // Create actions
    if (dto.actions && dto.actions.length > 0) {
      const actions = dto.actions.map((act, index) =>
        this.actionsRepository.create({
          ruleId: savedRule.id,
          actionType: act.type,
          targetField: act.field,
          value: act.value,
          actionOrder: index,
        }),
      );
      await this.actionsRepository.save(actions);
    }

    // Return the complete rule with relations
    return this.findOne(savedRule.id);
  }

  async update(id: string, dto: Partial<CreateRuleDto>): Promise<ConditionalRule> {
    const rule = await this.findOne(id);

    // Update basic fields
    if (dto.name) rule.name = dto.name;
    if (dto.description !== undefined) rule.description = dto.description;
    if (dto.productLine) rule.productLine = dto.productLine;

    await this.rulesRepository.save(rule);

    // Update conditions if provided
    if (dto.conditions) {
      // Delete existing conditions
      await this.conditionsRepository.delete({ ruleId: id });

      // Create new conditions
      const conditions = dto.conditions.map((cond, index) =>
        this.conditionsRepository.create({
          ruleId: id,
          fieldPath: cond.field,
          operator: cond.operator,
          value: cond.value,
          conditionOrder: index,
        }),
      );
      await this.conditionsRepository.save(conditions);
    }

    // Update actions if provided
    if (dto.actions) {
      // Delete existing actions
      await this.actionsRepository.delete({ ruleId: id });

      // Create new actions
      const actions = dto.actions.map((act, index) =>
        this.actionsRepository.create({
          ruleId: id,
          actionType: act.type,
          targetField: act.field,
          value: act.value,
          actionOrder: index,
        }),
      );
      await this.actionsRepository.save(actions);
    }

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.rulesRepository.remove(rule);
  }

  async activate(id: string): Promise<ConditionalRule> {
    const rule = await this.findOne(id);
    rule.status = 'active';
    await this.rulesRepository.save(rule);
    return this.findOne(id);
  }

  async archive(id: string): Promise<ConditionalRule> {
    const rule = await this.findOne(id);
    rule.status = 'archived';
    await this.rulesRepository.save(rule);
    return this.findOne(id);
  }
}
