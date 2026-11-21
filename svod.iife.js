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
  var ZAKAZ_COLUMN_MAP = {
    rowNo: 0,
    orderRcc: 1,
    workType: 5,
    quantity: 8,
    date1: 12,
    date2: 13,
    placeOrAddress: 14
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
    if (/\bгород\s+Москва\b/iu.test(body) || /(?:^|[\s,;])Москва(?:\s*г\.?)?(?=[\s,;]|$)/iu.test(body) && !mosOblastPhrase && !/Московская\s+(?:область|обл)/iu.test(body))
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
  function normalizeCells(cells) {
    return (cells || []).map((c) => String(c ?? "").replace(/\u00A0/g, " ").trim());
  }
  function stripTtPlaceExtras(place) {
    return String(place ?? "").replace(/\u00A0/g, " ").replace(/,\s*КПП\s*[\d\s]+$/iu, "").trim();
  }
  function detectInputKind(rows) {
    const head = rows.slice(0, 50).map((r) => normalizeCells(r).join("	")).join("\n");
    if (/на основании спецификации/i.test(head)) return "zakaz";
    if (/№\s*п\s*\/\s*п/i.test(head) && /место поставки|номер заказа/i.test(head)) return "zakaz";
    let zakazHits = 0;
    let legacyHits = 0;
    for (const raw of rows) {
      const cells = normalizeCells(raw);
      if (!cells.length) continue;
      if (/^\d+$/.test(cells[0] || "") && /^RCC-/i.test(cells[1] || "")) zakazHits += 1;
      if (cells[0] && cells[0] !== "\u0422\u0422" && /^RCC-/i.test(cells[1] || "") && !/^\d+$/.test(cells[0]))
        legacyHits += 1;
    }
    if (zakazHits >= 2 && zakazHits >= legacyHits) return "zakaz";
    return "legacy";
  }
  function extractZakazRecords(rows) {
    const zm = ZAKAZ_COLUMN_MAP;
    const out = [];
    for (let i = 0; i < rows.length; i += 1) {
      const cells = normalizeCells(rows[i]);
      if (!/^\d+$/.test(cells[zm.rowNo] || "")) continue;
      const rcc = cells[zm.orderRcc] || "";
      if (!/^RCC-/i.test(rcc)) continue;
      let workType = cells[zm.workType] || "";
      if (!workType || /^модель$/i.test(workType)) {
        workType = cells.find((c) => PIVOT_WORK_TYPES.includes(c)) || workType;
      }
      if (!workType || /^модель$/i.test(workType) || /^наименование$/i.test(workType)) continue;
      const qtyRaw = String(cells[zm.quantity] ?? "").replace(/\s/g, "");
      let quantity = parseInt(qtyRaw, 10);
      if (!Number.isFinite(quantity)) {
        quantity = 0;
        const wi = cells.indexOf(workType);
        if (wi >= 0) {
          for (let j = wi + 1; j < cells.length; j += 1) {
            const n = parseInt(String(cells[j]).replace(/\s/g, ""), 10);
            if (Number.isFinite(n) && n > 0 && n < 1e5) {
              quantity = n;
              break;
            }
          }
        }
      }
      const tt = stripTtPlaceExtras(cells[zm.placeOrAddress] || "");
      if (!tt || /^адрес/i.test(tt) || /^место/i.test(tt)) continue;
      let address = "";
      if (i + 1 < rows.length) {
        const next = normalizeCells(rows[i + 1]);
        const nextIsData = /^\d+$/.test(next[zm.rowNo] || "") && /^RCC-/i.test(next[zm.orderRcc] || "");
        const nextIsHeader = /^№\s*п/i.test(next[0] || "") || /^номер заказа$/i.test(String(next[1] || "").toLowerCase());
        if (!nextIsData && !nextIsHeader) {
          const cand = next[zm.placeOrAddress] || next.find((c, idx) => idx >= 12 && c && !/^адрес/i.test(c) && !/^место/i.test(c)) || "";
          if (cand && cand !== tt && !/^за счет/i.test(cand) && !/^CNT-/i.test(cand) && !/^RCC-/i.test(cand)) {
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
        area: "",
        date1: cells[zm.date1] || "",
        date2: cells[zm.date2] || "",
        format: ""
      });
    }
    return out;
  }
  function extractLegacyRecords(rows, col = {}) {
    const cm = { ...DEFAULT_COLUMN_MAP, ...col };
    const out = [];
    const getCell = (cells, idx) => typeof idx === "number" && idx >= 0 ? String(cells[idx] ?? "").trim() : "";
    for (const raw of rows) {
      const cells = normalizeCells(raw);
      const tt = getCell(cells, cm.ttName);
      if (!tt || tt === "\u0422\u0422" || tt === "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0422\u0422") continue;
      const workType = getCell(cells, cm.workType);
      if (workType === "\u041C\u043E\u0434\u0435\u043B\u044C") continue;
      const qty = parseInt(getCell(cells, cm.quantity), 10);
      out.push({
        tt,
        rcc: getCell(cells, cm.orderRcc),
        workType,
        quantity: Number.isFinite(qty) ? qty : 0,
        address: getCell(cells, cm.address),
        area: getCell(cells, cm.area),
        date1: getCell(cells, cm.date1),
        date2: getCell(cells, cm.date2),
        format: lastNonEmptyCell(cells)
      });
    }
    return out;
  }
  function normalizeMatrixToRecords(rows, opts = {}) {
    const kind = opts.inputKind && opts.inputKind !== "auto" ? opts.inputKind : detectInputKind(rows);
    if (kind === "zakaz") return { kind, records: extractZakazRecords(rows) };
    return { kind: "legacy", records: extractLegacyRecords(rows, opts.columns) };
  }
  function groupAndAggregateRecords(records, warn = []) {
    const map = /* @__PURE__ */ new Map();
    for (const rec of records) {
      const tt = String(rec.tt ?? "").trim();
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
      const rcc = String(rec.rcc ?? "").trim();
      if (rcc && rcc !== "\u041A\u0410 \u043D\u0435 \u043C\u043E\u043D\u0442\u0438\u0440\u0443\u0435\u0442" && !agg.rccSeen.includes(rcc)) agg.rccSeen.push(rcc);
      const work = String(rec.workType ?? "").trim();
      const qtySafe = Number.isFinite(rec.quantity) ? rec.quantity : 0;
      if (PIVOT_WORK_TYPES.includes(work)) {
        agg.pivotCounts[work] += qtySafe;
      } else if (work && !shouldIgnoreUnknownWorkWarning(work)) {
        if (!agg.unknownWorkSeen.has(work)) {
          agg.unknownWorkSeen.add(work);
          warn.push(`\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u0440\u0430\u0431\u043E\u0442 \u0434\u043B\u044F \xAB${tt}\xBB: "${work}"`);
        }
      }
      const addr = String(rec.address ?? "").trim();
      if (addr) {
        if (!agg.addressSample) agg.addressSample = addr;
        else if (addr !== agg.addressSample) agg.addressConflict = true;
      }
      const areaNum = parseArea(rec.area);
      if (areaNum != null) agg.areaValues.push(areaNum);
      agg.dateVals.push(parseRuDate(rec.date1), parseRuDate(rec.date2));
      const fmt = String(rec.format ?? "").trim();
      if (fmt) agg.formats.push(fmt);
    }
    map.forEach((agg, tt) => {
      if (agg.addressConflict)
        warn.push(`\u0420\u0430\u0437\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0432\u043D\u0443\u0442\u0440\u0438 \u0433\u0440\u0443\u043F\u043F\u044B \xAB${tt}\xBB \u2014 \u0432 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u043F\u0435\u0440\u0432\u044B\u0439 \u0432\u0441\u0442\u0440\u0435\u0442\u0438\u0432\u0448\u0438\u0439\u0441\u044F`);
      if (agg.rccSeen.length > 1)
        warn.push(`\u041D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0437\u0430\u043A\u0430\u0437\u043E\u0432 RCC \u0434\u043B\u044F \xAB${tt}\xBB: ${agg.rccSeen.join(", ")}`);
      const uniqueFmt = [...new Set(agg.formats.filter(Boolean))];
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
    const { kind, records } = normalizeMatrixToRecords(parsedRows, opts);
    const groupMap = groupAndAggregateRecords(records, warnings);
    const outRows = buildOutputRows(groupMap, opts);
    const warningsByTtFlags = outRows.map((r) => ttHasAttention(String(r["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0422\u0422"]), warnings));
    return {
      rows: outRows,
      warnings,
      warningsByTtFlags,
      inputKind: kind,
      sourceRecords: records.length
    };
  }
  var GOLDEN_ZAKAZ_MATRIX = [
    ["\u2116 \u043F/\u043F", "\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u043A\u0430\u0437\u0430", "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", "", "", "\u041C\u043E\u0434\u0435\u043B\u044C", "", "", "\u041A\u043E\u043B-\u0432\u043E, \u0448\u0442", "", "", "", "\u0414\u0430\u0442\u0430 \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0438", "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043C\u043E\u043D\u0442\u0430\u0436\u0430", "\u041C\u0435\u0441\u0442\u043E \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0438"],
    ["1", "RCC-000160293", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0433\u0440\u043E\u043C\u043A\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044F", "", "", "3", "", "", "", "08.12.2026", "08.12.2026", "\u0420\u043E\u0441\u043A\u043E\u0448\u044C"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439, \u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440 \u0433"],
    ["2", "RCC-000160293", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F", "", "", "1", "", "", "", "08.12.2026", "08.12.2026", "\u0420\u043E\u0441\u043A\u043E\u0448\u044C"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439, \u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440 \u0433"],
    ["3", "RCC-000160293", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438", "", "", "1", "", "", "", "08.12.2026", "08.12.2026", "\u0420\u043E\u0441\u043A\u043E\u0448\u044C"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439, \u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440 \u0433"],
    ["4", "RCC-000160299", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0433\u0440\u043E\u043C\u043A\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044F", "", "", "7", "", "", "", "08.12.2026", "08.12.2026", "\u0421\u0430\u043B\u043A\u0438"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "105484, \u041C\u043E\u0441\u043A\u0432\u0430 \u0433, \u0421\u0438\u0440\u0435\u043D\u0435\u0432\u044B\u0439 \u0431-\u0440, \u0434\u043E\u043C \u2116 60"],
    ["5", "RCC-000160299", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0434\u0438\u0441\u043F\u043B\u0435\u044F \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044F", "", "", "2", "", "", "", "08.12.2026", "08.12.2026", "\u0421\u0430\u043B\u043A\u0438"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "105484, \u041C\u043E\u0441\u043A\u0432\u0430 \u0433, \u0421\u0438\u0440\u0435\u043D\u0435\u0432\u044B\u0439 \u0431-\u0440, \u0434\u043E\u043C \u2116 60"],
    ["6", "RCC-000160299", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430", "", "", "1", "", "", "", "08.12.2026", "08.12.2026", "\u0421\u0430\u043B\u043A\u0438"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "105484, \u041C\u043E\u0441\u043A\u0432\u0430 \u0433, \u0421\u0438\u0440\u0435\u043D\u0435\u0432\u044B\u0439 \u0431-\u0440, \u0434\u043E\u043C \u2116 60"],
    ["7", "RCC-000160299", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0430\u0443\u0434\u0438\u043E\u0432\u0435\u0449\u0430\u043D\u0438\u044F", "", "", "1", "", "", "", "08.12.2026", "08.12.2026", "\u0421\u0430\u043B\u043A\u0438"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "105484, \u041C\u043E\u0441\u043A\u0432\u0430 \u0433, \u0421\u0438\u0440\u0435\u043D\u0435\u0432\u044B\u0439 \u0431-\u0440, \u0434\u043E\u043C \u2116 60"],
    ["8", "RCC-000160299", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0422\u0412 \u043F\u0430\u043D\u0435\u043B\u0438", "", "", "2", "", "", "", "08.12.2026", "08.12.2026", "\u0421\u0430\u043B\u043A\u0438"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "105484, \u041C\u043E\u0441\u043A\u0432\u0430 \u0433, \u0421\u0438\u0440\u0435\u043D\u0435\u0432\u044B\u0439 \u0431-\u0440, \u0434\u043E\u043C \u2116 60"],
    ["9", "RCC-000160300", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u0418\u0422-\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F", "", "", "\u041F\u0435\u0440\u0432\u0438\u0447\u043D\u044B\u0439 \u043C\u043E\u043D\u0442\u0430\u0436 \u043F\u0440\u0430\u0439\u0441\u0447\u0435\u043A\u0435\u0440\u0430", "", "", "1", "", "", "", "08.12.2026", "08.12.2026", "\u0411\u0440\u0443\u0434\u0435\u0440\u0433\u0430\u0443\u0437, \u041A\u041F\u041F 222545005"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "656049, \u0410\u043B\u0442\u0430\u0439\u0441\u043A\u0438\u0439 \u043A\u0440\u0430\u0439, \u0411\u0430\u0440\u043D\u0430\u0443\u043B \u0433, \u041F\u0440\u043E\u043B\u0435\u0442\u0430\u0440\u0441\u043A\u0430\u044F \u0443\u043B, \u0434\u043E\u043C \u2116 150, \u043F\u043E\u043C. \u041D1"]
  ];
  var GOLDEN_INPUT = GOLDEN_ZAKAZ_MATRIX.map((r) => r.join("	")).join("\n");

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
      const { rows, warnings, warningsByTtFlags, inputKind, sourceRecords } = transformFromMatrix(
        matrix,
        {
          queueDefault: queueVal,
          columns: PARSE_OPTS_BASE.columns,
          warnings: warns
        }
      );
      lastResult = rows;
      lastWarnings = warnings;
      lastWarnFlags = warningsByTtFlags;
      const kindLabel = inputKind === "zakaz" ? "\u0437\u0430\u043A\u0430\u0437 Magnit" : "\u043F\u043B\u043E\u0441\u043A\u0430\u044F \u0432\u044B\u0433\u0440\u0443\u0437\u043A\u0430";
      $("meta-line").textContent = `\u0413\u043E\u0442\u043E\u0432\u043E (${kindLabel}): \u043F\u043E\u0437\u0438\u0446\u0438\u0439 ${sourceRecords ?? "\u2014"}, \u0442\u043E\u0440\u0433\u043E\u0432\u044B\u0445 \u0442\u043E\u0447\u0435\u043A ${rows.length}.`;
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
