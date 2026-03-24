const form = document.getElementById("waitlist-form");
const countNode = document.getElementById("lead-count");
const noteNode = document.getElementById("form-note");

async function syncCount() {
  try {
    const response = await fetch("/api/leads/count", { cache: "no-store" });
    const payload = await response.json();
    countNode.textContent = String(payload.count || 0);
  } catch {
    noteNode.innerHTML =
      "Nao foi possivel carregar a contagem agora. O servidor precisa estar rodando.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const payload = {
    name: String(data.get("name") || "").trim(),
    niche: String(data.get("niche") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
  };

  noteNode.textContent = "Salvando lead...";

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Erro ao salvar lead.");
    }

    form.reset();
    countNode.textContent = String(result.count || 0);
    noteNode.innerHTML = `Cadastro enviado com sucesso. Pessoas na lista: <strong>${result.count}</strong>`;
  } catch (error) {
    noteNode.textContent =
      error instanceof Error ? error.message : "Nao foi possivel enviar agora.";
  }
});

syncCount();
