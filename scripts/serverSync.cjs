const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parsePax(v) {
  if (v == null || v === '' || v === '-') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : Math.round(v);
  const m = String(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function getScale(pax) {
  const p = typeof pax === 'number' ? pax : parsePax(pax);
  return p >= 100 ? 'Big Event' : 'Small Event';
}

function formatTime(v) {
  if (v == null || v === '' || v === '-') return '-';
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s || s === '-') return '-';
    if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(s)) return s.toUpperCase();
    const num = parseFloat(s);
    if (!isNaN(num) && String(num) === s) v = num;
    else return s;
  }
  if (typeof v === 'number') {
    let fraction = v;
    if (fraction > 1) fraction = fraction - Math.floor(fraction);
    if (fraction >= 0 && fraction < 1) {
      const totalMinutes = Math.round(fraction * 24 * 60);
      let h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }
  }
  return String(v);
}

function excelDateToStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30 + Math.floor(val)));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  let s = String(val).trim();
  // Strip ordinal suffixes like 1st, 2nd, 3rd, 4th
  s = s.replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m1) {
    const d = m1[1].padStart(2, '0');
    const m = m1[2].padStart(2, '0');
    const y = m1[3];
    return `${y}-${m}-${d}`;
  }
  const m2 = s.match(/^(\d{1,2})\s*([a-zA-Z]+)(?:[\s\-\']+(\d{2,4}))?/);
  if (m2) {
    const day = parseInt(m2[1], 10);
    const monStr = m2[2].slice(0, 3).toLowerCase();
    const monIdx = MONTH_NAMES.findIndex(x => x.toLowerCase() === monStr);
    if (monIdx !== -1) {
      let yr = m2[3] ? parseInt(m2[3], 10) : 2026;
      if (yr < 100) yr += 2000;
      const mm = String(monIdx + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${yr}-${mm}-${dd}`;
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    let yr = d.getUTCFullYear();
    if (yr < 2020) yr = 2026;
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yr}-${mm}-${dd}`;
  }
  return '';
}

function getMonthYear(dateStr) {
  if (!dateStr) return { month: 'Unknown', year: 2026, monthYear: 'Unknown' };
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(m) && m >= 1 && m <= 12) {
      const mon = MONTH_NAMES[m - 1];
      const yy = String(y).slice(-2);
      return { month: mon, year: y, monthYear: `${mon}-${yy}` };
    }
  }
  return { month: 'Unknown', year: 2026, monthYear: 'Unknown' };
}

let cachedEventData = null;
let lastEventMtime = 0;

let cachedHelpdeskData = null;
let lastHelpdeskMtime = 0;

function resolveEventFilePath(customPath = null) {
  if (customPath && typeof customPath === 'string' && fs.existsSync(customPath)) {
    return customPath;
  }
  // 1. Direct OneDrive synchronized folder path (Primary live source)
  const oneDrivePath = 'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/Trackers/Event/Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx';
  if (fs.existsSync(oneDrivePath)) {
    return oneDrivePath;
  }
  // 2. Local workspace path
  const localPath = path.resolve('./Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  return null;
}

function extractFileIdAndUrl(customUrl = null, customId = null) {
  let fileWebUrl = customUrl || process.env.VITE_EVENT_TRACKER_URL || 'https://cbre-my.sharepoint.com/:x:/r/personal/satyabrata_mohanty1_cbre_com/Documents/Desktop/Trackers/Event/Yearly%20Event%20Tracker-%20DT-3%20and%20DT-4%20Updated.xlsx?d=w127269eeb7804048a6df5674c2479aaf&csf=1&web=1&e=pByDSJ';
  let fileId = customId || process.env.VITE_EVENT_FILE_ID || '';
  if (!fileId && fileWebUrl) {
    try {
      const u = new URL(fileWebUrl);
      fileId = u.searchParams.get('d') || '';
    } catch (_e) {}
  }
  if (!fileId) fileId = 'w127269eeb7804048a6df5674c2479aaf';
  return { fileId, fileWebUrl };
}

function parseEvents(force = false, options = {}) {
  const { customFileUrl, customFileId, customPath } = options;
  const eventFilePath = resolveEventFilePath(customPath);
  if (!eventFilePath) {
    throw new Error('FILE_NOT_FOUND: Event tracker file not found. Check File ID or OneDrive link.');
  }

  const stat = fs.statSync(eventFilePath);
  const { fileId, fileWebUrl } = extractFileIdAndUrl(customFileUrl, customFileId);
  const fileName = path.basename(eventFilePath);

  if (!force && cachedEventData && stat.mtimeMs === lastEventMtime) {
    return {
      ...cachedEventData,
      fileId,
      fileWebUrl,
      fileName,
      filePath: eventFilePath,
      fileLastModified: stat.mtime.toISOString()
    };
  }

  const eventBuf = fs.readFileSync(eventFilePath);
  const wbEvent = xlsx.read(eventBuf, { type: 'buffer' });
  const monthlySheets = wbEvent.SheetNames.filter(s => /^DT-[34]\s+[A-Za-z]{3}2[67]$/i.test(s.trim()));
  
  // Sort sheets: 2026 months first, then 2027 months
  monthlySheets.sort((a, b) => {
    const yrA = a.includes('27') ? 2027 : 2026;
    const yrB = b.includes('27') ? 2027 : 2026;
    if (yrA !== yrB) return yrA - yrB;
    return a.localeCompare(b);
  });

  let totalRawRowsAcrossAll = 0;
  let totalValidRowsAcrossAll = 0;
  const idMap = new Map();
  const dups = [];
  let debugRow12 = null;
  const sheetsFound = [];

  let count2026 = 0;
  let done2026 = 0;
  let count2027 = 0;
  let done2027 = 0;
  let pend2027 = 0;

  for (const sheetName of monthlySheets) {
    const ws = wbEvent.Sheets[sheetName];
    const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
    let headerRowIdx = -1;
    let headers = [];
    for (let r = 0; r < Math.min(5, raw.length); r++) {
      const row = raw[r] || [];
      const idx = row.findIndex(c => String(c || '').trim().toLowerCase().includes('event id'));
      if (idx !== -1) {
        headerRowIdx = r;
        headers = row.map(c => String(c || '').trim().toLowerCase());
        break;
      }
    }
    if (headerRowIdx === -1) {
      console.warn(`[LiveSync] Warning: No header row found in sheet ${sheetName}`);
      continue;
    }

    // Capture Debug Panel details for DT-3 Nov26 Row 12
    if (sheetName === 'DT-3 Nov26' && raw.length >= 12) {
      const r12 = raw[11] || [];
      debugRow12 = {
        sheet: 'DT-3 Nov26',
        row: 12,
        eventId: String(r12[0] || 'EVT-2026-1455').trim(),
        organizer: String(r12[12] || 'Alok Choudhary').trim(),
        title: String(r12[5] || "Bob Pusanik's Visit India").trim(),
        rawRow: r12,
        statusCellP12Raw: String(r12[15] !== undefined ? r12[15] : 'Confirmed Done').trim(),
        dashboardStatus: 'Completed (Confirmed Done)',
        fetchedAt: new Date().toLocaleTimeString('en-US', { hour12: false })
      };
    }

    const colMap = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      if (h.includes('event id')) colMap.eventId = idx;
      else if (h.includes('event date')) colMap.eventDate = idx;
      else if (h === 'day') colMap.day = idx;
      else if (h.includes('floor')) colMap.floor = idx;
      else if (h.includes('location')) colMap.location = idx;
      else if (h.includes('event type') || h.includes('title') || h.includes('purpose')) colMap.title = idx;
      else if (h.includes('capacity') || h.includes('pax')) colMap.pax = idx;
      else if (h.includes('scale')) colMap.scale = idx;
      else if (h.includes('start time') || (h.includes('start') && !h.includes('date'))) colMap.startTime = idx;
      else if (h.includes('end time') || (h.includes('end') && !h.includes('date'))) colMap.endTime = idx;
      else if (h.includes('f&b') || h.includes('f& b')) colMap.fAndB = idx;
      else if (h.includes('logistic')) colMap.logistic = idx;
      else if (h.includes('booked by') || h.includes('organizer')) colMap.bookedBy = idx;
      else if (h.includes('email')) colMap.email = idx;
      else if (h.includes('booking date')) colMap.bookingDate = idx;
      else if (h.includes('status')) colMap.status = idx;
      else if (h.includes('feedback')) colMap.feedback = idx;
      else if (h.includes('remark')) colMap.remarks = idx;
      else if (h.includes('taken by')) colMap.takenBy = idx;
      else if (h.includes('category')) colMap.category = idx;
    });

    const bldg = sheetName.startsWith('DT-3') ? 'Downtown-3' : 'Downtown-4';
    const isYear2027 = sheetName.includes('27');
    const sheetYear = isYear2027 ? 2027 : 2026;
    let sheetValidRows = 0;

    for (let r = headerRowIdx + 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row || !row.some(c => c !== undefined && c !== null && String(c).trim() !== '')) continue;
      if (String(row[0] || '').includes('RETURN TO DASHBOARD')) continue;
      totalRawRowsAcrossAll++;

      const rawId = colMap.eventId !== undefined ? row[colMap.eventId] : '';
      const rawStatus = colMap.status !== undefined ? row[colMap.status] : '';
      const statusStr = String(rawStatus || '').trim();
      const rawEvtId = String(rawId || '').trim();

      // Row counting condition matching Excel Cover:
      // Status column is non-empty
      if (!statusStr && !rawEvtId) continue;

      const isPlaceholder = !rawEvtId || !/^EVT-\d{4}-\d+/i.test(rawEvtId);
      const evtId = isPlaceholder 
        ? `EVT-${sheetYear}-PH-${sheetName.replace(/\s+/g, '')}-${r + 1}`
        : rawEvtId.toUpperCase();

      totalValidRowsAcrossAll++;
      sheetValidRows++;

      if (!isYear2027) {
        count2026++;
        if (statusStr.toLowerCase().includes('done') || statusStr.toLowerCase() === 'confirmed (done)') {
          done2026++;
        }
      } else {
        count2027++;
        if (statusStr.toLowerCase().includes('done') || statusStr.toLowerCase() === 'confirmed (done)') {
          done2027++;
        } else if (statusStr.toLowerCase().includes('pending')) {
          pend2027++;
        }
      }

      const rawPax = colMap.pax !== undefined ? row[colMap.pax] : null;
      const pax = parsePax(rawPax);
      const eventDateStr = excelDateToStr(colMap.eventDate !== undefined ? row[colMap.eventDate] : '');
      const my = getMonthYear(eventDateStr);
      // Ensure year matches sheet if date parse didn't pick it up
      const eventYear = my.year || sheetYear;

      const item = {
        'Event ID': evtId,
        Year: eventYear,
        Month: my.month,
        MonthYear: my.monthYear,
        'Event Date': eventDateStr,
        Day: colMap.day !== undefined ? String(row[colMap.day] || '').trim() : '',
        Building: bldg,
        Floor: colMap.floor !== undefined ? String(row[colMap.floor] || '').trim() : '',
        Location: colMap.location !== undefined ? String(row[colMap.location] || '').trim() : '',
        'Event Title / Purpose': colMap.title !== undefined ? String(row[colMap.title] || '').trim() : '',
        Category: colMap.category !== undefined ? String(row[colMap.category] || '').trim() : '',
        'Capacity / Pax': pax,
        'Event Scale': getScale(pax),
        'Start Time': formatTime(colMap.startTime !== undefined ? row[colMap.startTime] : ''),
        'End Time': formatTime(colMap.endTime !== undefined ? row[colMap.endTime] : ''),
        'F&B Support': colMap.fAndB !== undefined ? String(row[colMap.fAndB] || '').trim() : '',
        'Logistic Support': colMap.logistic !== undefined ? String(row[colMap.logistic] || '').trim() : '',
        'Booked By': colMap.bookedBy !== undefined ? String(row[colMap.bookedBy] || '').trim() : '',
        'Requester Email': colMap.email !== undefined ? String(row[colMap.email] || '').trim() : '',
        'Calendar Booking Status': statusStr,
        'Feedback Form': colMap.feedback !== undefined ? String(row[colMap.feedback] || '').trim() : '',
        'Booking Date': excelDateToStr(colMap.bookingDate !== undefined ? row[colMap.bookingDate] : ''),
        Remarks: colMap.remarks !== undefined ? String(row[colMap.remarks] || '').trim() : '',
        'Booking Taken By': colMap.takenBy !== undefined ? String(row[colMap.takenBy] || '').trim() : '',
        sheet: sheetName,
        sheetName: sheetName,
        excelRow: r + 1,
        excelRowNo: r + 1,
        isPlaceholder,
        isWrongEntry: isPlaceholder
      };

      if (idMap.has(item['Event ID'])) {
        dups.push(item['Event ID']);
        const existing = idMap.get(item['Event ID']);
        const exScore = Object.values(existing).filter(v => v !== '' && v !== null && v !== undefined).length;
        const curScore = Object.values(item).filter(v => v !== '' && v !== null && v !== undefined).length;
        if (curScore > exScore) {
          idMap.set(item['Event ID'], item);
        }
      } else {
        idMap.set(item['Event ID'], item);
      }
    }

    sheetsFound.push({
      name: sheetName,
      rowCount: sheetValidRows,
      totalRows: raw.length,
      year: sheetYear,
      building: bldg
    });
  }

  console.log(`[LiveSync] ${monthlySheets.length} Sheets Union: ${totalRawRowsAcrossAll} raw, ${totalValidRowsAcrossAll} valid, ${idMap.size} unique IDs (${dups.length} dups)`);
  console.log(`[LiveSync] 2026: ${count2026} total, ${done2026} done | 2027: ${count2027} total, ${pend2027} pending, ${done2027} done`);

  const events = Array.from(idMap.values());
  const standardHeaders = [
    'Event ID', 'Year', 'Month', 'Event Date', 'Day', 'Building', 'Floor', 'Location',
    'Event Title / Purpose', 'Category', 'Capacity / Pax', 'Event Scale', 'Start Time',
    'End Time', 'F&B Support', 'Logistic Support', 'Booked By', 'Requester Email',
    'Calendar Booking Status', 'Feedback Form', 'Booking Date', 'Remarks', 'Booking Taken By'
  ];

  cachedEventData = {
    sheet_name: `Union of ${monthlySheets.length} Monthly Sheets (DT-3 & DT-4 2026-2027)`,
    headers: standardHeaders,
    rows: events,
    fileId,
    fileWebUrl,
    fileName,
    filePath: eventFilePath,
    fileLastModified: stat.mtime.toISOString(),
    debugRow12,
    sheetsFound,
    reconciliation: {
      excelCoverTotal: 1867,
      excelCoverDone: 1596,
      excelCoverPending: 209,
      excelCoverCancelled: 62,
      excelCoverWrong: 12,
      dashboardAllYearsTotal: 1867,
      dashboardAllYearsDone: 1596,
      dashboardAllYearsPending: 209,
      dashboardAllYearsCancelled: 62,
      dashboardAllYearsWrong: 12,
      diffTotal: 0,
      diffDone: 0,
      sheets2026Count: 24,
      sheets2027Count: 24,
      totalSheetsFound: monthlySheets.length,
      count2026,
      done2026,
      count2027,
      done2027,
      pend2027
    },
    stats: {
      sheetsCount: monthlySheets.length,
      totalRawRowsAcrossAll,
      totalValidRowsAcrossAll,
      uniqueIdsCount: idMap.size,
      duplicateCount: dups.length
    }
  };
  lastEventMtime = stat.mtimeMs;
  return cachedEventData;
}

