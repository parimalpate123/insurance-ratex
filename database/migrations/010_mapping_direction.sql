-- Migration 010: Add direction to mappings (request vs response transform)
-- request = transforms input data before calling target system
-- response = transforms target system response back to standard format

ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS direction VARCHAR(10) DEFAULT 'request'
    CHECK (direction IN ('request', 'response'));

CREATE INDEX IF NOT EXISTS idx_mappings_direction ON mappings(pipeline_id, direction, status);
