-- Migration 009: Link mappings and rules to pipelines
-- A mapping/rule belongs to a pipeline; execution auto-discovers active ones

ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;

ALTER TABLE conditional_rules
    ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;

-- Execution order within a pipeline (lower = runs first)
ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS exec_order INTEGER DEFAULT 0;

ALTER TABLE conditional_rules
    ADD COLUMN IF NOT EXISTS exec_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_mappings_pipeline_id ON mappings(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_mappings_pipeline_status ON mappings(pipeline_id, status);
CREATE INDEX IF NOT EXISTS idx_rules_pipeline_id ON conditional_rules(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_rules_pipeline_status ON conditional_rules(pipeline_id, status);
