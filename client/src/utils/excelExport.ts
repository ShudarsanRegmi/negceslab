/**
 * excelExport.ts
 * Rich Excel report generator for NegcesLab Analytics using ExcelJS.
 * Supports full cell styling: colors, borders, fonts, merged cells, freeze rows.
 */
import ExcelJS from 'exceljs';

// ─── Brand palette ───────────────────────────────────────────────────────────
const COLOR = {
  navyDark:   '0F172A',
  navyMid:    '1E3A5F',
  navyLight:  '2563EB',
  accent:     '3B82F6',
  white:      'FFFFFF',
  offWhite:   'F8FAFC',
  borderGray: 'E2E8F0',
  textDark:   '1E293B',
  textMid:    '475569',
  textLight:  '94A3B8',
  // Status colors
  approved:   '10B981',
  approvedBg: 'ECFDF5',
  pending:    'F59E0B',
  pendingBg:  'FFFBEB',
  rejected:   'EF4444',
  rejectedBg: 'FEF2F2',
  cancelled:  '6B7280',
  cancelledBg:'F9FAFB',
  completed:  '3B82F6',
  completedBg:'EFF6FF',
  // Chart bar shades
  bar1:       'BFDBFE',
  bar2:       '93C5FD',
  bar3:       '60A5FA',
  bar4:       '3B82F6',
  bar5:       '2563EB',
  gpu:        '8B5CF6',
  gpuBg:      'F5F3FF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type XlsxFill = ExcelJS.Fill;
type XlsxFont = Partial<ExcelJS.Font>;
type XlsxBorder = Partial<ExcelJS.Borders>;
type XlsxAlign = Partial<ExcelJS.Alignment>;

function solidFill(hex: string): XlsxFill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
}
function border(hex = COLOR.borderGray, style: ExcelJS.BorderStyle = 'thin'): XlsxBorder {
  const b = { style, color: { argb: 'FF' + hex } } as ExcelJS.Border;
  return { top: b, left: b, bottom: b, right: b };
}
function bottomBorder(hex = COLOR.borderGray): XlsxBorder {
  return { bottom: { style: 'thin', color: { argb: 'FF' + hex } } };
}
function font(hex: string, size = 10, bold = false, italic = false): XlsxFont {
  return { name: 'Calibri', size, bold, italic, color: { argb: 'FF' + hex } };
}
function align(h: ExcelJS.Alignment['horizontal'] = 'left', v: ExcelJS.Alignment['vertical'] = 'middle', wrap = false): XlsxAlign {
  return { horizontal: h, vertical: v, wrapText: wrap };
}

/** Apply styles to an entire row */
function styleRow(
  row: ExcelJS.Row,
  fillHex?: string,
  fontCfg?: XlsxFont,
  borderCfg?: XlsxBorder,
  alignCfg?: XlsxAlign,
) {
  row.eachCell({ includeEmpty: true }, cell => {
    if (fillHex) cell.fill = solidFill(fillHex);
    if (fontCfg) cell.font = fontCfg as ExcelJS.Font;
    if (borderCfg) cell.border = borderCfg as ExcelJS.Borders;
    if (alignCfg) cell.alignment = alignCfg as ExcelJS.Alignment;
  });
}

/** Status cell color */
function statusColors(status: string): { fg: string; bg: string } {
  const m: Record<string, { fg: string; bg: string }> = {
    approved:  { fg: COLOR.approved,  bg: COLOR.approvedBg },
    completed: { fg: COLOR.completed, bg: COLOR.completedBg },
    pending:   { fg: COLOR.pending,   bg: COLOR.pendingBg },
    rejected:  { fg: COLOR.rejected,  bg: COLOR.rejectedBg },
    cancelled: { fg: COLOR.cancelled, bg: COLOR.cancelledBg },
  };
  return m[status] || { fg: COLOR.textMid, bg: COLOR.offWhite };
}

