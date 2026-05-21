/**
 * Чистые функции преобразования строк выгрузки в свод по ТТ.
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

/** Настройки маппинга колонок исходника (индекс с 0). */
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
 * @typedef {Object} TransformOptions
 * @property {string} [queueDefault] — номер очереди для всех строк результата
 * @property {boolean} [skipFirstRow=false] — трактовать первую строку как заголовок
 * @property {typeof DEFAULT_COLUMN_MAP} [columns]
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
    /^Краснодар\s*,/.test(body) ||
    /(?:^|[\s,;])Краснодар\s*(?=,)/iu.test(body) ||
    /(?:^|[\s,;])Краснодар,/iu.test(body)
  )
    return 'Краснодар';

  if (
    /\bгород\s+Москва\b/iu.test(body) ||
    (/(?:^|[\s,;])Москва\s*(?=,)/iu.test(body) &&
      !mosOblastPhrase &&
      !/\bМосковская\s+(?:область|обл)/iu.test(body))
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

/**
 * @param {string[][]} rows
 * @param {Partial<typeof DEFAULT_COLUMN_MAP>} col
 * @param {string[]} [warn]
 */
export function groupAndAggregate(rows, col = {}, warn = []) {
  const cm = { ...DEFAULT_COLUMN_MAP, ...col };
  /** @type {Map<string, ParsedRowAgg>} */
  const map = new Map();

  const getCell = (cells, idx) =>
    typeof idx === 'number' && idx >= 0 ? (cells[idx] ?? '').trim() : '';

  for (const cells of rows) {
    const tt = getCell(cells, cm.ttName);
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

    const rcc = getCell(cells, cm.orderRcc);
    if (rcc && rcc !== 'КА не монтирует' && !agg.rccSeen.includes(rcc)) agg.rccSeen.push(rcc);

    const work = getCell(cells, cm.workType);
    const qtyRaw = getCell(cells, cm.quantity);
    const qty = parseInt(qtyRaw, 10);
    const qtySafe = Number.isFinite(qty) ? qty : 0;

    if (PIVOT_WORK_TYPES.includes(work)) {
      agg.pivotCounts[work] += qtySafe;
    } else if (work && !shouldIgnoreUnknownWorkWarning(work)) {
      if (!agg.unknownWorkSeen.has(work)) {
        agg.unknownWorkSeen.add(work);
        warn.push(`Неизвестный тип работ для «${tt}»: "${work}"`);
      }
    }

    const addr = getCell(cells, cm.address);
    if (addr) {
      if (!agg.addressSample) agg.addressSample = addr;
      else if (addr !== agg.addressSample) agg.addressConflict = true;
    }

    const areaNum = parseArea(getCell(cells, cm.area));
    if (areaNum != null) agg.areaValues.push(areaNum);

    const t1 = parseRuDate(getCell(cells, cm.date1));
    const t2 = parseRuDate(getCell(cells, cm.date2));
    agg.dateVals.push(t1, t2);

    const fmt = lastNonEmptyCell(cells);
    if (fmt) agg.formats.push(fmt);
  }

  map.forEach((agg, tt) => {
    if (agg.addressConflict)
      warn.push(`Разный адрес внутри группы «${tt}» — в результате указан первый встретившийся`);

    if (agg.rccSeen.length > 1)
      warn.push(`Несколько заказов RCC для «${tt}»: ${agg.rccSeen.join(', ')}`);

    const uniqueFmt = [...new Set(agg.formats)];
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
  const col = opts.columns ?? {};
  const groupMap = groupAndAggregate(parsedRows, col, warnings);
  const outRows = buildOutputRows(groupMap, opts);

  const warningsByTtFlags = outRows.map((r) => ttHasAttention(String(r['Название ТТ']), warnings));

  return {
    rows: outRows,
    warnings,
    warningsByTtFlags,
  };
}

/* --- Контрольный пример для сверки с эталоном --- */

export const GOLDEN_INPUT = [
  'Шатер\tRCC-000126879\tОперативный план KRS-000000187 от 12.05.2026 17:19:32\tПервичный монтаж дисплея покупателя\t2\tКраснодар, ул. Северная 391\t404,95\tПавлов Иван Сергеевич\t8-960-478-31-96\t08.06.2026\t11.06.2026\t\t\tРД Новый концепт 3.1',
  'Шатер\tRCC-000126879\tОперативный план KRS-000000187 от 12.05.2026 17:19:32\tПервичный монтаж прайсчекера\t1\tКраснодар, ул. Северная 391\t404,95\tПавлов Иван Сергеевич\t8-960-478-31-96\t08.06.2026\t11.06.2026\t\t\tРД Новый концепт 3.1',
  'Шатер\tRCC-000126879\tОперативный план KRS-000000187 от 12.05.2026 17:19:32\tПервичный монтаж ТВ панели\t2\tКраснодар, ул. Северная 391\t404,95\tПавлов Иван Сергеевич\t8-960-478-31-96\t08.06.2026\t11.06.2026\t\t\tРД Новый концепт 3.1',
  'Айбаш\tRCC-000126882\tОперативный план GKC-000001156 от 15.05.2026 10:10:29\tПервичный монтаж прайсчекера\t1\tСаратовская область, Саратов, ул.Азина 19\t490,26\tМитрофанов Владимир Александрович\t8 906 319 06 43\t16.06.2026\t19.06.2026\t\t\tБО Новый концепт 3.1',
  'Рушановская\tRCC-000126876\tОперативный план GKC-000001002 от 08.04.2026 13:39:17\tПервичный монтаж прайсчекера\t1\tРеспублика Коми, Сыктывкар, ул.Морозова 12\t377,91\tСельков Дмитрий Михайлович\t89042717367, 89617608373\t23.06.2026\t26.06.2026\t\t\tБО Новый концепт 3.1',
  'Инкас\tRCC-000126877\tОперативный план VRN-000000193 от 23.04.2026 15:12:15\tПервичный монтаж дисплея покупателя\t2\t241047, Брянская обл, Брянск г, Тельмана ул, дом № 68, А\t581,47\tБарановский Владимир Владимирович\t8-960-560-43-63\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Инкас\tRCC-000126877\tОперативный план VRN-000000193 от 23.04.2026 15:12:15\tПервичный монтаж прайсчекера\t1\t241047, Брянская обл, Брянск г, Тельмана ул, дом № 68, А\t581,47\tБарановский Владимир Владимирович\t8-960-560-43-63\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Инкас\tRCC-000126877\tОперативный план VRN-000000193 от 23.04.2026 15:12:15\tПервичный монтаж ТВ панели\t2\t241047, Брянская обл, Брянск г, Тельмана ул, дом № 68, А\t581,47\tБарановский Владимир Владимирович\t8-960-560-43-63\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Заметка\tRCC-000126878\tОперативный план OMC-000000190 от 12.05.2026 12:10:33\tПервичный монтаж прайсчекера\t1\tКемеровская область - Кузбасс, Юрга, ул.Победы 10\t0\tЧигряй Константин Николаевич\t89050756076\t23.06.2026\t26.06.2026\t\t\tБО Новый концепт 3.1',
  'Бланк\tRCC-000126880\tОперативный план SPB-000000147 от 13.05.2026 10:19:11\tПервичный монтаж дисплея покупателя\t3\t183031, Мурманская обл, Мурманск г, Свердлова ул, дом № 8\t435,47\tСтепанов Андрей Валерьевич\t8921-041-42-43\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Бланк\tRCC-000126880\tОперативный план SPB-000000147 от 13.05.2026 10:19:11\tПервичный монтаж прайсчекера\t1\t183031, Мурманская обл, Мурманск г, Свердлова ул, дом № 8\t435,47\tСтепанов Андрей Валерьевич\t8921-041-42-43\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Бланк\tRCC-000126880\tОперативный план SPB-000000147 от 13.05.2026 10:19:11\tПервичный монтаж ТВ панели\t2\t183031, Мурманская обл, Мурманск г, Свердлова ул, дом № 8\t435,47\tСтепанов Андрей Валерьевич\t8921-041-42-43\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Джентес\tRCC-000126881\tОперативный план GKC-000001150 от 13.05.2026 16:35:55\tПервичный монтаж дисплея покупателя\t2\t195299, Санкт-Петербург г, Муринская дор, дом № 53, стр. 1, нежилые помещения №14-Н, №15-Н\t399,2\tБалушкин Андрей Александрович\t. +79210769606\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Джентес\tRCC-000126881\tОперативный план GKC-000001150 от 13.05.2026 16:35:55\tПервичный монтаж прайсчекера\t1\t195299, Санкт-Петербург г, Муринская дор, дом № 53, стр. 1, нежилые помещения №14-Н, №15-Н\t399,2\tБалушкин Андрей Александрович\t. +79210769606\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
  'Джентес\tRCC-000126881\tОперативный план GKC-000001150 от 13.05.2026 16:35:55\tПервичный монтаж ТВ панели\t2\t195299, Санкт-Петербург г, Муринская дор, дом № 53, стр. 1, нежилые помещения №14-Н, №15-Н\t399,2\tБалушкин Андрей Александрович\t. +79210769606\t23.06.2026\t26.06.2026\t\t\tРД Новый концепт 3.1',
].join('\n');

/** Эталон (ключ — Название ТТ): как в задаче пользователя. */
export const GOLDEN_EXPECTED = {
  Айбаш: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Саратовская обл.',
    площадь: '490',
    'Первичный монтаж дисплея покупателя': 0,
    'Первичный монтаж прайсчекера': 1,
    'Первичный монтаж ТВ панели': 0,
    format: 'БО Новый концепт 3.1',
    'Дата открытия': '19.06.2026',
  },
  Бланк: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Мурманская обл.',
    площадь: '435',
    'Первичный монтаж дисплея покупателя': 3,
    'Первичный монтаж прайсчекера': 1,
    'Первичный монтаж ТВ панели': 2,
    format: 'РД Новый концепт 3.1',
    'Дата открытия': '26.06.2026',
  },
  Джентес: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Санкт-Петербург',
    площадь: '399',
    'Дата открытия': '26.06.2026',
    format: 'РД Новый концепт 3.1',
    'Первичный монтаж дисплея покупателя': 2,
    'Первичный монтаж прайсчекера': 1,
    'Первичный монтаж ТВ панели': 2,
  },
  Инкас: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Брянская обл.',
    площадь: '581',
    'Первичный монтаж дисплея покупателя': 2,
    'Первичный монтаж прайсчекера': 1,
    'Первичный монтаж ТВ панели': 2,
    format: 'РД Новый концепт 3.1',
    'Дата открытия': '26.06.2026',
  },
  Заметка: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Кемеровская обл.',
    площадь: '0',
    'Дата открытия': '26.06.2026',
    format: 'БО Новый концепт 3.1',
    'Первичный монтаж прайсчекера': 1,
  },
  Рушановская: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Республика Коми',
    площадь: '378',
    'Дата открытия': '26.06.2026',
    format: 'БО Новый концепт 3.1',
    'Первичный монтаж прайсчекера': 1,
  },
  Шатер: {
    Очередь: '56',
    'Дата открытия из заказа': '',
    Область: 'Краснодар',
    площадь: '405',
    'Первичный монтаж дисплея покупателя': 2,
    'Первичный монтаж прайсчекера': 1,
    'Первичный монтаж ТВ панели': 2,
    'Дата открытия': '11.06.2026',
    format: 'РД Новый концепт 3.1',
  },
};

/**
 * Возвращает список несовпадений с эталоном (или пусто).
 */
export function runGoldenSampleTest() {
  const { rows } = executeTransform(GOLDEN_INPUT, {
    queueDefault: '56',
    skipFirstRow: false,
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
