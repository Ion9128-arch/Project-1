(function () {
  const $ = (id) => document.getElementById(id);
  const form = $("signup-form");
  const alertEl = $("form-alert");
  const submitBtn = $("signup-btn");
  const F = {
    name: $("f-name"), username: $("f-username"), email: $("f-email"),
    college_id: $("f-college"), password: $("f-password"), confirm: $("f-confirm"),
  };

  UI.initPasswordToggles();

  // ---------------- Simple fields ----------------
  const val = (n) => form.elements[n].value;

  function checkField(name) {
    let msg;
    if (name === "name") msg = Rules.name(val("name"));
    if (name === "email") msg = Rules.email(val("email"));
    if (name === "password") msg = Rules.password(val("password"));
    if (name === "confirm") msg = Rules.confirm(val("password"), val("confirm"));
    if (name === "username") msg = Rules.username(val("username").trim());
    if (name === "college_id") msg = $("college-id").value ? null : "Select your college from the list, or add it.";
    msg ? UI.setFieldError(F[name], msg) : UI.clearField(F[name]);
    return !msg;
  }

  ["name", "email", "confirm"].forEach((n) => {
    form.elements[n].addEventListener("blur", () => form.elements[n].value && checkField(n));
    form.elements[n].addEventListener("input", () => UI.clearField(F[n]));
  });

  // ---------------- Username: live availability ----------------
  const usernameOk = F.username.querySelector(".field-ok");
  let usernameState = { value: "", available: false };

  const checkAvailability = UI.debounce(async (value) => {
    try {
      const res = await Api.usernameAvailable(value);
      if (form.elements.username.value.trim() !== value) return; // user kept typing
      usernameState = { value, available: res.available };
      if (res.available) { UI.setFieldValid(F.username); usernameOk.textContent = "✓ Username is available"; }
      else { UI.setFieldError(F.username, res.reason); usernameOk.textContent = ""; }
    } catch { /* server unreachable: the final submit will report it */ }
  }, 400);

  form.elements.username.addEventListener("input", () => {
    const v = form.elements.username.value.trim();
    usernameOk.textContent = "";
    usernameState = { value: "", available: false };
    if (!v) return UI.clearField(F.username);
    const problem = Rules.username(v);
    if (problem) return v.length >= 3 ? UI.setFieldError(F.username, problem) : UI.clearField(F.username);
    UI.clearField(F.username);
    checkAvailability(v);
  });

  // ---------------- Password checklist ----------------
  const rulesList = $("pw-rules");
  rulesList.innerHTML = Rules.passwordChecks.map((c) => `<li data-rule="${c.id}">${c.label}</li>`).join("");
  const bar = $("strength-bar");
  const barColors = ["#dc2626", "#dc2626", "#f97316", "#eab308", "#84cc16", "#16a34a"];

  form.elements.password.addEventListener("input", () => {
    const p = val("password");
    let met = 0;
    Rules.passwordChecks.forEach((c) => {
      const ok = c.test(p);
      met += ok;
      rulesList.querySelector(`[data-rule="${c.id}"]`).classList.toggle("met", ok);
    });
    bar.style.width = (met / Rules.passwordChecks.length) * 100 + "%";
    bar.style.background = barColors[met];
    UI.clearField(F.password);
    if (val("confirm")) checkField("confirm");
  });

  // ---------------- College search (combobox) ----------------
  const search = $("college-search");
  const list = $("college-list");
  const hiddenId = $("college-id");
  const selectedBox = $("selected-college");
  let results = [];
  let active = -1;
  let lastQuery = "";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function openList() { list.hidden = false; search.setAttribute("aria-expanded", "true"); }
  function closeList() { list.hidden = true; search.setAttribute("aria-expanded", "false"); active = -1; }

  function render(query) {
    let html = results.map((c, i) => `
      <li role="option" id="college-opt-${i}" data-index="${i}" aria-selected="${i === active}">
        <div class="c-name">${esc(c.name)}</div>
        <div class="c-meta">${esc(c.city)}, ${esc(c.state)}
          ${c.nirf_rank ? `<span class="badge">NIRF ${c.nirf_year} #${c.nirf_rank}</span>` : `<span class="badge user">Added by students</span>`}
        </div>
      </li>`).join("");
    if (!results.length) html += `<li class="c-empty" aria-disabled="true">No colleges match “${esc(query)}”.</li>`;
    html += `<li class="c-add" data-add="1" role="option" id="college-opt-add" aria-selected="${active === results.length}">+ Add “${esc(query)}” as a new college</li>`;
    list.innerHTML = html;
    search.setAttribute("aria-activedescendant", active >= 0 ? (active === results.length ? "college-opt-add" : `college-opt-${active}`) : "");
    openList();
  }

  const runSearch = UI.debounce(async (q) => {
    try {
      const data = await Api.searchColleges(q);
      if (search.value.trim() !== q) return;
      results = data; active = -1; lastQuery = q;
      render(q);
    } catch (err) {
      UI.setFieldError(F.college_id, err.message);
    }
  }, 250);

  search.addEventListener("input", () => {
    clearSelection(false);
    const q = search.value.trim();
    UI.clearField(F.college_id);
    if (q.length < 2) { closeList(); return; }
    runSearch(q);
  });

  search.addEventListener("keydown", (e) => {
    if (list.hidden) return;
    const max = results.length; // last index = "Add" row
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, max); render(lastQuery); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(lastQuery); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); active === max ? openAddCollege(lastQuery) : selectCollege(results[active]); }
    else if (e.key === "Escape") closeList();
  });

  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li");
    if (!li || li.classList.contains("c-empty")) return;
    e.preventDefault();
    li.dataset.add ? openAddCollege(lastQuery) : selectCollege(results[+li.dataset.index]);
  });
  search.addEventListener("blur", () => setTimeout(closeList, 120));

  function selectCollege(c) {
    hiddenId.value = c.id;
    search.value = c.name;
    $("selected-college-text").textContent = `✓ ${c.name} — ${c.city}, ${c.state}`;
    selectedBox.hidden = false;
    search.hidden = true;
    closeList();
    closeAddCollege();
    UI.clearField(F.college_id);
  }

  function clearSelection(focus = true) {
    hiddenId.value = "";
    selectedBox.hidden = true;
    search.hidden = false;
    if (focus) { search.value = ""; search.focus(); }
  }
  $("change-college").addEventListener("click", () => clearSelection(true));

  // ---------------- Add a new college ----------------
  const addBox = $("add-college");
  const NF = { name: $("f-new-name"), city: $("f-new-city"), state: $("f-new-state") };
  const stateSelect = $("new-college-state");
  let statesLoaded = false;

  async function loadStates() {
    if (statesLoaded) return;
    try {
      const states = await Api.listStates();
      stateSelect.insertAdjacentHTML("beforeend", states.map((s) => `<option>${esc(s)}</option>`).join(""));
      statesLoaded = true;
    } catch (err) { UI.setFieldError(NF.state, err.message); }
  }

  function openAddCollege(prefill = "") {
    closeList();
    addBox.hidden = false;
    if (prefill && !$("new-college-name").value) $("new-college-name").value = prefill;
    loadStates();
    $("new-college-name").focus();
  }
  function closeAddCollege() {
    addBox.hidden = true;
    Object.values(NF).forEach(UI.clearField);
  }

  $("open-add-college").addEventListener("click", () => openAddCollege(hiddenId.value ? "" : search.value.trim()));
  $("cancel-add-college").addEventListener("click", closeAddCollege);

  $("save-college").addEventListener("click", async () => {
    const payload = {
      name: $("new-college-name").value.trim(),
      city: $("new-college-city").value.trim(),
      state: stateSelect.value,
    };
    let ok = true;
    if (payload.name.length < 3) { UI.setFieldError(NF.name, "Enter the full college name."); ok = false; }
    if (payload.city.length < 2) { UI.setFieldError(NF.city, "Enter the city."); ok = false; }
    if (!payload.state) { UI.setFieldError(NF.state, "Select a state."); ok = false; }
    if (!ok) return;

    const btn = $("save-college");
    UI.setLoading(btn, true, "Adding…");
    try {
      const college = await Api.addCollege(payload);
      selectCollege(college);
      $("new-college-name").value = $("new-college-city").value = ""; stateSelect.value = "";
    } catch (err) {
      if (err.status === 409 && err.body.college) {
        selectCollege(err.body.college); // already exists: just use it
        UI.showAlert(alertEl, err.message, "success");
      } else {
        Object.entries(err.errors).forEach(([k, m]) => UI.setFieldError(NF[k], m));
        if (!Object.keys(err.errors).length) UI.setFieldError(NF.name, err.message);
      }
    } finally {
      UI.setLoading(btn, false);
    }
  });

  // ---------------- Submit ----------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    UI.showAlert(alertEl, "");
    const allOk = ["name", "username", "email", "college_id", "password", "confirm"].map(checkField).every(Boolean);
    if (!allOk) {
      form.querySelector(".field.invalid input:not([type=hidden])")?.focus();
      return;
    }

    UI.setLoading(submitBtn, true, "Creating account…");
    try {
      const data = await Api.register({
        name: val("name").trim(),
        username: val("username").trim(),
        email: val("email").trim(),
        password: val("password"),
        college_id: Number(hiddenId.value),
      });
      Api.Session.save(data);
      location.href = window.APP_CONFIG.AFTER_LOGIN_URL;
    } catch (err) {
      UI.showAlert(alertEl, err.message);
      Object.entries(err.errors).forEach(([k, m]) => UI.setFieldError(F[k], m));
      if (err.errors.username) usernameOk.textContent = "";
      UI.setLoading(submitBtn, false);
    }
  });
})();
