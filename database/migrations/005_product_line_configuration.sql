-- Migration 005: Product Line Configuration Infrastructure
-- Description: Adds configuration-driven architecture for marketplace platform
-- Version: 005
-- Date: 2026-02-06

-- ============================================
-- Product Line Configuration Table
-- ============================================

-- Create product_line_configs table for storing product line configurations
CREATE TABLE IF NOT EXISTS product_line_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
    version VARCHAR(20) DEFAULT '1.0.0',
    product_owner VARCHAR(255),
    technical_lead VARCHAR(255),
    parent_template_id UUID,
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create indexes for product_line_configs
CREATE INDEX idx_product_line_configs_code ON product_line_configs(code);
CREATE INDEX idx_product_line_configs_status ON product_line_configs(status);
CREATE INDEX idx_product_line_configs_is_template ON product_line_configs(is_template);
CREATE INDEX idx_product_line_configs_created_at ON product_line_configs(created_at DESC);

-- ============================================
-- Add Product Line Code to Existing Tables
-- ============================================

-- Add product_line_code to mappings table
ALTER TABLE mappings
    ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);

-- Add product_line_code to rules table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rules') THEN
        ALTER TABLE rules ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);
    END IF;
END $$;

-- Add product_line_code to conditional_rules table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conditional_rules') THEN
        ALTER TABLE conditional_rules ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);
    END IF;
END $$;

-- Add product_line_code to field_mappings table
ALTER TABLE field_mappings
    ADD COLUMN IF NOT EXISTS product_line_code VARCHAR(50);

-- Create indexes for product line filtering
CREATE INDEX IF NOT EXISTS idx_mappings_product_line_code ON mappings(product_line_code);
CREATE INDEX IF NOT EXISTS idx_field_mappings_product_line_code ON field_mappings(product_line_code);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rules') THEN
        CREATE INDEX IF NOT EXISTS idx_rules_product_line_code ON rules(product_line_code);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conditional_rules') THEN
        CREATE INDEX IF NOT EXISTS idx_conditional_rules_product_line_code ON conditional_rules(product_line_code);
    END IF;
END $$;

-- ============================================
-- Configuration Version History Table
-- ============================================

-- Track configuration changes over time
CREATE TABLE IF NOT EXISTS config_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_line_code VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    config JSONB NOT NULL,
    change_description TEXT,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_line_code) REFERENCES product_line_configs(code) ON DELETE CASCADE
);

CREATE INDEX idx_config_version_product_line ON config_version_history(product_line_code);
CREATE INDEX idx_config_version_changed_at ON config_version_history(changed_at DESC);

-- ============================================
-- Triggers for Updated At
-- ============================================

-- Create or replace trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to product_line_configs
CREATE TRIGGER update_product_line_configs_updated_at
    BEFORE UPDATE ON product_line_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed Sample Product Line Configurations
-- ============================================

-- Insert default General Liability configuration for existing data
INSERT INTO product_line_configs (
    code,
    name,
    description,
    config,
    status,
    version,
    is_template
) VALUES (
    'GL_EXISTING',
    'General Liability (Legacy)',
    'Default configuration for existing GL mappings and rules',
    '{
        "productLine": {
            "code": "GL_EXISTING",
            "name": "General Liability (Legacy)",
            "displayName": "General Liability",
            "industry": "commercial",
            "states": ["CA", "NY", "TX", "FL"]
        },
        "integrations": {
            "sourceSystem": {
                "type": "guidewire",
                "version": "v10.0",
                "endpoint": "/api/v1/rating/gl",
                "authentication": "oauth2"
            },
            "targetSystems": [
                {
                    "type": "earnix",
                    "version": "v8.0",
                    "endpoint": "/api/rating",
                    "authentication": "api_key"
                }
            ]
        },
        "workflow": {
            "steps": [
                {
                    "id": "validate",
                    "type": "system",
                    "name": "Input Validation",
                    "enabled": true,
                    "config": {
                        "validateRequired": true,
                        "validateTypes": true
                    }
                },
                {
                    "id": "transform",
                    "type": "system",
                    "name": "Data Mapping",
                    "enabled": true,
                    "config": {
                        "useMappings": true
                    }
                },
                {
                    "id": "rules",
                    "type": "system",
                    "name": "Business Rules",
                    "enabled": true,
                    "config": {
                        "useRules": true
                    }
                },
                {
                    "id": "calculate",
                    "type": "system",
                    "name": "Calculate Premium",
                    "enabled": true
                },
                {
                    "id": "respond",
                    "type": "system",
                    "name": "Format Response",
                    "enabled": true
                }
            ]
        },
        "features": {
            "dataMapping": {
                "enabled": true,
                "aiAssisted": true
            },
            "businessRules": {
                "enabled": true,
                "aiGeneration": true
            },
            "multiStateSupport": {
                "enabled": true,
                "states": ["CA", "NY", "TX", "FL"]
            },
            "customPlugins": {
                "enabled": false
            }
        },
        "api": {
            "baseEndpoint": "/api/v1/rating/gl-existing",
            "methods": ["POST"],
            "authentication": "api_key"
        }
    }'::jsonb,
    'active',
    '1.0.0',
    false
) ON CONFLICT (code) DO NOTHING;

-- Migrate existing data to use GL_EXISTING product line
UPDATE mappings
SET product_line_code = 'GL_EXISTING'
WHERE product_line_code IS NULL;

