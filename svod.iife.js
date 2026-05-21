(() => {
  // transform.js
  var OUTPUT_HEADERS = [
    "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0422\u0422",
    "\u041E\u0447\u0435\u0440\u0435\u0434\u044C",
    "\u041E\u0431\u043B\u0430\u0441\u0442\u044C",
    "\u0410\u0434\u0440\u0435\u0441",
    "\u0424\u043E\u0440\u043C\u0430\u0442 \u041C\u041C",
    "\u0442\u0435\u0440\u043C\u0438\u0442",
    "\u0423\u0441\u0438\u043B\u0438\u0442\u0435\u043B\u044C \u0441\u043E \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u043C \u043F\u043B\u0435\u0435\u0440\u043E\u043C",
    "\u0414\u0430\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F \u0438\u0437 \u0437\u0430\u043A\u0430\u0437\u0430",
    "\u0414\u0430\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0433\u0440\u043E\u043C\u043A\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438",
    "\u041C\u0435\u0434\u0438\u0430\u043F\u043B\u0435\u0435\u0440",
    "\u043F\u043B\u043E\u0449\u0430\u0434\u044C"
  ];
  var PIVOT_WORK_TYPES = [
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0433\u0440\u043E\u043C\u043A\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F",
    "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438",
    "\u041C\u0435\u0434\u0438\u0430\u043F\u043B\u0435\u0435\u0440"
  ];
  var SILENT_SKIP_WORK_PATTERN = [
    /^Расходные материалы для монтажа/i,
    /^Автотранспорт$/i,
    /^Дополнительный выезд/i,
    /\bдля трансляции медиаконтента на ОС android\s*\(\s*заказ\s*\)/iu,
    /^Прайсчекер\s+\d+[""]?/iu,
    /^Дисплей покупателя\s+\d+['`'"\u2032\u2033\u2019]/iu,
    /^Экран\s+\d+/iu
  ];
  function shouldIgnoreUnknownWorkWarning(workRaw) {
    const w = String(workRaw ?? "").trim();
    if (!w) return true;
    return SILENT_SKIP_WORK_PATTERN.some((re) => re.test(w));
  }
  var DEFAULT_COLUMN_MAP = {
    ttName: 0,
    orderRcc: 1,
    workType: 3,
    quantity: 4,
    address: 5,
    area: 6,
    date1: 9,
    date2: 10
  };
  function detectDelimiter(sampleLine) {
    if (!sampleLine) return "	";
    const tabCount = (sampleLine.match(/\t/g) || []).length;
    if (tabCount >= 3) return "	";
    const semi = (sampleLine.match(/;/g) || []).length;
    const comma = (sampleLine.match(/,/g) || []).length;
    if (semi > comma && semi >= 3) return ";";
    return ",";
  }
  function firstPhysicalLine(s) {
    const n = String(s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const ix = n.indexOf("\n");
    return ix === -1 ? n : n.slice(0, ix);
  }
  function splitIntoRowsRespectingQuotes(s, delim) {
    const norm = String(s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const len = norm.length;
    let idx = 0;
    const rows = [];
    const readField = () => {
      if (idx >= len || norm[idx] === "\n") return "";
      if (norm[idx] === delim) return "";
      if (norm[idx] === '"') {
        idx += 1;
        let sb2 = "";
        while (idx < len) {
          const ch = norm[idx];
          if (ch === '"') {
            if (idx + 1 < len && norm[idx + 1] === '"') {
              sb2 += '"';
              idx += 2;
              continue;
            }
            idx += 1;
            break;
          }
          sb2 += ch;
          idx += 1;
        }
        return sb2.trim();
      }
      let sb = "";
      while (idx < len) {
        const ch = norm[idx];
        if (ch === delim || ch === "\n") break;
        sb += ch;
        idx += 1;
      }
      return sb.trim();
    };
    while (idx < len) {
      if (norm[idx] === "\n") {
        idx += 1;
        continue;
      }
      const fields = [];
      while (idx < len && norm[idx] !== "\n") {
        fields.push(readField());
        if (idx < len && norm[idx] === delim) idx += 1;
      }
      if (idx < len && norm[idx] === "\n") idx += 1;
      if (fields.some((f) => String(f).trim() !== "")) rows.push(fields);
    }
    return rows;
  }
  function parsePaste(raw, opts = {}) {
    const normalized = String(raw ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!normalized.trim()) return { rows: [], delimiter: "	" };
    let delimiter = opts.delimiter;
    if (!delimiter) {
      const line1 = firstPhysicalLine(normalized);
      delimiter = detectDelimiter(line1);
      if (delimiter === "," && opts.skipFirstRow === false && /название|товар|RCC|монтаж/i.test(line1)) {
        let start = line1.length;
        if (start < normalized.length && normalized[start] === "\n") start += 1;
        const line2 = firstPhysicalLine(normalized.slice(start)) || line1;
        delimiter = detectDelimiter(line2);
      }
    }
    let rows = splitIntoRowsRespectingQuotes(normalized, delimiter).map(
      (cells) => cells.map((c) => String(c).trim())
    );
    const skip = opts.skipFirstRow ? 1 : 0;
    rows = rows.slice(skip).filter((row) => row.some((c) => String(c).trim() !== ""));
    return { rows, delimiter };
  }
  function lastNonEmptyCell(cells) {
    for (let i = cells.length - 1; i >= 0; i -= 1) {
      if (cells[i] && cells[i].trim() !== "") return cells[i].trim();
    }
    return "";
  }
  function parseArea(s) {
    if (s == null || String(s).trim() === "") return null;
    const normalized = String(s).replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : null;
  }
  function parseRuDate(d) {
    const m = String(d).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mo = Number(m[2]);
    const yy = Number(m[3]);
    if (mo < 1 || mo > 12 || dd < 1 || dd > 31) return null;
    const dt = new Date(yy, mo - 1, dd);
    if (dt.getFullYear() !== yy || dt.getMonth() !== mo - 1 || dt.getDate() !== dd) return null;
    return dt.getTime();
  }
  function formatRuDate(ts) {
    if (ts == null || !Number.isFinite(ts)) return "";
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}.${mm}.${yy}`;
  }
  function stripLeadingPostalAndIndices(raw) {
    let s = String(raw ?? "").trim().replace(/\u00A0/g, " ").replace(/\s+/g, " ");
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
  function toskayaOblastAbbrev(stem) {
    let t = String(stem ?? "").trim();
    while (/\.$/.test(t)) t = t.slice(0, -1);
    return `${t} \u043E\u0431\u043B.`;
  }
  function deriveRegion(address) {
    let body = stripLeadingPostalAndIndices(String(address ?? "").trim());
    body = stripLeadingPostalAndIndices(body).replace(/\u00A0/g, " ");
    body = body.replace(/\s+/g, " ").trim();
    if (!body) return "";
    const mosOblastPhrase = /(?:^|[\s,;])(Московская)\s+(?:область|обл\.?)(?=[$\s,;])/iu.exec(body);
    if (/^Краснодар\s*,/.test(body) || /(?:^|[\s,;])Краснодар\s*(?=,)/iu.test(body) || /(?:^|[\s,;])Краснодар,/iu.test(body))
      return "\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440";
    if (/\bгород\s+Москва\b/iu.test(body) || /(?:^|[\s,;])Москва\s*(?=,)/iu.test(body) && !mosOblastPhrase && !/\bМосковская\s+(?:область|обл)/iu.test(body))
      return "\u041C\u043E\u0441\u043A\u0432\u0430";
    if (mosOblastPhrase) return toskayaOblastAbbrev(mosOblastPhrase[1]);
    if (/Санкт-Петербург/iu.test(body)) return "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433";
    if (/С-Петербург/iu.test(body) || /Спб\b/iu.test(body) || /С-ПБ\b/iu.test(body))
      return "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433";
    if (/Санкт-Пет(?:[,;\s]|$|[\s\-]*г\S)/iu.test(body)) return "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433";
    if (/Ставропольский\s+край/iu.test(body)) return "\u0421\u0442\u0430\u0432\u0440\u043E\u043F\u043E\u043B\u044C\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
    if (!/Ставропольский/iu.test(body) && /(?:^|[\s,;])(?:г\.?\s+|город\s+)?Ставрополь(?:[,;\s]|$)/iu.test(body))
      return "\u0421\u0442\u0430\u0432\u0440\u043E\u043F\u043E\u043B\u044C\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
    if (!/Ставропольский/iu.test(body) && /(?:^|[\s,;])(?:г\.?\s+)?Ставропол(?:[,;\s]|$)/iu.test(body))
      return "\u0421\u0442\u0430\u0432\u0440\u043E\u043F\u043E\u043B\u044C\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
    if (/Саратовская\s+область/i.test(body)) return "\u0421\u0430\u0440\u0430\u0442\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/Республика\s+Коми/i.test(body)) return "\u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0430 \u041A\u043E\u043C\u0438";
    if (/Кемеровская\s+область/i.test(body) || /Юрга/iu.test(body)) return "\u041A\u0435\u043C\u0435\u0440\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/Брянская\s+обл/i.test(body)) return "\u0411\u0440\u044F\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/Мурманская\s+обл/i.test(body)) return "\u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/Севастополь/iu.test(body)) return "\u0421\u0435\u0432\u0430\u0441\u0442\u043E\u043F\u043E\u043B\u044C";
    if (/Республика\s+Татарстан/i.test(body) || /Татарстан/iu.test(body))
      return "\u0422\u0430\u0442\u0430\u0440\u0441\u0442\u0430\u043D";
    if (/Республика\s+Башкортостан/i.test(body) || /Башкортостан/iu.test(body))
      return "\u0411\u0430\u0448\u043A\u043E\u0440\u0442\u043E\u0441\u0442\u0430\u043D";
    if (/ХМАО/u.test(body) || /Югра/iu.test(body) || /Ханты[\s\-]?Мансийск/iu.test(body))
      return "\u0425\u041C\u0410\u041E";
    if (/ЯНАО/u.test(body) || /Ямало[\s\-]*Ненецк/ui.test(body) || /(?:^|[\s,;])Ямало(?=[\s,;]|$)/iu.test(body))
      return "\u042F\u041D\u0410\u041E";
    if (/Республика\s+Мордовия/iu.test(body) || /Мордовия/iu.test(body)) return "\u041C\u043E\u0440\u0434\u043E\u0432\u0438\u044F";
    if (/Удмуртская\s+Республика/iu.test(body) || /Удмурти[яию]/iu.test(body))
      return "\u0423\u0434\u043C\u0443\u0440\u0442\u0438\u044F";
    let m = /(?:^|[\s,;])([А-ЯЁёа-я\-]{4,44}ская)\s+область(?=[$\s,;])/iu.exec(body);
    if (m) return toskayaOblastAbbrev(m[1]);
    m = /(?:^|[\s,;])([А-ЯЁёа-я\-]{4,44}ская)\s+обл\.?(?=[$\s,;])/iu.exec(body);
    if (m) return toskayaOblastAbbrev(m[1]);
    const krai = /(?:^|[\s,;])([А-ЯЁёа-я\-]{4,50}ский)\s+край(?=[$\s,;])/iu.exec(body);
    if (krai) return `${krai[1].trim()} \u043A\u0440\u0430\u0439`;
    const rep = /(?:^|[\s,;])Республика\s+([А-ЯЁа-яё][А-ЯЁа-яё\-]{2,}?)(?=[\s,;]|$)/iu.exec(
      body
    );
    if (rep && rep[1]) return `\u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0430 ${rep[1].trim()}`;
    const parts = body.split(",").map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (/^\d{5,8}$/.test(part)) continue;
      m = /^([А-ЯЁёа-я\-]{4,44}ская)\s+(?:область|обл\.?)$/iu.exec(part);
      if (m) return toskayaOblastAbbrev(m[1]);
      const k = /^([А-ЯЁёа-я\-]{4,50}ский)\s+край$/iu.exec(part);
      if (k) return `${k[1]} \u043A\u0440\u0430\u0439`;
    }
    if (!/Ленинградская/iu.test(body) && /(?:^|[\s,;])Ленинград(?:[^А-ЯЁа-яё]|$)/iu.test(body))
      return "\u041B\u0435\u043D\u0438\u043D\u0433\u0440\u0430\u0434\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/Ростов-на[-\u00AD\s]?дону/iu.test(body) || /город\s+Ростов(?=[\s,;]|$)/iu.test(body))
      return "\u0420\u043E\u0441\u0442\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/(?:^|[\s,;])(?:Ростовск(?:ая|а)|Ростовск|Ростов(?!ск))(?=[,;\sг\.]|$)/iu.test(body))
      return "\u0420\u043E\u0441\u0442\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/(?:^|[\s,;])(?:Курганск(?:ая|а)|Курганск|Курган)(?=[,;\sг\.]|$)/iu.test(body))
      return "\u041A\u0443\u0440\u0433\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/(?:^|[\s,;])(?:Челябинск(?:ая)?|Челябинс|Челя(?=бин|\s|,|$))/iu.test(body))
      return "\u0427\u0435\u043B\u044F\u0431\u0438\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/(?:^|[\s,;])(?:Нижегородская|Нижегородск|Нижегоро)(?=[,;\s]|$)/iu.test(body))
      return "\u041D\u0438\u0436\u0435\u0433\u043E\u0440\u043E\u0434\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/(?:^|[\s,;])(?:Кировская|Кировск)(?=[,;\s]|$)/iu.test(body)) return "\u041A\u0438\u0440\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    if (/(?:^|[\s,;])(?:Хабаровский|Хабаровск|Хабаров)/iu.test(body))
      return "\u0425\u0430\u0431\u0430\u0440\u043E\u0432\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
    if (/(?:^|[\s,;])Пермск(?:ий|,|\s|$)/iu.test(body)) return "\u041F\u0435\u0440\u043C\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
    if (/(?:^|[\s,;])Алтайский(?=[,;\s]|$)/iu.test(body)) return "\u0410\u043B\u0442\u0430\u0439\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
    const semanticHead = parts.find((p) => {
      const t = p.trim();
      return Boolean(t && !/^\d{5,8}$/.test(t));
    }) ?? "";
    if (semanticHead) {
      const h = semanticHead.replace(/^г\.?\s+/iu, "").trim();
      if (/^(?:ХМАО|Югра|Ханты|Хант)/iu.test(h)) return "\u0425\u041C\u0410\u041E";
      if (/^(?:ЯНАО|Ямало|Ямал)/iu.test(h)) return "\u042F\u041D\u0410\u041E";
      if (/^Хаб/iu.test(h)) return "\u0425\u0430\u0431\u0430\u0440\u043E\u0432\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439";
      if (/^Морд/iu.test(h) && h.length >= 3) return "\u041C\u043E\u0440\u0434\u043E\u0432\u0438\u044F";
    }
    const firstTxt = parts.find((p) => !/^\d{5,8}$/.test(p));
    if (!firstTxt) return "";
    const stripped = firstTxt.replace(/^г\.?\s+/iu, "").trim();
    if (/^\d/.test(stripped)) return "";
    if (/(обл\.?|кая\s+(?:обл|область)|кий\s+край)$/iu.test(firstTxt.replace(/^г\.?\s+/iu, ""))) {
      const t = firstTxt.replace(/^г\.?\s+/iu, "").trim();
      if (/ский\s+край$/iu.test(t)) return t;
      if (/кая\s+(?:область|обл\.?)$/iu.test(t)) {
        const stem = t.replace(/\s+(?:область|обл\.?)$/iu, "").trim();
        return toskayaOblastAbbrev(stem);
      }
    }
    return "";
  }
  function maxDateTimestamps(timestamps) {
    const valid = timestamps.filter((t) => t != null && Number.isFinite(t));
    if (!valid.length) return null;
    return Math.max(...valid);
  }
  function groupAndAggregate(rows, col = {}, warn = []) {
    const cm = { ...DEFAULT_COLUMN_MAP, ...col };
    const map = /* @__PURE__ */ new Map();
    const getCell = (cells, idx) => typeof idx === "number" && idx >= 0 ? (cells[idx] ?? "").trim() : "";
    for (const cells of rows) {
      const tt = getCell(cells, cm.ttName);
      if (!tt) continue;
      let agg = map.get(tt);
      if (!agg) {
        agg = {
          tt,
          rccSeen: [],
          pivotCounts: Object.fromEntries(PIVOT_WORK_TYPES.map((k) => [k, 0])),
          addressSample: "",
          addressConflict: false,
          areaValues: [],
          dateVals: [],
          formats: [],
          unknownWorkSeen: /* @__PURE__ */ new Set()
        };
        map.set(tt, agg);
      }
      const rcc = getCell(cells, cm.orderRcc);
      if (rcc && rcc !== "\u041A\u0410 \u043D\u0435 \u043C\u043E\u043D\u0442\u0438\u0440\u0443\u0435\u0442" && !agg.rccSeen.includes(rcc)) agg.rccSeen.push(rcc);
      const work = getCell(cells, cm.workType);
      const qtyRaw = getCell(cells, cm.quantity);
      const qty = parseInt(qtyRaw, 10);
      const qtySafe = Number.isFinite(qty) ? qty : 0;
      if (PIVOT_WORK_TYPES.includes(work)) {
        agg.pivotCounts[work] += qtySafe;
      } else if (work && !shouldIgnoreUnknownWorkWarning(work)) {
        if (!agg.unknownWorkSeen.has(work)) {
          agg.unknownWorkSeen.add(work);
          warn.push(`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u0440\u0430\u0431\u043E\u0442 \u0434\u043B\u044F \xAB${tt}\xBB: "${work}"`);
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
        warn.push(`\u0420\u0430\u0437\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0432\u043D\u0443\u0442\u0440\u0438 \u0433\u0440\u0443\u043F\u043F\u044B \xAB${tt}\xBB \u2014 \u0432 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u043F\u0435\u0440\u0432\u044B\u0439 \u0432\u0441\u0442\u0440\u0435\u0442\u0438\u0432\u0448\u0438\u0439\u0441\u044F`);
      if (agg.rccSeen.length > 1)
        warn.push(`\u041D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0437\u0430\u043A\u0430\u0437\u043E\u0432 RCC \u0434\u043B\u044F \xAB${tt}\xBB: ${agg.rccSeen.join(", ")}`);
      const uniqueFmt = [...new Set(agg.formats)];
      if (uniqueFmt.length > 1) warn.push(`\u0420\u0430\u0437\u043D\u044B\u0435 \u0444\u043E\u0440\u043C\u0430\u0442\u044B \u041C\u041C \u0434\u043B\u044F \xAB${tt}\xBB: ${uniqueFmt.join(" | ")}`);
      const uniqueAreaNums = [...new Set(agg.areaValues)];
      if (uniqueAreaNums.length > 1)
        warn.push(
          `\u0420\u0430\u0437\u043D\u0430\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0430\u043C \xAB${tt}\xBB \u2014 \u0431\u0435\u0440\u0451\u0442\u0441\u044F \u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u0437\u0430\u0442\u0435\u043C \u043E\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0435 (${uniqueAreaNums.join(", ")})`
        );
    });
    return map;
  }
  function buildOutputRows(groupMap, opts = {}) {
    const queue = opts.queueDefault ?? "";
    const out = [];
    const orderedKeys = [...groupMap.keys()];
    for (const tt of orderedKeys) {
      const agg = groupMap.get(tt);
      if (!agg) continue;
      const addr = agg.addressSample;
      const region = deriveRegion(addr);
      const fmt = [...new Set(agg.formats)].length === 1 ? agg.formats[0] : agg.formats[0] ?? "";
      const openTs = maxDateTimestamps(agg.dateVals);
      const openStr = formatRuDate(openTs);
      let areaRounded = "";
      const av = agg.areaValues;
      if (av.length) {
        const meanVal = av.reduce((a, b) => a + b, 0) / av.length;
        areaRounded = String(Math.round(meanVal));
      }
      const audioSysQty = agg.pivotCounts["\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F"] || 0;
      const mediaExplicitQty = agg.pivotCounts["\u041C\u0435\u0434\u0438\u0430\u043F\u043B\u0435\u0435\u0440"] || 0;
      const mediaplayerQty = audioSysQty > 0 ? Math.max(mediaExplicitQty, audioSysQty) : mediaExplicitQty;
      const row = {
        "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0422\u0422": tt,
        \u041E\u0447\u0435\u0440\u0435\u0434\u044C: queue,
        \u041E\u0431\u043B\u0430\u0441\u0442\u044C: region,
        \u0410\u0434\u0440\u0435\u0441: addr,
        "\u0424\u043E\u0440\u043C\u0430\u0442 \u041C\u041C": fmt,
        \u0442\u0435\u0440\u043C\u0438\u0442: "",
        "\u0423\u0441\u0438\u043B\u0438\u0442\u0435\u043B\u044C \u0441\u043E \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u043C \u043F\u043B\u0435\u0435\u0440\u043E\u043C": "",
        "\u0414\u0430\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F \u0438\u0437 \u0437\u0430\u043A\u0430\u0437\u0430": "",
        "\u0414\u0430\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F": openStr,
        "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F": agg.pivotCounts["\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F"] || 0,
        "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430": agg.pivotCounts["\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430"] || 0,
        "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0433\u0440\u043E\u043C\u043A\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044F": agg.pivotCounts["\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0433\u0440\u043E\u043C\u043A\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044F"] || 0,
        "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F": agg.pivotCounts["\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F"] || 0,
        "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438": agg.pivotCounts["\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438"] || 0,
        \u041C\u0435\u0434\u0438\u0430\u043F\u043B\u0435\u0435\u0440: mediaplayerQty,
        \u043F\u043B\u043E\u0449\u0430\u0434\u044C: areaRounded
      };
      out.push(row);
    }
    return out;
  }
  function rowsToAoA(rows) {
    return [OUTPUT_HEADERS, ...rows.map((r) => OUTPUT_HEADERS.map((h) => r[h] ?? ""))];
  }
  function ttHasAttention(tt, warnings) {
    if (!warnings.length) return false;
    const escaped = tt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}|\xAB${escaped}\xBB`, "u");
    return warnings.some((w) => re.test(w));
  }
  function transformFromMatrix(parsedRows, opts = {}) {
    const warnings = opts.warnings ?? [];
    const col = opts.columns ?? {};
    const groupMap = groupAndAggregate(parsedRows, col, warnings);
    const outRows = buildOutputRows(groupMap, opts);
    const warningsByTtFlags = outRows.map((r) => ttHasAttention(String(r["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0422\u0422"]), warnings));
    return {
      rows: outRows,
      warnings,
      warningsByTtFlags
    };
  }
  var GOLDEN_INPUT = [
    "\u0428\u0430\u0442\u0435\u0440	RCC-000126879	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D KRS-000000187 \u043E\u0442 12.05.2026 17:19:32	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F	2	\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440, \u0443\u043B. \u0421\u0435\u0432\u0435\u0440\u043D\u0430\u044F 391	404,95	\u041F\u0430\u0432\u043B\u043E\u0432 \u0418\u0432\u0430\u043D \u0421\u0435\u0440\u0433\u0435\u0435\u0432\u0438\u0447	8-960-478-31-96	08.06.2026	11.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0428\u0430\u0442\u0435\u0440	RCC-000126879	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D KRS-000000187 \u043E\u0442 12.05.2026 17:19:32	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440, \u0443\u043B. \u0421\u0435\u0432\u0435\u0440\u043D\u0430\u044F 391	404,95	\u041F\u0430\u0432\u043B\u043E\u0432 \u0418\u0432\u0430\u043D \u0421\u0435\u0440\u0433\u0435\u0435\u0432\u0438\u0447	8-960-478-31-96	08.06.2026	11.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0428\u0430\u0442\u0435\u0440	RCC-000126879	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D KRS-000000187 \u043E\u0442 12.05.2026 17:19:32	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438	2	\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440, \u0443\u043B. \u0421\u0435\u0432\u0435\u0440\u043D\u0430\u044F 391	404,95	\u041F\u0430\u0432\u043B\u043E\u0432 \u0418\u0432\u0430\u043D \u0421\u0435\u0440\u0433\u0435\u0435\u0432\u0438\u0447	8-960-478-31-96	08.06.2026	11.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0410\u0439\u0431\u0430\u0448	RCC-000126882	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D GKC-000001156 \u043E\u0442 15.05.2026 10:10:29	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	\u0421\u0430\u0440\u0430\u0442\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C, \u0421\u0430\u0440\u0430\u0442\u043E\u0432, \u0443\u043B.\u0410\u0437\u0438\u043D\u0430 19	490,26	\u041C\u0438\u0442\u0440\u043E\u0444\u0430\u043D\u043E\u0432 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440 \u0410\u043B\u0435\u043A\u0441\u0430\u043D\u0434\u0440\u043E\u0432\u0438\u0447	8 906 319 06 43	16.06.2026	19.06.2026			\u0411\u041E \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0420\u0443\u0448\u0430\u043D\u043E\u0432\u0441\u043A\u0430\u044F	RCC-000126876	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D GKC-000001002 \u043E\u0442 08.04.2026 13:39:17	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	\u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0430 \u041A\u043E\u043C\u0438, \u0421\u044B\u043A\u0442\u044B\u0432\u043A\u0430\u0440, \u0443\u043B.\u041C\u043E\u0440\u043E\u0437\u043E\u0432\u0430 12	377,91	\u0421\u0435\u043B\u044C\u043A\u043E\u0432 \u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u041C\u0438\u0445\u0430\u0439\u043B\u043E\u0432\u0438\u0447	89042717367, 89617608373	23.06.2026	26.06.2026			\u0411\u041E \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0418\u043D\u043A\u0430\u0441	RCC-000126877	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D VRN-000000193 \u043E\u0442 23.04.2026 15:12:15	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F	2	241047, \u0411\u0440\u044F\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B, \u0411\u0440\u044F\u043D\u0441\u043A \u0433, \u0422\u0435\u043B\u044C\u043C\u0430\u043D\u0430 \u0443\u043B, \u0434\u043E\u043C \u2116 68, \u0410	581,47	\u0411\u0430\u0440\u0430\u043D\u043E\u0432\u0441\u043A\u0438\u0439 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440\u043E\u0432\u0438\u0447	8-960-560-43-63	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0418\u043D\u043A\u0430\u0441	RCC-000126877	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D VRN-000000193 \u043E\u0442 23.04.2026 15:12:15	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	241047, \u0411\u0440\u044F\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B, \u0411\u0440\u044F\u043D\u0441\u043A \u0433, \u0422\u0435\u043B\u044C\u043C\u0430\u043D\u0430 \u0443\u043B, \u0434\u043E\u043C \u2116 68, \u0410	581,47	\u0411\u0430\u0440\u0430\u043D\u043E\u0432\u0441\u043A\u0438\u0439 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440\u043E\u0432\u0438\u0447	8-960-560-43-63	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0418\u043D\u043A\u0430\u0441	RCC-000126877	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D VRN-000000193 \u043E\u0442 23.04.2026 15:12:15	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438	2	241047, \u0411\u0440\u044F\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B, \u0411\u0440\u044F\u043D\u0441\u043A \u0433, \u0422\u0435\u043B\u044C\u043C\u0430\u043D\u0430 \u0443\u043B, \u0434\u043E\u043C \u2116 68, \u0410	581,47	\u0411\u0430\u0440\u0430\u043D\u043E\u0432\u0441\u043A\u0438\u0439 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440 \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440\u043E\u0432\u0438\u0447	8-960-560-43-63	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0417\u0430\u043C\u0435\u0442\u043A\u0430	RCC-000126878	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D OMC-000000190 \u043E\u0442 12.05.2026 12:10:33	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	\u041A\u0435\u043C\u0435\u0440\u043E\u0432\u0441\u043A\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C - \u041A\u0443\u0437\u0431\u0430\u0441\u0441, \u042E\u0440\u0433\u0430, \u0443\u043B.\u041F\u043E\u0431\u0435\u0434\u044B 10	0	\u0427\u0438\u0433\u0440\u044F\u0439 \u041A\u043E\u043D\u0441\u0442\u0430\u043D\u0442\u0438\u043D \u041D\u0438\u043A\u043E\u043B\u0430\u0435\u0432\u0438\u0447	89050756076	23.06.2026	26.06.2026			\u0411\u041E \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0411\u043B\u0430\u043D\u043A	RCC-000126880	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D SPB-000000147 \u043E\u0442 13.05.2026 10:19:11	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F	3	183031, \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B, \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A \u0433, \u0421\u0432\u0435\u0440\u0434\u043B\u043E\u0432\u0430 \u0443\u043B, \u0434\u043E\u043C \u2116 8	435,47	\u0421\u0442\u0435\u043F\u0430\u043D\u043E\u0432 \u0410\u043D\u0434\u0440\u0435\u0439 \u0412\u0430\u043B\u0435\u0440\u044C\u0435\u0432\u0438\u0447	8921-041-42-43	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0411\u043B\u0430\u043D\u043A	RCC-000126880	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D SPB-000000147 \u043E\u0442 13.05.2026 10:19:11	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	183031, \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B, \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A \u0433, \u0421\u0432\u0435\u0440\u0434\u043B\u043E\u0432\u0430 \u0443\u043B, \u0434\u043E\u043C \u2116 8	435,47	\u0421\u0442\u0435\u043F\u0430\u043D\u043E\u0432 \u0410\u043D\u0434\u0440\u0435\u0439 \u0412\u0430\u043B\u0435\u0440\u044C\u0435\u0432\u0438\u0447	8921-041-42-43	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0411\u043B\u0430\u043D\u043A	RCC-000126880	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D SPB-000000147 \u043E\u0442 13.05.2026 10:19:11	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438	2	183031, \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B, \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A \u0433, \u0421\u0432\u0435\u0440\u0434\u043B\u043E\u0432\u0430 \u0443\u043B, \u0434\u043E\u043C \u2116 8	435,47	\u0421\u0442\u0435\u043F\u0430\u043D\u043E\u0432 \u0410\u043D\u0434\u0440\u0435\u0439 \u0412\u0430\u043B\u0435\u0440\u044C\u0435\u0432\u0438\u0447	8921-041-42-43	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0414\u0436\u0435\u043D\u0442\u0435\u0441	RCC-000126881	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D GKC-000001150 \u043E\u0442 13.05.2026 16:35:55	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F	2	195299, \u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433 \u0433, \u041C\u0443\u0440\u0438\u043D\u0441\u043A\u0430\u044F \u0434\u043E\u0440, \u0434\u043E\u043C \u2116 53, \u0441\u0442\u0440. 1, \u043D\u0435\u0436\u0438\u043B\u044B\u0435 \u043F\u043E\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u211614-\u041D, \u211615-\u041D	399,2	\u0411\u0430\u043B\u0443\u0448\u043A\u0438\u043D \u0410\u043D\u0434\u0440\u0435\u0439 \u0410\u043B\u0435\u043A\u0441\u0430\u043D\u0434\u0440\u043E\u0432\u0438\u0447	. +79210769606	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0414\u0436\u0435\u043D\u0442\u0435\u0441	RCC-000126881	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D GKC-000001150 \u043E\u0442 13.05.2026 16:35:55	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430	1	195299, \u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433 \u0433, \u041C\u0443\u0440\u0438\u043D\u0441\u043A\u0430\u044F \u0434\u043E\u0440, \u0434\u043E\u043C \u2116 53, \u0441\u0442\u0440. 1, \u043D\u0435\u0436\u0438\u043B\u044B\u0435 \u043F\u043E\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u211614-\u041D, \u211615-\u041D	399,2	\u0411\u0430\u043B\u0443\u0448\u043A\u0438\u043D \u0410\u043D\u0434\u0440\u0435\u0439 \u0410\u043B\u0435\u043A\u0441\u0430\u043D\u0434\u0440\u043E\u0432\u0438\u0447	. +79210769606	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1",
    "\u0414\u0436\u0435\u043D\u0442\u0435\u0441	RCC-000126881	\u041E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u043F\u043B\u0430\u043D GKC-000001150 \u043E\u0442 13.05.2026 16:35:55	\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438	2	195299, \u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433 \u0433, \u041C\u0443\u0440\u0438\u043D\u0441\u043A\u0430\u044F \u0434\u043E\u0440, \u0434\u043E\u043C \u2116 53, \u0441\u0442\u0440. 1, \u043D\u0435\u0436\u0438\u043B\u044B\u0435 \u043F\u043E\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u211614-\u041D, \u211615-\u041D	399,2	\u0411\u0430\u043B\u0443\u0448\u043A\u0438\u043D \u0410\u043D\u0434\u0440\u0435\u0439 \u0410\u043B\u0435\u043A\u0441\u0430\u043D\u0434\u0440\u043E\u0432\u0438\u0447	. +79210769606	23.06.2026	26.06.2026			\u0420\u0414 \u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 3.1"
  ].join("\n");

  // app.js
  var $ = (id) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`#${id} not found`);
    return el;
  };
  var inputEl = (
    /** @type {HTMLInputElement} */
    $("file-xlsx")
  );
  var PARSE_OPTS_BASE = {
    skipFirstRow: false,
    columns: DEFAULT_COLUMN_MAP
  };
  var lastResult = [];
  var lastWarnings = [];
  var lastWarnFlags = [];
  function generate() {
    const raw = $("paste").value;
    $("error-msg").textContent = "";
    $("meta-line").textContent = "";
    if (!raw.trim()) {
      lastResult = [];
      lastWarnings = [];
      lastWarnFlags = [];
      renderTable();
      renderWarnings([]);
      $("error-msg").textContent = "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0434\u0430\u043D\u043D\u044B\u0435: \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0438\u043B\u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043B.";
      $("warnings-block").hidden = true;
      return;
    }
    try {
      const { rows: matrix } = parsePaste(raw, PARSE_OPTS_BASE);
      if (!matrix.length) {
        lastResult = [];
        lastWarnings = ["\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0438 \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435, \u0447\u0442\u043E \u0432\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 \u0442\u0430\u0431\u043B\u0438\u0446\u044B."];
        lastWarnFlags = [];
        renderTable();
        renderWarnings(lastWarnings);
        $("warnings-block").hidden = false;
        return;
      }
      const queueVal = $("queue-input").value.trim();
      const warns = [];
      const { rows, warnings, warningsByTtFlags } = transformFromMatrix(matrix, {
        queueDefault: queueVal,
        columns: PARSE_OPTS_BASE.columns,
        warnings: warns
      });
      lastResult = rows;
      lastWarnings = warnings;
      lastWarnFlags = warningsByTtFlags;
      $("meta-line").textContent = `\u0413\u043E\u0442\u043E\u0432\u043E: \u0441\u0442\u0440\u043E\u043A \u0438\u0441\u0445\u043E\u0434\u043D\u0438\u043A\u0430 ${matrix.length}, \u0442\u043E\u0440\u0433\u043E\u0432\u044B\u0445 \u0442\u043E\u0447\u0435\u043A ${rows.length}.`;
      renderWarnings(lastWarnings);
      $("warnings-block").hidden = warnings.length === 0;
      renderTable();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      $("error-msg").textContent = msg;
      lastResult = [];
      lastWarnings = [];
      lastWarnFlags = [];
      renderTable();
      renderWarnings([]);
      $("warnings-block").hidden = true;
    }
  }
  function renderWarnings(messages) {
    const ul = $("warnings-ul");
    ul.replaceChildren();
    messages.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m;
      ul.appendChild(li);
    });
  }
  function renderTable() {
    const thead = $("thead-row");
    const tbody = $("tbody");
    thead.replaceChildren();
    tbody.replaceChildren();
    OUTPUT_HEADERS.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      thead.appendChild(th);
    });
    lastResult.forEach((row, idx) => {
      const tr = document.createElement("tr");
      if (lastWarnFlags[idx]) tr.classList.add("warn-row");
      OUTPUT_HEADERS.forEach((h) => {
        const td = document.createElement("td");
        const v = row[h];
        td.textContent = v === "" || v == null ? "" : typeof v === "number" ? String(v) : String(v);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    const has = lastResult.length > 0;
    $("btn-copy-tsv").disabled = !has;
    $("btn-download-csv").disabled = !has;
    $("btn-download-xlsx").disabled = !has || !(typeof window !== "undefined" && /** @type {any} */
    window.XLSX);
  }
  function downloadBlob(filename, blob) {
    const a = document.createElement("a");
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
    const s = v === null || typeof v === "undefined" ? "" : typeof v === "number" ? String(v) : String(v);
    if (/[\";\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function encodeCsvAoA(rows) {
    const sep = ";";
    return rows.map((cells) => cells.map(encodeCsvField).join(sep)).join("\r\n");
  }
  function encodeTsvAoA(rows) {
    return rows.map((cells) => cells.join("	")).join("\r\n");
  }
  function downloadCsv() {
    const aoa = rowsToAoA(lastResult);
    const body = encodeCsvAoA(aoa);
    const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8;" });
    downloadBlob("svod_tt.csv", blob);
  }
  function downloadXlsx() {
    const XLSX = (
      /** @type {any} */
      window.XLSX
    );
    if (!XLSX || !lastResult.length) return;
    const aoa = rowsToAoA(lastResult);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "\u0421\u0432\u043E\u0434");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    downloadBlob("svod_tt.xlsx", blob);
  }
  function wireFileLabel() {
    const input = $("file-xlsx");
    const label = document.querySelector("label.file-label");
    label?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });
  }
  function readXlsxFile(file) {
    const XLSX = (
      /** @type {any} */
      window.XLSX
    );
    if (!file || !XLSX) return;
    $("error-msg").textContent = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(
          /** @type {ArrayBuffer} */
          ev.target?.result
        );
        const wb = XLSX.read(data, { type: "array" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
        $("paste").value = rows.map((r) => (Array.isArray(r) ? r : []).join("	")).join("\n");
        $("meta-line").textContent = `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u043B\u0438\u0441\u0442 \xAB${wsName}\xBB. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\xBB.`;
        inputEl.value = "";
      } catch (e) {
        $("error-msg").textContent = e instanceof Error ? e.message : String(e);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  function wireEvents() {
    $("btn-generate").addEventListener("click", generate);
    $("btn-copy-tsv").addEventListener(
      "click",
      () => copyTsv().catch((e) => {
        $("error-msg").textContent = e instanceof Error ? e.message : String(e);
      })
    );
    $("btn-download-csv").addEventListener("click", downloadCsv);
    $("btn-download-xlsx").addEventListener("click", downloadXlsx);
    inputEl.addEventListener("change", (ev) => {
      const f = (
        /** @type {HTMLInputElement} */
        ev.target.files?.[0]
      );
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
  $("warnings-block").hidden = true;
  $("btn-copy-tsv").disabled = true;
  $("btn-download-csv").disabled = true;
  $("btn-download-xlsx").disabled = true;
  window.addEventListener("load", () => {
    if (!window.XLSX && $("warn-xlsx"))
      $("warn-xlsx").textContent = "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0434\u043B\u044F Excel \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442/CDN.";
  });
})();
