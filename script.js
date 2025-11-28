document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("mwOpenConversation");

  const convoModal = document.getElementById("mwConversationModal");
  const form = document.getElementById("mwConversationForm");

  const successModal = document.getElementById("mwSuccessModal");
  const successDialog = successModal?.querySelector(".mw-success__dialog") || null;
  const successCloseBtn = document.getElementById("mwSuccessClose");
  const successTitle = document.getElementById("mwSuccessTitle");
  const successMessage = document.getElementById("mwSuccessMessage");

  let lastFocus = null;

  // ---- Validation tooltip + "show invalid only after submit attempt" ----
  let tipEl = null;

  const ensureTip = () => {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "mw-validate-tip";
    tipEl.setAttribute("role", "alert");
    tipEl.style.display = "none";
    document.body.appendChild(tipEl);
    return tipEl;
  };

  const hideTip = () => {
    if (!tipEl) return;
    tipEl.style.display = "none";
  };

  const showTipFor = (field) => {
    if (!field) return;
    const tip = ensureTip();
    tip.textContent = field.validationMessage || "Please check this field.";

    const r = field.getBoundingClientRect();
    const pad = 12;

    let top = r.bottom + pad;
    if (top + 80 > window.innerHeight) top = r.top - pad - 64;

    const left = Math.min(Math.max(r.left, pad), window.innerWidth - pad - 320);

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.style.display = "block";
  };

  const markAttempted = () => {
    if (!form) return;
    form.classList.add("mw-submitted");
  };

  const clearAttempted = () => {
    form?.classList.remove("mw-submitted");
    hideTip();
  };

  form?.addEventListener(
    "invalid",
    (e) => {
      e.preventDefault(); // suppress native bubble
      markAttempted();
      showTipFor(e.target);
    },
    true
  );

  form?.addEventListener("input", (e) => {
    if (e.target?.matches?.("input, textarea")) hideTip();
  });

  // ---- Email validity (requires @ and a .tld) ----
const emailEl = document.getElementById("mwEmail");

const validateEmail = () => {
  if (!emailEl) return true;

  const v = (emailEl.value || "").trim();
  emailEl.value = v; // optional: auto-trim
  emailEl.setCustomValidity("");

  if (!v) return false; // "required" handles empty

  // Simple + flexible: allows any TLD (.com, .net, .io, .co.uk, etc.)
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  if (!ok) {
    emailEl.setCustomValidity("Please enter a valid email address (name@domain.tld).");
  }

  return ok;
};