UPDATE field_mappings
SET product_line_code = 'GL_EXISTING'
WHERE product_line_code IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rules') THEN
        UPDATE rules SET product_line_code = 'GL_EXISTING' WHERE product_line_code IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conditional_rules') THEN
        UPDATE conditional_rules SET product_line_code = 'GL_EXISTING' WHERE product_line_code IS NULL;
    END IF;
END $$;

-- ============================================
-- Sample Template Configurations
-- ============================================

-- Insert GL Commercial template
INSERT INTO product_line_configs (
    code,
    name,
    description,
    config,
    status,
    version,
    is_template
) VALUES (
    'GL_COMMERCIAL_TEMPLATE',
    'General Liability Commercial (Template)',
    'Pre-configured template for GL Commercial lines with Guidewire to Earnix integration',
    '{
        "productLine": {
            "code": "GL_COMMERCIAL_TEMPLATE",
            "name": "General Liability Commercial",
            "displayName": "GL Commercial",
            "industry": "commercial",
            "states": []
        },
        "integrations": {
            "sourceSystem": {
                "type": "guidewire",
                "version": "v10.0",
                "endpoint": "",
                "authentication": "oauth2"
            },
            "targetSystems": [
                {
                    "type": "earnix",
                    "version": "v8.0",
                    "endpoint": "",
                    "authentication": "api_key"
                }
            ]
        },
        "workflow": {
            "steps": [
                {
                    "id": "validate",
                    "type": "system",
                    "name": "Input Validation",
                    "enabled": true,
                    "config": {}
                },
                {
                    "id": "transform",
                    "type": "system",
                    "name": "Data Mapping",
                    "enabled": true,
                    "config": {}
                },
                {
                    "id": "rules",
                    "type": "system",
                    "name": "Business Rules",
                    "enabled": true,
                    "config": {}
                },
                {
                    "id": "calculate",
                    "type": "system",
                    "name": "Calculate Premium",
                    "enabled": true
                },
                {
                    "id": "respond",
                    "type": "system",
                    "name": "Format Response",
                    "enabled": true
                }
            ]
        },
        "features": {
            "dataMapping": {
                "enabled": true,
                "aiAssisted": true
            },
            "businessRules": {
                "enabled": true,
                "aiGeneration": true
            },
            "multiStateSupport": {
                "enabled": true,
                "states": []
            }
        },
        "api": {
            "baseEndpoint": "/api/v1/rating/{{productLineCode}}",
            "methods": ["POST"],
            "authentication": "api_key"
        }
    }'::jsonb,
    'active',
    '1.0.0',
    true
) ON CONFLICT (code) DO NOTHING;

-- Insert Workers Comp template
INSERT INTO product_line_configs (
    code,
    name,
    description,
    config,
    status,
    version,
    is_template
) VALUES (
    'WC_TEMPLATE',
    'Workers Compensation (Template)',
    'Pre-configured template for Workers Comp with common rating factors',
    '{
        "productLine": {
            "code": "WC_TEMPLATE",
            "name": "Workers Compensation",
            "displayName": "Workers Comp",
            "industry": "commercial",
            "states": []
        },
        "integrations": {
            "sourceSystem": {
                "type": "guidewire",
                "version": "v10.0",
                "endpoint": "",
                "authentication": "oauth2"
            },
            "targetSystems": [
                {
                    "type": "earnix",
                    "version": "v8.0",
                    "endpoint": "",
                    "authentication": "api_key"
                }
            ]
        },
        "workflow": {
            "steps": [
                {
                    "id": "validate",
                    "type": "system",
                    "name": "Input Validation",
                    "enabled": true
                },
                {
                    "id": "transform",
                    "type": "system",
                    "name": "Data Mapping",
                    "enabled": true
                },
                {
                    "id": "rules",
                    "type": "system",
                    "name": "Business Rules",
                    "enabled": true
                },
                {
                    "id": "calculate",
                    "type": "system",
                    "name": "Calculate Premium",
                    "enabled": true
                },
                {
                    "id": "respond",
                    "type": "system",
                    "name": "Format Response",
                    "enabled": true
                }
            ]
        },
        "features": {
            "dataMapping": {
                "enabled": true,
                "aiAssisted": true
            },
            "businessRules": {
                "enabled": true,
                "aiGeneration": true
            },
            "multiStateSupport": {
                "enabled": true,
                "states": []
            }
        },
        "api": {
            "baseEndpoint": "/api/v1/rating/{{productLineCode}}",
            "methods": ["POST"],
            "authentication": "api_key"
        }
    }'::jsonb,
    'active',
    '1.0.0',
    true
) ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE product_line_configs IS 'Configuration-driven product line definitions for marketplace platform';
COMMENT ON TABLE config_version_history IS 'Version history tracking for product line configuration changes';
COMMENT ON COLUMN product_line_configs.config IS 'JSONB configuration including integrations, workflow, features, and API settings';
COMMENT ON COLUMN product_line_configs.is_template IS 'If true, this configuration serves as a reusable template in marketplace';
COMMENT ON COLUMN product_line_configs.parent_template_id IS 'Reference to template this config was instantiated from';
COMMENT ON COLUMN product_line_configs.status IS 'active: in use, inactive: disabled, draft: under development, archived: retired';
COMMENT ON COLUMN mappings.product_line_code IS 'Links mapping to specific product line configuration';
COMMENT ON COLUMN field_mappings.product_line_code IS 'Links field mapping to specific product line configuration';
