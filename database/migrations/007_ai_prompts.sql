-- Migration 007: AI Prompt Templates
-- Externalizes hardcoded AI prompts so tech leads can manage them via the Admin UI.
-- Phase 2: kb_query_template / kb_top_k columns enable RAG enrichment via Bedrock Knowledge Bases.

CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable identifier used in code: 'mapping-suggest-fields', 'mapping-parse-text', 'rule-generate'
  key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- The actual prompt. Supports {{variable}} placeholders filled at runtime.
  -- {{knowledge_context}} is reserved for RAG-retrieved document chunks (Phase 2).
  template TEXT NOT NULL,
  -- JSON array of variable names: ["sourceSystem","targetSystem","productLine"]
  variables JSONB NOT NULL DEFAULT '[]',
  -- Phase 2 RAG fields (NULL = no retrieval, just use template as-is)
  kb_query_template VARCHAR(500),   -- e.g. "{{productLine}} rating rules surcharge"
  kb_top_k SMALLINT DEFAULT 3,      -- how many KB chunks to retrieve
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_prompts_key ON ai_prompts(key);

-- ── Seed default prompt templates ──────────────────────────────────────────
-- These match the current hardcoded prompts exactly.
-- Tech leads can edit via Admin UI → Config → AI Prompts.

INSERT INTO ai_prompts (key, name, description, template, variables) VALUES
(
  'mapping-suggest-fields',
  'Mapping: Suggest Field Mappings',
  'Suggests 5-8 field mappings given a source/target system and existing mappings. Used in the Mapping Editor "Suggest Fields" button.',
  'You are an expert in insurance data integration.
Suggest field mappings for a {{sourceSystem}} → {{targetSystem}} integration for product line: {{productLine}}.
{{existingMappings}}
{{additionalContext}}

Suggest 5-8 additional field mappings that are typical for this integration.
Respond ONLY with JSON array:
[
  {
    "sourcePath": "$.Quote.Premium",
    "targetPath": "rating.basePremium",
    "transformationType": "direct",
    "confidence": 0.95,
    "reasoning": "Direct premium amount mapping"
  }
]
transformationType must be one of: direct, expression, lookup, conditional, static, concat, split, uppercase, lowercase, trim, number, date, custom

{{knowledge_context}}',
  '["sourceSystem","targetSystem","productLine","existingMappings","additionalContext","knowledge_context"]'
),
(
  'mapping-parse-text',
  'Mapping: Parse Text Requirements',
  'Parses free-form text or JIRA user story requirements into structured field mapping suggestions. Used in the Mapping Create "AI-Powered" mode.',
  'You are an expert in insurance data integration. Parse the following requirements and extract field mapping definitions.
Source System: {{sourceSystem}}
Target System: {{targetSystem}}
Product Line: {{productLine}}

Requirements text:
{{requirementsText}}

{{knowledge_context}}

Extract all field mappings mentioned. For each, provide:
- sourcePath: JSONPath or field name from the source system (use $.FieldName format)
- targetPath: target field name or path
- transformationType: one of direct, expression, lookup, conditional, static, concat, split, uppercase, lowercase, trim, number, date, custom
- confidence: 0.0 to 1.0
- reasoning: brief explanation

Respond ONLY with a JSON array:
[
  {
    "sourcePath": "$.Quote.QuoteNumber",
    "targetPath": "policy.quoteId",
    "transformationType": "direct",
    "confidence": 0.95,
    "reasoning": "Direct mapping of quote number to policy ID"
  }
]',
  '["sourceSystem","targetSystem","productLine","requirementsText","knowledge_context"]'
),
(
  'rule-generate',
  'Rule: Generate from Description',
  'Converts a plain-English insurance rule description into structured rule JSON. Used in Rules → "Generate with AI" button.',
  'You are an expert in insurance business rules and rating systems.
Convert this plain-English description into a structured insurance rule JSON.

Product Line Code: {{productLine}}
Description: "{{description}}"

{{knowledge_context}}

Respond ONLY with valid JSON using this exact structure:
{
  "name": "Snake_Case_Rule_Name",
  "description": "one clear sentence describing the rule",
  "conditions": [
    { "fieldPath": "dot.path.field", "operator": "==", "value": "someValue" }
  ],
  "actions": [
    { "actionType": "surcharge", "targetField": "premium", "value": "0.05" }
  ],
  "confidence": 0.9
}

Rules:
- fieldPath uses dot notation (e.g. insured.state, building.yearBuilt, insured.annualRevenue, risk.claimCount)
- operator must be one of: ==, !=, >, >=, <, <=, contains, in, not_in, is_null, is_not_null
- actionType must be one of: surcharge, discount, multiply, set, add, subtract, reject
- value for surcharge/discount is a decimal (0.20 = 20%)
- for "in" operator, value is a comma-separated list: "CA,NY,NJ"
- multiple conditions are all ANDed together
- output only JSON, no explanation',
  '["productLine","description","knowledge_context"]'
);
