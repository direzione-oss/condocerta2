import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurazione CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Codice mancante o invalido' });
    }

    // Cerca il codice nel database
    const { data, error } = await supabase
      .from('condocerta_codes')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Codice inesistente o non valido.' });
    }

    if (data.is_used) {
      return res.status(401).json({ error: 'Questo codice è già stato utilizzato.' });
    }

    return res.status(200).json({ success: true, message: 'Codice valido.' });
  } catch (error: any) {
    console.error("Errore verifica codice:", error);
    return res.status(500).json({ error: "Errore interno del server." });
  }
}
