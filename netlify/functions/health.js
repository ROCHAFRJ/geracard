const { getConfig, jsonResponse } = require('./lib/github');

exports.handler = async function handler() {
  try {
    const cfg = getConfig();
    return jsonResponse(200, {
      ok: true,
      service: 'geracard-netlify-sync',
      repository: `${cfg.owner}/${cfg.repo}`,
      branch: cfg.branch,
      dataPath: cfg.dataPath
    });
  } catch (error) {
    return jsonResponse(error.statusCode || 500, {
      ok: false,
      error: error.message || 'Ambiente não configurado.'
    });
  }
};
