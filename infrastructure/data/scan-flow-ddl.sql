CREATE SEQUENCE scanflow_files_id_seq
    START WITH 3999
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 50;


CREATE TABLE scanflow_files (
    id BIGINT PRIMARY KEY DEFAULT nextval('scanflow_files_id_seq'),
    name VARCHAR(255) NOT NULL,                 -- Nome do arquivo
    size BIGINT NOT NULL,                       -- Tamanho em bytes
    type VARCHAR(100) NOT NULL,                 -- Tipo do arquivo (pdf, png, etc)
    file_raw_path TEXT NOT NULL,                -- Caminho do arquivo cru no storage
    file_path TEXT,                             -- Caminho do arquivo processado no storage
    request JSONB NOT NULL,                     -- JSON da request
    upload_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Data do insert
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- Última atualização
);


CREATE INDEX idx_scanflow_files_name
    ON scanflow_files (name);

CREATE INDEX idx_scanflow_files_upload_at_id
    ON scanflow_files (upload_at DESC, id DESC);

CREATE INDEX idx_scanflow_files_name_upload
    ON scanflow_files (name, upload_at DESC);

CREATE INDEX idx_scanflow_files_type
    ON scanflow_files (type);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_scanflow_files_updated_at
BEFORE UPDATE ON scanflow_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