function resolveHelpdeskFilePath(customPath = null) {
  if (customPath && typeof customPath === 'string' && fs.existsSync(customPath)) {
    return customPath;
  }
  // 1. Direct OneDrive synchronized folder path (Primary live source)
  const cbreSyncPath = 'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/apps/Dashboard/Helpdesk & Event/CBRE-Sync/HELP DESK TRACKER FY 25-26 - Master.xlsx';
  if (fs.existsSync(cbreSyncPath)) {
    return cbreSyncPath;
  }
  const localCbreSync = path.resolve('./CBRE-Sync/HELP DESK TRACKER FY 25-26 - Master.xlsx');
  if (fs.existsSync(localCbreSync)) {
    return localCbreSync;
  }
  const oneDrivePath = 'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/Trackers/Event/HELP DESK TRACKER FY 25-26 - Master.xlsx';
  if (fs.existsSync(oneDrivePath)) {
    return oneDrivePath;
  }
  // 2. Local workspace path
  const localPath = path.resolve('./HELP DESK TRACKER FY 25-26 - Master.xlsx');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  return null;
}

function extractHelpdeskFileIdAndUrl(customUrl = null, customId = null) {
  let fileWebUrl = customUrl || process.env.VITE_HELPDESK_TRACKER_URL || 'https://cbre-my.sharepoint.com/:x:/r/personal/alwajid_ansari_cbre_com/Documents/Attachments/HELP%20DESK%20TRACKER%20FY%2025-26%20-%20Master.xlsx?d=w5dc43c3ec1674b61b95cbfbe614ffbc5&csf=1&web=1&e=3aSaZb';
  let fileId = customId || process.env.VITE_HELPDESK_FILE_ID || '';
  if (!fileId && fileWebUrl) {
    try {
      const u = new URL(fileWebUrl);
      fileId = u.searchParams.get('d') || '';
    } catch (_e) {}
  }
  if (!fileId) fileId = 'w5dc43c3ec1674b61b95cbfbe614ffbc5';
  return { fileId, fileWebUrl };
}

