-- Migration 004: Field Metadata System with Master Field Catalog
-- This migration adds comprehensive field metadata capabilities

-- Create data_types table (insurance-specific types)
CREATE TABLE IF NOT EXISTS data_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  validation_pattern TEXT,
  example_value TEXT,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed insurance-specific data types
INSERT INTO data_types (type_name, display_name, validation_pattern, example_value) VALUES
('string', 'Text', NULL, 'Sample text'),
('number', 'Number', '^\d+(\.\d+)?$', '123.45'),
('integer', 'Whole Number', '^\d+$', '100'),
('date', 'Date', '^\d{4}-\d{2}-\d{2}$', '2026-02-04'),
('datetime', 'Date & Time', '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', '2026-02-04T10:30:00'),
('boolean', 'True/False', '^(true|false)$', 'true'),
('money', 'Currency', '^\d+(\.\d{2})?$', '1000.00'),
('percentage', 'Percentage', '^\d+(\.\d+)?%?$', '12.5'),
('policy_number', 'Policy Number', '^[A-Z0-9-]+$', 'POL-2024-001'),
('tax_id', 'Tax ID / SSN', '^\d{2}-\d{7}$', '12-3456789'),
('phone', 'Phone Number', '^\d{3}-\d{3}-\d{4}$', '555-123-4567'),
('email', 'Email Address', '^[^@]+@[^@]+\.[^@]+$', 'user@example.com'),
('address', 'Address', NULL, '123 Main St'),
('zipcode', 'ZIP Code', '^\d{5}(-\d{4})?$', '12345'),
('state_code', 'State Code', '^[A-Z]{2}$', 'CA'),
('country_code', 'Country Code', '^[A-Z]{2,3}$', 'US')
ON CONFLICT (type_name) DO NOTHING;

-- Create field_catalog table (master list of insurance fields)
CREATE TABLE IF NOT EXISTS field_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL REFERENCES data_types(type_name),
  category VARCHAR(100),
  description TEXT,
  sample_value TEXT,
  is_required BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for field_catalog
CREATE INDEX IF NOT EXISTS idx_field_catalog_category ON field_catalog(category);
CREATE INDEX IF NOT EXISTS idx_field_catalog_data_type ON field_catalog(data_type);
CREATE INDEX IF NOT EXISTS idx_field_catalog_is_system ON field_catalog(is_system);

-- Seed field catalog with common insurance fields
INSERT INTO field_catalog (field_name, display_name, data_type, category, description, sample_value, is_required) VALUES
-- Policy fields
('policyNumber', 'Policy Number', 'policy_number', 'policy', 'Unique identifier for insurance policy', 'POL-2024-001', true),
('quoteNumber', 'Quote Number', 'policy_number', 'policy', 'Unique identifier for insurance quote', 'QTE-2024-001', true),
('premium', 'Premium Amount', 'money', 'policy', 'Total premium amount', '1000.00', true),
('effectiveDate', 'Effective Date', 'date', 'policy', 'Policy effective start date', '2026-01-01', true),
('expirationDate', 'Expiration Date', 'date', 'policy', 'Policy expiration date', '2027-01-01', true),
('policyTerm', 'Policy Term', 'integer', 'policy', 'Policy term in months', '12', false),
('policyStatus', 'Policy Status', 'string', 'policy', 'Current status of policy', 'Active', false),
('productLine', 'Product Line', 'string', 'policy', 'Line of business', 'Commercial Auto', true),

-- Insured/Account fields
('insuredName', 'Insured Name', 'string', 'insured', 'Name of insured party', 'John Doe', true),
('businessName', 'Business Name', 'string', 'insured', 'Name of business entity', 'ABC Corporation', false),
('taxId', 'Tax ID', 'tax_id', 'insured', 'Tax identification number', '12-3456789', false),
('address', 'Address', 'address', 'insured', 'Mailing address', '123 Main St', false),
('city', 'City', 'string', 'insured', 'City name', 'New York', false),
('state', 'State', 'state_code', 'insured', 'State code', 'NY', false),
('zipCode', 'ZIP Code', 'zipcode', 'insured', 'Postal code', '10001', false),
('country', 'Country', 'country_code', 'insured', 'Country code', 'US', false),
('phone', 'Phone Number', 'phone', 'insured', 'Contact phone number', '555-123-4567', false),
('email', 'Email', 'email', 'insured', 'Contact email address', 'john@example.com', false),

-- Coverage fields
('coverageLimit', 'Coverage Limit', 'money', 'coverage', 'Maximum coverage amount', '1000000.00', true),
('deductible', 'Deductible', 'money', 'coverage', 'Deductible amount', '500.00', false),
('coverageType', 'Coverage Type', 'string', 'coverage', 'Type of coverage', 'Liability', true),
('coverageCode', 'Coverage Code', 'string', 'coverage', 'Coverage code identifier', 'GL', false),
('perOccurrenceLimit', 'Per Occurrence Limit', 'money', 'coverage', 'Limit per occurrence', '500000.00', false),
('aggregateLimit', 'Aggregate Limit', 'money', 'coverage', 'Annual aggregate limit', '1000000.00', false),

