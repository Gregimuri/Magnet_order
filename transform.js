/**
 * Чистые функции преобразования заказа / выгрузки в свод по ТТ.
 * Основной вход — файл заказа Magnit («Заказ1.xlsx» и аналоги): пары строк позиция+адрес.
 */

/** Колонки результата (порядок как в образце). */
export const OUTPUT_HEADERS = [
  'Название ТТ',
  'Очередь',
  'Область',
  'Адрес',
  'Формат ММ',
  'термит',
  'Усилитель со встроенным плеером',
  'Дата открытия из заказа',
  'Дата открытия',
  'Первичный монтаж дисплея покупателя',
  'Первичный монтаж прайсчекера',
  'Первичный монтаж громкоговорителя',
  'Первичный монтаж системы аудиовещания',
  'Первичный монтаж ТВ панели',
  'Медиаплеер',
  'площадь',
];

/** Типы работ → колонки pivot (совпадение по полному тексту). */
export const PIVOT_WORK_TYPES = [
  'Первичный монтаж дисплея покупателя',
  'Первичный монтаж прайсчекера',
  'Первичный монтаж громкоговорителя',
  'Первичный монтаж системы аудиовещания',
  'Первичный монтаж ТВ панели',
  'Медиаплеер',
];

/** Строки с этими видами работ не дают предупреждение «Неизвестный тип» — свод только по монтажу. */
const SILENT_SKIP_WORK_PATTERN = [
  /^Расходные материалы для монтажа/i,
  /^Автотранспорт$/i,
  /^Дополнительный выезд/i,
  /\bдля трансляции медиаконтента на ОС android\s*\(\s*заказ\s*\)/iu,
  /^Прайсчекер\s+\d+[""]?/iu,
  /^Дисплей покупателя\s+\d+['`'"\u2032\u2033\u2019]/iu,
  /^Экран\s+\d+/iu,
];

/**
 * Частые доп. позиции / оборудование в заказе — для свода игнорируем как «ошибочный тип» без шумного warning.
 * @param {string} workRaw
 */
export function shouldIgnoreUnknownWorkWarning(workRaw) {
  const w = String(workRaw ?? '').trim();
  if (!w) return true;
  return SILENT_SKIP_WORK_PATTERN.some((re) => re.test(w));
}

/**
 * Маппинг колонок старой плоской выгрузки (индекс с 0).
 * Новый формат «Заказ» разбирается отдельно (см. extractZakazRecords).
 */
export const DEFAULT_COLUMN_MAP = {
  ttName: 0,
  orderRcc: 1,
  workType: 3,
  quantity: 4,
  address: 5,
  area: 6,
  date1: 9,
  date2: 10,
};

/**
 * Колонки шаблона заказа Magnit (после разворота merged-ячеек SheetJS).
 * 0 № п/п · 1 RCC · 5 Модель · 8 Кол-во · 12 Дата поставки · 13 Дата окончания монтажа · 14 Место/адрес
 */
export const ZAKAZ_COLUMN_MAP = {
  rowNo: 0,
  orderRcc: 1,
  workType: 5,
  quantity: 8,
  date1: 12,
  date2: 13,
  placeOrAddress: 14,
};

/**
 * @typedef {Object} SourceRecord
 * @property {string} tt
 * @property {string} rcc
 * @property {string} workType
 * @property {number} quantity
 * @property {string} address
 * @property {string} [area]
 * @property {string} [date1]
 * @property {string} [date2]
 * @property {string[]} [dates] — все даты позиции (заказ + выгрузка)
 * @property {string} [format]
 */

/**
 * @typedef {Object} TransformOptions
 * @property {string} [queueDefault] — номер очереди для всех строк результата
 * @property {boolean} [skipFirstRow=false] — трактовать первую строку как заголовок
 * @property {typeof DEFAULT_COLUMN_MAP} [columns]
 * @property {'zakaz'|'legacy'|'auto'} [inputKind]
 */

/**
 * @typedef {Object} AttachmentFile
 * @property {string} name
 * @property {string[][]} matrix
 */

/**
 * Обнаружение разделителя по первой строке (вставка из Excel почти всегда TAB).
 * @param {string} sampleLine
 * @returns {string}
 */
export function detectDelimiter(sampleLine) {
  if (!sampleLine) return '\t';
  const tabCount = (sampleLine.match(/\t/g) || []).length;
  if (tabCount >= 3) return '\t';
  const semi = (sampleLine.match(/;/g) || []).length;
  const comma = (sampleLine.match(/,/g) || []).length;
  if (semi > comma && semi >= 3) return ';';
  return ',';
}

/**
 * Простое разбиение строки с учётом кавычек для CSV-like.
 * @param {string} line
 * @param {string} delim
 */
export function splitDelimitedRow(line, delim) {
  if (delim === '\t') {
    return line.split('\t').map((c) => c.trim());
  }
  /** @type {string[]} */
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * Первая физическая строка (до первого \\n) — для выбора разделителя.
 * Многострочные кавычечные ячейки обрабатываются отдельно в splitIntoRowsRespectingQuotes.
 * @param {string} s
 */
function firstPhysicalLine(s) {
  const n = String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const ix = n.indexOf('\n');
  return ix === -1 ? n : n.slice(0, ix);
}

/**
 * Делит текст на строки таблицы. Переносы \\n и табы ВНЕ кавычечного поля начинают новую запись /
 * следующее поле. Как в Excel RFC: режим кавычек включается ТОЛЬКО если поле начинается с символа " —
 * иначе " в тексте («10"", дюйм) не ломает разбор и не склеивает несколько строк.
 *
 * @param {string} s
 * @param {string} delim
 * @returns {string[][]}
 */
export function splitIntoRowsRespectingQuotes(s, delim) {
  const norm = String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const len = norm.length;
  let idx = 0;

  /** @type {string[][]} */
  const rows = [];

  const readField = () => {
    if (idx >= len || norm[idx] === '\n') return '';
    if (norm[idx] === delim) return '';

    if (norm[idx] === '"') {
      idx += 1;
      let sb = '';
      while (idx < len) {
        const ch = norm[idx];
        if (ch === '"') {
          if (idx + 1 < len && norm[idx + 1] === '"') {
            sb += '"';
            idx += 2;
            continue;
          }
          idx += 1;
          break;
        }
        sb += ch;
        idx += 1;
      }
      return sb.trim();
    }

    let sb = '';
    while (idx < len) {
      const ch = norm[idx];
      if (ch === delim || ch === '\n') break;
      sb += ch;
      idx += 1;
    }
    return sb.trim();
  };

  while (idx < len) {
    if (norm[idx] === '\n') {
      idx += 1;
      continue;
    }

    /** @type {string[]} */
    const fields = [];
    while (idx < len && norm[idx] !== '\n') {
      fields.push(readField());
      if (idx < len && norm[idx] === delim) idx += 1;
    }
    if (idx < len && norm[idx] === '\n') idx += 1;

    if (fields.some((f) => String(f).trim() !== '')) rows.push(fields);
  }

  return rows;
}

/**
 * Разбивает многострочный ввод на массив строк (учёт переводов внутри кавычек).
 * @param {string} raw
 * @param {TransformOptions & {delimiter?: string}} opts
 */
export function parsePaste(raw, opts = {}) {
  const normalized = String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  if (!normalized.trim()) return { rows: [], delimiter: '\t' };

  let delimiter = opts.delimiter;
  if (!delimiter) {
    const line1 = firstPhysicalLine(normalized);
    delimiter = detectDelimiter(line1);
    if (
      delimiter === ',' &&
      opts.skipFirstRow === false &&
      /название|товар|RCC|монтаж/i.test(line1)
    ) {
      let start = line1.length;
      if (start < normalized.length && normalized[start] === '\n') start += 1;
      const line2 = firstPhysicalLine(normalized.slice(start)) || line1;
      delimiter = detectDelimiter(line2);
    }
  }

  /** @type {string[][]} */
  let rows = splitIntoRowsRespectingQuotes(normalized, delimiter).map((cells) =>
    cells.map((c) => String(c).trim()),
  );

  const skip = opts.skipFirstRow ? 1 : 0;
  rows = rows.slice(skip).filter((row) => row.some((c) => String(c).trim() !== ''));

  return { rows, delimiter };
}

/**
 * Последняя непустая ячейка строки — «Формат ММ».
 * @param {string[]} cells
 */
export function lastNonEmptyCell(cells) {
  for (let i = cells.length - 1; i >= 0; i -= 1) {
    if (cells[i] && cells[i].trim() !== '') return cells[i].trim();
  }
  return '';
}

/**
 * @param {string} s
 * @returns {number | null}
 */
export function parseArea(s) {
  if (s == null || String(s).trim() === '') return null;
  const normalized = String(s).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} d
 * @returns {number | null} timestamp ms начала локального дня
 */
export function parseRuDate(d) {
  const m = String(d)
    .trim()
    .match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mo = Number(m[2]);
  const yy = Number(m[3]);
  if (mo < 1 || mo > 12 || dd < 1 || dd > 31) return null;
  const dt = new Date(yy, mo - 1, dd);
  if (dt.getFullYear() !== yy || dt.getMonth() !== mo - 1 || dt.getDate() !== dd) return null;
  return dt.getTime();
}

/**
 * Дата из «ДД.ММ.ГГГГ» или Excel-serial (как в выгрузке монтажей).
 * @param {string|number|null|undefined} raw
 * @returns {number | null}
 */
export function parseFlexibleDate(raw) {
  if (raw == null || raw === '') return null;
  const ru = parseRuDate(String(raw));
  if (ru != null) return ru;
  const n = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 30000 || n > 80000) return null;
  const epoch = new Date(1899, 11, 30);
  const dt = new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate() + Math.floor(n));
  return dt.getTime();
}

