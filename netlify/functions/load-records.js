const { getConfig, getRepoFile, jsonResponse } = require('./lib/github');

exports.handler = async function handler(event) {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const cfg = getConfig();
    const file = await getRepoFile(cfg.dataPath);
    const records = file.exists && file.text ? JSON.parse(file.text) : [];

    if (!Array.isArray(records)) {
      throw new Error('O arquivo data/records.json não contém um array JSON válido.');
    }

    return jsonResponse(200, {
      ok: true,
      source: `${cfg.owner}/${cfg.repo}@${cfg.branch}`,
      dataPath: cfg.dataPath,
      records,
      sha: file.sha
    });
  } catch (error) {
    return jsonResponse(error.statusCode || 500, {
      ok: false,
      error: error.message || 'Falha ao carregar dados do GitHub.'
    });
  }
};