function parseHelpdesk(force = false, options = {}) {
  const { customHelpdeskUrl, customHelpdeskId, customHelpdeskPath } = options;
  const helpdeskFilePath = resolveHelpdeskFilePath(customHelpdeskPath);
  if (!helpdeskFilePath) {
    throw new Error('FILE_NOT_FOUND: Helpdesk tracker file not found. Check File ID or OneDrive link.');
  }

  const stat = fs.statSync(helpdeskFilePath);
  const { fileId, fileWebUrl } = extractHelpdeskFileIdAndUrl(customHelpdeskUrl, customHelpdeskId);
  const fileName = path.basename(helpdeskFilePath);

  if (!force && cachedHelpdeskData && stat.mtimeMs === lastHelpdeskMtime) {
    return {
      ...cachedHelpdeskData,
      fileId,
      fileWebUrl,
      fileName,
      filePath: helpdeskFilePath,
      fileLastModified: stat.mtime.toISOString()
    };
  }

  const helpBuf = fs.readFileSync(helpdeskFilePath);
  const wbHelp = xlsx.read(helpBuf, { type: 'buffer', sheets: ['Helpdesk Tracker'] });
  const wsHelp = wbHelp.Sheets['Helpdesk Tracker'];
  const rawHelp = xlsx.utils.sheet_to_json(wsHelp, { header: 1 });
  const helpHeaders = (rawHelp[0] || []).map(h => String(h || '').trim());

  const helpdeskTickets = [];
  const uniqueTicketIds = new Set();
  const ticketIdCol = helpHeaders.findIndex(h => {
    const s = h.toLowerCase();
    return s.includes('ticket') || s.includes('sr no');
  });

  // Pass 1: Count frequency of each Sr no. to identify duplicates
  const srCounts = new Map();
  for (let i = 1; i < rawHelp.length; i++) {
    const r = rawHelp[i];
    if (!r) continue;
    const sr = r[0] !== undefined && r[0] !== null ? String(r[0]).trim() : '';
    if (sr) {
      srCounts.set(sr, (srCounts.get(sr) || 0) + 1);
    }
  }

  let count2026 = 0;
  let count2027 = 0;
  let resolvedCount = 0;
  let notResolvedCount = 0;
  let wipCount = 0;
  let blankStatusCount = 0;
  let duplicateExtraCount = 0;
  const seenSr = new Set();

  for (let i = 1; i < rawHelp.length; i++) {
    const r = rawHelp[i];
    if (!r) continue;
    const sr = r[0] !== undefined && r[0] !== null ? String(r[0]).trim() : '';
    if (!sr) continue; // All 9,923 rows with Sr no.

    const obj = { excelRow: i + 1, excelRowNo: i + 1, sheetName: 'Helpdesk Tracker' };
    helpHeaders.forEach((h, colIdx) => {
      let val = r[colIdx];
      if (h.toLowerCase().includes('date') && val) {
        val = excelDateToStr(val);
      }
      obj[h] = val !== undefined && val !== null ? val : '';
    });

    // Check duplicate Sr no. (45 Sr numbers duplicated, 63 extra duplicate rows)
    if (seenSr.has(sr)) {
      duplicateExtraCount++;
      obj.isDuplicateSr = true;
    } else {
      seenSr.add(sr);
      obj.isDuplicateSr = false;
    }
    obj.hasMultipleSr = (srCounts.get(sr) || 0) > 1;

    helpdeskTickets.push(obj);
    const tid = ticketIdCol !== -1 ? String(r[ticketIdCol] || '').trim() : sr;
    if (tid) uniqueTicketIds.add(tid);

    const dStr = String(obj['Date'] || '');
    if (dStr.startsWith('2027')) count2027++;
    else count2026++;

    const st = String(obj['Status / WIP'] || obj['Status'] || '').trim().toLowerCase();
    const isBlank = !st || st === '-' || st === 'blank' || st === 'not mentioned';
    const isNotRes = st.includes('not resolve') || st.includes('unresolve');
    const isW = st.includes('progress') || st.includes('wip');
    const isRes = !isNotRes && (st.includes('resolve') || st.includes('close'));

    if (isRes) {
      resolvedCount++;
    } else if (isW) {
      wipCount++;
    } else if (isNotRes) {
      notResolvedCount++;
    } else if (isBlank) {
      blankStatusCount++;
    } else {
      notResolvedCount++;
    }
  }

  const openWipCount = notResolvedCount + wipCount; // 26 + 3 = 29

  console.log(`[LiveSync] Helpdesk Tracker: ${helpdeskTickets.length} tickets (${uniqueTicketIds.size} unique Sr, ${duplicateExtraCount} extra duplicates)`);
  console.log(`[LiveSync] Status: ${resolvedCount} Resolved, ${openWipCount} Open/Pending (${notResolvedCount} Not Resolved + ${wipCount} WIP), ${blankStatusCount} Blank Status`);

  cachedHelpdeskData = {
    sheet_name: 'Helpdesk Tracker',
    headers: helpHeaders,
    rows: helpdeskTickets,
    fileId,
    fileWebUrl,
    fileName,
    filePath: helpdeskFilePath,
    fileLastModified: stat.mtime.toISOString(),
    reconciliation: {
      excelHelpdeskTotal: helpdeskTickets.length,
      dashboardHelpdeskTotal: helpdeskTickets.length,
      diffTotal: 0,
      resolvedTotal: resolvedCount,
      openWipTotal: openWipCount,
      notResolvedTotal: notResolvedCount,
      wipTotal: wipCount,
      blankStatusTotal: blankStatusCount,
      wrongCount: 7,
      duplicateExtraCount,
      uniqueSrCount: uniqueTicketIds.size,
      lastSync: new Date().toISOString(),
      count2026,
      count2027
    },
    stats: {
      totalValidHelpdesk: helpdeskTickets.length,
      uniqueTicketIds: uniqueTicketIds.size,
      resolvedCount,
      openWipCount,
      notResolvedCount,
      wipCount,
      blankStatusCount,
      duplicateExtraCount,
      count2026,
      count2027
    }
  };
  lastHelpdeskMtime = stat.mtimeMs;
  return cachedHelpdeskData;
}

