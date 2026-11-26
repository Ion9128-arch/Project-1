// Shared helpers for showing errors, loading states and password toggles.
window.UI = {
  setFieldError(fieldEl, message) {
    if (!fieldEl) return;
    fieldEl.classList.toggle("invalid", !!message);
    fieldEl.classList.remove("valid");
    const err = fieldEl.querySelector(".field-error");
    if (err) err.textContent = message || "";
    const input = fieldEl.querySelector("input, select");
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  },
  setFieldValid(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove("invalid");
    fieldEl.classList.add("valid");
    const err = fieldEl.querySelector(".field-error");
    if (err) err.textContent = "";
  },
  clearField(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove("invalid", "valid");
    const err = fieldEl.querySelector(".field-error");
    if (err) err.textContent = "";
  },
  showAlert(el, message, type = "error") {
    el.className = "alert alert-" + type;
    el.textContent = message;
    el.hidden = !message;
  },
  setLoading(button, loading, label) {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = loading;
    button.innerHTML = loading
      ? '<span class="spinner" aria-hidden="true"></span>' + (label || "Please wait…")
      : button.dataset.label;
  },
  initPasswordToggles(root = document) {
    root.querySelectorAll(".toggle-password").forEach((btn) => {
      const input = document.getElementById(btn.dataset.target);
      input.classList.add("has-toggle");
      btn.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Hide" : "Show";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  },
  debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
};
