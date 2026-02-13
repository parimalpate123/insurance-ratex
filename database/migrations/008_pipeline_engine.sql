-- Migration 008: Pipeline Engine
-- Systems catalog + Pipelines + Steps + Routing Rules

-- ── Systems ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'target' CHECK (type IN ('source', 'target', 'both')),
    protocol VARCHAR(20) NOT NULL DEFAULT 'rest' CHECK (protocol IN ('rest', 'soap', 'mock')),
    format VARCHAR(10) NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'xml', 'soap')),
    base_url TEXT,
    auth_config JSONB DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    is_mock BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Pipelines ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_line_code VARCHAR(50),
    source_system_code VARCHAR(100) REFERENCES systems(code) ON DELETE SET NULL,
    target_system_code VARCHAR(100) REFERENCES systems(code) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Pipeline Steps ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(30) NOT NULL CHECK (step_type IN ('transform', 'execute_rules', 'call_system', 'mock_response')),
    name VARCHAR(255),
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Routing Rules ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    product_line VARCHAR(100),
    source_system VARCHAR(100),
    transaction_type VARCHAR(100),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pipelines_product_line ON pipelines(product_line_code);
CREATE INDEX IF NOT EXISTS idx_pipeline_steps_pipeline_id ON pipeline_steps(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_steps_order ON pipeline_steps(pipeline_id, step_order);
CREATE INDEX IF NOT EXISTS idx_routing_rules_pipeline_id ON routing_rules(pipeline_id);

-- ── Triggers ──────────────────────────────────────────────────────────────────
CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed: Mock Systems ────────────────────────────────────────────────────────
INSERT INTO systems (name, code, description, type, protocol, format, base_url, is_mock, is_active) VALUES
(
    'Guidewire PolicyCenter',
    'guidewire',
    'Guidewire PolicyCenter — source system sending GL/WC/CA quote JSON',
    'source',
    'rest',
    'json',
    NULL,
    false,
    true
),
(
    'Earnix Rating Engine (Mock)',
    'earnix-mock',
    'Mock Earnix REST/JSON rating engine — returns canned premium response',
    'target',
    'mock',
    'json',
    'http://rating-api:3002/api/v1/mock/earnix',
    true,
    true
),
(
    'CGI Ratabase (Mock)',
    'ratabase-mock',
    'Mock CGI Ratabase SOAP/XML rating engine — returns canned XML premium response',
    'target',
    'mock',
    'xml',
    'http://rating-api:3002/api/v1/mock/ratabase',
    true,
    true
),
(
    'Earnix Rating Engine',
    'earnix',
    'Earnix REST/JSON rating engine — production endpoint',
    'target',
    'rest',
    'json',
    'https://api.earnix.com/rate',
    false,
    false
),
(
    'CGI Ratabase',
    'ratabase',
    'CGI Ratabase SOAP/XML rating engine — production endpoint',
    'target',
    'soap',
    'xml',
    'https://ratabase.cgi.com/services/RatingService',
    false,
    false
)
ON CONFLICT (code) DO NOTHING;
