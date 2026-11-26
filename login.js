(function () {
  const form = document.getElementById("login-form");
  const alertEl = document.getElementById("form-alert");
  const btn = document.getElementById("login-btn");
  const fields = {
    username: document.getElementById("f-username"),
    password: document.getElementById("f-password"),
  };

  UI.initPasswordToggles();

  // Message from the sign-up page, e.g. ?registered=1
  if (new URLSearchParams(location.search).get("registered")) {
    UI.showAlert(alertEl, "Account created. Please log in.", "success");
  }

  Object.entries(fields).forEach(([name, field]) =>
    form.elements[name].addEventListener("input", () => UI.clearField(field))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    UI.showAlert(alertEl, "");
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;

    let ok = true;
    if (!username) { UI.setFieldError(fields.username, "Enter your username."); ok = false; }
    if (!password) { UI.setFieldError(fields.password, "Enter your password."); ok = false; }
    if (!ok) return;

    UI.setLoading(btn, true, "Logging in…");
    try {
      const data = await Api.login(username, password);
      Api.Session.save(data);
      location.href = window.APP_CONFIG.AFTER_LOGIN_URL;
    } catch (err) {
      UI.showAlert(alertEl, err.message);
      if (err.status === 401) {
        form.elements.password.value = "";
        form.elements.password.focus();
      }
      UI.setLoading(btn, false);
    }
  });
})();
