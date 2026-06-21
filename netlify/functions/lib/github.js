const DEFAULT_HEADERS = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'geracard-netlify-dashboard'
};

function getConfig() {
  const cfg = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO || 'geracard',
    branch: process.env.GITHUB_BRANCH || 'main',
    dataPath: process.env.DATA_FILE_PATH || 'data/records.json',
    committerName: process.env.GITHUB_COMMITTER_NAME || 'GeraCard Bot',
    committerEmail: process.env.GITHUB_COMMITTER_EMAIL || 'bot@example.com'
  };

  const missing = Object.entries({
    GITHUB_TOKEN: cfg.token,
    GITHUB_OWNER: cfg.owner,
    GITHUB_REPO: cfg.repo
  }).filter(([, value]) => !value).map(([key]) => key);

  if (missing.length) {
    const error = new Error(`Variáveis ausentes: ${missing.join(', ')}`);
    error.statusCode = 500;
    throw error;
  }

  return cfg;
}

function encodePath(path) {
  return String(path).split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

function buildContentsUrl(path, cfg = getConfig()) {
  return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(cfg.branch)}`;
}

async function githubRequest(url, options = {}) {
  const cfg = getConfig();
  const headers = {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${cfg.token}`,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

async function getRepoFile(path = getConfig().dataPath) {
  const cfg = getConfig();
  const response = await githubRequest(buildContentsUrl(path, cfg));

  if (response.status === 404) {
    return { exists: false, sha: null, text: null, api: null };
  }

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Falha ao consultar arquivo no GitHub: ${response.status} ${body}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const content = Buffer.from((data.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
  return { exists: true, sha: data.sha, text: content, api: data };
}

async function upsertRepoFile({ path = getConfig().dataPath, text, message }) {
  const cfg = getConfig();
  const current = await getRepoFile(path);
  const payload = {
    message: message || 'chore(data): update records',
    content: Buffer.from(text, 'utf8').toString('base64'),
    branch: cfg.branch,
    committer: {
      name: cfg.committerName,
      email: cfg.committerEmail
    }
  };

  if (current.exists && current.sha) payload.sha = current.sha;

  const response = await githubRequest(buildContentsUrl(path, cfg), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Falha ao gravar arquivo no GitHub: ${response.status} ${body}`);
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

module.exports = {
  getConfig,
  getRepoFile,
  upsertRepoFile,
  jsonResponse
};