-- Claim fields
('claimNumber', 'Claim Number', 'policy_number', 'claim', 'Unique claim identifier', 'CLM-2024-001', true),
('claimAmount', 'Claim Amount', 'money', 'claim', 'Claimed amount', '5000.00', true),
('lossDate', 'Loss Date', 'date', 'claim', 'Date of loss occurrence', '2026-01-15', true),
('claimStatus', 'Claim Status', 'string', 'claim', 'Current claim status', 'Open', false),
('claimType', 'Claim Type', 'string', 'claim', 'Type of claim', 'Property Damage', false),

-- Rating/Premium fields
('basePremium', 'Base Premium', 'money', 'rating', 'Base premium before adjustments', '800.00', false),
('totalPremium', 'Total Premium', 'money', 'rating', 'Total premium after all adjustments', '1000.00', true),
('taxAmount', 'Tax Amount', 'money', 'rating', 'Tax amount', '50.00', false),
('feeAmount', 'Fee Amount', 'money', 'rating', 'Fee amount', '25.00', false),
('discountAmount', 'Discount Amount', 'money', 'rating', 'Total discount amount', '100.00', false),
('discountPercentage', 'Discount Percentage', 'percentage', 'rating', 'Discount percentage', '10', false),

-- Vehicle fields (for auto insurance)
('vin', 'Vehicle VIN', 'string', 'vehicle', 'Vehicle identification number', '1HGBH41JXMN109186', false),
('year', 'Vehicle Year', 'integer', 'vehicle', 'Vehicle model year', '2024', false),
('make', 'Vehicle Make', 'string', 'vehicle', 'Vehicle manufacturer', 'Honda', false),
('model', 'Vehicle Model', 'string', 'vehicle', 'Vehicle model', 'Accord', false),
('vehicleValue', 'Vehicle Value', 'money', 'vehicle', 'Estimated vehicle value', '25000.00', false)
ON CONFLICT (field_name) DO NOTHING;

-- Enhance field_mappings table with new metadata columns
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS data_type VARCHAR(50);
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS field_direction VARCHAR(20) DEFAULT 'both';
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS field_identifier VARCHAR(255);
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS skip_mapping BOOLEAN DEFAULT false;
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS skip_behavior VARCHAR(20) DEFAULT 'exclude';
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS catalog_field_id UUID;
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS sample_input TEXT;
ALTER TABLE field_mappings ADD COLUMN IF NOT EXISTS sample_output TEXT;

-- Add foreign key constraint (drop first if exists to avoid errors)
ALTER TABLE field_mappings DROP CONSTRAINT IF EXISTS fk_catalog_field;
ALTER TABLE field_mappings ADD CONSTRAINT fk_catalog_field
  FOREIGN KEY (catalog_field_id) REFERENCES field_catalog(id) ON DELETE SET NULL;

-- Add check constraints
ALTER TABLE field_mappings DROP CONSTRAINT IF EXISTS check_field_direction;
ALTER TABLE field_mappings ADD CONSTRAINT check_field_direction
  CHECK (field_direction IN ('input', 'output', 'both'));

ALTER TABLE field_mappings DROP CONSTRAINT IF EXISTS check_skip_behavior;
ALTER TABLE field_mappings ADD CONSTRAINT check_skip_behavior
  CHECK (skip_behavior IN ('exclude', 'use_default'));

-- Create indexes for field_mappings
CREATE INDEX IF NOT EXISTS idx_field_mappings_data_type ON field_mappings(data_type);
CREATE INDEX IF NOT EXISTS idx_field_mappings_catalog_field ON field_mappings(catalog_field_id);
CREATE INDEX IF NOT EXISTS idx_field_mappings_field_identifier ON field_mappings(field_identifier);

-- Add comments for documentation
COMMENT ON TABLE data_types IS 'Insurance-specific data types for field validation';
COMMENT ON TABLE field_catalog IS 'Master catalog of standard insurance fields';
COMMENT ON COLUMN field_catalog.is_required IS 'Indicates if this field is typically required in insurance contexts';
COMMENT ON COLUMN field_mappings.field_direction IS 'Direction of mapping: input (request), output (response), or both (bidirectional)';
COMMENT ON COLUMN field_mappings.skip_mapping IS 'If true, field is excluded from transformation or uses default value';
COMMENT ON COLUMN field_mappings.skip_behavior IS 'Behavior when skip_mapping is true: exclude completely or use default value';
COMMENT ON COLUMN field_mappings.catalog_field_id IS 'Reference to field_catalog for template-based field creation';