emailEl?.addEventListener("input", validateEmail);
emailEl?.addEventListener("blur", validateEmail);

  
  // ---- Phone auto-format + JS validity (US formats, +intl allowed) ----
  const phoneEl = document.getElementById("mwPhone");

  const formatUSPhone = (digits) => {
    const d = digits.slice(0, 10);
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  };

  const setCaretByDigitIndex = (el, digitIndex) => {
    const v = el.value;
    let count = 0;
    for (let i = 0; i < v.length; i++) {
      if (/\d/.test(v[i])) count++;
      if (count >= digitIndex) {
        el.setSelectionRange(i + 1, i + 1);
        return;
      }
    }
    el.setSelectionRange(v.length, v.length);
  };

  const validatePhone = () => {
    if (!phoneEl) return true;

    const raw = (phoneEl.value || "").trim();
    if (!raw) {
      phoneEl.setCustomValidity(""); // required handles empty
      return false;
    }

    const digits = raw.replace(/\D/g, "");
    const isIntl = raw.startsWith("+");

    // If it starts with "+", validate as international ONLY (no US fallback)
    if (isIntl) {
      // Special case: +1 must be exactly 11 digits total (1 + 10-digit national number)
      if (digits.startsWith("1")) {
        const ok = digits.length === 11;
        phoneEl.setCustomValidity(
          ok ? "" : "Please enter a valid +1 number (e.g., +1 775 555 1212)."
        );
        return ok;
      }

      // Other countries: E.164 allows up to 15 digits total (country + national)
      const ok = digits.length >= 8 && digits.length <= 15;
      phoneEl.setCustomValidity(ok ? "" : "Please enter a valid international phone number.");
      return ok;
    }

    // Not international: allow US formats (10 digits, or 11 starting with 1)
    const okUS = digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
    phoneEl.setCustomValidity(okUS ? "" : "Please enter a valid phone number.");
    return okUS;
  };

  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      const raw = phoneEl.value || "";
      const caret = phoneEl.selectionStart ?? raw.length;

      // digits typed before caret (so caret doesn't jump around)
      const digitsBefore = (raw.slice(0, caret).match(/\d/g) || []).length;

      const trimmed = raw.trim();
      const digits = trimmed.replace(/\D/g, "");

      // International: if it starts with +, keep "+digits" (no US formatting)
      if (trimmed.startsWith("+")) {
        // +1 => max 11 digits total; others => max 15 digits total
        const max = digits.startsWith("1") ? 11 : 15;
        phoneEl.value = "+" + digits.slice(0, max);
        validatePhone();
        return;
      }

      // US formatting: if they start with 1, drop it for display
      let d = digits;
      if (d.length > 10 && d.startsWith("1")) d = d.slice(1);

      phoneEl.value = formatUSPhone(d);
      setCaretByDigitIndex(phoneEl, digitsBefore);

      validatePhone();
    });

    phoneEl.addEventListener("blur", validatePhone);
  }

  const isOpen = (el) => el && el.getAttribute("aria-hidden") === "false";

  const openConversation = () => {
    if (!convoModal) return;
    lastFocus = document.activeElement;

    convoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("mw-modal-open");

    (convoModal.querySelector("input, textarea, button") || convoModal).focus?.();
  };

  const closeConversationOnly = () => {
    if (!convoModal) return;
    convoModal.setAttribute("aria-hidden", "true");
  };

  const openPopup = ({ title, message, tone = "success" }) => {
    if (!successModal) return;

    if (successDialog) {
      successDialog.classList.toggle("is-error", tone === "error");
    }

    if (successTitle) successTitle.textContent = title;
    if (successMessage) successMessage.textContent = message;

    successModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("mw-modal-open");
    successCloseBtn?.focus?.();
  };

  const closePopupOnly = () => {
    if (!successModal) return;
    successModal.setAttribute("aria-hidden", "true");
  };

  const closeAll = () => {
    closePopupOnly();
    closeConversationOnly();
    document.body.classList.remove("mw-modal-open");
    clearAttempted();
    lastFocus?.focus?.();
  };

  // Open modal
  openBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openConversation();
  });

  // Clicking outside conversation closes ONLY if popup isn't open
  convoModal?.addEventListener("click", (e) => {
    if (!e.target.matches("[data-close-modal]")) return;
    if (isOpen(successModal)) return;
    closeAll();
  });

  // Clicking outside popup closes BOTH
  successModal?.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-success]")) closeAll();
  });

  // Popup Close button closes BOTH
  successCloseBtn?.addEventListener("click", closeAll);

  // Escape closes any open modal(s)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isOpen(successModal) || isOpen(convoModal)) closeAll();
  });

  // Submit form via Web3Forms
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    markAttempted();

    // Ensure phone validity is current before checkValidity()
    validatePhone();
    validateEmail();

    if (!form.checkValidity()) {
      const first = form.querySelector(":invalid");
      first?.focus?.();
      return;
    }

    hideTip();

    const btn = form.querySelector('button[type="submit"]');
    const old = btn?.textContent || "Send";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }

    try {
      const fd = new FormData(form);
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
      const data = await res.json();

      if (data.success) {
        form.reset();
        clearAttempted();
        openPopup({
          title: "Thanks!",
          message: "We will respond to your inquiry promptly.",
          tone: "success",
        });
      } else {
        openPopup({
          title: "Something went wrong",
          message: data.message || "Please try again in a moment.",
          tone: "error",
        });
      }
    } catch {
      openPopup({
        title: "Network error",
        message: "Please check your connection and try again.",
        tone: "error",
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = old;
      }
    }
  });
});