/**
 * Адрес из заказа часто обрезан до города/региона без улицы.
 * @param {string} addr
 */
export function isAddressIncomplete(addr) {
  const a = String(addr ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!a) return true;
  const hasStreet =
    /ул\.?|улица|пр-?кт|проспект|пер\.|переулок|бульвар|б-?р\b|шоссе|наб\.|набереж|проезд|площад|\bпл\.|мкр|микрорайон|\bдом\b|\bд\.\s*\d|корп|строение|\bстр\.|ЖК\b|посёлок|поселок|деревн|\bсело\b/iu.test(
      a,
    );
  if (hasStreet) return false;
  /** «Краснодар Казбекская 12_мини» — улица без слова «ул», но есть номер */
  if (/\d/.test(a) && a.length >= 18) return false;
  return true;
}

/**
 * @param {string[]} candidates
 */
export function pickBestAddress(candidates) {
  const list = [...new Set(candidates.map((c) => String(c ?? '').trim()).filter(Boolean))];
  if (!list.length) return '';
  const complete = list.filter((a) => !isAddressIncomplete(a));
  const pool = complete.length ? complete : list;
  return pool.sort((a, b) => b.length - a.length)[0] || '';
}

/** @param {string[]} values */
function mostCommonNonEmpty(values) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const v of values) {
    const s = String(v ?? '').trim();
    if (!s) continue;
    if (/давальческ/i.test(s)) continue;
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  let best = '';
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN || (n === bestN && k.length > best.length)) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

