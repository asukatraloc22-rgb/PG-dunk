const MAX_NEEDS_LENGTH = 1200;

function validateInput(body = {}) {
  const energy = Number(body.energy);
  const time = Number(body.time);
  const needs = typeof body.needs === 'string' ? body.needs.trim() : '';
  const format = body.format === 'team' ? 'team' : 'solo';

  if (!Number.isInteger(energy) || energy < 1 || energy > 10) throw new Error('Énergie invalide.');
  if (!Number.isInteger(time) || time < 10 || time > 240) throw new Error('Durée invalide.');
  if (needs.length > MAX_NEEDS_LENGTH) throw new Error('La description est trop longue.');

  return { energy, time, needs, format };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Le service IA n’est pas configuré.' });

  try {
    const { energy, time, needs, format } = validateInput(req.body);
    const response = await fetch(`${process.env.OPENAI_API_BASE || 'https://api.manus.im/api/llm-proxy/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-5-mini',
        messages: [{ role: 'user', content: `Coach basket expert. Génère une séance structurée pour un meneur. Énergie: ${energy}/10. Durée: ${time} minutes. Format: ${format === 'team' ? 'équipe' : 'solo'}. Besoins: ${needs || 'aucun besoin particulier'}. Réponds avec échauffement, bloc principal, finition et consignes de sécurité.` }],
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.choices?.[0]?.message?.content) return res.status(502).json({ error: 'Réponse invalide du service IA.' });
    return res.status(200).json({ success: true, workout: data.choices[0].message.content });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Erreur de génération.' });
  }
}
