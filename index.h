<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ALL_MKT Bhavcopy Builder</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/en.js"></script>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <header class="nv-bar">
    <div class="left">
      <div class="title">ALL_MKT Builder</div>
      <div class="sub">Validus Fintech</div>
    </div>
    <div class="actions">
      <button id="btnDownloadAll" class="btn primary">Download ALL_MKT CSV</button>
      <button id="btnDownloadAmfi" class="btn">Download AMFI CSV</button>
      <button id="btnCopyTable" class="btn">Copy table</button>
    </div>
  </header>

  <main class="container">
    <section class="card">
      <div class="row">
        <label for="datePick"><b>Date</b></label>
        <input id="datePick" placeholder="YYYY-MM-DD (IST)" />
        <label class="chk"><input type="checkbox" id="persistToggle" /> Persist to Blob</label>
        <button id="btnOpen" class="btn">Open Originals</button>
      </div>
      <div class="row">
        <textarea id="isinInput" rows="3" placeholder="AMFI ISINs (comma/newline separated). Leave blank for all."></textarea>
        <button id="btnSaveIsin" class="btn">Save ISIN list</button>
        <button id="btnLoadIsin" class="btn">Load saved list</button>
      </div>
      <div id="msg" class="hint"></div>
    </section>

    <section class="card">
      <div class="row">
        <input id="search" placeholder="Search ISIN / Ticker / Name" />
        <div class="pager">
          <button id="prevPage" class="btn">◀</button>
          <span id="pageInfo" class="muted">0–0 / 0</span>
          <button id="nextPage" class="btn">▶</button>
        </div>
      </div>
      <div id="tableWrap" class="table-wrap"></div>
      <div id="downloads" class="downloads"></div>
    </section>

    <section class="card">
      <details open>
        <summary>Status log</summary>
        <pre id="statusLog" class="log"></pre>
      </details>
    </section>
  </main>

  <footer class="footer">
    <span>© Dinesh_FA@Validus</span>
  </footer>

  <div id="toast" class="toast hidden"></div>
  <script src="./app.js" type="module"></script>
</body>
</html>
