import {
  OUTPUT_HEADERS,
  parsePaste,
  transformFromMatrix,
  processAttachmentBundle,
  rowsToAoA,
} from './transform.js';

const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el;
};

const inputEl = /** @type {HTMLInputElement} */ ($('file-xlsx'));

/** @type {Record<string, string|number>[]} */
let lastResult = [];

/** @type {string[]} */
let lastWarnings = [];

/** @type {boolean[]} */
let lastWarnFlags = [];

/**
 * Последний разобранный пакет (ZIP/xlsx). Если задан — «Сгенерировать» использует его,
 * а не textarea (textarea только для ручной вставки).
 * @type {{ name: string, matrix: string[][] }[] | null}
 */
let loadedBundle = null;

function applyResult(payload, metaText) {
  lastResult = payload.rows;
  lastWarnings = payload.warnings;
  lastWarnFlags = payload.warningsByTtFlags;
  $('meta-line').textContent = metaText;
  renderWarnings(lastWarnings);
  $('warnings-block').hidden = lastWarnings.length === 0;
  renderTable();
}

function clearResult(errorText) {
  lastResult = [];
  lastWarnings = [];
  lastWarnFlags = [];
  renderTable();
  renderWarnings([]);
  $('warnings-block').hidden = true;
  if (errorText) $('error-msg').textContent = errorText;
}

function generate() {
  $('error-msg').textContent = '';
  $('meta-line').textContent = '';
  const queueVal = $('queue-input').value.trim();

  try {
    if (loadedBundle && loadedBundle.length) {
      const warns = [];
      const payload = processAttachmentBundle(loadedBundle, {
        queueDefault: queueVal,
        warnings: warns,
      });
      const z = payload.zakazFiles?.length ?? 0;
      const m = payload.montageFiles?.length ?? 0;
      applyResult(
        payload,
        `Готово (${payload.inputKind}): заказов ${z}, выгрузок монтажей ${m}, позиций ${payload.sourceRecords}, ТТ ${payload.rows.length}.`,
      );
      return;
    }

    const raw = $('paste').value;
    if (!raw.trim()) {
      clearResult('Добавьте данные: ZIP/Excel или вставьте таблицу.');
      return;
    }

    const { rows: matrix } = parsePaste(raw, { skipFirstRow: false });
    if (!matrix.length) {
      lastResult = [];
      lastWarnings = ['Не удалось разобрать строки — проверьте вставку.'];
      lastWarnFlags = [];
      renderTable();
      renderWarnings(lastWarnings);
      $('warnings-block').hidden = false;
      return;
    }

    const warns = [];
    const payload = transformFromMatrix(matrix, {
      queueDefault: queueVal,
      warnings: warns,
    });
    applyResult(
      payload,
      `Готово (${payload.inputKind}): позиций ${payload.sourceRecords ?? '—'}, ТТ ${payload.rows.length}.`,
    );
  } catch (e) {
    clearResult(e instanceof Error ? e.message : String(e));
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

/** @param {ArrayBuffer} data */
function xlsxBufferToMatrix(data) {
  const XLSX = /** @type {any} */ (window).XLSX;
  const wb = XLSX.read(new Uint8Array(data), { type: 'array' });
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  /** @type {string[][]} */
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  return { wsName, rows: rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '')) : [])) };
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

function readXlsxAsBundle(file) {
  const XLSX = /** @type {any} */ (window).XLSX;
  if (!file || !XLSX) return;
  $('error-msg').textContent = '';
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const { wsName, rows } = xlsxBufferToMatrix(/** @type {ArrayBuffer} */ (ev.target?.result));
      loadedBundle = [{ name: file.name, matrix: rows }];
      $('paste').value = '';
      $('meta-line').textContent =
        `Загружен «${file.name}» (лист «${wsName}»). Укажите очередь и нажмите «Сгенерировать результат».`;
      inputEl.value = '';
    } catch (e) {
      $('error-msg').textContent = e instanceof Error ? e.message : String(e);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function readZipAsBundle(file) {
  const JSZip = /** @type {any} */ (window).JSZip;
  const XLSX = /** @type {any} */ (window).XLSX;
  if (!file || !JSZip || !XLSX) {
    $('error-msg').textContent = 'Для ZIP нужны библиотеки JSZip и SheetJS (проверьте интернет/CDN).';
    return;
  }
  $('error-msg').textContent = '';
  try {
    const zip = await JSZip.loadAsync(file);
    /** @type {{ name: string, matrix: string[][] }[]} */
    const bundle = [];
    const names = Object.keys(zip.files).sort();
    for (const name of names) {
      const entry = zip.files[name];
      if (!entry || entry.dir) continue;
      if (!/\.xlsx$/i.test(name) && !/\.xls$/i.test(name)) continue;
      const buf = await entry.async('arraybuffer');
      const shortName = name.split(/[/\\]/).pop() || name;
      try {
        const { rows } = xlsxBufferToMatrix(buf);
        bundle.push({ name: shortName, matrix: rows });
      } catch (e) {
        console.warn('skip xlsx in zip', name, e);
      }
    }
    if (!bundle.length) {
      $('error-msg').textContent = 'В ZIP нет читаемых .xlsx файлов.';
      return;
    }
    loadedBundle = bundle;
    $('paste').value = '';
    $('meta-line').textContent =
      `ZIP «${file.name}»: найдено xlsx ${bundle.length} (${bundle.map((b) => b.name).join('; ')}). Укажите очередь и нажмите «Сгенерировать результат».`;
    inputEl.value = '';
  } catch (e) {
    $('error-msg').textContent = e instanceof Error ? e.message : String(e);
  }
}

function onFileChosen(file) {
  if (!file) return;
  loadedBundle = null;
  if (/\.zip$/i.test(file.name)) readZipAsBundle(file);
  else readXlsxAsBundle(file);
}

function wireEvents() {
  $('btn-generate').addEventListener('click', generate);

  $('paste').addEventListener('input', () => {
    if ($('paste').value.trim()) loadedBundle = null;
  });

  $('btn-copy-tsv').addEventListener('click', () =>
    copyTsv().catch((e) => {
      $('error-msg').textContent = e instanceof Error ? e.message : String(e);
    }),
  );

  $('btn-download-csv').addEventListener('click', downloadCsv);
  $('btn-download-xlsx').addEventListener('click', downloadXlsx);

  inputEl.addEventListener('change', (ev) => {
    const f = /** @type {HTMLInputElement} */ (ev.target).files?.[0];
    if (f) onFileChosen(f);
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
  else if (!(/** @type {any} */ (window).JSZip) && $('warn-xlsx'))
    $('warn-xlsx').textContent = 'JSZip не загрузился — ZIP-архивы будут недоступны.';
});
