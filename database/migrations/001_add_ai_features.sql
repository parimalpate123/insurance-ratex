-- Migration: Add AI Features and Schema Management
-- Description: Adds tables for schema library, AI suggestions, and enhanced mapping creation
-- Version: 001
-- Date: 2026-02-03

-- ============================================
-- Schema Library Management
-- ============================================

-- Create schemas table for storing schema definitions
CREATE TABLE IF NOT EXISTS schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_type VARCHAR(50) NOT NULL
        CHECK (schema_type IN ('library', 'custom', 'detected')),
    schema_data JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    UNIQUE(system_name, version)
);

CREATE INDEX idx_schemas_system_name ON schemas(system_name);
CREATE INDEX idx_schemas_type ON schemas(schema_type);

-- ============================================
-- AI Suggestions and Audit Trail
-- ============================================

-- Create AI suggestions audit trail table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mapping_id UUID REFERENCES mappings(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(50) NOT NULL
        CHECK (suggestion_type IN ('excel_parse', 'jira_parse', 'auto_detect', 'manual_suggest', 'nlp_rule')),
    input_data JSONB,
    suggestions JSONB NOT NULL,
    accepted_suggestions JSONB,
    rejected_suggestions JSONB,
    confidence_scores JSONB,
    ai_model VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE INDEX idx_ai_suggestions_mapping_id ON ai_suggestions(mapping_id);
CREATE INDEX idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);

-- ============================================
-- Enhanced Mappings Table
-- ============================================

-- Add new columns to existing mappings table
ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS creation_method VARCHAR(50)
        CHECK (creation_method IN ('manual', 'excel', 'jira', 'ai_detect', 'hybrid'));

ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS source_reference TEXT;

ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(5,2);

COMMENT ON COLUMN mappings.creation_method IS 'How the mapping was created: manual, excel upload, jira import, AI detection, or hybrid';
COMMENT ON COLUMN mappings.source_reference IS 'Reference to source document (JIRA story key, Excel filename, etc.)';
COMMENT ON COLUMN mappings.ai_confidence_score IS 'Average AI confidence score for auto-suggested mappings (0-100)';

-- ============================================
-- JIRA Integration
-- ============================================

-- Create JIRA stories cache table
CREATE TABLE IF NOT EXISTS jira_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_key VARCHAR(50) NOT NULL UNIQUE,
    project_key VARCHAR(50) NOT NULL,
    summary VARCHAR(500),
    description TEXT,
    story_type VARCHAR(50),
    status VARCHAR(50),
    raw_data JSONB,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_jira_stories_project ON jira_stories(project_key);
CREATE INDEX idx_jira_stories_key ON jira_stories(story_key);

-- ============================================
-- Excel/CSV Upload Tracking
-- ============================================

-- Create uploaded files tracking table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) CHECK (file_type IN ('xlsx', 'csv', 'json')),
    file_size_bytes INTEGER,
    storage_path VARCHAR(500),
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mapping_id UUID REFERENCES mappings(id) ON DELETE SET NULL,
    processed BOOLEAN DEFAULT false,
    processing_errors JSONB
);

CREATE INDEX idx_uploaded_files_mapping_id ON uploaded_files(mapping_id);
CREATE INDEX idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);

-- ============================================
-- Mapping Field Enhancements
-- ============================================

-- Add AI-related columns to field_mappings
ALTER TABLE field_mappings
    ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN DEFAULT false;

ALTER TABLE field_mappings
    ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,2);

ALTER TABLE field_mappings
    ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

COMMENT ON COLUMN field_mappings.ai_suggested IS 'Whether this mapping was suggested by AI';
COMMENT ON COLUMN field_mappings.ai_confidence IS 'AI confidence score for this mapping (0-100)';
COMMENT ON COLUMN field_mappings.ai_reasoning IS 'AI explanation for why this mapping was suggested';

-- ============================================
-- Schema Detection History
-- ============================================

-- Create schema detection history table
CREATE TABLE IF NOT EXISTS schema_detection_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name VARCHAR(100) NOT NULL,
    detection_method VARCHAR(50) CHECK (detection_method IN ('api_introspection', 'sample_payload', 'manual_upload')),
    detected_fields JSONB,
    detection_status VARCHAR(20) CHECK (detection_status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    schema_id UUID REFERENCES schemas(id) ON DELETE SET NULL
);

