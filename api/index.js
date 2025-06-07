// Vercel serverless function entry point for NBA Analytics
export default async function handler(req, res) {
  try {
    const { default: app } = await import('../dist/index.js');
    return app(req, res);
  } catch (error) {
    console.error('Vercel function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}