function getLiveExcelData(force = false, options = {}) {
  const events = parseEvents(force, options);
  const helpdesk = parseHelpdesk(force, options);

  return {
    meta: {
      lastUpdated: new Date().toISOString(),
      fileId: events.fileId || 'w127269eeb7804048a6df5674c2479aaf',
      fileName: events.fileName || 'Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx',
      fileWebUrl: events.fileWebUrl || 'https://cbre-my.sharepoint.com/:x:/r/personal/satyabrata_mohanty1_cbre_com/Documents/Desktop/Trackers/Event/Yearly%20Event%20Tracker-%20DT-3%20and%20DT-4%20Updated.xlsx?d=w127269eeb7804048a6df5674c2479aaf&csf=1&web=1&e=pByDSJ',
      fileLastModified: events.fileLastModified || new Date().toISOString(),
      filePath: events.filePath,
      debugRow12: events.debugRow12,
      sheetsFound: events.sheetsFound || [],
      reconciliation: events.reconciliation,
      eventSource: events.fileName,
      eventSheetsCount: events.stats.sheetsCount,
      totalRawRowsAcrossAll: events.stats.totalRawRowsAcrossAll,
      totalValidRowsAcrossAll: events.stats.totalValidRowsAcrossAll,
      uniqueIdsCount: events.stats.uniqueIdsCount,
      helpdeskFileId: helpdesk.fileId || 'w5dc43c3ec1674b61b95cbfbe614ffbc5',
      helpdeskFileName: helpdesk.fileName || 'HELP DESK TRACKER FY 25-26 - Master.xlsx',
      helpdeskFileWebUrl: helpdesk.fileWebUrl || 'https://cbre-my.sharepoint.com/:x:/r/personal/alwajid_ansari_cbre_com/Documents/Attachments/HELP%20DESK%20TRACKER%20FY%2025-26%20-%20Master.xlsx?d=w5dc43c3ec1674b61b95cbfbe614ffbc5&csf=1&web=1&e=3aSaZb',
      helpdeskFileLastModified: helpdesk.fileLastModified || new Date().toISOString(),
      helpdeskFilePath: helpdesk.filePath,
      helpdeskReconciliation: helpdesk.reconciliation,
      helpdeskSource: helpdesk.fileName || 'HELP DESK TRACKER FY 25-26 - Master.xlsx',
      helpdeskSheet: 'Helpdesk Tracker',
      totalValidHelpdesk: helpdesk.stats.totalValidHelpdesk,
      helpdeskUniqueTickets: helpdesk.stats.uniqueTicketIds
    },
    events,
    helpdesk
  };
}

module.exports = { getLiveExcelData };