/** @param {number | null} ts */
export function formatRuDate(ts) {
  if (ts == null || !Number.isFinite(ts)) return '';
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

/**
 * Отрезает ведущий почтовый индекс («123456, …», «123456 …» перед текстом).
 * Так индекс не попадает в колонку «Область».
 * @param {string} raw
 */
function stripLeadingPostalAndIndices(raw) {
  let s = String(raw ?? '')
    .trim()
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ');
  let guard = 0;
  while (guard++ < 16) {
    const comma = /^(\d{6})\s*[,;:]\s*/u.exec(s);
    if (comma) {
      s = s.slice(comma[0].length);
      continue;
    }
    const space = /^(\d{6})\s+/u.exec(s);
    if (space && /[^\s\d]/.test(s.slice(space[0].length))) {
      s = s.slice(space[0].length);
      continue;
    }
    break;
  }
  while (/^[,;:\\s.-]+/.test(s)) s = s.slice(1).trimStart();
  return s.trim();
}

/** @param {string} stem например «Ленинградская» или «Ленинградская.» */
function toskayaOblastAbbrev(stem) {
  let t = String(stem ?? '').trim();
  while (/\.$/.test(t)) t = t.slice(0, -1);
  return `${t} обл.`;
}

/**
 * Краткая «Область» по адресу. Границы для кириллицы задаём через пробелы/запятые, без \b.
 * @param {string} address
 */
export function deriveRegion(address) {
  let body = stripLeadingPostalAndIndices(String(address ?? '').trim());
  body = stripLeadingPostalAndIndices(body).replace(/\u00A0/g, ' ');
  body = body.replace(/\s+/g, ' ').trim();
  if (!body) return '';

  const mosOblastPhrase =
    /(?:^|[\s,;])(Московская)\s+(?:область|обл\.?)(?=[$\s,;])/iu.exec(body);

  if (
    !/Краснодарский/iu.test(body) &&
    (/^Краснодар(?:\s|,|$)/iu.test(body) ||
      /(?:^|[\s,;])Краснодар\s*(?=,)/iu.test(body) ||
      /(?:^|[\s,;])Краснодар,/iu.test(body))
  )
    return 'Краснодар';

  if (
    /\bгород\s+Москва\b/iu.test(body) ||
    (/(?:^|[\s,;])Москва(?:\s*г\.?)?(?=[\s,;]|$)/iu.test(body) &&
      !mosOblastPhrase &&
      !/Московская\s+(?:область|обл)/iu.test(body))
  )
    return 'Москва';

  if (mosOblastPhrase) return toskayaOblastAbbrev(mosOblastPhrase[1]);

  /** По кириллице \b с дефисом ненадёжен — достаточно подстроки */
  if (/Санкт-Петербург/iu.test(body)) return 'Санкт-Петербург';
  if (/С-Петербург/iu.test(body) || /Спб\b/iu.test(body) || /С-ПБ\b/iu.test(body))
    return 'Санкт-Петербург';
  /** Обрезанная ячейка «Санкт-Пет, …» без «ербург» */
  if (/Санкт-Пет(?:[,;\s]|$|[\s\-]*г\S)/iu.test(body)) return 'Санкт-Петербург';

  if (/Ставропольский\s+край/iu.test(body)) return 'Ставропольский край';

  /** Город Ставрополь (исключить «Ставропольский») */
  if (
    !/Ставропольский/iu.test(body) &&
    /(?:^|[\s,;])(?:г\.?\s+|город\s+)?Ставрополь(?:[,;\s]|$)/iu.test(body)
  )
    return 'Ставропольский край';

  /** Обрыв строки «Ставропол», «Ставропол » */
  if (
    !/Ставропольский/iu.test(body) &&
    /(?:^|[\s,;])(?:г\.?\s+)?Ставропол(?:[,;\s]|$)/iu.test(body)
  )
    return 'Ставропольский край';

  if (/Саратовская\s+область/i.test(body)) return 'Саратовская обл.';
  if (/Республика\s+Коми/i.test(body)) return 'Республика Коми';
  if (/Кемеровская\s+область/i.test(body) || /Юрга/iu.test(body)) return 'Кемеровская обл.';
  if (/Брянская\s+обл/i.test(body)) return 'Брянская обл.';
  if (/Мурманская\s+обл/i.test(body)) return 'Мурманская обл.';
  if (/Севастополь/iu.test(body)) return 'Севастополь';

  if (/Республика\s+Татарстан/i.test(body) || /Татарстан/iu.test(body))
    return 'Татарстан';
  if (
    /Республика\s+Башкортостан/i.test(body) ||
    /Башкортостан/iu.test(body)
  )
    return 'Башкортостан';

  /** ХМАО / ЯНАО: без \\b — у кириллицы граница «слова» в JS некорректна */
  if (/ХМАО/u.test(body) || /Югра/iu.test(body) || /Ханты[\s\-]?Мансийск/iu.test(body))
    return 'ХМАО';

  if (
    /ЯНАО/u.test(body) ||
    /Ямало[\s\-]*Ненецк/ui.test(body) ||
    /(?:^|[\s,;])Ямало(?=[\s,;]|$)/iu.test(body)
  )
    return 'ЯНАО';

  if (/Республика\s+Мордовия/iu.test(body) || /Мордовия/iu.test(body)) return 'Мордовия';
  if (/Удмуртская\s+Республика/iu.test(body) || /Удмурти[яию]/iu.test(body))
    return 'Удмуртия';

  /** Типичные конструкции по всей строке */
  let m = /(?:^|[\s,;])([А-ЯЁёа-я\-]{4,44}ская)\s+область(?=[$\s,;])/iu.exec(body);
  if (m) return toskayaOblastAbbrev(m[1]);
  m = /(?:^|[\s,;])([А-ЯЁёа-я\-]{4,44}ская)\s+обл\.?(?=[$\s,;])/iu.exec(body);
  if (m) return toskayaOblastAbbrev(m[1]);

  const krai = /(?:^|[\s,;])([А-ЯЁёа-я\-]{4,50}ский)\s+край(?=[$\s,;])/iu.exec(body);
  if (krai) return `${krai[1].trim()} край`;

  const rep =
    /(?:^|[\s,;])Республика\s+([А-ЯЁа-яё][А-ЯЁа-яё\-]{2,}?)(?=[\s,;]|$)/iu.exec(
      body,
    );
  if (rep && rep[1]) return `Республика ${rep[1].trim()}`;

  const parts = body.split(',').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^\d{5,8}$/.test(part)) continue;
    m = /^([А-ЯЁёа-я\-]{4,44}ская)\s+(?:область|обл\.?)$/iu.exec(part);
    if (m) return toskayaOblastAbbrev(m[1]);
    const k = /^([А-ЯЁёа-я\-]{4,50}ский)\s+край$/iu.exec(part);
    if (k) return `${k[1]} край`;
  }

  /** Обрывы «Ленинград», «Ленинград …» без «ская» */
  if (
    !/Ленинградская/iu.test(body) &&
    /(?:^|[\s,;])Ленинград(?:[^А-ЯЁа-яё]|$)/iu.test(body)
  )
    return 'Ленинградская обл.';
  if (/Ростов-на[-\u00AD\s]?дону/iu.test(body) || /город\s+Ростов(?=[\s,;]|$)/iu.test(body))
    return 'Ростовская обл.';

  /** Частые усеченные строки Excel в колонке «Область» / начало адреса */
  if (
    /(?:^|[\s,;])(?:Ростовск(?:ая|а)|Ростовск|Ростов(?!ск))(?=[,;\sг\.]|$)/iu.test(body)
  )
    return 'Ростовская обл.';
  if (
    /(?:^|[\s,;])(?:Курганск(?:ая|а)|Курганск|Курган)(?=[,;\sг\.]|$)/iu.test(body)
  )
    return 'Курганская обл.';
  if (
    /(?:^|[\s,;])(?:Челябинск(?:ая)?|Челябинс|Челя(?=бин|\s|,|$))/iu.test(body)
  )
    return 'Челябинская обл.';
  if (/(?:^|[\s,;])(?:Нижегородская|Нижегородск|Нижегоро)(?=[,;\s]|$)/iu.test(body))
    return 'Нижегородская обл.';
  if (/(?:^|[\s,;])(?:Кировская|Кировск)(?=[,;\s]|$)/iu.test(body)) return 'Кировская обл.';
  if (/(?:^|[\s,;])(?:Хабаровский|Хабаровск|Хабаров)/iu.test(body))
    return 'Хабаровский край';
  if (/(?:^|[\s,;])Пермск(?:ий|,|\s|$)/iu.test(body)) return 'Пермский край';
  if (/(?:^|[\s,;])Алтайский(?=[,;\s]|$)/iu.test(body)) return 'Алтайский край';

  /** Первый текстовый токен после индексов (часто обрезается без запятой) */
  const semanticHead =
    parts.find((p) => {
      const t = p.trim();
      return Boolean(t && !/^\d{5,8}$/.test(t));
    }) ?? '';
  if (semanticHead) {
    const h = semanticHead.replace(/^г\.?\s+/iu, '').trim();
    if (/^(?:ХМАО|Югра|Ханты|Хант)/iu.test(h)) return 'ХМАО';
    if (/^(?:ЯНАО|Ямало|Ямал)/iu.test(h)) return 'ЯНАО';
    if (/^Хаб/iu.test(h)) return 'Хабаровский край';
    if (/^Морд/iu.test(h) && h.length >= 3) return 'Мордовия';
  }

  const firstTxt = parts.find((p) => !/^\d{5,8}$/.test(p));
  if (!firstTxt) return '';
  const stripped = firstTxt.replace(/^г\.?\s+/iu, '').trim();
  if (/^\d/.test(stripped)) return '';

  if (/(обл\.?|кая\s+(?:обл|область)|кий\s+край)$/iu.test(firstTxt.replace(/^г\.?\s+/iu, ''))) {
    const t = firstTxt.replace(/^г\.?\s+/iu, '').trim();
    if (/ский\s+край$/iu.test(t)) return t;
    if (/кая\s+(?:область|обл\.?)$/iu.test(t)) {
      const stem = t.replace(/\s+(?:область|обл\.?)$/iu, '').trim();
      return toskayaOblastAbbrev(stem);
    }
  }

  return '';
}


