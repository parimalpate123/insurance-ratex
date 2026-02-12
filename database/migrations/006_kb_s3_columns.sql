-- Migration 006: Knowledge Base S3 Storage Columns
-- Extends uploaded_files table for Knowledge Base functionality
-- Adds S3 storage fields, KB metadata, and processing status

-- ============================================
-- Extend uploaded_files for KB use
-- ============================================

-- Add product line association
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);

-- Add KB-specific description
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Add tags for categorization
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- S3 storage fields (local MinIO or AWS S3)
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500);

ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS s3_bucket VARCHAR(255);

-- AI processing status
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) DEFAULT 'pending'
    CHECK (ai_status IN ('pending', 'processing', 'ready', 'error'));

ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- When AI processing completed (text extraction, future: vectorization)
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Number of text chunks extracted (for future vectorization)
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;

-- Extracted text content (stored for keyword search pre-vectorization)
ALTER TABLE uploaded_files
    ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Update file_type check to support KB document types
ALTER TABLE uploaded_files
    DROP CONSTRAINT IF EXISTS uploaded_files_file_type_check;

ALTER TABLE uploaded_files
    ADD CONSTRAINT uploaded_files_file_type_check
    CHECK (file_type IN ('xlsx', 'csv', 'json', 'pdf', 'docx', 'doc', 'txt', 'md'));

-- ============================================
-- Indexes for KB queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_uploaded_files_product_line_code
    ON uploaded_files(product_line_code);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_ai_status
    ON uploaded_files(ai_status);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_s3_key
    ON uploaded_files(s3_key);

-- Full-text search index on extracted text
CREATE INDEX IF NOT EXISTS idx_uploaded_files_extracted_text
    ON uploaded_files USING gin(to_tsvector('english', COALESCE(extracted_text, '')));

-- ============================================
-- Migrate existing records to have ai_status = 'ready' if already processed
-- ============================================

UPDATE uploaded_files
SET ai_status = 'ready'
WHERE processed = true AND ai_status = 'pending';

-- ============================================
-- Add product_line_code to decision_tables and lookup_tables
-- (init.sql only had product_line varchar, not the code reference)
-- ============================================

ALTER TABLE decision_tables
    ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_decision_tables_product_line_code
    ON decision_tables(product_line_code);

ALTER TABLE lookup_tables
    ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_lookup_tables_product_line_code
    ON lookup_tables(product_line_code);

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN uploaded_files.s3_key IS 'S3 object key (path in bucket)';
COMMENT ON COLUMN uploaded_files.s3_bucket IS 'S3 bucket name (insurratex-kb-dev or prod bucket)';
COMMENT ON COLUMN uploaded_files.ai_status IS 'AI processing status: pending → processing → ready | error';
COMMENT ON COLUMN uploaded_files.extracted_text IS 'Full text extracted from document for keyword search';
COMMENT ON COLUMN uploaded_files.chunk_count IS 'Number of text chunks (for future vector embeddings on AWS)';
COMMENT ON COLUMN uploaded_files.product_line_code IS 'Associated product line (NULL = shared across all product lines)';
COMMENT ON COLUMN uploaded_files.tags IS 'JSON array of tags for categorization, e.g. ["underwriting","GL","2024"]';
