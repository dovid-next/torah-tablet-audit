(function() {
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