/**
 * @param {number | null[]} timestamps
 */
export function maxDateTimestamps(timestamps) {
  const valid = timestamps.filter((t) => t != null && Number.isFinite(t));
  if (!valid.length) return null;
  return Math.max(...valid);
}

/**
 * @typedef {Object} ParsedRowAgg
 * @property {string} tt
 * @property {string[]} rccSeen
 * @property {Record<string, number>} pivotCounts
 * @property {string} addressSample
 * @property {boolean} addressConflict
 * @property {number[]} areaValues
 * @property {(number|null)[]} dateVals
 * @property {string[]} formats
 * @property {Set<string>} unknownWorkSeen
 */

/** @param {string[]|undefined|null} cells */
function normalizeCells(cells) {
  return (cells || []).map((c) => String(c ?? '').replace(/\u00A0/g, ' ').trim());
}

/** Убирает «, КПП …» из «Место поставки». */
export function stripTtPlaceExtras(place) {
  return String(place ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/,\s*КПП\s*[\d\s]+$/iu, '')
    .trim();
}

/**
 * @param {string[][]} rows
 * @returns {'zakaz'|'legacy'}
 */
export function detectInputKind(rows) {
  const head = rows
    .slice(0, 50)
    .map((r) => normalizeCells(r).join('\t'))
    .join('\n');
  if (/на основании спецификации/i.test(head)) return 'zakaz';
  if (/№\s*п\s*\/\s*п/i.test(head) && /место поставки|номер заказа/i.test(head)) return 'zakaz';

  let zakazHits = 0;
  let legacyHits = 0;
  for (const raw of rows) {
    const cells = normalizeCells(raw);
    if (!cells.length) continue;
    if (/^\d+$/.test(cells[0] || '') && /^RCC-/i.test(cells[1] || '')) zakazHits += 1;
    if (cells[0] && cells[0] !== 'ТТ' && /^RCC-/i.test(cells[1] || '') && !/^\d+$/.test(cells[0]))
      legacyHits += 1;
  }
  if (zakazHits >= 2 && zakazHits >= legacyHits) return 'zakaz';
  return 'legacy';
}

/**
 * Разбор файла заказа Magnit: строка позиции + следующая строка с адресом.
 * @param {string[][]} rows
 * @returns {SourceRecord[]}
 */
export function extractZakazRecords(rows) {
  const zm = ZAKAZ_COLUMN_MAP;
  /** @type {SourceRecord[]} */
  const out = [];

  for (let i = 0; i < rows.length; i += 1) {
    const cells = normalizeCells(rows[i]);
    if (!/^\d+$/.test(cells[zm.rowNo] || '')) continue;
    const rcc = cells[zm.orderRcc] || '';
    if (!/^RCC-/i.test(rcc)) continue;

    let workType = cells[zm.workType] || '';
    if (!workType || /^модель$/i.test(workType)) {
      workType = cells.find((c) => PIVOT_WORK_TYPES.includes(c)) || workType;
    }
    if (!workType || /^модель$/i.test(workType) || /^наименование$/i.test(workType)) continue;

    const qtyRaw = String(cells[zm.quantity] ?? '').replace(/\s/g, '');
    let quantity = parseInt(qtyRaw, 10);
    if (!Number.isFinite(quantity)) {
      quantity = 0;
      const wi = cells.indexOf(workType);
      if (wi >= 0) {
        for (let j = wi + 1; j < cells.length; j += 1) {
          const n = parseInt(String(cells[j]).replace(/\s/g, ''), 10);
          if (Number.isFinite(n) && n > 0 && n < 100000) {
            quantity = n;
            break;
          }
        }
      }
    }

    const tt = stripTtPlaceExtras(cells[zm.placeOrAddress] || '');
    if (!tt || /^адрес/i.test(tt) || /^место/i.test(tt)) continue;

    let address = '';
    if (i + 1 < rows.length) {
      const next = normalizeCells(rows[i + 1]);
      const nextIsData = /^\d+$/.test(next[zm.rowNo] || '') && /^RCC-/i.test(next[zm.orderRcc] || '');
      const nextIsHeader =
        /^№\s*п/i.test(next[0] || '') || /^номер заказа$/i.test(String(next[1] || '').toLowerCase());
      if (!nextIsData && !nextIsHeader) {
        const cand =
          next[zm.placeOrAddress] ||
          next.find((c, idx) => idx >= 12 && c && !/^адрес/i.test(c) && !/^место/i.test(c)) ||
          '';
        if (
          cand &&
          cand !== tt &&
          !/^за счет/i.test(cand) &&
          !/^CNT-/i.test(cand) &&
          !/^RCC-/i.test(cand)
        ) {
          address = cand;
        }
      }
    }

    out.push({
      tt,
      rcc,
      workType,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      address,
      area: '',
      date1: cells[zm.date1] || '',
      date2: cells[zm.date2] || '',
      format: '',
    });
  }

  return out;
}

