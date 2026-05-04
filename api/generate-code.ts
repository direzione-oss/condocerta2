import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    const { password, count = 1 } = req.body;

    // Semplice protezione admin
    if (password !== 'ADMIN2026') {
      return res.status(401).json({ error: 'Password errata' });
    }

    const numCodes = Math.min(Math.max(1, count), 50); // Limita tra 1 e 50
    const newCodes = [];
    const insertPayload = [];

    for (let i = 0; i < numCodes; i++) {
      const code = generateRandomCode();
      newCodes.push(code);
      insertPayload.push({ code });
    }

    const { error } = await supabase
      .from('condocerta_codes')
      .insert(insertPayload);

    if (error) {
      throw error;
    }

    return res.status(200).json({ codes: newCodes });
  } catch (error: any) {
    console.error("Errore generazione codice:", error);
    return res.status(500).json({ error: "Errore interno del server." });
  }
}