/** Standard section header row (dark navy) */
function writeTableHeader(ws: ExcelJS.Worksheet, rowNum: number, headers: string[], colWidths?: number[]) {
  const row = ws.getRow(rowNum);
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.fill = solidFill(COLOR.navyDark);
    cell.font = font(COLOR.white, 10, true) as ExcelJS.Font;
    cell.alignment = align('center', 'middle') as ExcelJS.Alignment;
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FF' + COLOR.navyMid } },
      bottom: { style: 'medium', color: { argb: 'FF' + COLOR.accent } },
      left:   { style: 'thin', color: { argb: 'FF' + COLOR.navyMid } },
      right:  { style: 'thin', color: { argb: 'FF' + COLOR.navyMid } },
    };
  });
  row.height = 24;
  if (colWidths) {
    ws.columns = colWidths.map((w, i) => ({ key: String(i), width: w }));
  }
}

/** Title block at top of sheet */
function writeTitleBlock(ws: ExcelJS.Worksheet, title: string, subtitle: string, colSpan: number) {
  // Row 1 – main title
  ws.mergeCells(1, 1, 1, colSpan);
  const t = ws.getCell('A1');
  t.value = title;
  t.fill = solidFill(COLOR.navyDark);
  t.font = font(COLOR.white, 16, true) as ExcelJS.Font;
  t.alignment = align('center', 'middle') as ExcelJS.Alignment;
  ws.getRow(1).height = 36;

  // Row 2 – subtitle
  ws.mergeCells(2, 1, 2, colSpan);
  const s = ws.getCell('A2');
  s.value = subtitle;
  s.fill = solidFill(COLOR.navyMid);
  s.font = font(COLOR.bar1, 10, false, true) as ExcelJS.Font;
  s.alignment = align('center', 'middle') as ExcelJS.Alignment;
  ws.getRow(2).height = 20;

  // Row 3 – spacer
  ws.mergeCells(3, 1, 3, colSpan);
  ws.getCell('A3').fill = solidFill(COLOR.offWhite);
  ws.getRow(3).height = 6;
}

// ─── Booking type (minimal) ───────────────────────────────────────────────────

interface Booking {
  _id: string;
  userId: string;
  userInfo?: { name: string; email: string };
  user?: { name: string; email: string };
  computerId: { _id: string; name: string; location: string; specifications: string };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  createdAt: string;
  requiresGPU: boolean;
  gpuMemoryRequired?: number;
  problemStatement?: string;
  datasetType?: string;
  mentor?: string;
  rejectionReason?: string;
}

function getUserName(b: Booking) { return b.user?.name || b.userInfo?.name || ''; }
function getUserEmail(b: Booking) { return b.user?.email || b.userInfo?.email || b.userId || ''; }
function getDisplayName(b: Booking) { return getUserName(b) || getUserEmail(b) || 'Unknown User'; }
function calcHours(b: Booking) {
  const s = new Date(`${b.startDate}T${b.startTime || '00:00'}`);
  const e = new Date(`${b.endDate}T${b.endTime || '00:00'}`);
  const h = Math.ceil((e.getTime() - s.getTime()) / 3600000);
  return isNaN(h) || h <= 0 ? 2 : h;
}
function fmtDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Sheet builders ───────────────────────────────────────────────────────────