/**
 * Ищет строку заголовка выгрузки «ТТ / Заказ / Адрес / Формат».
 * @param {string[][]} rows
 * @param {Partial<typeof DEFAULT_COLUMN_MAP & {format?: number}>} [colOverride]
 */
export function resolveLegacyColumnMap(rows, colOverride = {}) {
  for (let i = 0; i < Math.min(rows.length, 8); i += 1) {
    const cells = normalizeCells(rows[i]);
    const lower = cells.map((c) => c.toLowerCase());
    const find = (...names) => {
      for (const n of names) {
        const ix = lower.indexOf(n.toLowerCase());
        if (ix >= 0) return ix;
      }
      return -1;
    };
    const tt = find('ТТ');
    const addr = find('Адрес');
    if (tt < 0 || addr < 0) continue;
    return {
      ttName: tt,
      orderRcc: find('Заказ') >= 0 ? find('Заказ') : 1,
      workType: find('Модель') >= 0 ? find('Модель') : 3,
      quantity: find('Количество') >= 0 ? find('Количество') : 4,
      address: addr,
      area: (() => {
        const a = find('Площадь ТТ', 'Площадь');
        return a >= 0 ? a : 6;
      })(),
      date1: find('Дата монтажа') >= 0 ? find('Дата монтажа') : 9,
      date2: find('Дата открытия') >= 0 ? find('Дата открытия') : 10,
      format: find('Формат') >= 0 ? find('Формат') : 13,
      _headerIndex: i,
      ...colOverride,
    };
  }
  return { ...DEFAULT_COLUMN_MAP, format: 13, _headerIndex: -1, ...colOverride };
}

/**
 * Плоская выгрузка монтажей (Эдтех Солюшн монтажи …).
 * @param {string[][]} rows
 * @param {Partial<typeof DEFAULT_COLUMN_MAP & {format?: number}>} col
 * @returns {SourceRecord[]}
 */
export function extractLegacyRecords(rows, col = {}) {
  const cm = resolveLegacyColumnMap(rows, col);
  /** @type {SourceRecord[]} */
  const out = [];
  const getCell = (cells, idx) =>
    typeof idx === 'number' && idx >= 0 ? String(cells[idx] ?? '').trim() : '';

  rows.forEach((raw, rowIndex) => {
    if (rowIndex === cm._headerIndex) return;
    const cells = normalizeCells(raw);
    const tt = getCell(cells, cm.ttName);
    if (!tt || tt === 'ТТ' || tt === 'Название ТТ') return;
    const workType = getCell(cells, cm.workType);
    if (workType === 'Модель') return;
    const qty = parseInt(getCell(cells, cm.quantity), 10);
    const formatIdx = typeof cm.format === 'number' ? cm.format : 13;
    const format =
      getCell(cells, formatIdx) ||
      (lastNonEmptyCell(cells) && !/давальческ/i.test(lastNonEmptyCell(cells))
        ? lastNonEmptyCell(cells)
        : '');
    out.push({
      tt,
      rcc: getCell(cells, cm.orderRcc),
      workType,
      quantity: Number.isFinite(qty) ? qty : 0,
      address: getCell(cells, cm.address),
      area: getCell(cells, cm.area),
      date1: getCell(cells, cm.date1),
      date2: getCell(cells, cm.date2),
      dates: [getCell(cells, cm.date1), getCell(cells, cm.date2)].filter(Boolean),
      format,
    });
  });
  return out;
}

/**
 * @param {string[][]} matrix
 * @param {string} [fileName]
 * @returns {'zakaz'|'montage'|'unknown'}
 */
export function classifyAttachmentMatrix(matrix, fileName = '') {
  const base = String(fileName).split(/[/\\]/).pop() || '';
  if (detectInputKind(matrix) === 'zakaz') return 'zakaz';
  if (/заказ/i.test(base) && /RCC-/i.test(base)) return 'zakaz';

  const head = matrix
    .slice(0, 5)
    .map((r) => normalizeCells(r).join('\t'))
    .join('\n');
  if (/(?:^|\t)ТТ(?:\t|$)/m.test(head) && /Адрес/i.test(head)) return 'montage';
  if (/монтаж/i.test(base) || /солюшн/i.test(base) || /эдтех/i.test(base)) return 'montage';

  const legacyProbe = extractLegacyRecords(matrix);
  if (legacyProbe.length >= 3) return 'montage';
  return 'unknown';
}

/**
 * Справочник по ТТ из выгрузки монтажей: полный адрес, формат, площадь, даты.
 * @param {SourceRecord[]} montageRecords
 */
export function buildTtEnrichmentIndex(montageRecords) {
  /** @type {Map<string, {addresses: string[], formats: string[], areas: string[], dates: string[]}>} */
  const acc = new Map();
  for (const rec of montageRecords) {
    const tt = String(rec.tt ?? '').trim();
    if (!tt) continue;
    let e = acc.get(tt);
    if (!e) {
      e = { addresses: [], formats: [], areas: [], dates: [] };
      acc.set(tt, e);
    }
    if (rec.address) e.addresses.push(rec.address);
    if (rec.format) e.formats.push(rec.format);
    if (rec.area) e.areas.push(String(rec.area));
    if (Array.isArray(rec.dates)) e.dates.push(...rec.dates);
    else {
      if (rec.date1) e.dates.push(rec.date1);
      if (rec.date2) e.dates.push(rec.date2);
    }
  }

  /** @type {Map<string, {address: string, format: string, area: string, dates: string[]}>} */
  const out = new Map();
  for (const [tt, e] of acc) {
    out.set(tt, {
      address: pickBestAddress(e.addresses),
      format: mostCommonNonEmpty(e.formats),
      area: e.areas.find((a) => parseArea(a) != null) || e.areas[0] || '',
      dates: [...new Set(e.dates.filter(Boolean))],
    });
  }
  return out;
}

