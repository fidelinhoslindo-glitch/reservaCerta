const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

async function ensureDataFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  if (!fs.existsSync(LEADS_FILE)) {
    await fsp.writeFile(LEADS_FILE, "[]\n", "utf8");
  }
}

async function readLeads() {
  await ensureDataFile();

  try {
    const raw = await fsp.readFile(LEADS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLeads(leads) {
  await ensureDataFile();
  await fsp.writeFile(LEADS_FILE, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(message);
}

function normalizeFilePath(urlPathname) {
  const pathname = urlPathname === "/" ? "/index.html" : urlPathname;
  const resolved = path.normalize(path.join(ROOT, pathname));

  if (!resolved.startsWith(ROOT)) {
    return null;
  }

  return resolved;
}

async function serveStatic(request, response, urlPathname) {
  const filePath = normalizeFilePath(urlPathname);

  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const stats = await fsp.stat(filePath);
    const finalPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const file = await fsp.readFile(finalPath);

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300",
    });
    response.end(file);
  } catch {
    sendText(response, 404, "Not found");
  }
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;

      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

function validateLead(payload) {
  const name = String(payload.name || "").trim();
  const niche = String(payload.niche || "").trim();
  const phone = String(payload.phone || "").trim();

  if (name.length < 2 || niche.length < 2 || phone.length < 8) {
    return null;
  }

  return { name, niche, phone };
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "ReservaCerta",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/leads/count") {
    const leads = await readLeads();
    sendJson(response, 200, { count: leads.length });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/leads") {
    try {
      const payload = await parseBody(request);
      const lead = validateLead(payload);

      if (!lead) {
        sendJson(response, 400, {
          ok: false,
          error: "Preencha nome, area e WhatsApp validos.",
        });
        return;
      }

      const leads = await readLeads();
      const created = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        ...lead,
      };

      leads.unshift(created);
      await writeLeads(leads);

      sendJson(response, 201, {
        ok: true,
        count: leads.length,
        lead: created,
      });
    } catch (error) {
      const message = error && error.message === "Payload too large"
        ? "Payload muito grande."
        : "Nao foi possivel salvar o lead agora.";
      sendJson(response, 500, { ok: false, error: message });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  await serveStatic(request, response, url.pathname);
});

ensureDataFile()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`ReservaCerta rodando em http://127.0.0.1:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Falha ao inicializar dados:", error);
    process.exit(1);
  });