/** Sheet 1: Summary KPI dashboard */
function buildSummarySheet(wb: ExcelJS.Workbook, periodLabel: string, periodBookings: Booking[]) {
  const ws = wb.addWorksheet('Summary');
  ws.properties.tabColor = { argb: 'FF0F172A' };

  const approved = periodBookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
  const rejected = periodBookings.filter(b => b.status === 'rejected').length;
  const pending  = periodBookings.filter(b => b.status === 'pending').length;
  const cancelled = periodBookings.filter(b => b.status === 'cancelled').length;
  const total    = periodBookings.length;
  const gpu      = periodBookings.filter(b => b.requiresGPU).length;
  const approvalRate = (approved + rejected) > 0 ? `${Math.round((approved / (approved + rejected)) * 100)}%` : 'N/A';

  ws.columns = [
    { key: 'A', width: 6 },
    { key: 'B', width: 32 },
    { key: 'C', width: 22 },
    { key: 'D', width: 22 },
    { key: 'E', width: 22 },
  ];

  // Title block
  writeTitleBlock(ws, 'NegcesLab · Booking Analytics Report', `Period: ${periodLabel}  ·  Generated: ${new Date().toLocaleString()}`, 5);

  // KPI section header
  const kpiHead = ws.getRow(4);
  ws.mergeCells(4, 1, 4, 5);
  kpiHead.getCell(1).value = 'KEY PERFORMANCE INDICATORS';
  kpiHead.getCell(1).font = font(COLOR.navyLight, 9, true) as ExcelJS.Font;
  kpiHead.getCell(1).alignment = align('left', 'middle') as ExcelJS.Alignment;
  kpiHead.getCell(1).fill = solidFill(COLOR.offWhite);
  kpiHead.height = 18;

  // KPI table header
  writeTableHeader(ws, 5, ['', 'Metric', 'Value', 'Share of Total', 'Note'], [6, 32, 22, 22, 22]);

  // KPI rows
  const kpiRows: [string, string, number | string, string, string][] = [
    ['📋', 'Total Booking Requests',    total,    '100%',                              'All requests in period'],
    ['✅', 'Approved / Completed',       approved,  total > 0 ? `${Math.round((approved / total) * 100)}%` : '—', 'Approved + completed'],
    ['⏳', 'Pending (awaiting action)',  pending,   total > 0 ? `${Math.round((pending / total) * 100)}%`  : '—', 'Needs admin review'],
    ['❌', 'Rejected',                  rejected,  total > 0 ? `${Math.round((rejected / total) * 100)}%` : '—', 'Declined by admin'],
    ['🚫', 'Cancelled',                 cancelled, total > 0 ? `${Math.round((cancelled / total) * 100)}%`: '—', 'Cancelled by user/admin'],
    ['🔲', 'GPU-Accelerated Requests',  gpu,       total > 0 ? `${Math.round((gpu / total) * 100)}%`      : '—', 'Workloads needing GPU'],
    ['🖥️', 'CPU-Only Requests',         total - gpu, total > 0 ? `${Math.round(((total - gpu) / total) * 100)}%` : '—', 'Standard CPU workloads'],
    ['📈', 'Approval Rate',             approvalRate, '—',                             'Approved ÷ (Approved + Rejected)'],
  ];

  const kpiColors: Record<number, { fg: string; bg: string }> = {
    0: { fg: COLOR.accent,    bg: COLOR.offWhite },
    1: { fg: COLOR.approved,  bg: COLOR.approvedBg },
    2: { fg: COLOR.pending,   bg: COLOR.pendingBg },
    3: { fg: COLOR.rejected,  bg: COLOR.rejectedBg },
    4: { fg: COLOR.cancelled, bg: COLOR.cancelledBg },
    5: { fg: COLOR.gpu,       bg: COLOR.gpuBg },
    6: { fg: COLOR.textMid,   bg: COLOR.offWhite },
    7: { fg: COLOR.navyLight, bg: 'EFF6FF' },
  };

  kpiRows.forEach(([icon, metric, value, share, note], i) => {
    const r = ws.getRow(6 + i);
    const c = kpiColors[i];
    r.height = 22;

    const emojiCell = r.getCell(1);
    emojiCell.value = icon;
    emojiCell.alignment = align('center', 'middle') as ExcelJS.Alignment;
    emojiCell.fill = solidFill(c.bg);

    const metricCell = r.getCell(2);
    metricCell.value = metric;
    metricCell.font = font(COLOR.textDark, 10, true) as ExcelJS.Font;
    metricCell.fill = solidFill(c.bg);
    metricCell.alignment = align('left', 'middle') as ExcelJS.Alignment;

    const valueCell = r.getCell(3);
    valueCell.value = value;
    valueCell.font = font(c.fg, 13, true) as ExcelJS.Font;
    valueCell.fill = solidFill(c.bg);
    valueCell.alignment = align('center', 'middle') as ExcelJS.Alignment;

    const shareCell = r.getCell(4);
    shareCell.value = share;
    shareCell.font = font(COLOR.textMid, 10) as ExcelJS.Font;
    shareCell.fill = solidFill(c.bg);
    shareCell.alignment = align('center', 'middle') as ExcelJS.Alignment;

    const noteCell = r.getCell(5);
    noteCell.value = note;
    noteCell.font = font(COLOR.textLight, 9, false, true) as ExcelJS.Font;
    noteCell.fill = solidFill(c.bg);
    noteCell.alignment = align('left', 'middle') as ExcelJS.Alignment;

    // Row borders
    r.eachCell({ includeEmpty: true }, cell => {
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });
  });

  // Freeze top 5 rows
  ws.views = [{ state: 'frozen', ySplit: 5 }];
}