/**
 * Подставляет в позиции заказа адрес/формат/площадь/даты из выгрузки монтажей.
 * @param {SourceRecord[]} orderRecords
 * @param {ReturnType<typeof buildTtEnrichmentIndex>} index
 * @param {string[]} [warnings]
 */
export function enrichOrderRecords(orderRecords, index, warnings = []) {
  const warnedTt = new Set();
  return orderRecords.map((rec) => {
    const info = index.get(rec.tt);
    if (!info) {
      if (isAddressIncomplete(rec.address) && !warnedTt.has(rec.tt)) {
        warnedTt.add(rec.tt);
        warnings.push(
          `Неполный адрес и нет строки в выгрузке монтажей для «${rec.tt}»: "${rec.address}"`,
        );
      }
      return { ...rec, dates: [rec.date1, rec.date2].filter(Boolean) };
    }

    const next = { ...rec };
    /** Адрес/формат/площадь из выгрузки монтажей приоритетнее (заказ часто обрезан). */
    if (info.address) {
      if (isAddressIncomplete(rec.address) && rec.address !== info.address && !warnedTt.has(`fix:${rec.tt}`)) {
        warnedTt.add(`fix:${rec.tt}`);
        warnings.push(
          `Адрес «${rec.tt}» дополнен из выгрузки монтажей: «${rec.address || '∅'}» → «${info.address}»`,
        );
      }
      next.address = info.address;
    }
    if (info.format) next.format = info.format;
    if (info.area) next.area = info.area;
    next.dates = [
      ...new Set(
        [rec.date1, rec.date2, ...(info.dates || [])]
          .map((d) => String(d ?? '').trim())
          .filter(Boolean),
      ),
    ];
    return next;
  });
}

/**
 * @param {string[][]} rows
 * @param {TransformOptions} [opts]
 */
export function normalizeMatrixToRecords(rows, opts = {}) {
  const kind =
    opts.inputKind && opts.inputKind !== 'auto' ? opts.inputKind : detectInputKind(rows);
  if (kind === 'zakaz') return { kind, records: extractZakazRecords(rows) };
  return { kind: 'legacy', records: extractLegacyRecords(rows, opts.columns) };
}

/**
 * @param {SourceRecord[]} records
 * @param {string[]} [warn]
 */
export function groupAndAggregateRecords(records, warn = []) {
  /** @type {Map<string, ParsedRowAgg>} */
  const map = new Map();

  for (const rec of records) {
    const tt = String(rec.tt ?? '').trim();
    if (!tt) continue;

    let agg = map.get(tt);
    if (!agg) {
      agg = {
        tt,
        rccSeen: [],
        pivotCounts: Object.fromEntries(PIVOT_WORK_TYPES.map((k) => [k, 0])),
        addressSample: '',
        addressConflict: false,
        areaValues: [],
        dateVals: [],
        formats: [],
        unknownWorkSeen: new Set(),
      };
      map.set(tt, agg);
    }

    const rcc = String(rec.rcc ?? '').trim();
    if (rcc && rcc !== 'КА не монтирует' && !agg.rccSeen.includes(rcc)) agg.rccSeen.push(rcc);

    const work = String(rec.workType ?? '').trim();
    const qtySafe = Number.isFinite(rec.quantity) ? rec.quantity : 0;

    if (PIVOT_WORK_TYPES.includes(work)) {
      agg.pivotCounts[work] += qtySafe;
    } else if (work && !shouldIgnoreUnknownWorkWarning(work)) {
      if (!agg.unknownWorkSeen.has(work)) {
        agg.unknownWorkSeen.add(work);
        warn.push(`Неизвестный тип работ для «${tt}»: "${work}"`);
      }
    }

    const addr = String(rec.address ?? '').trim();
    if (addr) {
      if (!agg.addressSample) agg.addressSample = addr;
      else if (addr !== agg.addressSample) agg.addressConflict = true;
    }

    const areaNum = parseArea(rec.area);
    if (areaNum != null) agg.areaValues.push(areaNum);

    const dateRawList =
      Array.isArray(rec.dates) && rec.dates.length
        ? rec.dates
        : [rec.date1, rec.date2];
    for (const d of dateRawList) agg.dateVals.push(parseFlexibleDate(d));

    const fmt = String(rec.format ?? '').trim();
    if (fmt && !/давальческ/i.test(fmt)) agg.formats.push(fmt);
  }

  map.forEach((agg, tt) => {
    if (agg.addressConflict)
      warn.push(`Разный адрес внутри группы «${tt}» — в результате указан первый встретившийся`);

    if (agg.rccSeen.length > 1)
      warn.push(`Несколько заказов RCC для «${tt}»: ${agg.rccSeen.join(', ')}`);

    const uniqueFmt = [...new Set(agg.formats.filter(Boolean))];
    if (uniqueFmt.length > 1) warn.push(`Разные форматы ММ для «${tt}»: ${uniqueFmt.join(' | ')}`);

    const uniqueAreaNums = [...new Set(agg.areaValues)];
    if (uniqueAreaNums.length > 1)
      warn.push(
        `Разная площадь по строкам «${tt}» — берётся среднее затем округление (${uniqueAreaNums.join(', ')})`,
      );
  });

  return map;
}

/**
 * Совместимость: матрица → агрегация (автодетект формата).
 * @param {string[][]} rows
 * @param {Partial<typeof DEFAULT_COLUMN_MAP>} col
 * @param {string[]} [warn]
 */
export function groupAndAggregate(rows, col = {}, warn = []) {
  const { records } = normalizeMatrixToRecords(rows, { columns: col });
  return groupAndAggregateRecords(records, warn);
}

/**
 * @param {Map<string, ParsedRowAgg>} groupMap
 * @param {TransformOptions} opts
 */
