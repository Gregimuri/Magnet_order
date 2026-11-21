import {
  OUTPUT_HEADERS,
  DEFAULT_COLUMN_MAP,
  parsePaste,
  transformFromMatrix,
  rowsToAoA,
} from './transform.js';

const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el;
};

const inputEl = /** @type {HTMLInputElement} */ ($('file-xlsx'));

const PARSE_OPTS_BASE = {
  skipFirstRow: false,
  columns: DEFAULT_COLUMN_MAP,
};

/** @type {Record<string, string|number>[]} */
let lastResult = [];

/** @type {string[]} */
let lastWarnings = [];

/** @type {boolean[]} */
let lastWarnFlags = [];

function generate() {
  const raw = $('paste').value;
  $('error-msg').textContent = '';
  $('meta-line').textContent = '';

  if (!raw.trim()) {
    lastResult = [];
    lastWarnings = [];
    lastWarnFlags = [];
    renderTable();
    renderWarnings([]);
    $('error-msg').textContent = 'Добавьте данные: вставьте текст или выберите файл.';
    $('warnings-block').hidden = true;
    return;
  }

  try {
    const { rows: matrix } = parsePaste(raw, PARSE_OPTS_BASE);

    if (!matrix.length) {
      lastResult = [];
      lastWarnings = ['Не удалось разобрать строки — проверьте, что вставлен фрагмент таблицы.'];
      lastWarnFlags = [];
      renderTable();
      renderWarnings(lastWarnings);
      $('warnings-block').hidden = false;
      return;
    }

    const queueVal = $('queue-input').value.trim();
    const warns = [];
    const { rows, warnings, warningsByTtFlags, inputKind, sourceRecords } = transformFromMatrix(
      matrix,
      {
        queueDefault: queueVal,
        columns: PARSE_OPTS_BASE.columns,
        warnings: warns,
      },
    );

    lastResult = rows;
    lastWarnings = warnings;
    lastWarnFlags = warningsByTtFlags;
    const kindLabel = inputKind === 'zakaz' ? 'заказ Magnit' : 'плоская выгрузка';
    $('meta-line').textContent = `Готово (${kindLabel}): позиций ${sourceRecords ?? '—'}, торговых точек ${rows.length}.`;
    renderWarnings(lastWarnings);
    $('warnings-block').hidden = warnings.length === 0;
    renderTable();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    $('error-msg').textContent = msg;
    lastResult = [];
    lastWarnings = [];
    lastWarnFlags = [];
    renderTable();
    renderWarnings([]);
    $('warnings-block').hidden = true;
  }
}

function renderWarnings(messages) {
  const ul = $('warnings-ul');
  ul.replaceChildren();

  messages.forEach((m) => {
    const li = document.createElement('li');
    li.textContent = m;
    ul.appendChild(li);
  });
}

function renderTable() {
  const thead = $('thead-row');
  const tbody = $('tbody');
  thead.replaceChildren();
  tbody.replaceChildren();

  OUTPUT_HEADERS.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    thead.appendChild(th);
  });

  lastResult.forEach((row, idx) => {
    const tr = document.createElement('tr');
    if (lastWarnFlags[idx]) tr.classList.add('warn-row');
    OUTPUT_HEADERS.forEach((h) => {
      const td = document.createElement('td');
      const v = row[h];
      td.textContent =
        v === '' || v == null ? '' : typeof v === 'number' ? String(v) : String(v);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  const has = lastResult.length > 0;
  $('btn-copy-tsv').disabled = !has;
  $('btn-download-csv').disabled = !has;
  $('btn-download-xlsx').disabled =
    !has || !(typeof window !== 'undefined' && /** @type {any} */ (window).XLSX);
}

function downloadBlob(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 400);
}

async function copyTsv() {
  if (!lastResult.length) return;
  const text = encodeTsvAoA(rowsToAoA(lastResult));
  await navigator.clipboard.writeText(text);
}

function encodeCsvField(v) {
  const s =
    v === null || typeof v === 'undefined' ? '' : typeof v === 'number' ? String(v) : String(v);
  if (/[\";\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function encodeCsvAoA(rows) {
  const sep = ';';
  return rows.map((cells) => cells.map(encodeCsvField).join(sep)).join('\r\n');
}

function encodeTsvAoA(rows) {
  return rows.map((cells) => cells.join('\t')).join('\r\n');
}

function downloadCsv() {
  const aoa = rowsToAoA(lastResult);
  const body = encodeCsvAoA(aoa);
  const blob = new Blob([`\ufeff${body}`], { type: 'text/csv;charset=utf-8;' });
  downloadBlob('svod_tt.csv', blob);
}

function downloadXlsx() {
  const XLSX = /** @type {any} */ (window).XLSX;
  if (!XLSX || !lastResult.length) return;
  const aoa = rowsToAoA(lastResult);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Свод');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob('svod_tt.xlsx', blob);
}

function wireFileLabel() {
  const input = $('file-xlsx');
  const label = document.querySelector('label.file-label');
  label?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
}

function readXlsxFile(file) {
  const XLSX = /** @type {any} */ (window).XLSX;
  if (!file || !XLSX) return;
  $('error-msg').textContent = '';
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = new Uint8Array(/** @type {ArrayBuffer} */ (ev.target?.result));
      const wb = XLSX.read(data, { type: 'array' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      /** @type {string[][]} */
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      $('paste').value = rows.map((r) => (Array.isArray(r) ? r : []).join('\t')).join('\n');
      $('meta-line').textContent =
        `Загружен лист «${wsName}». Нажмите «Сгенерировать результат».`;
      inputEl.value = '';
    } catch (e) {
      $('error-msg').textContent = e instanceof Error ? e.message : String(e);
    }
  };
  reader.readAsArrayBuffer(file);
}

function wireEvents() {
  $('btn-generate').addEventListener('click', generate);

  $('btn-copy-tsv').addEventListener('click', () =>
    copyTsv().catch((e) => {
      $('error-msg').textContent = e instanceof Error ? e.message : String(e);
    }),
  );

  $('btn-download-csv').addEventListener('click', downloadCsv);
  $('btn-download-xlsx').addEventListener('click', downloadXlsx);

  inputEl.addEventListener('change', (ev) => {
    const f = /** @type {HTMLInputElement} */ (ev.target).files?.[0];
    if (f) readXlsxFile(f);
  });

  wireFileLabel();
}

wireEvents();

lastResult = [];
lastWarnings = [];
lastWarnFlags = [];
renderTable();
renderWarnings([]);
$('warnings-block').hidden = true;
$('btn-copy-tsv').disabled = true;
$('btn-download-csv').disabled = true;
$('btn-download-xlsx').disabled = true;

window.addEventListener('load', () => {
  if (!window.XLSX && $('warn-xlsx'))
    $('warn-xlsx').textContent = 'Библиотека для Excel не загрузилась — проверьте интернет/CDN.';
});
