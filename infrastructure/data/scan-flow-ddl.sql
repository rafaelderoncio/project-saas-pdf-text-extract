-- Drop existing sequences if they exist
DROP SEQUENCE IF EXISTS seq_scanflow_files_id;

-- Create sequences
CREATE SEQUENCE seq_scanflow_files_id;

-- Set the starting value of the sequences to a random number
SELECT setval('seq_scanflow_files_id', round(random() * (99999 - 10000) + 10000)::bigint);

-- Drop existing tables if they exist
DROP TABLE IF EXISTS scanflow_files;

-- Create the scanflow_files table with random sequence
CREATE TABLE scanflow_files (
    id BIGINT PRIMARY KEY DEFAULT nextval('seq_scanflow_files_id'),
    name VARCHAR(255) NOT NULL,                     -- Nome do arquivo
    size BIGINT NOT NULL,                           -- Tamanho em bytes
    type VARCHAR(100) NOT NULL,                     -- Tipo do arquivo (pdf, png, etc)
    file_raw_path TEXT NOT NULL,                    -- Caminho do arquivo cru no storage
    file_path TEXT,                                 -- Caminho do arquivo processado no storage
    request JSONB NOT NULL,                         -- JSON da request
    upload_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- Data do insert
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- Última atualização
);

-- Create the scanflow_files index
CREATE INDEX idx_scanflow_files_name ON scanflow_files (name);
CREATE INDEX idx_scanflow_files_upload_at_id ON scanflow_files (upload_at DESC, id DESC);
CREATE INDEX idx_scanflow_files_name_upload ON scanflow_files (name, upload_at DESC);
CREATE INDEX idx_scanflow_files_type ON scanflow_files (type);

-- Grant read permissions to replica/read role
GRANT USAGE ON SCHEMA public TO scanflowread;
GRANT SELECT ON TABLE scanflow_files TO scanflowread;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scanflowread;

-- Drop existing function if they exist
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create function update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing function if they exist
DROP TRIGGER IF EXISTS trg_scanflow_files_updated_at ON scanflow_files;

-- Create TRIGGER trg_scanflow_files_updated_at
CREATE TRIGGER trg_scanflow_files_updated_at
BEFORE UPDATE ON scanflow_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