export function buildOutputRows(groupMap, opts = {}) {
  const queue = opts.queueDefault ?? '';
  /** @type {Record<string,string|number>[]} */
  const out = [];

  /** Порядок ТТ совпадает с порядком первого появления в исходнике */
  const orderedKeys = [...groupMap.keys()];

  for (const tt of orderedKeys) {
    const agg = groupMap.get(tt);
    if (!agg) continue;

    const addr = agg.addressSample;
    const region = deriveRegion(addr);
    const fmt = [...new Set(agg.formats)].length === 1 ? agg.formats[0] : agg.formats[0] ?? '';
    const openTs = maxDateTimestamps(agg.dateVals);
    const openStr = formatRuDate(openTs);

    let areaRounded = '';
    const av = agg.areaValues;
    if (av.length) {
      const meanVal = av.reduce((a, b) => a + b, 0) / av.length;
      areaRounded = String(Math.round(meanVal));
    }

    /** При наличии монтажа системы аудиовещания считается, что есть и медиаплеер (не меньше этого количества). */
    const audioSysQty = agg.pivotCounts['Первичный монтаж системы аудиовещания'] || 0;
    const mediaExplicitQty = agg.pivotCounts['Медиаплеер'] || 0;
    const mediaplayerQty =
      audioSysQty > 0 ? Math.max(mediaExplicitQty, audioSysQty) : mediaExplicitQty;

    /** @type {Record<string,string|number>} */
    const row = {
      'Название ТТ': tt,
      Очередь: queue,
      Область: region,
      Адрес: addr,
      'Формат ММ': fmt,
      термит: '',
      'Усилитель со встроенным плеером': '',
      'Дата открытия из заказа': '',
      'Дата открытия': openStr,
      'Первичный монтаж дисплея покупателя': agg.pivotCounts['Первичный монтаж дисплея покупателя'] || 0,
      'Первичный монтаж прайсчекера': agg.pivotCounts['Первичный монтаж прайсчекера'] || 0,
      'Первичный монтаж громкоговорителя': agg.pivotCounts['Первичный монтаж громкоговорителя'] || 0,
      'Первичный монтаж системы аудиовещания':
        agg.pivotCounts['Первичный монтаж системы аудиовещания'] || 0,
      'Первичный монтаж ТВ панели': agg.pivotCounts['Первичный монтаж ТВ панели'] || 0,
      Медиаплеер: mediaplayerQty,
      площадь: areaRounded,
    };

    out.push(row);
  }

  return out;
}

/**
 * @param {Record<string,string|number>[]} rows
 */
export function rowsToAoA(rows) {
  return [OUTPUT_HEADERS, ...rows.map((r) => OUTPUT_HEADERS.map((h) => r[h] ?? ''))];
}

/**
 * Полный пайплайн.
 * @param {string[][]} parsedRows — уже без строки заголовка (если снята)
 * @param {TransformOptions & {warnings?: string[]}} opts
 */
