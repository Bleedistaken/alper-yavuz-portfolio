const crypto = require("node:crypto");

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function secureEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function validateContent(content) {
  if (!content || typeof content !== "object") return "İçerik geçersiz.";
  if (!Array.isArray(content.projects) || content.projects.length < 1 || content.projects.length > 20) return "Proje listesi geçersiz.";
  const serialized = JSON.stringify(content);
  if (Buffer.byteLength(serialized, "utf8") > 150000) return "İçerik dosyası çok büyük.";
  return "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Yalnızca POST desteklenir." });

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return json(res, 500, { error: "Vercel'de ADMIN_PASSWORD ayarlanmamış." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (!secureEqual(body.password, expectedPassword)) return json(res, 401, { error: "Şifre yanlış." });
  if (body.action === "login") return json(res, 200, { ok: true });
  if (body.action !== "save") return json(res, 400, { error: "Geçersiz işlem." });

  const validationError = validateContent(body.content);
  if (validationError) return json(res, 400, { error: validationError });

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "Bleedistaken";
  const repo = process.env.GITHUB_REPO || "alper-yavuz-portfolio";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = "content.json";

  if (!token) return json(res, 500, { error: "Vercel'de GITHUB_TOKEN ayarlanmamış." });

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`;
  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "alper-yavuz-portfolio-admin"
  };

  try {
    const currentResponse = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
    if (!currentResponse.ok) {
      const detail = await currentResponse.text();
      throw new Error(`GitHub content.json okunamadı (${currentResponse.status}): ${detail.slice(0, 180)}`);
    }
    const current = await currentResponse.json();
    const formatted = JSON.stringify(body.content, null, 2) + "\n";

    const updateResponse = await fetch(url, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Admin panel: portfolio içeriğini güncelle",
        content: Buffer.from(formatted, "utf8").toString("base64"),
        sha: current.sha,
        branch
      })
    });

    const result = await updateResponse.json();
    if (!updateResponse.ok) throw new Error(result.message || `GitHub güncellemesi başarısız (${updateResponse.status}).`);

    return json(res, 200, {
      ok: true,
      message: "GitHub güncellendi. Vercel genellikle kısa süre içinde yeni sürümü yayınlar.",
      commitUrl: result.commit?.html_url || ""
    });
  } catch (error) {
    return json(res, 500, { error: error.message || "Beklenmeyen sunucu hatası." });
  }
};
