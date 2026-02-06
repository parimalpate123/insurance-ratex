import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionalRule } from '../../entities/conditional-rule.entity';
import { RuleCondition } from '../../entities/rule-condition.entity';
import { RuleAction } from '../../entities/rule-action.entity';
import { RulesService } from './rules.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConditionalRule, RuleCondition, RuleAction])],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
