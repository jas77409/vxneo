-- ============================================
-- VXNeo Threat Intelligence Database Schema
-- Migration: 002 - Threat Indicators Table
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Threat Intelligence Indicators Table
CREATE TABLE IF NOT EXISTS threat_indicators (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id TEXT UNIQUE NOT NULL,
  
  -- Indicator classification
  type TEXT NOT NULL CHECK (type IN (
    'ipv4',
    'ipv6', 
    'domain',
    'url',
    'file-hash',
    'email',
    'breach'
  )),
  
  -- Indicator value
  value TEXT NOT NULL,
  
  -- Confidence and source
  confidence INTEGER DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  source TEXT NOT NULL,
  
  -- Classification tags
  labels TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance (corrected)
CREATE INDEX IF NOT EXISTS idx_indicators_type ON threat_indicators(type);
CREATE INDEX IF NOT EXISTS idx_indicators_value ON threat_indicators(value);
CREATE INDEX IF NOT EXISTS idx_indicators_source ON threat_indicators(source);
CREATE INDEX IF NOT EXISTS idx_indicators_confidence ON threat_indicators(confidence);

-- Valid until index with proper WHERE clause
CREATE INDEX IF NOT EXISTS idx_indicators_valid_until 
  ON threat_indicators(valid_until) 
  WHERE valid_until IS NOT NULL;

-- GIN indexes for arrays and JSON
CREATE INDEX IF NOT EXISTS idx_indicators_labels 
  ON threat_indicators USING GIN(labels);

CREATE INDEX IF NOT EXISTS idx_indicators_metadata 
  ON threat_indicators USING GIN(metadata);

-- Trigram index for fuzzy text search (corrected)
CREATE INDEX IF NOT EXISTS idx_indicators_value_trgm 
  ON threat_indicators USING gin(value gin_trgm_ops);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_threat_indicators_updated_at ON threat_indicators;
CREATE TRIGGER update_threat_indicators_updated_at 
  BEFORE UPDATE ON threat_indicators
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired indicators
CREATE OR REPLACE FUNCTION cleanup_expired_indicators()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM threat_indicators 
  WHERE valid_until < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE threat_indicators IS 'Threat intelligence indicators from HIBP, OTX, and other sources';
COMMENT ON COLUMN threat_indicators.confidence IS 'Confidence score 0-100, where 100 is verified threat';
COMMENT ON COLUMN threat_indicators.valid_until IS 'When indicator expires (TTL). NULL means no expiration.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 completed successfully';
  RAISE NOTICE '✅ Created: threat_indicators table';
  RAISE NOTICE '✅ Created: 8 indexes for performance';
END $$;
