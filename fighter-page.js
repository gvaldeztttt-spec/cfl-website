(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const fighters = window.CFL_FIGHTERS || {};
  const fighter = fighters[id];

  const root = document.querySelector("[data-fighter-root]");
  const history = document.querySelector("[data-fighter-history]");
  const missing = document.querySelector("[data-fighter-missing]");

  const lang = () => window.CFL_getLang?.() || localStorage.getItem("cfl-lang") || "en";
  const pick = (value) => {
    if (value && typeof value === "object") return value[lang()] || value.en || value.es || "";
    return value || "";
  };

  const render = () => {
    if (!fighter) {
      root?.setAttribute("hidden", "");
      history?.setAttribute("hidden", "");
      missing?.removeAttribute("hidden");
      document.title = "Athlete | CFL Continental Fight League";
      return;
    }

    missing?.setAttribute("hidden", "");
    root?.removeAttribute("hidden");
    history?.removeAttribute("hidden");

    document.title = `${fighter.namePlain} | CFL Continental Fight League`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        `${fighter.name} — ${pick(fighter.sport)} · ${pick(fighter.country)}. Record ${fighter.record}. Continental Fight League.`
      );
    }

    const img = document.querySelector("[data-fighter-image]");
    if (img) {
      img.src = fighter.image;
      img.alt = fighter.name;
    }

    const recordBadge = document.querySelector("[data-fighter-record]");
    if (recordBadge) recordBadge.textContent = fighter.record;

    const tag = document.querySelector("[data-fighter-tag]");
    if (tag) tag.textContent = `${pick(fighter.sport)} · ${pick(fighter.country)}`;

    const name = document.querySelector("[data-fighter-name]");
    if (name) name.textContent = fighter.name;

    const nick = document.querySelector("[data-fighter-nick]");
    if (nick) {
      if (fighter.nickname) {
        nick.hidden = false;
        nick.textContent = `“${fighter.nickname}”`;
      } else {
        nick.hidden = true;
      }
    }

    const bio = document.querySelector("[data-fighter-bio]");
    if (bio) bio.textContent = pick(fighter.bio);

    const setStat = (key, value) => {
      const el = document.querySelector(`[data-fighter-stat="${key}"]`);
      if (el) el.textContent = value;
    };

    setStat("record", fighter.record);
    setStat("division", pick(fighter.division));
    setStat("height", fighter.height);
    setStat("reach", fighter.reach);
    setStat("stance", pick(fighter.stance));
    setStat("koRate", fighter.koRate);
    setStat("debut", fighter.debut);
    setStat("based", pick(fighter.based));

    const source = document.querySelector("[data-fighter-source]");
    if (source) {
      source.href = fighter.sourceUrl;
      const label = window.CFL_I18N?.[lang()]?.fighter_source || "Source";
      source.innerHTML = `<span>${label} · ${fighter.sourceLabel}</span> <span>→</span>`;
    }

    const list = document.querySelector("[data-fighter-fights]");
    if (list) {
      list.innerHTML = (fighter.recent || [])
        .map(
          (fight) => `
        <article class="fighter-fight">
          <span class="fighter-fight-result is-${fight.result.toLowerCase()}">${fight.result}</span>
          <div class="fighter-fight-copy">
            <h3>${fight.opponent}</h3>
            <p>${fight.event}</p>
          </div>
          <div class="fighter-fight-meta">
            <strong>${fight.method}</strong>
            <span>${fight.date}</span>
          </div>
        </article>`
        )
        .join("");
    }

    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  };

  render();

  const originalSetLang = window.CFL_setLang;
  window.CFL_setLang = (next) => {
    originalSetLang?.(next);
    render();
  };
})();
