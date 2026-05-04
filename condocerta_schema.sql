-- Creazione tabella per i codici monouso di Condocerta2
CREATE TABLE IF NOT EXISTS condocerta_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- RLS (Row Level Security) - Permettiamo lettura/scrittura solo con la Service Key (server-side)
ALTER TABLE condocerta_codes ENABLE ROW LEVEL SECURITY;

-- Policy che consente tutte le operazioni solo a utenti autenticati come 'service_role'
-- (La Anon Key non avrà accesso diretto per evitare che la gente legga i codici dal browser)
CREATE POLICY "Enable all for service_role" ON condocerta_codes
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