/** Sheet 2: All Booking Records */
function buildBookingsSheet(wb: ExcelJS.Workbook, periodLabel: string, bookings: Booking[]) {
  const ws = wb.addWorksheet('Booking Records');
  ws.properties.tabColor = { argb: 'FF2563EB' };

  const headers = ['#', 'User Name', 'User Email', 'Computer', 'Start Date', 'End Date', 'Start Time', 'End Time', 'Status', 'GPU?', 'GPU Mem (GB)', 'Mentor', 'Reason', 'Problem Statement', 'Dataset Type', 'Rejection Reason', 'Requested On'];
  const colWidths = [5, 24, 32, 18, 14, 14, 12, 12, 14, 8, 14, 20, 35, 35, 20, 35, 16];

  writeTitleBlock(ws, `Booking Records  ·  ${periodLabel}`, `${bookings.length} records`, headers.length);
  writeTableHeader(ws, 4, headers, colWidths);

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  bookings.forEach((b, i) => {
    const row = ws.getRow(5 + i);
    const isAlt = i % 2 === 0;
    const rowBg = isAlt ? COLOR.white : COLOR.offWhite;
    const sc = statusColors(b.status);

    const values: (string | number)[] = [
      i + 1,
      getDisplayName(b),
      getUserEmail(b),
      b.computerId?.name || '',
      fmtDate(b.startDate),
      fmtDate(b.endDate),
      b.startTime || '',
      b.endTime || '',
      b.status.charAt(0).toUpperCase() + b.status.slice(1),
      b.requiresGPU ? 'Yes' : 'No',
      b.gpuMemoryRequired || '',
      b.mentor || '',
      b.reason || '',
      b.problemStatement || '',
      b.datasetType || '',
      b.rejectionReason || '',
      fmtDate(b.createdAt),
    ];

    values.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.font = font(COLOR.textDark, 10) as ExcelJS.Font;
      cell.fill = solidFill(rowBg);
      cell.alignment = align(ci === 0 ? 'center' : 'left', 'middle', ci >= 12) as ExcelJS.Alignment;
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });

    // Status cell special styling (col 9 = index 8)
    const statusCell = row.getCell(9);
    statusCell.fill = solidFill(sc.bg);
    statusCell.font = font(sc.fg, 10, true) as ExcelJS.Font;
    statusCell.alignment = align('center', 'middle') as ExcelJS.Alignment;

    // GPU cell (col 10)
    if (b.requiresGPU) {
      row.getCell(10).fill = solidFill(COLOR.gpuBg);
      row.getCell(10).font = font(COLOR.gpu, 10, true) as ExcelJS.Font;
      row.getCell(10).alignment = align('center', 'middle') as ExcelJS.Alignment;
    }

    // Serial number cell
    row.getCell(1).font = font(COLOR.textLight, 9) as ExcelJS.Font;
    row.getCell(1).alignment = align('center', 'middle') as ExcelJS.Alignment;
    row.height = 18;
  });
}

