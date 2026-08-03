(() => {
  const form = document.getElementById("cflBoxForm");
  if (!form) return;

  // Google Apps Script Web App (CFL Box → Google Sheet)
  const SHEETS_ENDPOINT =
    "https://script.google.com/macros/s/AKfycby5D7vu8tYjYH4VY-NCwSO6ECkXnbjHX5CoXrQldo_gX-V85-Wnp2p-OvGzwOQ9cRPHbg/exec";

  const statusEl = form.querySelector("[data-form-status]");
  const t = (key) => {
    const lang = window.CFL_getLang?.() || localStorage.getItem("cfl-lang") || "en";
    return window.CFL_I18N?.[lang]?.[key] || window.CFL_I18N?.en?.[key] || key;
  };

  const ageFromDate = (iso) => {
    if (!iso) return null;
    const birth = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age;
  };

  const setStatus = (message, kind = "") => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-success", kind === "success");
  };

  const collectPayload = () => {
    const data = {};
    const fd = new FormData(form);

    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        data[key] = value.name || "";
        continue;
      }
      data[key] = value;
    }

    // Explicit checkbox handling (unchecked boxes are omitted from FormData)
    ["acepta_evaluacion_medica", "declara_veracidad", "acepta_reglamento", "autoriza_imagen", "autoriza_datos"].forEach(
      (name) => {
        const el = form.elements.namedItem(name);
        data[name] = el && "checked" in el ? Boolean(el.checked) : false;
      }
    );

    return data;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus(t("cfl_box_error_required"), "error");
      return;
    }

    const birth = form.elements.namedItem("fecha_nacimiento")?.value;
    const age = ageFromDate(birth);
    if (age == null || age < 18 || age > 34) {
      setStatus(t("cfl_box_error_age"), "error");
      form.elements.namedItem("fecha_nacimiento")?.focus();
      return;
    }

    const email = String(form.elements.namedItem("correo_electronico")?.value || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus(t("cfl_box_error_email"), "error");
      return;
    }

    const video = String(form.elements.namedItem("video_pelea")?.value || "").trim();
    if (video) {
      try {
        // eslint-disable-next-line no-new
        new URL(video);
      } catch {
        setStatus(t("cfl_box_error_video"), "error");
        return;
      }
    }

    const payload = collectPayload();
    setStatus(t("cfl_box_sending"), "");
    if (button) {
      button.disabled = true;
      button.textContent = t("cfl_box_sending_btn");
    }

    try {
      // text/plain avoids a CORS preflight; Apps Script still reads JSON from the body
      await fetch(SHEETS_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // no-cors responses are opaque; success is assumed if the request did not throw
      setStatus(t("cfl_box_success"), "success");
      if (button) button.textContent = t("cfl_box_success_btn");
    } catch {
      setStatus(t("cfl_box_error_network"), "error");
      if (button) {
        button.disabled = false;
        button.textContent = t("cfl_box_submit");
      }
    }
  });

  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
})();
