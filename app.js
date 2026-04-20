(function() {
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
    'ship-safe':          'SHIP-SAFE — License is Public Domain, CC0, CC-BY, or CC-BY-SA. Legally clean to ship on a commercial device.',
    'blocked-nc':         'BLOCKED-NC — Licensed CC-BY-NC or CC-BY-NC-SA. Non-commercial only. Cannot ship on a commercial product without a separate license deal.',
    'blocked-copyright':  'BLOCKED-COPYRIGHT — Explicit copyright holder (e.g., Schocken, Chabad House Publications, Steinsaltz Center). Licensing deal required.',
    'blocked-copy':       'BLOCKED-COPYRIGHT — Explicit copyright holder. Licensing deal required.',
    'audit-needed':       'AUDIT-NEEDED — License field is blank or marked "unknown". Legal review required before shipping.',
    'other':              'OTHER — License value does not fit standard categories. Review manually.',

    // License values (what actually appears in Sefaria data)
    'public domain':      'Public Domain — out of copyright. Ship freely.',
    'pd':                 'Public Domain (alias). Ship freely.',
    'cc0':                'CC0 — dedicated to the public domain. Ship freely.',
    'cc-by':              'CC-BY — Creative Commons Attribution. Commercial use allowed with attribution.',
    'cc-by-sa':           'CC-BY-SA — Attribution + ShareAlike. Commercial OK; derivatives must use same license.',
    'cc-by-nc':           'CC-BY-NC — Attribution + NonCommercial. Cannot ship on a commercial product.',
    'cc-by-nc-sa':        'CC-BY-NC-SA — NonCommercial + ShareAlike. Cannot ship on a commercial product.',
    'unknown':            'Unknown — license field blank or explicitly "unknown". Legal review required.',
    '(blank)':            'Blank — no license specified. Legal review required.',
    'copyright: schocken': 'Copyright: Schocken. Blocked for commercial use without license.',
    'copyright: chabad house publications': 'Copyright: Chabad House Publications. Blocked for commercial use without license.',
    'copyright: steinsaltz center': 'Copyright: Steinsaltz Center. Blocked for commercial use without license.',

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
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
})();