/** Sheet 3: User Summary */
function buildUserSheet(wb: ExcelJS.Workbook, periodLabel: string, bookings: Booking[]) {
  const ws = wb.addWorksheet('User Analytics');
  ws.properties.tabColor = { argb: 'FF8B5CF6' };

  const userMap: Record<string, { name: string; email: string; total: number; approved: number; rejected: number; pending: number; cancelled: number; gpu: number; hours: number }> = {};
  bookings.forEach(b => {
    const key = getUserEmail(b) || b._id;
    if (!userMap[key]) userMap[key] = { name: getDisplayName(b), email: getUserEmail(b), total: 0, approved: 0, rejected: 0, pending: 0, cancelled: 0, gpu: 0, hours: 0 };
    userMap[key].total++;
    if (b.status === 'approved' || b.status === 'completed') { userMap[key].approved++; userMap[key].hours += calcHours(b); }
    if (b.status === 'rejected') userMap[key].rejected++;
    if (b.status === 'pending') userMap[key].pending++;
    if (b.status === 'cancelled') userMap[key].cancelled++;
    if (b.requiresGPU) userMap[key].gpu++;
  });

  const users = Object.values(userMap).sort((a, b) => b.total - a.total);
  const headers = ['Rank', 'User Name', 'Email', 'Total Requests', 'Approved', 'Pending', 'Rejected', 'Cancelled', 'GPU Requests', 'Approved Hours'];
  const colWidths = [7, 26, 34, 16, 12, 12, 12, 12, 15, 17];

  writeTitleBlock(ws, `User Analytics  ·  ${periodLabel}`, `${users.length} users · ranked by total requests`, headers.length);
  writeTableHeader(ws, 4, headers, colWidths);
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  // Medals for top 3
  const medals = ['🥇', '🥈', '🥉'];

  users.forEach((u, i) => {
    const row = ws.getRow(5 + i);
    const isAlt = i % 2 === 0;
    const rowBg = i < 3 ? ['FFFDE7', 'F5F5F5', 'FBE9E7'][i] : (isAlt ? COLOR.white : COLOR.offWhite);

    const rankCell = row.getCell(1);
    rankCell.value = i < 3 ? medals[i] : i + 1;
    rankCell.alignment = align('center', 'middle') as ExcelJS.Alignment;
    rankCell.fill = solidFill(rowBg);
    rankCell.font = font(i === 0 ? 'D97706' : COLOR.textDark, i === 0 ? 13 : 10, i < 3) as ExcelJS.Font;

    const cols: (string | number)[] = [u.name, u.email, u.total, u.approved, u.pending, u.rejected, u.cancelled, u.gpu, u.hours];
    const colColors = [COLOR.textDark, COLOR.textMid, COLOR.textDark, COLOR.approved, COLOR.pending, COLOR.rejected, COLOR.cancelled, COLOR.gpu, COLOR.navyLight];

    cols.forEach((v, ci) => {
      const cell = row.getCell(ci + 2);
      cell.value = v;
      cell.fill = solidFill(rowBg);
      cell.font = font(colColors[ci], ci >= 2 ? 11 : 10, ci >= 2 && i < 3) as ExcelJS.Font;
      cell.alignment = align(ci <= 1 ? 'left' : 'center', 'middle') as ExcelJS.Alignment;
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });

    row.height = 20;
  });
}