CREATE INDEX idx_schema_detection_system ON schema_detection_history(system_name);
CREATE INDEX idx_schema_detection_date ON schema_detection_history(detected_at DESC);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER update_schemas_updated_at
    BEFORE UPDATE ON schemas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data
-- ============================================

-- Insert sample schemas for common systems
INSERT INTO schemas (id, system_name, version, schema_type, schema_data, description) VALUES
    (
        '770e8400-e29b-41d4-a716-446655440001',
        'guidewire',
        'v10.0',
        'library',
        '{
            "fields": [
                {
                    "path": "quoteNumber",
                    "type": "string",
                    "description": "Unique quote identifier",
                    "required": true
                },
                {
                    "path": "productCode",
                    "type": "string",
                    "description": "Product line code (GL, WC, etc.)",
                    "required": true
                },
                {
                    "path": "insured.name",
                    "type": "string",
                    "description": "Insured business name",
                    "required": true
                },
                {
                    "path": "insured.state",
                    "type": "string",
                    "description": "State code (CA, NY, etc.)",
                    "required": true
                },
                {
                    "path": "insured.businessType",
                    "type": "string",
                    "description": "Business classification code"
                },
                {
                    "path": "classification.code",
                    "type": "string",
                    "description": "Industry classification code"
                },
                {
                    "path": "coverages[].limit",
                    "type": "number",
                    "description": "Coverage limit amount"
                },
                {
                    "path": "coverages[].deductible",
                    "type": "number",
                    "description": "Deductible amount"
                }
            ]
        }'::jsonb,
        'Guidewire PolicyCenter v10.0 schema for General Liability'
    ),
    (
        '770e8400-e29b-41d4-a716-446655440002',
        'cdm',
        'v2.0',
        'library',
        '{
            "fields": [
                {
                    "path": "policy.id",
                    "type": "string",
                    "description": "Canonical policy identifier",
                    "required": true
                },
                {
                    "path": "policy.productLine",
                    "type": "string",
                    "description": "Product line (general-liability, property, etc.)",
                    "required": true
                },
                {
                    "path": "insured.name",
                    "type": "string",
                    "description": "Insured name",
                    "required": true
                },
                {
                    "path": "insured.address.state",
                    "type": "string",
                    "description": "State code",
                    "required": true
                },
                {
                    "path": "ratingFactors.state",
                    "type": "string",
                    "description": "Rating state"
                },
                {
                    "path": "ratingFactors.businessType",
                    "type": "string",
                    "description": "Business type classification"
                },
                {
                    "path": "coverages[].limit",
                    "type": "number",
                    "description": "Coverage limit"
                },
                {
                    "path": "coverages[].deductible",
                    "type": "number",
                    "description": "Coverage deductible"
                }
            ]
        }'::jsonb,
        'Canonical Data Model v2.0 base schema'
    ),
    (
        '770e8400-e29b-41d4-a716-446655440003',
        'earnix',
        'v8.0',
        'library',
        '{
            "fields": [
                {
                    "path": "PolicyNumber",
                    "type": "string",
                    "description": "Policy identifier",
                    "required": true
                },
                {
                    "path": "ProductType",
                    "type": "string",
                    "description": "Product type code",
                    "required": true
                },
                {
                    "path": "InsuredName",
                    "type": "string",
                    "description": "Name of insured"
                },
                {
                    "path": "State",
                    "type": "string",
                    "description": "State code"
                },
                {
                    "path": "ClassCode",
                    "type": "string",
                    "description": "Classification code"
                },
                {
                    "path": "Limits",
                    "type": "array",
                    "description": "Coverage limits array"
                }
            ]
        }'::jsonb,
        'Earnix Rating Engine v8.0 schema'
    )
ON CONFLICT (system_name, version) DO NOTHING;

COMMENT ON TABLE schemas IS 'Schema library for policy systems and rating engines';
COMMENT ON TABLE ai_suggestions IS 'Audit trail of AI-generated mapping and rule suggestions';
COMMENT ON TABLE jira_stories IS 'Cache of JIRA stories for mapping requirements';
COMMENT ON TABLE uploaded_files IS 'Tracking for uploaded Excel/CSV requirement files';
COMMENT ON TABLE schema_detection_history IS 'History of schema detection attempts';
