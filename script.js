document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("mwOpenConversation");
  const modal = document.getElementById("mwConversationModal");
  const form = document.getElementById("mwConversationForm");
  const statusEl = document.getElementById("mwFormStatus");

  let lastFocus = null;

  const openModal = () => {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("mw-modal-open");
    (modal.querySelector("input, textarea, button") || modal).focus?.();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mw-modal-open");
    if (statusEl) { statusEl.textContent = ""; statusEl.className = "mw-form__status"; }
    lastFocus?.focus?.();
  };

  openBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });

  modal?.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal) return;
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!statusEl) return;

    statusEl.textContent = "";
    statusEl.className = "mw-form__status";

    const btn = form.querySelector('button[type="submit"]');
    const old = btn?.textContent || "Send";
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

    try {
      const fd = new FormData(form);
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
      const data = await res.json();

      if (data.success) {
        statusEl.textContent = "Thanks — we received your message.";
        statusEl.classList.add("is-success");
        form.reset();
        setTimeout(closeModal, 1200);
      } else {
        statusEl.textContent = data.message || "Something went wrong. Please try again.";
        statusEl.classList.add("is-error");
      }
    } catch {
      statusEl.textContent = "Network error. Please try again.";
      statusEl.classList.add("is-error");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = old; }
    }
  });
});