/** Sheet 4: System Summary */
function buildSystemSheet(wb: ExcelJS.Workbook, periodLabel: string, bookings: Booking[]) {
  const ws = wb.addWorksheet('System Analytics');
  ws.properties.tabColor = { argb: 'FF10B981' };

  const sysMap: Record<string, { name: string; total: number; approved: number; rejected: number; pending: number; cancelled: number; gpu: number; hours: number; users: Set<string> }> = {};
  bookings.forEach(b => {
    const key = b.computerId?._id || 'unknown';
    if (!sysMap[key]) sysMap[key] = { name: b.computerId?.name || 'Unknown', total: 0, approved: 0, rejected: 0, pending: 0, cancelled: 0, gpu: 0, hours: 0, users: new Set() };
    sysMap[key].total++;
    sysMap[key].users.add(getUserEmail(b));
    if (b.status === 'approved' || b.status === 'completed') { sysMap[key].approved++; sysMap[key].hours += calcHours(b); }
    if (b.status === 'rejected') sysMap[key].rejected++;
    if (b.status === 'pending') sysMap[key].pending++;
    if (b.status === 'cancelled') sysMap[key].cancelled++;
    if (b.requiresGPU) sysMap[key].gpu++;
  });

  const systems = Object.values(sysMap).sort((a, b) => b.hours - a.hours);
  const headers = ['Rank', 'System Name', 'Total Bookings', 'Approved', 'Pending', 'Rejected', 'Cancelled', 'GPU Requests', 'Approved Hours', 'Unique Users'];
  const colWidths = [7, 26, 16, 12, 12, 12, 12, 15, 17, 15];

  writeTitleBlock(ws, `System Analytics  ·  ${periodLabel}`, `${systems.length} computers · ranked by approved hours`, headers.length);
  writeTableHeader(ws, 4, headers, colWidths);
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  systems.forEach((s, i) => {
    const row = ws.getRow(5 + i);
    const isAlt = i % 2 === 0;
    // Color rows by utilization intensity
    const maxH = systems[0]?.hours || 1;
    const pct = s.hours / maxH;
    const intensityBg = pct > 0.75 ? 'E0F2FE' : pct > 0.5 ? 'EFF6FF' : pct > 0.25 ? 'F8FAFC' : COLOR.white;
    const rowBg = i % 2 === 0 ? intensityBg : COLOR.white;

    const rankCell = row.getCell(1);
    rankCell.value = i + 1;
    rankCell.fill = solidFill(rowBg);
    rankCell.font = font(COLOR.textMid, 10) as ExcelJS.Font;
    rankCell.alignment = align('center', 'middle') as ExcelJS.Alignment;

    const cols: (string | number)[] = [s.name, s.total, s.approved, s.pending, s.rejected, s.cancelled, s.gpu, s.hours, s.users.size];
    const colColors = [COLOR.textDark, COLOR.textDark, COLOR.approved, COLOR.pending, COLOR.rejected, COLOR.cancelled, COLOR.gpu, COLOR.navyLight, COLOR.accent];

    cols.forEach((v, ci) => {
      const cell = row.getCell(ci + 2);
      cell.value = v;
      cell.fill = solidFill(rowBg);
      cell.font = font(colColors[ci], ci === 0 ? 10 : 11, ci > 0) as ExcelJS.Font;
      cell.alignment = align(ci === 0 ? 'left' : 'center', 'middle') as ExcelJS.Alignment;
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });

    row.height = 20;
  });
}

