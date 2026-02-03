-- InsurRateX Database Initialization Script
-- PostgreSQL 15

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create mappings table
CREATE TABLE IF NOT EXISTS mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    source_system VARCHAR(100) NOT NULL,
    target_system VARCHAR(100) NOT NULL,
    product_line VARCHAR(100) NOT NULL,
    version VARCHAR(50) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create field_mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mapping_id UUID NOT NULL REFERENCES mappings(id) ON DELETE CASCADE,
    source_path VARCHAR(500) NOT NULL,
    target_path VARCHAR(500) NOT NULL,
    transformation_type VARCHAR(50) NOT NULL DEFAULT 'direct'
        CHECK (transformation_type IN ('direct', 'lookup', 'expression', 'conditional', 'static', 'concat', 'split', 'aggregate', 'custom', 'nested')),
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    transformation_config JSONB,
    validation_rules JSONB,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conditional_rules table
CREATE TABLE IF NOT EXISTS conditional_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_line VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    version VARCHAR(50) DEFAULT '1.0.0',
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create rule_conditions table
CREATE TABLE IF NOT EXISTS rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES conditional_rules(id) ON DELETE CASCADE,
    field_path VARCHAR(500) NOT NULL,
    operator VARCHAR(50) NOT NULL CHECK (operator IN ('==', '!=', '>', '<', '>=', '<=', 'contains', 'in', 'not_in', 'starts_with', 'ends_with')),
    value JSONB NOT NULL,
    condition_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rule_actions table
CREATE TABLE IF NOT EXISTS rule_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES conditional_rules(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('surcharge', 'discount', 'set', 'multiply', 'reject', 'add', 'subtract')),
    target_field VARCHAR(500) NOT NULL,
    value JSONB NOT NULL,
    action_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lookup_tables table
CREATE TABLE IF NOT EXISTS lookup_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    product_line VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    version VARCHAR(50) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create lookup_entries table
CREATE TABLE IF NOT EXISTS lookup_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lookup_table_id UUID NOT NULL REFERENCES lookup_tables(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lookup_table_id, key)
);

-- Create decision_tables table
CREATE TABLE IF NOT EXISTS decision_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_line VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    version VARCHAR(50) DEFAULT '1.0.0',
    condition_columns JSONB NOT NULL,
    action_columns JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create decision_table_rows table
CREATE TABLE IF NOT EXISTS decision_table_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_table_id UUID NOT NULL REFERENCES decision_tables(id) ON DELETE CASCADE,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    row_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_mappings_source_target ON mappings(source_system, target_system);
CREATE INDEX idx_mappings_product_line ON mappings(product_line);
CREATE INDEX idx_mappings_status ON mappings(status);
CREATE INDEX idx_field_mappings_mapping_id ON field_mappings(mapping_id);
CREATE INDEX idx_conditional_rules_product_line ON conditional_rules(product_line);
CREATE INDEX idx_conditional_rules_status ON conditional_rules(status);
CREATE INDEX idx_rule_conditions_rule_id ON rule_conditions(rule_id);
CREATE INDEX idx_rule_actions_rule_id ON rule_actions(rule_id);
CREATE INDEX idx_lookup_entries_table_id ON lookup_entries(lookup_table_id);
CREATE INDEX idx_decision_table_rows_table_id ON decision_table_rows(decision_table_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_mappings_updated_at BEFORE UPDATE ON mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_field_mappings_updated_at BEFORE UPDATE ON field_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conditional_rules_updated_at BEFORE UPDATE ON conditional_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lookup_tables_updated_at BEFORE UPDATE ON lookup_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lookup_entries_updated_at BEFORE UPDATE ON lookup_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decision_tables_updated_at BEFORE UPDATE ON decision_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decision_table_rows_updated_at BEFORE UPDATE ON decision_table_rows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO mappings (id, name, source_system, target_system, product_line, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Guidewire to CDM (General Liability)', 'guidewire', 'cdm', 'general-liability', 'active'),
    ('550e8400-e29b-41d4-a716-446655440002', 'CDM to Earnix (General Liability)', 'cdm', 'earnix', 'general-liability', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample conditional rule
INSERT INTO conditional_rules (id, name, description, product_line, status) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'High Revenue Surcharge', 'Apply surcharge for high revenue businesses', 'general-liability', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO rule_conditions (rule_id, field_path, operator, value, condition_order) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'insured.annualRevenue', '>', '5000000', 0)
ON CONFLICT DO NOTHING;

INSERT INTO rule_actions (rule_id, action_type, target_field, value, action_order) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'surcharge', 'premium', '4.0', 0)
ON CONFLICT DO NOTHING;
