const { getConfig, upsertRepoFile, jsonResponse } = require('./lib/github');

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod && event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const cfg = getConfig();
    const payload = JSON.parse(event.body || '{}');
    const records = payload.records;
    const commitMessage = payload.commitMessage || `chore(dados): atualiza ${cfg.dataPath}`;

    if (!Array.isArray(records)) {
      return jsonResponse(400, { ok: false, error: 'O campo records deve ser um array JSON.' });
    }

    const result = await upsertRepoFile({
      path: cfg.dataPath,
      text: JSON.stringify(records, null, 2) + '\n',
      message: commitMessage
    });

    return jsonResponse(200, {
      ok: true,
      message: 'Dados gravados no GitHub com sucesso.',
      dataPath: cfg.dataPath,
      commit: result.commit ? {
        sha: result.commit.sha,
        url: result.commit.html_url,
        message: result.commit.message
      } : null,
      content: result.content ? {
        path: result.content.path,
        sha: result.content.sha,
        html_url: result.content.html_url,
        download_url: result.content.download_url
      } : null,
      recordsSaved: records.length
    });
  } catch (error) {
    return jsonResponse(error.statusCode || 500, {
      ok: false,
      error: error.message || 'Falha ao gravar dados no GitHub.'
    });
  }
};