/** Sheet 5: Monthly Trend */
function buildTrendSheet(wb: ExcelJS.Workbook, allBookings: Booking[]) {
  const ws = wb.addWorksheet('Monthly Trend');
  ws.properties.tabColor = { argb: 'FFF59E0B' };

  const now = new Date();
  const headers = ['Month', 'Total', 'Approved', 'Pending', 'Rejected', 'Cancelled', 'GPU Requests', 'Approval Rate'];
  const colWidths = [22, 12, 12, 12, 12, 12, 15, 15];

  writeTitleBlock(ws, 'Monthly Booking Trend', 'Last 12 months  ·  All-time data', headers.length);
  writeTableHeader(ws, 4, headers, colWidths);
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  const months: { label: string; total: number; approved: number; pending: number; rejected: number; cancelled: number; gpu: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mb = allBookings.filter(b => {
      const bd = new Date(b.createdAt || b.startDate);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
    });
    const app = mb.filter(b => b.status === 'approved' || b.status === 'completed').length;
    const rej = mb.filter(b => b.status === 'rejected').length;
    months.push({
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      total: mb.length,
      approved: app,
      pending:  mb.filter(b => b.status === 'pending').length,
      rejected: rej,
      cancelled: mb.filter(b => b.status === 'cancelled').length,
      gpu: mb.filter(b => b.requiresGPU).length,
    });
  }

  // Max for intensity scaling
  const maxTotal = Math.max(...months.map(m => m.total), 1);

  months.forEach((m, i) => {
    const isCurrentMonth = i === months.length - 1;
    const intensity = m.total / maxTotal;
    // Heat-map coloring: more bookings = deeper blue
    const rowBg = isCurrentMonth
      ? 'FFFDE7' // highlight current month in gold
      : intensity > 0.75 ? 'DBEAFE'
      : intensity > 0.5  ? 'EFF6FF'
      : intensity > 0.25 ? 'F8FAFC'
      : COLOR.white;

    const approvalRate = (m.approved + m.rejected) > 0
      ? `${Math.round((m.approved / (m.approved + m.rejected)) * 100)}%`
      : 'N/A';

    const row = ws.getRow(5 + i);
    const values: (string | number)[] = [m.label, m.total, m.approved, m.pending, m.rejected, m.cancelled, m.gpu, approvalRate];
    const valueColors = [COLOR.textDark, COLOR.textDark, COLOR.approved, COLOR.pending, COLOR.rejected, COLOR.cancelled, COLOR.gpu, COLOR.navyLight];

    values.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.fill = solidFill(rowBg);
      cell.font = font(valueColors[ci], ci === 0 ? 10 : 11, isCurrentMonth || ci > 0) as ExcelJS.Font;
      cell.alignment = align(ci === 0 ? 'left' : 'center', 'middle') as ExcelJS.Alignment;
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });

    // Current month label
    if (isCurrentMonth) {
      const labelCell = row.getCell(1);
      labelCell.value = `★ ${m.label} (Current)`;
      labelCell.font = font('D97706', 10, true) as ExcelJS.Font;
    }

    row.height = 20;
  });
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function buildExcelReport(
  periodLabel: string,
  allBookings: Booking[],
  periodBookings: Booking[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NegcesLab Analytics';
  wb.lastModifiedBy = 'NegcesLab Analytics';
  wb.created = new Date();
  wb.modified = new Date();

  buildSummarySheet(wb, periodLabel, periodBookings);
  buildBookingsSheet(wb, periodLabel, periodBookings);
  buildUserSheet(wb, periodLabel, periodBookings);
  buildSystemSheet(wb, periodLabel, periodBookings);
  buildTrendSheet(wb, allBookings);

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NegcesLab_Analytics_${periodLabel.replace(/[\s/]/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Shared download helper ───────────────────────────────────────────────────

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Per-user focused export ──────────────────────────────────────────────────

export async function exportUserReport(
  userName: string,
  userEmail: string,
  bookings: Booking[],
  kpis: { total: number; approved: number; pending: number; rejected: number; gpu: number; hours: number },
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NegcesLab Analytics';
  wb.created = new Date();

  const ws = wb.addWorksheet('User Report');
  ws.properties.tabColor = { argb: 'FF8B5CF6' };

  const totalCols = 10;
  writeTitleBlock(ws, `User Report  ·  ${userName}`, userEmail, totalCols);

  // KPI row
  writeTableHeader(ws, 4,
    ['Total', 'Approved', 'Pending', 'Rejected', 'GPU Requests', 'Approved Hours', '', '', '', ''],
    Array(totalCols).fill(14));
  const kpiRow = ws.getRow(5);
  kpiRow.height = 24;
  [kpis.total, kpis.approved, kpis.pending, kpis.rejected, kpis.gpu, kpis.hours].forEach((v, i) => {
    const colors2 = [COLOR.textDark, COLOR.approved, COLOR.pending, COLOR.rejected, COLOR.gpu, COLOR.navyLight];
    const cell = kpiRow.getCell(i + 1);
    cell.value = v;
    cell.font = font(colors2[i], 14, true) as ExcelJS.Font;
    cell.fill = solidFill(COLOR.offWhite);
    cell.alignment = align('center', 'middle') as ExcelJS.Alignment;
  });
  ws.getRow(6).height = 8;

  // Records
  const recHeaders = ['#', 'Computer', 'Start Date', 'End Date', 'Time', 'Status', 'GPU?', 'Mentor', 'Reason', 'Requested On'];
  writeTableHeader(ws, 7, recHeaders);
  ws.columns = [5, 22, 14, 14, 16, 14, 8, 20, 35, 16].map((w, i) => ({ key: String(i), width: w }));
  ws.views = [{ state: 'frozen', ySplit: 7 }];

  bookings.forEach((b, i) => {
    const row = ws.getRow(8 + i);
    const sc = statusColors(b.status);
    const rowBg = i % 2 === 0 ? COLOR.white : COLOR.offWhite;
    const vals: (string | number)[] = [
      i + 1, b.computerId?.name || '', fmtDate(b.startDate), fmtDate(b.endDate),
      `${b.startTime || ''}–${b.endTime || ''}`,
      b.status.charAt(0).toUpperCase() + b.status.slice(1),
      b.requiresGPU ? 'Yes' : 'No', b.mentor || '', b.reason || '', fmtDate(b.createdAt),
    ];
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.fill = solidFill(ci === 5 ? sc.bg : rowBg);
      cell.font = font(ci === 5 ? sc.fg : COLOR.textDark, 10, ci === 5) as ExcelJS.Font;
      cell.alignment = align([0, 5, 6].includes(ci) ? 'center' : 'left', 'middle') as ExcelJS.Alignment;
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });
    row.height = 18;
  });

  await downloadWorkbook(wb, `User_${userName.replace(/\s+/g, '_')}_Bookings.xlsx`);
}

// ─── Per-system focused export ────────────────────────────────────────────────

export async function exportSystemReport(
  sysName: string,
  bookings: Booking[],
  kpis: { total: number; approved: number; pending: number; rejected: number; gpu: number; hours: number; uniqueUsers: number },
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NegcesLab Analytics';
  wb.created = new Date();

  const ws = wb.addWorksheet('System Report');
  ws.properties.tabColor = { argb: 'FF10B981' };

  const totalCols = 10;
  writeTitleBlock(ws, `System Report  ·  ${sysName}`, 'All-time booking history for this computer', totalCols);

  writeTableHeader(ws, 4,
    ['Total', 'Approved', 'Pending', 'Rejected', 'GPU Requests', 'Approved Hours', 'Unique Users', '', '', ''],
    Array(totalCols).fill(14));
  const kpiRow = ws.getRow(5);
  kpiRow.height = 24;
  [kpis.total, kpis.approved, kpis.pending, kpis.rejected, kpis.gpu, kpis.hours, kpis.uniqueUsers].forEach((v, i) => {
    const colors2 = [COLOR.textDark, COLOR.approved, COLOR.pending, COLOR.rejected, COLOR.gpu, COLOR.navyLight, COLOR.accent];
    const cell = kpiRow.getCell(i + 1);
    cell.value = v;
    cell.font = font(colors2[i], 14, true) as ExcelJS.Font;
    cell.fill = solidFill(COLOR.offWhite);
    cell.alignment = align('center', 'middle') as ExcelJS.Alignment;
  });
  ws.getRow(6).height = 8;

  const recHeaders = ['#', 'User Name', 'Email', 'Start Date', 'End Date', 'Time', 'Status', 'GPU?', 'Mentor', 'Reason'];
  writeTableHeader(ws, 7, recHeaders);
  ws.columns = [5, 24, 32, 14, 14, 16, 14, 8, 20, 35].map((w, i) => ({ key: String(i), width: w }));
  ws.views = [{ state: 'frozen', ySplit: 7 }];

  bookings.forEach((b, i) => {
    const row = ws.getRow(8 + i);
    const sc = statusColors(b.status);
    const rowBg = i % 2 === 0 ? COLOR.white : COLOR.offWhite;
    const vals: (string | number)[] = [
      i + 1, getDisplayName(b), getUserEmail(b), fmtDate(b.startDate), fmtDate(b.endDate),
      `${b.startTime || ''}–${b.endTime || ''}`,
      b.status.charAt(0).toUpperCase() + b.status.slice(1),
      b.requiresGPU ? 'Yes' : 'No', b.mentor || '', b.reason || '',
    ];
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.fill = solidFill(ci === 6 ? sc.bg : rowBg);
      cell.font = font(ci === 6 ? sc.fg : COLOR.textDark, 10, ci === 6) as ExcelJS.Font;
      cell.alignment = align([0, 6, 7].includes(ci) ? 'center' : 'left', 'middle') as ExcelJS.Alignment;
      cell.border = bottomBorder(COLOR.borderGray) as ExcelJS.Borders;
    });
    row.height = 18;
  });

  await downloadWorkbook(wb, `System_${sysName.replace(/\s+/g, '_')}_Bookings.xlsx`);
}
