import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionalRule } from '../../entities/conditional-rule.entity';
import { RuleCondition } from '../../entities/rule-condition.entity';
import { RuleAction } from '../../entities/rule-action.entity';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { AiPromptsModule } from '../ai-prompts/ai-prompts.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionalRule, RuleCondition, RuleAction]), AiPromptsModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