export function ttHasAttention(tt, warnings) {
  if (!warnings.length) return false;
  const escaped = tt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}|«${escaped}»`, 'u');
  return warnings.some((w) => re.test(w));
}

export function transformFromMatrix(parsedRows, opts = {}) {
  const warnings = opts.warnings ?? [];
  const { kind, records } = normalizeMatrixToRecords(parsedRows, opts);
  if (kind === 'zakaz') {
    const seen = new Set();
    for (const rec of records) {
      if (isAddressIncomplete(rec.address) && !seen.has(rec.tt)) {
        seen.add(rec.tt);
        warnings.push(
          `Неполный адрес у «${rec.tt}»: "${rec.address}" — лучше загрузить ZIP с выгрузкой «Эдтех Солюшн монтажи»`,
        );
      }
    }
  }
  const groupMap = groupAndAggregateRecords(records, warnings);
  const outRows = buildOutputRows(groupMap, opts);

  const warningsByTtFlags = outRows.map((r) => ttHasAttention(String(r['Название ТТ']), warnings));

  return {
    rows: outRows,
    warnings,
    warningsByTtFlags,
    inputKind: kind,
    sourceRecords: records.length,
  };
}

/**
 * Пакет вложений (ZIP или несколько xlsx): заказ(ы) + выгрузка монтажей.
 * Количества — из заказа; адрес/формат/площадь/даты открытия — дополняются из монтажей.
 * @param {AttachmentFile[]} files
 * @param {TransformOptions & {warnings?: string[]}} opts
 */
export function processAttachmentBundle(files, opts = {}) {
  const warnings = opts.warnings ?? [];
  /** @type {SourceRecord[]} */
  let orderRecords = [];
  /** @type {SourceRecord[]} */
  let montageRecords = [];
  /** @type {string[]} */
  const zakazFiles = [];
  /** @type {string[]} */
  const montageFiles = [];

  for (const f of files) {
    const role = classifyAttachmentMatrix(f.matrix, f.name);
    if (role === 'zakaz') {
      orderRecords = orderRecords.concat(extractZakazRecords(f.matrix));
      zakazFiles.push(f.name);
    } else if (role === 'montage') {
      montageRecords = montageRecords.concat(extractLegacyRecords(f.matrix));
      montageFiles.push(f.name);
    } else {
      warnings.push(`Пропущен файл без распознанной таблицы: ${f.name}`);
    }
  }

  /** @type {SourceRecord[]} */
  let records;
  /** @type {string} */
  let mode;

  if (orderRecords.length && montageRecords.length) {
    const index = buildTtEnrichmentIndex(montageRecords);
    records = enrichOrderRecords(orderRecords, index, warnings);
    mode = 'zakaz+montage';
  } else if (orderRecords.length) {
    records = orderRecords.map((r) => ({
      ...r,
      dates: [r.date1, r.date2].filter(Boolean),
    }));
    mode = 'zakaz';
    const seen = new Set();
    for (const rec of records) {
      if (isAddressIncomplete(rec.address) && !seen.has(rec.tt)) {
        seen.add(rec.tt);
        warnings.push(
          `Неполный адрес у «${rec.tt}»: "${rec.address}" — в архиве нет выгрузки монтажей`,
        );
      }
    }
  } else if (montageRecords.length) {
    records = montageRecords;
    mode = 'montage';
  } else {
    throw new Error('Не найдено ни файла заказа, ни выгрузки монтажей (.xlsx)');
  }

  const groupMap = groupAndAggregateRecords(records, warnings);
  const outRows = buildOutputRows(groupMap, opts);
  const warningsByTtFlags = outRows.map((r) => ttHasAttention(String(r['Название ТТ']), warnings));

  return {
    rows: outRows,
    warnings,
    warningsByTtFlags,
    inputKind: mode,
    sourceRecords: records.length,
    zakazFiles,
    montageFiles,
  };
}

/* --- Контрольный пример: фрагмент заказа Magnit --- */

/** Матрица как после SheetJS: позиция + строка адреса. */
export const GOLDEN_ZAKAZ_MATRIX = [
  ['№ п/п', 'Номер заказа', 'Наименование', '', '', 'Модель', '', '', 'Кол-во, шт', '', '', '', 'Дата поставки', 'Дата окончания монтажа', 'Место поставки'],
  ['1', 'RCC-000160293', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж громкоговорителя', '', '', '3', '', '', '', '08.12.2026', '08.12.2026', 'Роскошь'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Краснодарский край, Краснодар г'],
  ['2', 'RCC-000160293', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж системы аудиовещания', '', '', '1', '', '', '', '08.12.2026', '08.12.2026', 'Роскошь'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Краснодарский край, Краснодар г'],
  ['3', 'RCC-000160293', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж ТВ панели', '', '', '1', '', '', '', '08.12.2026', '08.12.2026', 'Роскошь'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Краснодарский край, Краснодар г'],
  ['4', 'RCC-000160299', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж громкоговорителя', '', '', '7', '', '', '', '08.12.2026', '08.12.2026', 'Салки'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '105484, Москва г, Сиреневый б-р, дом № 60'],
  ['5', 'RCC-000160299', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж дисплея покупателя', '', '', '2', '', '', '', '08.12.2026', '08.12.2026', 'Салки'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '105484, Москва г, Сиреневый б-р, дом № 60'],
  ['6', 'RCC-000160299', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж прайсчекера', '', '', '1', '', '', '', '08.12.2026', '08.12.2026', 'Салки'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '105484, Москва г, Сиреневый б-р, дом № 60'],
  ['7', 'RCC-000160299', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж системы аудиовещания', '', '', '1', '', '', '', '08.12.2026', '08.12.2026', 'Салки'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '105484, Москва г, Сиреневый б-р, дом № 60'],
  ['8', 'RCC-000160299', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж ТВ панели', '', '', '2', '', '', '', '08.12.2026', '08.12.2026', 'Салки'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '105484, Москва г, Сиреневый б-р, дом № 60'],
  ['9', 'RCC-000160300', 'Первичный монтаж ИТ-оборудования', '', '', 'Первичный монтаж прайсчекера', '', '', '1', '', '', '', '08.12.2026', '08.12.2026', 'Брудергауз, КПП 222545005'],
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '656049, Алтайский край, Барнаул г, Пролетарская ул, дом № 150, пом. Н1'],
];

/** @deprecated используйте GOLDEN_ZAKAZ_MATRIX */
export const GOLDEN_INPUT = GOLDEN_ZAKAZ_MATRIX.map((r) => r.join('\t')).join('\n');

/** Эталон (ключ — Название ТТ). */
export const GOLDEN_EXPECTED = {
  Роскошь: {
    Очередь: '100',
    'Дата открытия из заказа': '',
    Область: 'Краснодарский край',
    Адрес: 'Краснодарский край, Краснодар г',
    'Дата открытия': '08.12.2026',
    'Первичный монтаж дисплея покупателя': 0,
    'Первичный монтаж прайсчекера': 0,
    'Первичный монтаж громкоговорителя': 3,
    'Первичный монтаж системы аудиовещания': 1,
    'Первичный монтаж ТВ панели': 1,
    Медиаплеер: 1,
    площадь: '',
    format: '',
  },
  Салки: {
    Очередь: '100',
    'Дата открытия из заказа': '',
    Область: 'Москва',
    'Дата открытия': '08.12.2026',
    'Первичный монтаж дисплея покупателя': 2,
    'Первичный монтаж прайсчекера': 1,
    'Первичный монтаж громкоговорителя': 7,
    'Первичный монтаж системы аудиовещания': 1,
    'Первичный монтаж ТВ панели': 2,
    Медиаплеер: 1,
    площадь: '',
    format: '',
  },
  Брудергауз: {
    Очередь: '100',
    Область: 'Алтайский край',
    'Дата открытия': '08.12.2026',
    'Первичный монтаж прайсчекера': 1,
    Медиаплеер: 0,
    format: '',
  },
};

/**
 * Возвращает список несовпадений с эталоном (или пусто).
 */
export function runGoldenSampleTest() {
  const { rows } = transformFromMatrix(GOLDEN_ZAKAZ_MATRIX, {
    queueDefault: '100',
    inputKind: 'zakaz',
  });
  /** @type {string[]} */
  const issues = [];

  for (const [ttKey, checks] of Object.entries(GOLDEN_EXPECTED)) {
    const row = rows.find((r) => r['Название ТТ'] === ttKey);
    if (!row) {
      issues.push(`Нет строки для «${ttKey}»`);
      continue;
    }
    for (const [k, v] of Object.entries(checks)) {
      if (k === 'format') {
        if (String(row['Формат ММ']) !== String(v))
          issues.push(`${ttKey}.Формат ММ: "${row['Формат ММ']}" ожид. "${v}"`);
        continue;
      }
      const actual =
        typeof row[k] === 'undefined' || row[k] === null ? '' : String(row[k]);
      if (actual !== String(v)) {
        issues.push(`${ttKey}.${k}: "${actual}" ожид. "${v}"`);
      }
    }
  }

  if (rows.length !== Object.keys(GOLDEN_EXPECTED).length)
    issues.push(`Число строк: ${rows.length}, ожид. ${Object.keys(GOLDEN_EXPECTED).length}`);

  return issues;
}

/**
 * @param {string} rawPaste
 * @param {TransformOptions} opts
 */
export function executeTransform(rawPaste, opts = {}) {
  const { rows: matrix } = parsePaste(rawPaste, {
    delimiter: opts.delimiter,
    skipFirstRow: opts.skipFirstRow,
  });
  const warnings = opts.warnings ?? [];
  const { rows: out, warningsByTtFlags } = transformFromMatrix(matrix, {
    ...opts,
    warnings,
  });
  return {
    rows: out,
    warnings,
    warningsByTtFlags,
    delimiterUsed: opts.delimiter,
  };
}
