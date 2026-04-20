(function() {
  // ============== MOBILE TOC DRAWER ==============
  // Below 1200px the TOC is hidden by default. On narrow screens, add a
  // floating button bottom-right that toggles the TOC as an overlay drawer.
  var toc = document.getElementById('floating-toc');
  if (toc) {
    var tocBtn = document.createElement('button');
    tocBtn.type = 'button';
    tocBtn.id = 'toc-toggle';
    tocBtn.setAttribute('aria-label', 'Toggle contents');
    tocBtn.innerHTML = '<span>☰</span>';
    document.body.appendChild(tocBtn);

    var tocOverlay = document.createElement('div');
    tocOverlay.id = 'toc-overlay';
    document.body.appendChild(tocOverlay);

    function closeTOC() {
      toc.classList.remove('open');
      tocOverlay.classList.remove('visible');
      document.body.classList.remove('toc-open');
    }
    tocBtn.addEventListener('click', function() {
      var isOpen = toc.classList.toggle('open');
      tocOverlay.classList.toggle('visible', isOpen);
      document.body.classList.toggle('toc-open', isOpen);
    });
    tocOverlay.addEventListener('click', closeTOC);
    // Close drawer when a link inside is tapped
    toc.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') closeTOC();
    });
  }

  // ============== TAG DESCRIPTIONS (hover tooltips) ==============
  // Keyed by lowercased chip value OR "columnName::value"
  var TAG_DESCRIPTIONS = {
    // Charedi acceptability grades
    '1':             'Grade 1 — Charedi mainstream. Ships without objection. Examples: Artscroll, Chabad/Kehot, Feldheim, Metsudah, Machon Mamre, classical Vilna/Warsaw editions, Hebrew/Aramaic source texts.',
    '2':             'Grade 2 — Orthodox / Modern-Orthodox / Religious-Zionist. Acceptable to most Charedim; may need haskama check. Examples: Koren, Maggid, OU Press, Moznaim/Touger, Har Bracha, Rav Kook world.',
    '3':             'Grade 3 — Academic-Orthodox or uneven quality. Tolerated by some Charedim, rejected by many. Examples: Steinsaltz/Davidson, Soncino, Sefaria community translations, Wikisource.',
    '4':             'Grade 4 — Non-Orthodox Jewish. Rejected by Charedi market. Examples: JPS, Reconstructionist, Reform, JTS/HUC.',
    '5':             'Grade 5 — Non-Jewish / critical academic. Examples: Christian translations, Septuagint (Brenton), bible-criticism scholars.',
    '?':             'Grade ? — Could not be classified automatically. Needs manual review to assign a grade.',

    // License status
    'ship-safe':          'SHIP-SAFE — License is Public Domain, CC0, CC-BY, or CC-BY-SA. Legally clean to ship on a commercial device; you can include, redistribute, and sell with the content embedded. For CC-BY / CC-BY-SA you still owe attribution in an about-page or credits screen.',
    'blocked-nc':         'BLOCKED-NC — Licensed CC-BY-NC or CC-BY-NC-SA. "NC" = NonCommercial. Free download is allowed, but shipping the text on a product you sell is a license violation. To use: (a) cut it from the build, (b) license it separately from the rights-holder, or (c) commission a replacement translation.',
    'blocked-copyright':  'BLOCKED-COPYRIGHT — All rights reserved by a named publisher (Schocken, Chabad House Publications, Steinsaltz Center). Sefaria got permission to display online under specific terms; that permission does NOT transfer to a commercial device. You need a direct license agreement with the rights-holder, or cut the text.',
    'blocked-copy':       'BLOCKED-COPYRIGHT — All rights reserved by a named publisher. Sefaria displays it under specific online terms that do NOT extend to a commercial device. Direct license agreement with the rights-holder required to ship, otherwise cut.',
    'audit-needed':       'AUDIT-NEEDED — License field is blank or literally "unknown" in Sefaria\'s metadata. Status is genuinely unclear — could be PD (safe), could be NC (blocked), could be an oversight. Treat as blocked until a lawyer or the Sefaria team clears it. ~2,000 versions fall here — this is the main legal-review bottleneck.',
    'other':              'OTHER — License value does not fit standard categories. Review manually.',

    // License values (what actually appears in Sefaria data)
    'public domain':      'Public Domain — copyright has expired or was never claimed (typical for pre-1928 works and classical Jewish texts: Gemara, Rashi, Rambam, Tur, Shulchan Aruch). Free to copy, modify, ship, and sell without attribution or permission. The safest possible status.',
    'pd':                 'Public Domain (alias of "Public Domain"). See Public Domain description — same meaning, just a shorter label in Sefaria\'s metadata.',
    'cc0':                'CC0 — the creator explicitly waived all copyright and dedicated the work to the public domain. Equivalent to PD for all practical purposes: ship freely, no attribution required. Often used for Sefaria-community-contributed texts.',
    'cc-by':              'CC-BY (Creative Commons Attribution 4.0) — you can copy, modify, distribute, and commercialize, including embed in a paid product, AS LONG AS you credit the original author/source. For a tablet: add a credits/about screen listing attributions. No other restrictions.',
    'cc-by-sa':           'CC-BY-SA (Attribution + ShareAlike) — same as CC-BY, but any derivative work you create and distribute must be released under CC-BY-SA too. For a tablet: fine to ship the text itself (you aren\'t modifying it), but if you make a derivative (e.g., commentary) and distribute it, you owe CC-BY-SA on that derivative. Does NOT "infect" unrelated parts of your product.',
    'cc-by-nc':           'CC-BY-NC (Attribution + NonCommercial) — permits copying and modification for NonCommercial uses only. A tablet sold for money is explicitly commercial → this license is BLOCKED. Includes: Steinsaltz/William Davidson Talmud, Touger Mishneh Torah, JPS Tanakh, Peninei Halakhah, Torat Emet. To ship, negotiate a separate paid license with each rights-holder.',
    'cc-by-nc-sa':        'CC-BY-NC-SA (NonCommercial + ShareAlike) — BLOCKED for commercial products for the same reason as CC-BY-NC. Adds ShareAlike: derivatives must use the same license. Only 1 version in Sefaria uses this.',
    'unknown':            'Unknown — Sefaria\'s metadata explicitly says "unknown" for the license. May have been digitized before licensing was tracked, or the contributor never supplied info. Must be cleared with Sefaria legal or cut. About 2,065 versions in this state — they represent the bulk of the audit burden.',
    '(blank)':            'Blank — no license value present in Sefaria\'s metadata at all. Same practical status as "unknown": must be cleared before shipping. ~74 versions blank. Treat as blocked pending research.',
    'copyright: schocken': 'Copyright: Schocken Books. A commercial publisher (now an imprint of Penguin Random House). Sefaria displays some Schocken translations under an arrangement specific to their site. To ship on a device, you would need a direct license from Schocken/Penguin Random House. 11 versions affected. Very unlikely to be granted for a competing product.',
    'copyright: chabad house publications': 'Copyright: Chabad House Publications. Lubavitch affiliated publisher. Sefaria has permission for online display; that does NOT transfer to a commercial device. 5 versions affected. A Chabad partnership might unlock these — but the underlying Kehot/Touger texts (Grade 1) are already ship-safe, so the marginal value may be low.',
    'copyright: steinsaltz center': 'Copyright: Steinsaltz Center. The copyright holder for some Steinsaltz works not covered by the William Davidson Edition release. 2 versions affected. Note: the Davidson Talmud translation is CC-BY-NC (still blocked commercially, but a different status), licensed separately. The Center may license directly for a fee.',

    // Coverage-gap buckets
    'clean':       'CLEAN — Title has Grade 1-2 ship-safe English. Works out of the box.',
    'compromise':  'COMPROMISE — Only Grade-3 English ship-safe (Davidson / Steinsaltz / Sefaria community). Ships legally but needs rabbinic sign-off.',
    'rescuable':   'RESCUABLE — Only "unknown license" English exists. Could be rescued by legal audit.',
    'blocked':     'BLOCKED — English exists but all of it is NC / copyright / Grade 4-5. Tablet ships Hebrew-only for this title.',
    'no_english':  'NO_ENGLISH — No English translation exists in Sefaria at all. Hebrew-only by default.',
    'not in sefaria': 'Title not present in Sefaria dataset.',

    // Categories
    'tanakh':          'Tanakh — Torah, Neviim, Ketuvim (the written Hebrew Bible).',
    'talmud':          'Talmud — Bavli and Yerushalmi, includes commentaries like Rashi, Tosafot.',
    'mishnah':         'Mishnah — the core tannaitic text, with commentaries (Bartenura, Tiferet Yisrael, etc.).',
    'midrash':         'Midrash — aggadic and halachic Midrash collections.',
    'halakhah':        'Halakhah — Rambam, Shulchan Aruch, Tur, Mishnah Berurah, etc.',
    'kabbalah':        'Kabbalah — Zohar, Sefer Yetzirah, Arizal, Ramchal Kabbalah, etc.',
    'chasidut':        'Chasidut — Tanya, Likutei Moharan, Chabad/Breslov/Polish Chasidic works.',
    'liturgy':         'Liturgy — Siddur, Machzor, Haggadah, piyyutim.',
    'jewish thought':  'Jewish Thought — medieval and modern Jewish philosophy and machshava.',
    'musar':           'Musar — Mesilat Yesharim, Chovot HaLevavot, Orchot Tzadikim, etc.',
    'responsa':        'Responsa — she\'elot u-teshuvot, halachic Q&A literature.',
    'tosefta':         'Tosefta — parallel tannaitic text to Mishnah.',
    'second temple':   'Second Temple — Philo, Josephus, apocrypha, pseudepigrapha.',
    'reference':       'Reference — dictionaries, encyclopedias, Jewish reference works.',

    // Languages (add for completeness)
    'english': 'English translation.',
    'hebrew':  'Hebrew source text or Hebrew translation.',
    'aramaic': 'Aramaic source text (Talmud, Targumim, Zohar).',
    'yiddish': 'Yiddish translation or original Yiddish work.',
  };

  function describeTag(columnName, value) {
    var colKey = (columnName || '').toLowerCase().trim();
    var valKey = (value || '').toLowerCase().trim();
    // Try "column::value" first, then "value" alone
    if (TAG_DESCRIPTIONS[colKey + '::' + valKey]) return TAG_DESCRIPTIONS[colKey + '::' + valKey];
    if (TAG_DESCRIPTIONS[valKey]) return TAG_DESCRIPTIONS[valKey];
    // Column-specific fallback hints
    if (colKey === 'grade') return 'Grade ' + value + ' — no description available.';
    if (colKey === 'status') return 'Status: ' + value;
    if (colKey === 'category') return 'Sefaria category: ' + value;
    if (colKey === 'language') return 'Language: ' + value;
    if (colKey === 'license') return 'License value: ' + value;
    return '';
  }

  document.querySelectorAll('table').forEach(function(table) {
    if (!table.tBodies.length || !table.tHead) return;
    var tbody = table.tBodies[0];
    if (tbody.rows.length < 2) return;

    var headers = Array.from(table.tHead.rows[0].cells);
    var headerNames = headers.map(function(h){ return h.textContent.trim(); });

    // ============== DETECT FACETABLE COLUMNS ==============
    // A column is "facetable" if it has <= 15 unique values AND >= 2 AND not purely numeric cells of high variety
    var facetableCols = [];
    headers.forEach(function(h, colIdx) {
      var values = {};
      var totalRows = 0;
      Array.from(tbody.rows).forEach(function(r) {
        var cell = r.cells[colIdx];
        if (!cell) return;
        var t = cell.textContent.trim();
        if (t === '' || t === '—' || t === '-') return;
        totalRows++;
        values[t] = (values[t] || 0) + 1;
      });
      var uniqueCount = Object.keys(values).length;
      // Heuristic: facetable if 2..15 unique values AND repeats exist (uniqueCount < totalRows)
      if (uniqueCount >= 2 && uniqueCount <= 15 && uniqueCount < totalRows * 0.75) {
        facetableCols.push({colIdx: colIdx, name: headerNames[colIdx], values: values});
      }
    });

    // ============== BUILD FACET BAR ==============
    var activeFilters = {}; // colIdx -> Set of active values
    var filterBox;
    function applyFilters() {
      var textQ = filterBox ? filterBox.value.toLowerCase().trim() : '';
      Array.from(tbody.rows).forEach(function(row) {
        var hiddenByText = textQ && row.textContent.toLowerCase().indexOf(textQ) === -1;
        var hiddenByFacet = false;
        Object.keys(activeFilters).forEach(function(colIdxStr) {
          if (hiddenByFacet) return;
          var colIdx = parseInt(colIdxStr,10);
          var active = activeFilters[colIdx];
          if (!active || active.size === 0) return;
          var cell = row.cells[colIdx];
          var val = cell ? cell.textContent.trim() : '';
          if (!active.has(val)) hiddenByFacet = true;
        });
        row.classList.toggle('hidden-by-filter', hiddenByText || hiddenByFacet);
      });
    }

    if (facetableCols.length > 0) {
      var bar = document.createElement('div');
      bar.className = 'facet-bar';
      facetableCols.forEach(function(fc) {
        var group = document.createElement('div');
        group.className = 'facet-group';
        var label = document.createElement('span');
        label.className = 'facet-label';
        label.textContent = fc.name + ':';
        group.appendChild(label);

        // Sort values: numeric desc if values look numeric, else alphabetic
        var vals = Object.keys(fc.values);
        var allNum = vals.every(function(v){ return !isNaN(parseFloat(v.replace(/[,\s%]/g,''))); });
        if (allNum) {
          vals.sort(function(a,b){ return parseFloat(b.replace(/[,\s%]/g,''))-parseFloat(a.replace(/[,\s%]/g,'')); });
        } else {
          vals.sort();
        }

        vals.forEach(function(val) {
          var chip = document.createElement('span');
          chip.className = 'facet-chip';
          chip.innerHTML = escapeHtml(val) + '<span class="count">' + fc.values[val] + '</span>';
          var desc = describeTag(fc.name, val);
          if (desc) {
            chip.setAttribute('data-tip', desc);
            chip.setAttribute('title', desc);  // fallback for touch/old browsers
          }
          chip.addEventListener('click', function() {
            if (!activeFilters[fc.colIdx]) activeFilters[fc.colIdx] = new Set();
            var set = activeFilters[fc.colIdx];
            if (set.has(val)) { set.delete(val); chip.classList.remove('active'); }
            else { set.add(val); chip.classList.add('active'); }
            applyFilters();
          });
          group.appendChild(chip);
        });
        bar.appendChild(group);
      });
      var clear = document.createElement('span');
      clear.className = 'facet-clear';
      clear.textContent = 'clear all filters';
      clear.addEventListener('click', function() {
        activeFilters = {};
        if (filterBox) filterBox.value = '';
        bar.querySelectorAll('.facet-chip.active').forEach(function(c){ c.classList.remove('active'); });
        applyFilters();
      });
      var clearRow = document.createElement('div');
      clearRow.style.textAlign = 'right';
      clearRow.appendChild(clear);
      bar.appendChild(clearRow);

      // Collapsible on mobile: wrap chips in a collapsible body, add toggle header
      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'facet-toggle';
      function updateToggleLabel() {
        var active = bar.querySelectorAll('.facet-chip.active').length;
        toggleBtn.innerHTML = 'Filters' + (active > 0 ? ' <span class="badge">' + active + '</span>' : '') + ' <span class="caret">▾</span>';
      }
      // Wrap everything after the toggle button in a .facet-body div so we can collapse it
      var body = document.createElement('div');
      body.className = 'facet-body';
      while (bar.firstChild) body.appendChild(bar.firstChild);
      bar.appendChild(toggleBtn);
      bar.appendChild(body);
      updateToggleLabel();
      toggleBtn.addEventListener('click', function() {
        bar.classList.toggle('collapsed');
      });
      // Observe chip activations to refresh badge count
      bar.addEventListener('click', function(e) {
        if (e.target.closest('.facet-chip')) setTimeout(updateToggleLabel, 0);
      });
      // Start collapsed on mobile, open on desktop (CSS handles via media query + default class)
      if (window.matchMedia('(max-width:720px)').matches) bar.classList.add('collapsed');

      table.parentNode.insertBefore(bar, table);
    }

    // ============== TEXT FILTER ==============
    filterBox = document.createElement('input');
    filterBox.type = 'search';
    filterBox.className = 'table-filter';
    filterBox.placeholder = 'Text filter in this table...';
    table.parentNode.insertBefore(filterBox, table);
    filterBox.addEventListener('input', applyFilters);

    // ============== SORTING ==============
    headers.forEach(function(th, colIdx) {
      th.addEventListener('click', function() {
        var asc = !th.classList.contains('sort-asc');
        headers.forEach(function(h) { h.classList.remove('sort-asc','sort-desc'); });
        th.classList.add(asc ? 'sort-asc' : 'sort-desc');

        var rows = Array.from(tbody.rows);
        var numeric = rows.slice(0, 10).every(function(r) {
          var txt = (r.cells[colIdx] ? r.cells[colIdx].textContent : '').trim();
          if (!txt || txt === '—' || txt === '-') return true;
          var cleaned = txt.replace(/[,\s%]/g,'').replace(/\(.*?\)/g,'').replace(/[a-zA-Z]+$/,'');
          return !isNaN(parseFloat(cleaned));
        });

        rows.sort(function(a, b) {
          var ta = (a.cells[colIdx] ? a.cells[colIdx].textContent : '').trim();
          var tb = (b.cells[colIdx] ? b.cells[colIdx].textContent : '').trim();
          if (numeric) {
            var na = parseFloat(ta.replace(/[,\s%]/g,'').replace(/\(.*?\)/g,'').replace(/[a-zA-Z]+$/,'')) || 0;
            var nb = parseFloat(tb.replace(/[,\s%]/g,'').replace(/\(.*?\)/g,'').replace(/[a-zA-Z]+$/,'')) || 0;
            return asc ? na - nb : nb - na;
          }
          return asc ? ta.localeCompare(tb) : tb.localeCompare(ta);
        });
        rows.forEach(function(r) { tbody.appendChild(r); });
      });
    });

    // ============== WRAP TABLE IN HORIZONTAL SCROLLER ==============
    // Done last so facet bar and filter input stay OUTSIDE the scrolling area.
    if (!table.parentElement.classList.contains('table-scroll')) {
      var scrollWrap = document.createElement('div');
      scrollWrap.className = 'table-scroll';
      table.parentNode.insertBefore(scrollWrap, table);
      scrollWrap.appendChild(table);
    }
  });

  // ============== MOBILE TOOLTIP TAP BEHAVIOR ==============
  // On touch devices (no hover), tapping a chip shows its tooltip; tapping elsewhere dismisses.
  // Desktop continues to use CSS :hover from app.css.
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(max-width:720px)').matches;
  if (isTouch) {
    document.addEventListener('click', function(e) {
      var chip = e.target.closest ? e.target.closest('.facet-chip[data-tip]') : null;
      // Dismiss any previously shown tooltip
      document.querySelectorAll('.facet-chip.show-tip').forEach(function(c) {
        if (c !== chip) c.classList.remove('show-tip');
      });
      if (!chip) return;
      // First tap → show tooltip AND prevent the toggle-filter action
      if (!chip.classList.contains('show-tip')) {
        chip.classList.add('show-tip');
        e.stopPropagation();
        e.preventDefault();
      }
      // Second tap (tooltip already shown) → hide tooltip and allow the original click (filter toggle) to proceed normally
      else {
        chip.classList.remove('show-tip');
      }
    }, true);  // capture phase, so we intercept before the chip's own click handler
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
})();