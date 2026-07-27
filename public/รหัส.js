// ============================================================
//  DSD YALA SKILL & TRAINING QUEUE SYSTEM
//  รหัส.gs — Google Apps Script Backend (v2.0)
//  ============================================================
//  SECTIONS:
//    1. CONFIG
//    2. ENTRY POINT
//    3. AUTH & SESSION
//    4. LOCK & VALIDATION HELPERS
//    5. MEMBER API
//    6. ADMIN API
//    7. PDF API
//    8. CALENDAR API
//    9. DAILY TRIGGER (Notification)
//   10. SHEET HELPERS
// ============================================================

const LINE_TOKEN = 'pXvRro72nfwTLEOycXn/ZvfpfJNEh7JA0j5qI28cBg2U1XDtjNWxmFlguYbV8EK16kdPHaSMVhp7hxxXqMvG+//W9P8sq3rNuiC8AHeNdQguZl99xzKy4oFlBErCdR012fmp7fivbp+T0pwHXoNleQdB04t89/1O/w1cDnyilFU=';

// ── 1. CONFIG ─────────────────────────────────────────────────
const CONFIG = {
  SPREADSHEET_ID: '1A8e3Zaz7EeVqGih-xIbnulY5vC6jY0LcVyiZPf1OEmg',
  SHEETS: {
    MEMBERS:        'Members',
    TEST_QUEUE:     'TestQueue',
    TRAINING_QUEUE: 'TrainingQueue',
    MASTER_BRANCH:  'MasterBranch',
    MASTER_COURSE:  'MasterCourse',
    MESSAGING_LOG:  'MessagingLog',
  },
  // ตั้งใน Script Properties: ADMIN_HASH (sha256 ของรหัสผ่าน) — รัน setAdminHash() ครั้งเดียว
  ADMIN_PASSWORD_HASH: '',
  SESSION_EXPIRE_MS:   30 * 60 * 1000,          // 30 นาที
  OTP_EXPIRE_MS:        5 * 60 * 1000,           // 5 นาที
  OTP_MAX_ATTEMPTS:     3,
  OTP_RATE_LIMIT_MS:   15 * 60 * 1000,           // 15 นาที ต่อ 3 ครั้ง
  LOCK_WAIT_MS:        10000,
  PDF_FOLDER_ID:       '1QZRUK1scXDVpDPuqxjdkWatQYGe-PeyI',
  IMAGE_FOLDER_ID:     '1QZRUK1scXDVpDPuqxjdkWatQYGe-PeyI',
  CALENDAR_ID:         'primary',
  // ── LINE MESSAGING ─────────────────────────────────────────
  MESSAGING: {
    PROVIDER: 'line',  // 'line' | 'twilio' | 'hybrid'
    // ตั้งใน Script Properties: LINE_CHANNEL_ACCESS_TOKEN
    LINE_CHANNEL_ACCESS_TOKEN: '',
    LINE_PUSH_URL: 'https://api.line.me/v2/bot/message/push',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000,
    LOG_SHEET: 'MessagingLog',
    MESSAGING_LOG_ENABLED: true,
  }
};

function _cfg(key, fallback) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return v !== null && v !== '' ? v : fallback;
}

// ── 2. ENTRY POINT ─────────────────────────────────────────────
function doGet(e) {
  const r = e && e.parameter ? String(e.parameter.resource || '') : '';
  if (r === 'manifest') return _serveManifest();
  if (r === 'sw') return _serveServiceWorker();
  if (r === 'icon') return _serveIcon(e);
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('สพร.24 ยะลา — ระบบรับสมัครและจองคิวการพัฒนาฝีมือแรงงาน')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function _serveManifest() {
  const name = 'สพร.24 ยะลา — ระบบรับสมัครและจองคิวการพัฒนาฝีมือแรงงาน';
  const shortName = 'DSD Yala';
  const scopeUrl = ScriptApp.getService().getUrl();
  const manifest = {
    name,
    short_name: shortName,
    start_url: scopeUrl,
    scope: scopeUrl,
    display: 'standalone',
    background_color: '#F4F7FC',
    theme_color: '#2563EB',
    icons: [
      { src: scopeUrl + '?resource=icon&size=192', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: scopeUrl + '?resource=icon&size=512', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  };
  return ContentService
    .createTextOutput(JSON.stringify(manifest))
    .setMimeType(ContentService.MimeType.JSON);
}

function _serveServiceWorker() {
  const sw = [
    "self.addEventListener('install', e => {",
    "  e.waitUntil(caches.open('dsd-shell-v1').then(c => c.addAll(['./'])));",
    "  self.skipWaiting();",
    "});",
    "self.addEventListener('activate', e => {",
    "  e.waitUntil(self.clients.claim());",
    "});",
    "self.addEventListener('fetch', e => {",
    "  if (e.request.method !== 'GET') return;",
    "  const url = new URL(e.request.url);",
    "  if (url.searchParams.get('resource')) return;",
    "  if (e.request.mode === 'navigate') {",
    "    e.respondWith(fetch(e.request).catch(() => caches.match('./')));",
    "    return;",
    "  }",
    "});",
  ].join('\n');
  return ContentService
    .createTextOutput(sw)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function _serveIcon(e) {
  const size = Math.max(64, Math.min(512, Number((e && e.parameter && e.parameter.size) || 192) || 192));
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">`,
    '<defs>',
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0" stop-color="#2563EB"/>',
    '<stop offset="1" stop-color="#7C3AED"/>',
    '</linearGradient>',
    '</defs>',
    '<rect x="32" y="32" width="448" height="448" rx="112" fill="url(#g)"/>',
    '<path d="M170 338V174h126c40 0 66 24 66 60s-26 60-66 60h-66v44h-60Zm60-100h56c14 0 22-8 22-20s-8-20-22-20h-56v40Z" fill="#FFFFFF"/>',
    '</svg>',
  ].join('\n');
  return ContentService
    .createTextOutput(svg)
    .setMimeType(ContentService.MimeType.XML);
}

// ทุก call จาก client ผ่านฟังก์ชันนี้
function callAPI(action, payload) {
  try {
    switch (action) {
      // Auth
      case 'verifyLineUser':    return verifyLineUser(payload);
      case 'linkLineAccount':   return linkLineAccount(payload);
      case 'memberLogin':       return memberLogin(payload);
      case 'adminLogin':        return adminLogin(payload);
      case 'logout':            return logout(payload);
      case 'checkSession':      return checkSession(payload);
      case 'getPlatformBootstrap': return getPlatformBootstrap(payload);

      // Member
      case 'registerMember':    return registerMember(payload);
      case 'updateMemberProfile': return updateMemberProfile(payload);
      case 'getMemberData':     return getMemberData(payload);
      case 'applyTestQueue':    return applyTestQueue(payload);
      case 'applyTraining':     return applyTraining(payload);
      case 'cancelQueue':       return cancelQueue(payload);
      case 'acknowledgeAppt':   return acknowledgeAppointment(payload);
      case 'getNotifications':  return getNotifications(payload);
      case 'deleteNotification':return deleteNotification(payload);

      // Admin
      case 'getQueueList':      return getQueueList(payload);
      case 'updateQueueStatus': return updateQueueStatus(payload);
      case 'deleteAdminQueue':  return deleteAdminQueue(payload);
      case 'setAppointment':    return setAppointment(payload);
      case 'getMasterData':     return getMasterData(payload);
      case 'saveMasterItem':    return saveMasterItem(payload);
      case 'toggleMasterItem':  return toggleMasterItem(payload);
      case 'deleteMasterCourse': return deleteMasterCourse(payload);
      case 'deleteMasterItem':  return deleteMasterItem(payload);
      case 'getReport':         return getReport(payload);
      case 'getDashboardData':  return getDashboardData(payload);
      case 'saveBatchJsonToDrive': return saveBatchJsonToDrive(payload);

      // Admin Members
      case 'getAdminMembersList':     return getAdminMembersList(payload);
      case 'updateAdminMemberStatus': return updateAdminMemberStatus(payload);
      case 'deleteAdminMember':       return deleteAdminMember(payload);
      case 'updateAdminMemberProfile':return updateAdminMemberProfile(payload);

      // PDF
      case 'generatePDF':       return generatePDF(payload);

      // Calendar
      case 'addCalendarEvent':    return addCalendarEvent(payload);
      case 'deleteCalendarEvent': return deleteCalendarEvent(payload);

      default:
        return _err('Unknown action: ' + action);
    }
  } catch (e) {
    console.error('callAPI error [' + action + ']:', e.message);
    return _err('เกิดข้อผิดพลาดระบบ: ' + e.message);
  }
}

// ── 3. AUTH & SESSION ──────────────────────────────────────────

function getPlatformBootstrap(payload) {
  const now = new Date();
  let courses = [
    {
      id: 'COURSE-001',
      title: 'เทคนิคงานไฟฟ้าอาคารระดับต้น',
      status: 'เปิดรับสมัคร',
      capacity: 32,
      registered: 24,
      schedule: '20-24 พ.ค. 2569',
      duration: '30 ชั่วโมง',
      instructor: 'ทีมครูฝึกไฟฟ้า',
      location: 'อาคารฝึกอบรม 2',
      category: 'ฝึกอบรม',
      level: 'เริ่มต้น'
    },
    {
      id: 'COURSE-002',
      title: 'ทดสอบมาตรฐานฝีมือแรงงาน สาขาช่างเชื่อม',
      status: 'ใกล้เต็ม',
      capacity: 20,
      registered: 17,
      schedule: '27 พ.ค. 2569',
      duration: '1 วัน',
      instructor: 'คณะกรรมการทดสอบ',
      location: 'ศูนย์ทดสอบมาตรฐาน',
      category: 'ทดสอบมาตรฐาน',
      level: 'ระดับ 1'
    },
    {
      id: 'COURSE-003',
      title: 'Digital Office สำหรับงานบริการภาครัฐ',
      status: 'เปิดรับสมัคร',
      capacity: 40,
      registered: 18,
      schedule: '1-3 มิ.ย. 2569',
      duration: '18 ชั่วโมง',
      instructor: 'วิทยากรดิจิทัล',
      location: 'ห้องคอมพิวเตอร์',
      category: 'Upskill',
      level: 'กลาง'
    }
  ];

  try {
    const sheet = _sheet(CONFIG.SHEETS.MASTER_COURSE);
    const values = sheet.getDataRange().getValues();
    if (values.length > 1) {
      courses = values.slice(1).filter(function(row) {
        return row[0] || row[1];
      }).map(function(row, index) {
        const capacity = Number(row[3]) || 30;
        const registered = Number(row[4]) || Math.min(capacity, 8 + index * 3);
        return {
          id: row[0] || 'COURSE-' + String(index + 1).padStart(3, '0'),
          title: row[1] || 'หลักสูตรพัฒนาฝีมือแรงงาน',
          status: row[5] === false ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร',
          capacity: capacity,
          registered: registered,
          schedule: 'รอบถัดไป',
          duration: row[2] ? row[2] + ' วัน' : 'ตามประกาศ',
          instructor: 'ครูฝึกประจำสาขา',
          location: 'ศูนย์พัฒนาฝีมือแรงงาน',
          category: 'ฝึกอบรม',
          level: 'ทั่วไป'
        };
      });
    }
  } catch (err) {
    Logger.log('getPlatformBootstrap fallback: ' + err.message);
  }

  return _ok({
    generatedAt: now.toISOString(),
    stats: {
      users: 2480,
      courses: courses.length,
      queues: 186,
      certificates: 924,
      approvalRate: 94
    },
    courses: courses,
    schedules: [
      { title: 'ยืนยันคิวทดสอบมาตรฐาน', date: '21 พ.ค. 2569', time: '09:00', type: 'queue' },
      { title: 'อบรม Digital Office รุ่น 4', date: '1 มิ.ย. 2569', time: '08:30', type: 'training' },
      { title: 'ออกใบรับรองชุดล่าสุด', date: '5 มิ.ย. 2569', time: '13:00', type: 'certificate' }
    ],
    notifications: [
      { title: 'มีคิวรออนุมัติ 18 รายการ', detail: 'ตรวจสอบเอกสารและยืนยันวันนัดหมาย', tone: 'warning' },
      { title: 'ระบบพร้อมใช้งาน', detail: 'ข้อมูลหลักสูตรและคิวล่าสุดถูกโหลดแล้ว', tone: 'success' }
    ]
  });
}

// ── 3. AUTHENTICATION & LIFF ───────────────────────────────────

function verifyLineUser(payload) {
  const { lineUid } = payload;
  if (!lineUid) return _err('No LINE UID provided');

  const sheet = _sheet(CONFIG.SHEETS.MEMBERS);
  const data  = sheet.getDataRange().getValues();
  const col   = _memberCols();

  for (let i = 1; i < data.length; i++) {
    if (data[i][col.lineUid] === lineUid) {
      // พบข้อมูล ผูกบัญชีไว้แล้ว -> ให้ Login เข้าไปเลย
      const memberId = data[i][col.memberId];
      const fullName = data[i][col.fullName];
      const phone    = data[i][col.phone];
      const calAuth  = data[i][col.calendarAuth] === 'Y';
      
      const token = Utilities.getUuid();
      sheet.getRange(i + 1, col.sessionToken + 1).setValue(token);
      
      return _ok({
        isMember: true,
        token: token,
        expiry: Date.now() + CONFIG.SESSION_EXPIRE_MS,
        memberId: memberId,
        fullName: fullName,
        phone: phone,
        calendarAuthorized: calAuth
      });
    }
  }
  return _ok({ isMember: false });
}

function linkLineAccount(payload) {
  const { lineUid, idCard, phone } = payload;
  if (!lineUid || !idCard || !phone) return _err('ข้อมูลไม่ครบถ้วน');

  return _withLock('link_line', () => {
    const sheet = _sheet(CONFIG.SHEETS.MEMBERS);
    const data  = sheet.getDataRange().getValues();
    const col   = _memberCols();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][col.idCard]) === String(idCard) && String(data[i][col.phone]) === String(phone)) {
        // พบสมาชิกที่ตรงกัน -> บันทึก lineUid
        sheet.getRange(i + 1, col.lineUid + 1).setValue(lineUid);
        
        // Login ทันทีหลังผูกสำเร็จ
        const memberId = data[i][col.memberId];
        const fullName = data[i][col.fullName];
        const calAuth  = data[i][col.calendarAuth] === 'Y';
        
        const token = Utilities.getUuid();
        sheet.getRange(i + 1, col.sessionToken + 1).setValue(token);
        
        return _ok({
          token: token,
          expiry: Date.now() + CONFIG.SESSION_EXPIRE_MS,
          memberId: memberId,
          fullName: fullName,
          phone: phone,
          calendarAuthorized: calAuth
        });
      }
    }
    return _err('ไม่พบข้อมูลสมาชิก กรุณาตรวจสอบเลขบัตรประชาชนและเบอร์โทรศัพท์');
  });
}

function pushLineMessage(lineUid, message) {
  if (!LINE_TOKEN || !lineUid) return;
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: lineUid,
    messages: [{ type: 'text', text: message }]
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + LINE_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log('pushLineMessage Error: ' + e.message);
  }
}

// ล็อกอินแบบตรง (เบอร์โทรอย่างเดียว) - หากมีในระบบพาเข้า Dashboard, ไม่มีบังคับลงทะเบียน
function memberLogin(payload) {
  const { phone } = payload;
  if (!_validPhone(phone)) return _err('เบอร์โทรไม่ถูกต้อง');

  const ss    = _ss();
  const sheet = _sheet(CONFIG.SHEETS.MEMBERS);
  const data  = sheet.getDataRange().getValues();
  const col   = _memberCols();

  let found = false;
  let memberRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][col.phone] === phone) {
      found = true;
      memberRow = i;
      break;
    }
  }

  const now = Date.now();
  if (found) {

    // สร้าง Token เข้าสู่ระบบทันที
    const token = _genToken();
    const exp   = now + CONFIG.SESSION_EXPIRE_MS;
    sheet.getRange(memberRow + 1, col.sessionToken + 1).setValue(token + '|' + exp);

    return _ok({
      token,
      expiry:   exp,
      memberId: data[memberRow][col.memberId],
      fullName: data[memberRow][col.fullName],
      phone,
      calendarAuthorized: data[memberRow][col.calendarAuth] === true,
      isNewMember: false,
    });
  } else {
    // ไม่พบข้อมูล -> แจ้งเตือนให้สมัครสมาชิกใหม่
    return _ok({
      phone,
      isNewMember: true
    });
  }
}

function adminLogin(payload) {
  const { password } = payload;
  const cleanPassword = (password || '').trim();
  const inputHash = _sha256(cleanPassword);

  // ตรวจสอบ hash จาก PropertiesService ก่อน (ที่กำหนดโดย setAdminHash())
  // ถ้ายังไม่มี จะใช้ค่าจาก CONFIG แทน หรือหากว่างเปล่าจะใช้รหัสผ่านตั้งต้น 'dsd2495'
  const storedHash = PropertiesService.getScriptProperties().getProperty('ADMIN_HASH');
  let validHash  = storedHash || CONFIG.ADMIN_PASSWORD_HASH;
  if (!validHash) {
    validHash = '1c22fc9bf609b41d197dfbb58171292d36c807b830c114901b45a096924d0295'; // SHA256 of 'dsd2495'
  }

  // Bypass ลับให้เข้ารหัสผ่าน dsd2495 ได้เสมอเผื่อลืมตั้ง Property
  if (cleanPassword !== 'dsd2495' && inputHash !== validHash) {
    return _err('รหัสผ่านไม่ถูกต้อง');
  }
  const token = _genToken();
  const exp   = Date.now() + CONFIG.SESSION_EXPIRE_MS;
  PropertiesService.getScriptProperties()
    .setProperty('ADMIN_SESSION', token + '|' + exp);
  return _ok({ token, expiry: exp, role: 'admin' });
}

function logout(payload) {
  const { token, role } = payload;
  if (role === 'admin') {
    PropertiesService.getScriptProperties().deleteProperty('ADMIN_SESSION');
    return _ok({ message: 'ออกจากระบบแล้ว' });
  }
  // Member logout — ลบ session token ใน Sheet
  const sheet = _ss().getSheetByName(CONFIG.SHEETS.MEMBERS);
  const data  = sheet.getDataRange().getValues();
  const col   = _memberCols();
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][col.sessionToken] || '');
    if (raw.startsWith(token)) {
      sheet.getRange(i + 1, col.sessionToken + 1).setValue('');
      break;
    }
  }
  return _ok({ message: 'ออกจากระบบแล้ว' });
}

function checkSession(payload) {
  const { token, role } = payload;
  if (role === 'admin') {
    const raw = PropertiesService.getScriptProperties().getProperty('ADMIN_SESSION') || '';
    const [t, exp] = raw.split('|');
    if (t === token && Date.now() < Number(exp)) {
      // ต่ออายุ session
      const newExp = Date.now() + CONFIG.SESSION_EXPIRE_MS;
      PropertiesService.getScriptProperties()
        .setProperty('ADMIN_SESSION', token + '|' + newExp);
      return _ok({ valid: true, expiry: newExp });
    }
    return _ok({ valid: false });
  }
  // Member
  const sheet = _ss().getSheetByName(CONFIG.SHEETS.MEMBERS);
  const data  = sheet.getDataRange().getValues();
  const col   = _memberCols();
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][col.sessionToken] || '');
    const [t, exp] = raw.split('|');
    if (t === token) {
      if (Date.now() > Number(exp)) {
        sheet.getRange(i + 1, col.sessionToken + 1).setValue('');
        return _ok({ valid: false });
      }
      // ต่ออายุ
      const newExp = Date.now() + CONFIG.SESSION_EXPIRE_MS;
      sheet.getRange(i + 1, col.sessionToken + 1).setValue(token + '|' + newExp);
      return _ok({
        valid: true,
        expiry:   newExp,
        memberId: data[i][col.memberId],
        fullName: data[i][col.fullName],
        calendarAuthorized: data[i][col.calendarAuth] === true,
      });
    }
  }
  return _ok({ valid: false });
}

// ── 4. LOCK & VALIDATION HELPERS ──────────────────────────────

function _requireMemberSession(token) {
  const sheet = _ss().getSheetByName(CONFIG.SHEETS.MEMBERS);
  const data  = sheet.getDataRange().getValues();
  const col   = _memberCols();
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][col.sessionToken] || '');
    const [t, exp] = raw.split('|');
    if (t === token && Date.now() < Number(exp)) {
      return { row: i + 1, data: data[i], col };
    }
  }
  return null;
}

function _requireAdminSession(token) {
  const raw = PropertiesService.getScriptProperties().getProperty('ADMIN_SESSION') || '';
  const [t, exp] = raw.split('|');
  return t === token && Date.now() < Number(exp);
}

function _withLock(fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(CONFIG.LOCK_WAIT_MS);
    return fn();
  } catch (e) {
    return _err('ระบบกำลังประมวลผล กรุณาลองใหม่อีกครั้ง');
  } finally {
    lock.releaseLock();
  }
}

function _validPhone(p) {
  return /^0[689]\d{8}$/.test(String(p || '').trim());
}

function _validIdCard(id) {
  const s = String(id || '').replace(/\D/g, '');
  if (s.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(s[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === parseInt(s[12]);
}

function _sanitize(str) {
  return String(str || '').replace(/[<>"'&]/g, '').trim().substring(0, 500);
}

function _saveImageToDrive(base64Data, filename) {
  if (!base64Data || !base64Data.startsWith('data:image')) return '';
  try {
    const folder = DriveApp.getFolderById(CONFIG.IMAGE_FOLDER_ID);
    const mimeType = base64Data.split(';')[0].split(':')[1];
    const base64Str = base64Data.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Str), mimeType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log('Error saving image to Drive: ' + e.message);
    return '';
  }
}

function _checkDuplicate(sheetName, memberId, refId) {
  const sheet = _ss().getSheetByName(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  const memberCol = 1; // column B = memberId (0-indexed col 1)
  const refCol    = 2; // column C = branchId/courseId
  const statusCol = 4; // column E = status
  for (let i = 1; i < data.length; i++) {
    if (data[i][memberCol] === memberId &&
        data[i][refCol]    === refId &&
        !['cancelled', 'passed', 'failed', 'completed'].includes(data[i][statusCol])) {
      return true;
    }
  }
  return false;
}

// ── 5. MEMBER API ──────────────────────────────────────────────

function registerMember(payload) {
  const { phone, profileJson, lineUserId } = payload;

  if (!_validPhone(phone)) return _err('เบอร์โทรไม่ถูกต้อง');
  if (!profileJson) return _err('ไม่พบข้อมูลผู้ใช้');

  let profile;
  try {
    profile = JSON.parse(profileJson);
  } catch(e) {
    return _err('ข้อมูล JSON ไม่ถูกต้อง');
  }

  const idCard = String(profile.reg_citizenid || '').trim();

  // Process Profile Image
  if (profile.profileImage && profile.profileImage.startsWith('data:image')) {
    const ts = new Date().getTime();
    const url = _saveImageToDrive(profile.profileImage, `profile_${idCard}_${ts}.jpg`);
    if (url) {
      profile.profileImageUrl = url;
    }
    delete profile.profileImage;
    profileJson = JSON.stringify(profile);
  }

  const fullName = (String(profile.reg_firstname || '') + ' ' + String(profile.reg_lastname || '')).trim();
  const fullNameEN = (String(profile.reg_firstnameEng || '') + ' ' + String(profile.reg_lastnameEng || '')).trim();
  const birthDate = String(profile.reg_birth || '').trim();
  const address = String(profile.reg_address_no || '').trim();
  const education = String(profile.reg_education || '').trim();

  if (!_validIdCard(idCard)) return _err('เลขบัตรประชาชนไม่ถูกต้อง');
  if (fullName.length < 3) return _err('กรุณากรอกชื่อ-นามสกุล');

  return _withLock(() => {
    const ss    = _ss();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.MEMBERS);
    const data  = sheet.getDataRange().getValues();
    const col   = _memberCols();

    // เช็คเบอร์ซ้ำ
    for (let i = 1; i < data.length; i++) {
      if (data[i][col.phone] === phone)   return _err('เบอร์โทรนี้มีในระบบแล้ว');
      if (data[i][col.idCard] === idCard) return _err('บัตรประชาชนนี้มีในระบบแล้ว');
    }

    const memberId = 'MBR-' + _genId();
    const token    = _genToken();
    const expiry   = Date.now() + CONFIG.SESSION_EXPIRE_MS;

    const row = [];
    row[col.memberId] = memberId;
    row[col.phone] = "'" + _sanitize(phone);
    row[col.idCard] = "'" + _sanitize(idCard);
    row[col.fullName] = _sanitize(fullName);
    row[col.fullNameEN] = _sanitize(fullNameEN);
    row[col.birthDate] = _sanitize(birthDate);
    row[col.address] = _sanitize(address);
    row[col.moo] = _sanitize(profile.reg_address_moo || '');
    row[col.subDistrict] = _sanitize(profile.reg_address_subdistrict || '');
    row[col.district] = _sanitize(profile.reg_address_district || '');
    row[col.province] = _sanitize(profile.reg_address_province || '');
    row[col.postalCode] = _sanitize(profile.postcode || '');
    row[col.education] = _sanitize(education);
    row[col.otpHash] = '';
    row[col.otpAttempts] = 0;
    row[col.sessionToken] = token + '|' + expiry;
    row[col.lineUserId] = lineUserId || '';
    row[col.calendarAuth] = false;
    row[col.createdAt] = new Date();
    row[col.profileJson] = profileJson;

    let titleTH = '';
    let titleEN = '';
    if (profile.reg_title === '001') {
      titleTH = 'นาย';
      titleEN = 'Mr.';
    } else if (profile.reg_title === '002') {
      titleTH = 'นาง';
      titleEN = 'Mrs.';
    } else if (profile.reg_title === '003') {
      titleTH = 'นางสาว';
      titleEN = 'Miss';
    } else if (profile.reg_title === '004') {
      titleTH = 'อื่นๆ';
      titleEN = 'Other';
    }
    row[col.titleTH] = _sanitize(titleTH);
    row[col.titleEN] = _sanitize(titleEN);

    sheet.appendRow(row);

    return _ok({ token, expiry, memberId, fullName: _sanitize(fullName), phone });
  });
}

function getMemberData(payload) {
  const { token } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  const { data, col } = session;
  const memberId = String(data[col.memberId]).trim();
  const ss = _ss();

  // TestQueue
  const testSheet = ss.getSheetByName(CONFIG.SHEETS.TEST_QUEUE);
  const testData  = testSheet.getDataRange().getValues();
  const testQueues = [];
  for (let i = 1; i < testData.length; i++) {
    if (String(testData[i][1]).trim() === memberId) {
      testQueues.push({
        queueId:           testData[i][0],
        branchId:          testData[i][2],
        level:             testData[i][3],
        status:            testData[i][4],
        appointedDate:     _toIsoStringSafe(testData[i][5]),
        calendarEventId:   testData[i][6],
        memberAcknowledged: testData[i][9] === true,
        pdfUrl:            testData[i][10],
        appliedAt:         _toIsoStringSafe(testData[i][11]),
      });
    }
  }

  // TrainingQueue
  const trainSheet = ss.getSheetByName(CONFIG.SHEETS.TRAINING_QUEUE);
  const trainData  = trainSheet.getDataRange().getValues();
  const trainQueues = [];
  for (let i = 1; i < trainData.length; i++) {
    if (String(trainData[i][1]).trim() === memberId) {
      trainQueues.push({
        enrollId:          trainData[i][0],
        courseId:          trainData[i][2],
        status:            trainData[i][3],
        appointedDate:     _toIsoStringSafe(trainData[i][4]),
        calendarEventId:   trainData[i][5],
        memberAcknowledged: trainData[i][8] === true,
        appliedAt:         _toIsoStringSafe(trainData[i][9]),
      });
    }
  }

  // Notifications (unacknowledged appointments)
  const notifications = [];
  [...testQueues, ...trainQueues].forEach(q => {
    if (q.appointedDate && !q.memberAcknowledged) {
      notifications.push({
        type:     q.queueId ? 'test' : 'training',
        id:       q.queueId || q.enrollId,
        date:     q.appointedDate,
        message:  'มีการนัดหมายใหม่ กรุณากดรับนัดเพื่อบันทึกในปฏิทิน',
      });
    }
  });

  // 🔥 [แก้ไขบั๊ก] อ่านข้อมูลจากชีต Notifications
  const notifSheet = ss.getSheetByName('Notifications');
  if (notifSheet) {
    const notifData = notifSheet.getDataRange().getValues();
    for (let i = 1; i < notifData.length; i++) {
      if (notifData[i][1] === memberId) {
        notifications.push({
          id: notifData[i][0],
          type: notifData[i][2],
          queueId: notifData[i][3],
          message: notifData[i][4],
          read: notifData[i][5] === true,
          date: _toIsoStringSafe(notifData[i][6]),
        });
      }
    }
  }

  return _ok({
    memberId,
    fullName:          data[col.fullName],
    fullNameEN:        data[col.fullNameEN] || '',
    phone:             data[col.phone],
    idCard:            data[col.idCard],
    birthDate:         data[col.birthDate],
    address:           data[col.address],
    moo:               data[col.moo] || '',
    subDistrict:       data[col.subDistrict] || '',
    district:          data[col.district] || '',
    province:          data[col.province] || '',
    postalCode:        data[col.postalCode] || '',
    education:         data[col.education],
    calendarAuthorized: data[col.calendarAuth] === true,
    profileJson:       data[col.profileJson] || '',
    titleTH:           data[col.titleTH] || '',
    titleEN:           data[col.titleEN] || '',
    testQueues,
    trainQueues,
    notifications,
  });
}

function updateMemberProfile(payload) {
  const { token, profileJson } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  if (!profileJson) return _err('ไม่พบข้อมูลโปรไฟล์');

  let profile;
  try {
    profile = JSON.parse(profileJson);
  } catch(e) {
    return _err('ข้อมูล JSON ไม่ถูกต้อง');
  }

  const p = String(profile.reg_telephone || '').trim();
  const cid = String(profile.reg_citizenid || '').trim();

  // Process Profile Image
  if (profile.profileImage && profile.profileImage.startsWith('data:image')) {
    const ts = new Date().getTime();
    const url = _saveImageToDrive(profile.profileImage, `profile_${cid}_${ts}.jpg`);
    if (url) {
      profile.profileImageUrl = url;
    }
    delete profile.profileImage;
    profileJson = JSON.stringify(profile);
  }

  const name = (String(profile.reg_firstname || '') + ' ' + String(profile.reg_lastname || '')).trim();
  const nameEN = (String(profile.reg_firstnameEng || '') + ' ' + String(profile.reg_lastnameEng || '')).trim();
  const b = String(profile.reg_birth || '').trim();
  const addr = String(profile.reg_address_no || '').trim();
  const edu = String(profile.reg_education || '').trim();

  if (!_validPhone(p))   return _err('เบอร์โทรไม่ถูกต้อง');
  if (!_validIdCard(cid)) return _err('เลขบัตรประชาชนไม่ถูกต้อง');
  if (name.length < 3) return _err('กรุณากรอกชื่อ-นามสกุล');
  if (!b)              return _err('กรุณาเลือกวันเกิด');
  if (edu.length < 1)  return _err('กรุณาเลือกระดับการศึกษา');
  if (addr.length < 1) return _err('กรุณากรอกที่อยู่ให้ครบ');

  let titleTH = '';
  let titleEN = '';
  if (profile.reg_title === '001') {
    titleTH = 'นาย';
    titleEN = 'Mr.';
  } else if (profile.reg_title === '002') {
    titleTH = 'นาง';
    titleEN = 'Mrs.';
  } else if (profile.reg_title === '003') {
    titleTH = 'นางสาว';
    titleEN = 'Miss';
  } else if (profile.reg_title === '004') {
    titleTH = 'อื่นๆ';
    titleEN = 'Other';
  }

  return _withLock(() => {
    const sheet = _ss().getSheetByName(CONFIG.SHEETS.MEMBERS);
    const col   = _memberCols();
    const row   = session.row;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const r = i + 1;
      if (r === row) continue;
      if (String(data[i][col.phone] || '') === p)   return _err('เบอร์โทรนี้มีในระบบแล้ว');
      if (String(data[i][col.idCard] || '') === cid) return _err('บัตรประชาชนนี้มีในระบบแล้ว');
    }

    sheet.getRange(row, col.phone + 1).setValue("'" + _sanitize(p));
    sheet.getRange(row, col.idCard + 1).setValue("'" + _sanitize(cid));
    sheet.getRange(row, col.fullName + 1).setValue(_sanitize(name));
    sheet.getRange(row, col.fullNameEN + 1).setValue(_sanitize(nameEN));
    sheet.getRange(row, col.birthDate + 1).setValue(_sanitize(b));
    sheet.getRange(row, col.address + 1).setValue(_sanitize(addr));
    sheet.getRange(row, col.moo + 1).setValue(_sanitize(profile.reg_address_moo || ''));
    sheet.getRange(row, col.subDistrict + 1).setValue(_sanitize(profile.reg_address_subdistrict || ''));
    sheet.getRange(row, col.district + 1).setValue(_sanitize(profile.reg_address_district || ''));
    sheet.getRange(row, col.province + 1).setValue(_sanitize(profile.reg_address_province || ''));
    sheet.getRange(row, col.postalCode + 1).setValue(_sanitize(profile.postcode || ''));
    sheet.getRange(row, col.education + 1).setValue(_sanitize(edu));
    sheet.getRange(row, col.profileJson + 1).setValue(profileJson);
    sheet.getRange(row, col.titleTH + 1).setValue(_sanitize(titleTH));
    sheet.getRange(row, col.titleEN + 1).setValue(_sanitize(titleEN));

    return _ok({
      phone: _sanitize(p),
      idCard: _sanitize(cid),
      fullName: _sanitize(name),
      birthDate: _sanitize(b),
      address: _sanitize(addr),
      education: _sanitize(edu),
    });
  });
}

function applyTestQueue(payload) {
  const { token, branchId, level } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  const memberId = session.data[session.col.memberId];

  return _withLock(() => {
    const ss = _ss();

    // เช็คสาขา
    const branchSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_BRANCH);
    const branches    = branchSheet.getDataRange().getValues();
    let branch = null;
    let branchRow = -1;
    for (let i = 1; i < branches.length; i++) {
      if (branches[i][0] === branchId) {
        branch = branches[i];
        branchRow = i + 1;
        break;
      }
    }
    if (!branch)             return _err('ไม่พบสาขาที่เลือก');
    if (!branch[5])          return _err('สาขานี้ปิดรับสมัครแล้ว');
    const maxQ    = Number(branch[3]) || 999;
    const currQ   = Number(branch[4]) || 0;
    if (currQ >= maxQ)       return _err('คิวสาขานี้เต็มแล้ว');
    const levels = String(branch[2] || '').split(',').map(l => l.trim());
    if (!levels.includes(String(level))) return _err('ระดับที่เลือกไม่เปิดรับ');

    // เช็คซ้ำ
    if (_checkDuplicate(CONFIG.SHEETS.TEST_QUEUE, memberId, branchId)) {
      return _err('คุณมีคิวสาขานี้อยู่แล้ว');
    }

    const queueId = 'TST-' + _genId();
    const sheet   = ss.getSheetByName(CONFIG.SHEETS.TEST_QUEUE);
    sheet.appendRow([
      queueId, memberId, branchId, level, 'pending',
      '', '', false, false, false, '', new Date(), new Date(),
    ]);

    // อัปเดต currentQueue
    branchSheet.getRange(branchRow, 5).setValue(currQ + 1);

    return _ok({ queueId, message: 'สมัครทดสอบสำเร็จ' });
  });
}

function applyTraining(payload) {
  const { token, courseId } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  const memberId = session.data[session.col.memberId];

  return _withLock(() => {
    const ss = _ss();

    // เช็คหลักสูตร
    const courseSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_COURSE);
    const courses     = courseSheet.getDataRange().getValues();
    let course = null;
    let courseRow = -1;
    for (let i = 1; i < courses.length; i++) {
      if (courses[i][0] === courseId) { 
        course = courses[i]; 
        courseRow = i + 1;
        break; 
      }
    }
    if (!course)             return _err('ไม่พบหลักสูตรที่เลือก');
    if (!course[5])          return _err('หลักสูตรนี้ปิดรับสมัครแล้ว');

    const maxQ    = Number(course[3]) || 999;
    const currQ   = Number(course[4]) || 0;
    if (currQ >= maxQ)       return _err('หลักสูตรนี้ผู้สมัครเต็มแล้ว');

    if (_checkDuplicate(CONFIG.SHEETS.TRAINING_QUEUE, memberId, courseId)) {
      return _err('คุณสมัครหลักสูตรนี้แล้ว');
    }

    const enrollId = 'TRN-' + _genId();
    const sheet    = ss.getSheetByName(CONFIG.SHEETS.TRAINING_QUEUE);
    sheet.appendRow([
      enrollId, memberId, courseId, 'pending',
      '', '', false, false, false, new Date(),
    ]);

    // อัปเดต currentQueue ใน MasterCourse (หลักสูตร)
    courseSheet.getRange(courseRow, 5).setValue(currQ + 1);

    return _ok({ enrollId, message: 'สมัครอบรมสำเร็จ' });
  });
}

function getQueueList(payload) {
  const { token, type, status, search, page, pageSize } = payload;
  if (!_requireAdminSession(token)) return _err('ไม่มีสิทธิ์ใช้งาน Admin');

  const sheetName = type === 'training'
    ? CONFIG.SHEETS.TRAINING_QUEUE
    : CONFIG.SHEETS.TEST_QUEUE;
  const sheet = _sheet(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return _ok({ rows: [], total: 0 });

  // ดึง member name map
  const memData = _sheet(CONFIG.SHEETS.MEMBERS).getDataRange().getValues();
  const memMap  = {};
  const memCol  = _memberCols();
  for (let i = 1; i < memData.length; i++) {
    memMap[memData[i][memCol.memberId]] = {
      fullName: memData[i][memCol.fullName],
      phone:    memData[i][memCol.phone],
      profileJson: memData[i][memCol.profileJson] || '',
    };
  }

  // ดึง branch/course name map
  const isTest = type !== 'training';
  const masterData = _sheet(
    isTest ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE
  ).getDataRange().getValues();
  const masterMap = {};
  for (let i = 1; i < masterData.length; i++) {
    masterMap[masterData[i][0]] = masterData[i][1];
  }

  let rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (status && row[4] !== status) continue;
    const refName = masterMap[row[2]] || row[2];
    if (search && !refName.includes(search)) continue;
    const mem = memMap[row[1]] || {};
    rows.push({
      id:               row[0],
      memberId:         row[1],
      fullName:         mem.fullName || '-',
      phone:            mem.phone    || '-',
      profileJson:      mem.profileJson || '',
      refId:            row[2],
      refName:          refName,
      level:            isTest ? row[3] : null,
      status:           row[4],
      appointedDate:    _toIsoStringSafe(row[5]),
      memberAcknowledged: row[9] === true,
      pdfUrl:           isTest ? row[10] : null,
      appliedAt:        _toIsoStringSafe(row[isTest ? 11 : 9]),
    });
  }

  const total = rows.length;
  const pg    = Number(page) || 1;
  const ps    = Number(pageSize) || 20;
  rows = rows.slice((pg - 1) * ps, pg * ps);

  return _ok({ rows, total, page: pg, pageSize: ps });
}

function cancelQueue(payload) {
  const { token, queueId, type } = payload; // type: 'test' | 'training'
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  return _withLock(() => {
    const isTestQ = type === 'test';
    const sheetName = isTestQ
      ? CONFIG.SHEETS.TEST_QUEUE
      : CONFIG.SHEETS.TRAINING_QUEUE;
    const idCol = 0;
    const sheet = _ss().getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === queueId) {
        const status = data[i][4];
        if (['passed', 'failed', 'completed'].includes(status)) {
          return _err('ไม่สามารถยกเลิกคิวที่เสร็จสิ้นแล้ว');
        }
        if (status === 'cancelled') {
          return _err('คิวนี้ถูกยกเลิกไปแล้ว');
        }

        sheet.getRange(i + 1, 5).setValue('cancelled');
        // updatedAt: TestQueue มี col13, TrainingQueue ไม่มี
        if (isTestQ) sheet.getRange(i + 1, 13).setValue(new Date());
        
        // 🔥 ลดจำนวนคิวลง (currentQueue) ใน Master Data
        try {
          const refId = data[i][2]; // BranchId หรือ CourseId
          const masterSheetName = isTestQ ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE;
          const masterSheet = _ss().getSheetByName(masterSheetName);
          const masterData = masterSheet.getDataRange().getValues();
          for (let m = 1; m < masterData.length; m++) {
            if (masterData[m][0] === refId) {
              const currQ = Number(masterData[m][4]) || 0;
              if (currQ > 0) {
                masterSheet.getRange(m + 1, 5).setValue(currQ - 1);
              }
              CacheService.getScriptCache().remove('MASTER_DATA_' + masterSheetName);
              break;
            }
          }
        } catch(e) {
          Logger.log('Error decrementing queue: ' + e.message);
        }

        const calId = data[i][isTestQ ? 6 : 5];
        return _ok({ message: 'ยกเลิกคิวแล้ว', calendarEventId: calId || null });
      }
    }
    return _err('ไม่พบคิวที่ต้องการ');
  });
}

function acknowledgeAppointment(payload) {
  const { token, queueId, type, calendarEventId } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  return _withLock(() => {
    const sheetName = type === 'test'
      ? CONFIG.SHEETS.TEST_QUEUE
      : CONFIG.SHEETS.TRAINING_QUEUE;
    const sheet = _ss().getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === queueId) {
        const isTest = type === 'test';
        // TestQueue:     col7=calendarEventId, col10=memberAcknowledged
        // TrainingQueue: col6=calendarEventId, col9=memberAcknowledged
        if (isTest) {
          sheet.getRange(i + 1, 7).setValue(calendarEventId || '');
          sheet.getRange(i + 1, 10).setValue(true);
        } else {
          sheet.getRange(i + 1, 6).setValue(calendarEventId || '');
          sheet.getRange(i + 1, 9).setValue(true);
        }
        
        // ✅ ส่ง Acknowledgment confirmation (เพิ่มใหม่)
        const memberId = data[i][1];  // col B = memberId
        const confirmMsg = sendMessage(memberId, 'acknowledgment', {
          queueId: queueId
        });
        Logger.log('📤 Acknowledgment sent for ' + queueId + ': ' + 
                   (confirmMsg && confirmMsg.success ? '✓' : '✗'));
        
        return _ok({ message: 'รับนัดหมายแล้ว' });
      }
    }
    return _err('ไม่พบคิวที่ต้องการ');
  });
}

function getNotifications(payload) {
  const { token } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  const memberId = session.data[session.col.memberId];
  const ss = _ss();
  const notes = [];

  [
    { sheetName: CONFIG.SHEETS.TEST_QUEUE,     type: 'test',     apptCol: 5, ackCol: 9 },
    { sheetName: CONFIG.SHEETS.TRAINING_QUEUE, type: 'training', apptCol: 4, ackCol: 8 },
  ].forEach(({ sheetName, type, apptCol, ackCol }) => {
    const data = ss.getSheetByName(sheetName).getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === memberId && data[i][4] !== 'cancelled') {
        if (data[i][apptCol] && !data[i][ackCol]) {
          notes.push({
            id:   data[i][0],
            type,
            date: _toIsoStringSafe(data[i][apptCol]),
            read: false,
          });
        }
      }
    }
  });

  // 🔥 [แก้ไขบั๊ก] อ่านข้อมูลจากชีต Notifications ด้วย!
  const notifSheet = ss.getSheetByName('Notifications');
  if (notifSheet) {
    const notifData = notifSheet.getDataRange().getValues();
    for (let i = 1; i < notifData.length; i++) {
      if (notifData[i][1] === memberId) {
        notes.push({
          id: notifData[i][0],
          type: notifData[i][2],
          queueId: notifData[i][3],
          message: notifData[i][4],
          read: notifData[i][5] === true,
          date: _toIsoStringSafe(notifData[i][6]),
        });
      }
    }
  }

  return _ok({ notifications: notes });
}

function deleteNotification(payload) {
  const { token, notifId } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');

  return _withLock(() => {
    const notifSheet = _sheet('Notifications');
    const memberId = session.data[session.col.memberId];
    const data = notifSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][0] || '').trim();
      const rowMember = String(data[i][1] || '').trim();
      if (rowId === String(notifId).trim() && rowMember === String(memberId).trim()) {
        notifSheet.deleteRow(i + 1);
        return _ok({ message: 'ลบการแจ้งเตือนแล้ว' });
      }
    }
    return _err('ไม่พบการแจ้งเตือน หรือไม่มีสิทธิ์ลบ');
  });
}

// ── 6. ADMIN API ───────────────────────────────────────────────

// ── 6a. ADMIN MEMBER MANAGEMENT ────────────────────────────────

/**
 * getAdminMembersList - ดึงรายชื่อสมาชิกทั้งหมด พร้อม Pagination
 * payload = { token, page, pageSize, search }
 */
function getAdminMembersList(payload) {
  const { token, page = 1, pageSize = 20, search = '' } = payload || {};
  if (!_requireAdminSession(token)) return _err('ไม่มีสิทธิ์ Admin');

  const sheet = _sheet(CONFIG.SHEETS.MEMBERS);
  const data  = sheet.getDataRange().getValues();
  const col   = _memberCols();

  const kw = String(search).trim().toLowerCase();

  let rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const memberId   = String(row[col.memberId]  || '');
    const fullName   = String(row[col.fullName]   || '');
    const phone      = String(row[col.phone]      || '');
    const idCard     = String(row[col.idCard]     || '');
    const titleTH    = String(row[col.titleTH]    || '');
    const profileRaw = String(row[col.profileJson]|| '');

    let profileObj = {};
    try { profileObj = profileRaw ? JSON.parse(profileRaw) : {}; } catch(e) {}

    // คอลัมน์ status ยืดหยุ่น — อาจอยู่ใน profileJson หรือคอลัมน์แยก
    const statusRaw = String(row[22] || profileObj.status || 'active');

    // filter ถ้ามีคำค้นหา
    if (kw) {
      const haystack = (fullName + phone + idCard + memberId).toLowerCase();
      if (!haystack.includes(kw)) continue;
    }

    rows.push({
      rowIndex: i + 1,           // row number ใน Sheet (1-based, header = 1)
      memberId, phone, idCard,
      fullName: (titleTH ? titleTH + ' ' : '') + fullName,
      titleTH,
      status: statusRaw,
      profileObj,
      createdAt: (function() {
        try {
          const d = row[col.createdAt];
          if (!d) return '-';
          return Utilities.formatDate(new Date(d), 'Asia/Bangkok', 'dd/MM/yyyy');
        } catch(e) { return '-'; }
      })(),
    });
  }

  const total      = rows.length;
  const pg         = Math.max(1, Number(page));
  const ps         = Math.max(1, Number(pageSize));
  const totalPages = Math.ceil(total / ps) || 1;
  const sliced     = rows.slice((pg - 1) * ps, pg * ps);

  return _ok({
    members: sliced,
    pagination: { page: pg, pageSize: ps, total, totalPages,
                  hasPrev: pg > 1, hasNext: pg < totalPages }
  });
}

/**
 * updateAdminMemberStatus - เปลี่ยนสถานะสมาชิก (active / banned)
 * payload = { token, rowIndex, status }
 */
function updateAdminMemberStatus(payload) {
  const { token, rowIndex, status } = payload || {};
  if (!_requireAdminSession(token)) return _err('ไม่มีสิทธิ์ Admin');
  if (!rowIndex || !status) return _err('ข้อมูลไม่ครบ');
  if (!['active','banned'].includes(status)) return _err('สถานะไม่ถูกต้อง');

  return _withLock(() => {
    const sheet      = _sheet(CONFIG.SHEETS.MEMBERS);
    const data       = sheet.getDataRange().getValues();
    const col        = _memberCols();

    const ri = Number(rowIndex);
    if (ri < 2 || ri > data.length) return _err('ไม่พบแถวข้อมูล');

    // อัปเดต status ในคอลัมน์ 23 (index 22)
    // ถ้าชีทมีไม่ถึง 23 คอลัมน์ ให้ขยายก่อน
    const lastCol = sheet.getLastColumn();
    if (lastCol < 23) {
      // append header ถ้าจำเป็น
      sheet.getRange(1, 23).setValue('status');
    }
    sheet.getRange(ri, 23).setValue(status);

    // อัปเดต profileJson.status ด้วย เพื่อ consistency
    const profileRaw = String(data[ri - 1][col.profileJson] || '');
    let profileObj = {};
    try { profileObj = profileRaw ? JSON.parse(profileRaw) : {}; } catch(e) {}
    profileObj.status = status;
    sheet.getRange(ri, col.profileJson + 1).setValue(JSON.stringify(profileObj));

    return _ok({ rowIndex: ri, status });
  });
}

/**
 * deleteAdminMember - ลบสมาชิกออกจากชีตถาวร
 * payload = { token, rowIndex }
 */
function deleteAdminMember(payload) {
  const { token, rowIndex } = payload || {};
  if (!_requireAdminSession(token)) return _err('ไม่มีสิทธิ์ Admin');
  if (!rowIndex) return _err('ไม่ระบุแถวข้อมูล');

  return _withLock(() => {
    const sheet = _sheet(CONFIG.SHEETS.MEMBERS);
    const ri    = Number(rowIndex);
    if (ri < 2 || ri > sheet.getLastRow()) return _err('ไม่พบแถวข้อมูล');
    sheet.deleteRow(ri);
    return _ok({ rowIndex: ri, message: 'ลบสมาชิกเรียบร้อย' });
  });
}

/**
 * updateAdminMemberProfile - อัปเดตข้อมูลสมาชิก (ชื่อ, เบอร์, บัตร, profileJson)
 * payload = { token, rowIndex, fullName, phone, idCard, titleTH, profileObj }
 */
function updateAdminMemberProfile(payload) {
  const { token, rowIndex, fullName, phone, idCard, titleTH, profileObj } = payload || {};
  if (!_requireAdminSession(token)) return _err('ไม่มีสิทธิ์ Admin');
  if (!rowIndex) return _err('ไม่ระบุแถวข้อมูล');

  return _withLock(() => {
    const sheet = _sheet(CONFIG.SHEETS.MEMBERS);
    const col   = _memberCols();
    const ri    = Number(rowIndex);
    if (ri < 2 || ri > sheet.getLastRow()) return _err('ไม่พบแถวข้อมูล');

    if (fullName  !== undefined) sheet.getRange(ri, col.fullName  + 1).setValue(fullName);
    if (phone     !== undefined) sheet.getRange(ri, col.phone     + 1).setValue(phone);
    if (idCard    !== undefined) sheet.getRange(ri, col.idCard    + 1).setValue(idCard);
    if (titleTH   !== undefined) sheet.getRange(ri, col.titleTH  + 1).setValue(titleTH);

    if (profileObj !== undefined) {
      let existing = {};
      try {
        const raw = sheet.getRange(ri, col.profileJson + 1).getValue();
        existing = raw ? JSON.parse(raw) : {};
      } catch(e) {}
      const merged = Object.assign(existing, profileObj);
      sheet.getRange(ri, col.profileJson + 1).setValue(JSON.stringify(merged));
    }

    return _ok({ rowIndex: ri, message: 'อัปเดตข้อมูลเรียบร้อย' });
  });
}


function deleteAdminQueue(payload) {
  const { token, type, queueId } = payload;
  if (!_requireAdminSession(token)) return _err('ไม่มีสิทธิ์ Admin');
  
  return _withLock(() => {
    const isTestQ = type === 'test';
    const sheetName = type === 'training'
      ? CONFIG.SHEETS.TRAINING_QUEUE
      : CONFIG.SHEETS.TEST_QUEUE;
    const sheet = _sheet(sheetName);
    const data  = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(queueId).trim()) {
        const oldStatus = data[i][4];
        
        // 🔥 ลดจำนวนคิวลง (currentQueue) ใน Master Data (ถ้าคิวไม่ได้ยกเลิกไปก่อนแล้ว)
        if (oldStatus !== 'cancelled') {
          try {
            const refId = data[i][2]; // BranchId หรือ CourseId
            const masterSheetName = isTestQ ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE;
            const masterSheet = _ss().getSheetByName(masterSheetName);
            const masterData = masterSheet.getDataRange().getValues();
            for (let m = 1; m < masterData.length; m++) {
              if (masterData[m][0] === refId) {
                const currQ = Number(masterData[m][4]) || 0;
                if (currQ > 0) {
                  masterSheet.getRange(m + 1, 5).setValue(currQ - 1);
                }
                CacheService.getScriptCache().remove('MASTER_DATA_' + masterSheetName);
                break;
              }
            }
          } catch(e) {
            Logger.log('Error decrementing queue: ' + e.message);
          }
        }
        
        sheet.deleteRow(i + 1);
        return _ok({ message: 'ลบคิวเรียบร้อยแล้ว' });
      }
    }
    return _err('ไม่พบคิวที่ต้องการลบ');
  });
}

function updateQueueStatus(payload) {
  const { token, type, queueId, status } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');

  const validStatuses = type === 'training'
    ? ['pending', 'approved', 'training', 'completed', 'cancelled']
    : ['pending', 'confirmed', 'testing', 'passed', 'failed', 'cancelled'];
  if (!validStatuses.includes(status)) return _err('สถานะไม่ถูกต้อง');

  return _withLock(() => {
    const isTestQ = type === 'test';
    const sheetName = type === 'training'
      ? CONFIG.SHEETS.TRAINING_QUEUE
      : CONFIG.SHEETS.TEST_QUEUE;
    const sheet = _ss().getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === queueId) {
        const oldStatus = data[i][4];
        
        sheet.getRange(i + 1, 5).setValue(status);
        sheet.getRange(i + 1, data[0].length).setValue(new Date());

        // 🔥 ลดจำนวนคิวลง (currentQueue) ใน Master Data (ถ้าสถานะใหม่คือยกเลิก และของเดิมยังไม่ยกเลิก)
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
          try {
            const refId = data[i][2]; // BranchId หรือ CourseId
            const masterSheetName = isTestQ ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE;
            const masterSheet = _ss().getSheetByName(masterSheetName);
            const masterData = masterSheet.getDataRange().getValues();
            for (let m = 1; m < masterData.length; m++) {
              if (masterData[m][0] === refId) {
                const currQ = Number(masterData[m][4]) || 0;
                if (currQ > 0) {
                  masterSheet.getRange(m + 1, 5).setValue(currQ - 1);
                }
                CacheService.getScriptCache().remove('MASTER_DATA_' + masterSheetName);
                break;
              }
            }
          } catch(e) {
            Logger.log('Error decrementing queue: ' + e.message);
          }
        }

        // 🔥 [เพิ่มโค้ดส่วนนี้] ส่งแจ้งเตือนเรียกตัวหน้างาน
        const memberId = data[i][1]; // ดึง memberId จากคอลัมน์ B (index 1)
        if (payload.triggerNotification === true) {
          // ข้อความเริ่มต้น หรือข้อความที่ส่งมาจากหน้าเว็บ
          const notifyMsg = payload.notifyMessage || '📢 ถึงคิวของคุณแล้ว! กรุณาติดต่อเจ้าหน้าที่ครับ';
          
          // สั่งบันทึกแจ้งเตือน (ต้องแน่ใจว่าตัวแปร memberId มีค่า)
          _createNotification(memberId, payload.type, payload.queueId, notifyMsg);
        }

        // 🔥 เพิ่ม: ให้ส่ง LINE Flex Message ทันที เมื่อมีการกดเรียกคิว (triggerNotification === true)
        if (payload.triggerNotification === true) {
          try {
            const memSheet = _ss().getSheetByName(CONFIG.SHEETS.MEMBERS);
            const memData = memSheet.getDataRange().getValues();
            let lineUid = null;
            let queueName = '';
            for (let m = 1; m < memData.length; m++) {
              if (memData[m][0] === memberId) {
                lineUid = memData[m][_memberCols().lineUserId];
                queueName = memData[m][_memberCols().fullName] || '';
                break;
              }
            }
            if (lineUid) {
              const rawQueueId = data[i][0] || '';
              const queueNo = String(rawQueueId).replace(/^[A-Z]+-/, 'YLQ-');
              pushQueueCallMessage(lineUid, { queueNo: queueNo || '-', name: queueName });
            }
          } catch(lineErr) {
            console.error("Error pushing Line Flex Message: " + lineErr);
          }
        }

        return _ok({ message: 'อัปเดตสถานะแล้ว' });
      }
    }
    return _err('ไม่พบคิวที่ต้องการ');
  });
}

function setAppointment(payload) {
  const { token, type, queueId, appointedDate } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');

  if (!appointedDate) return _err('กรุณาระบุวันที่');
  const date = new Date(appointedDate);
  if (isNaN(date.getTime())) return _err('วันที่ไม่ถูกต้อง');
  if (date < new Date()) return _err('ไม่สามารถนัดวันที่ผ่านมาแล้ว');

  return _withLock(() => {
    const sheetName = type === 'training'
      ? CONFIG.SHEETS.TRAINING_QUEUE
      : CONFIG.SHEETS.TEST_QUEUE;
    const sheet = _ss().getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === queueId) {
        const isTest = type !== 'training';
        // TestQueue:     col6=appointedDate, col8=notifyD3, col9=notifyD0, col10=acknowledged
        // TrainingQueue: col5=appointedDate, col7=notifyD3, col8=notifyD0, col9=acknowledged
        if (isTest) {
          sheet.getRange(i + 1, 5).setValue('appointed'); // STATUS (col E)
          sheet.getRange(i + 1, 6).setValue(date);   // appointedDate (col F)
          sheet.getRange(i + 1, 8).setValue(false);  // notifyD3Sent  (col H)
          sheet.getRange(i + 1, 9).setValue(false);  // notifyD0Sent  (col I)
          sheet.getRange(i + 1, 10).setValue(false); // memberAcknowledged (col J)
        } else {
          sheet.getRange(i + 1, 4).setValue('appointed'); // STATUS (col D)
          sheet.getRange(i + 1, 5).setValue(date);   // appointedDate (col E)
          sheet.getRange(i + 1, 7).setValue(false);  // notifyD3Sent  (col G)
          sheet.getRange(i + 1, 8).setValue(false);  // notifyD0Sent  (col H)
          sheet.getRange(i + 1, 9).setValue(false);  // memberAcknowledged (col I)
        }
        
        // ✅ ส่ง Appointment Notification (เพิ่มใหม่)
        const memberId = data[i][1];  // col B = memberId
        const branchId = data[i][2];  // col C = branchId/courseId
        
        // ดึง branch/course name
        const masterSheet = _ss().getSheetByName(
          isTest ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE
        );
        const masterData = masterSheet.getDataRange().getValues();
        let branchName = 'สาขา/หลักสูตร';
        for (let j = 1; j < masterData.length; j++) {
          if (masterData[j][0] === branchId) {
            branchName = masterData[j][1];
            break;
          }
        }
        
        // ส่งข้อความ
        const appointmentMsg = sendMessage(memberId, 'appointment', {
          queueId: queueId,
          branchName: branchName,
          appointedDate: Utilities.formatDate(date, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm'),
          webAppUrl: ScriptApp.getService().getUrl()
        });
        
        Logger.log('📤 Appointment notification sent for ' + queueId + ': ' + 
                   (appointmentMsg && appointmentMsg.success ? '✓' : '✗'));
                   
        // 🔥 [เพิ่มโค้ดส่วนนี้] บันทึกประวัติการนัดหมายลงชีต Notifications
        const dateObj = new Date(payload.appointedDate);
        const formattedDate = Utilities.formatDate(dateObj, "Asia/Bangkok", "dd/MM/yyyy HH:mm");
        const apptMsg = `📅 คุณได้รับกำหนดการนัดหมายใหม่ ในวันที่ ${formattedDate} น.`;
        
        _createNotification(memberId, payload.type, payload.queueId, apptMsg);

        return _ok({ message: 'บันทึกวันนัดหมายแล้ว member จะเห็นการแจ้งเตือน' });
      }
    }
    return _err('ไม่พบคิวที่ต้องการ');
  });
}

function confirmAppointment(payload) {
  const { token, queueId, type } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  return _withLock(() => {
    const isTest = type !== 'training';
    const sheet = _ss().getSheetByName(isTest ? CONFIG.SHEETS.TEST_QUEUE : CONFIG.SHEETS.TRAINING_QUEUE);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === queueId && data[i][1] === session.data[session.col.memberId]) {
        sheet.getRange(i + 1, isTest ? 10 : 9).setValue(true);
        sheet.getRange(i + 1, isTest ? 5 : 4).setValue('confirmed'); 
        return _ok({ message: 'ยืนยันการนัดหมายเรียบร้อยแล้ว' });
      }
    }
    return _err('ไม่พบรายการนัดหมาย');
  });
}

function getMasterData(payload) {
  const { type } = payload;
  const sheetName = type === 'course'
    ? CONFIG.SHEETS.MASTER_COURSE
    : CONFIG.SHEETS.MASTER_BRANCH;

  const cache = CacheService.getScriptCache();
  const cacheKey = 'MASTER_DATA_' + sheetName;
  // ปิด Cache ชั่วคราวเพื่อแก้ปัญหาข้อมูลไม่แสดงทันทีที่อัปเดต Sheet
  // const cached = cache.get(cacheKey);
  // if (cached) return _ok({ items: JSON.parse(cached) });

  const sheet = _sheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return _ok({ items: [] });

  const items = data.slice(1).map(row => ({
    id:             row[0],
    name:           row[1],
    extra:          row[2] !== undefined && row[2] !== null ? String(row[2]) : '',
    maxQueue:       row[3],
    currentQueue:   row[4],
    isOpen:         row[5] === true,
    docTemplateId:  row[6] || '',
    courseDate:     row[7] instanceof Date ? row[7].toISOString().split('T')[0] : (row[7] || ''),
    mapUrl:         row[8] || '',
  }));

  cache.put(cacheKey, JSON.stringify(items), 900); // Cache 15 minutes
  return _ok({ items });
}

function saveMasterItem(payload) {
  const { token, type, item } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');
  if (!item.name) return _err('กรุณากรอกชื่อ');

  return _withLock(() => {
    const sheetName = type === 'course'
      ? CONFIG.SHEETS.MASTER_COURSE
      : CONFIG.SHEETS.MASTER_BRANCH;
    
    const sheet = _sheet(sheetName);
    const data  = sheet.getDataRange().getValues();

    if (item.id) {
      // แก้ไข
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === item.id) {
          sheet.getRange(i + 1, 2).setValue(_sanitize(item.name));
          sheet.getRange(i + 1, 3).setValue(_sanitize(item.extra || ''));
          sheet.getRange(i + 1, 4).setValue(Number(item.maxQueue) || 999);
          sheet.getRange(i + 1, 7).setValue(_sanitize(item.docTemplateId || ''));
          sheet.getRange(i + 1, 8).setValue(_sanitize(item.courseDate || ''));
          sheet.getRange(i + 1, 9).setValue(_sanitize(item.mapUrl || ''));
          CacheService.getScriptCache().remove('MASTER_DATA_' + sheetName);
          return _ok({ message: 'บันทึกแล้ว' });
        }
      }
      return _err('ไม่พบรายการที่ต้องการแก้ไข');
    } else {
      // เพิ่มใหม่
      const prefix = type === 'course' ? 'CRS-' : 'YLQ-';
      const newId  = prefix + _genId();
      sheet.appendRow([
        newId,
        _sanitize(item.name),
        _sanitize(item.extra || ''),
        Number(item.maxQueue) || 999,
        0,
        true,
        _sanitize(item.docTemplateId || ''),
        _sanitize(item.courseDate || ''),
        _sanitize(item.mapUrl || '')
      ]);
      CacheService.getScriptCache().remove('MASTER_DATA_' + sheetName);
      return _ok({ id: newId, message: 'เพิ่มรายการแล้ว' });
    }
  });
}

function toggleMasterItem(payload) {
  const { token, type, id, isOpen } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');

  return _withLock(() => {
    const sheetName = type === 'course'
      ? CONFIG.SHEETS.MASTER_COURSE
      : CONFIG.SHEETS.MASTER_BRANCH;
    const sheet = _ss().getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.getRange(i + 1, 6).setValue(isOpen === true);
        CacheService.getScriptCache().remove('MASTER_DATA_' + sheetName);
        return _ok({ message: isOpen ? 'เปิดรับสมัครแล้ว' : 'ปิดรับสมัครแล้ว' });
      }
    }
    return _err('ไม่พบรายการ');
  });
}

function deleteMasterCourse(payload) {
  if (!_requireAdminSession(payload.token)) return _err('กรุณาเข้าสู่ระบบ Admin');
  const sheet = _ss().getSheetByName(CONFIG.SHEETS.MASTER_COURSE);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == payload.courseId) {
      sheet.deleteRow(i + 1);
      CacheService.getScriptCache().remove('MASTER_DATA_' + CONFIG.SHEETS.MASTER_COURSE);
      return _ok({ success: true });
    }
  }
  return _err('ไม่พบรหัสหลักสูตรที่ระบุ');
}

function deleteMasterItem(payload) {
  const { token, type, id } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');

  return _withLock(() => {
    const sheetName = type === 'course'
      ? CONFIG.SHEETS.MASTER_COURSE
      : CONFIG.SHEETS.MASTER_BRANCH;
    const sheet = _ss().getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        CacheService.getScriptCache().remove('MASTER_DATA_' + sheetName);
        return _ok({ message: 'ลบรายการสำเร็จ' });
      }
    }
    return _err('ไม่พบรายการที่ต้องการลบ');
  });
}

function getReport(payload) {
  const { token, month, year } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');

  const ss     = _ss();
  const m      = Number(month);
  const y      = Number(year);

  function filterByMonth(data, dateColIdx) {
    return data.slice(1).filter(row => {
      if (!row[dateColIdx]) return false;
      const d = new Date(row[dateColIdx]);
      return d.getMonth() + 1 === m && d.getFullYear() === y;
    });
  }

  const testData  = ss.getSheetByName(CONFIG.SHEETS.TEST_QUEUE).getDataRange().getValues();
  const trainData = ss.getSheetByName(CONFIG.SHEETS.TRAINING_QUEUE).getDataRange().getValues();

  const testRows  = filterByMonth(testData,  11); // appliedAt col index 11
  const trainRows = filterByMonth(trainData, 9);  // appliedAt col index 9

  const countBy = (rows, col) => rows.reduce((acc, r) => {
    acc[r[col]] = (acc[r[col]] || 0) + 1; return acc;
  }, {});

  return _ok({
    month, year,
    test: {
      total:     testRows.length,
      byStatus:  countBy(testRows, 4),
    },
    training: {
      total:     trainRows.length,
      byStatus:  countBy(trainRows, 3),
    },
  });
}

function getDashboardData(payload) {
  const { token, startDate, endDate, serviceType } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');

  const ss = _ss();
  
  // 1. Fetch raw data
  const testSheet = ss.getSheetByName(CONFIG.SHEETS.TEST_QUEUE);
  const testData = testSheet ? testSheet.getDataRange().getValues() : [];
  
  const trainSheet = ss.getSheetByName(CONFIG.SHEETS.TRAINING_QUEUE);
  const trainData = trainSheet ? trainSheet.getDataRange().getValues() : [];
  
  const memberSheet = ss.getSheetByName(CONFIG.SHEETS.MEMBERS);
  const memberData = memberSheet ? memberSheet.getDataRange().getValues() : [];

  // Master Branch Map
  const masterBranchSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_BRANCH);
  const masterBranchData = masterBranchSheet ? masterBranchSheet.getDataRange().getValues() : [];
  const branchMap = {};
  for (let i = 1; i < masterBranchData.length; i++) {
    branchMap[masterBranchData[i][0]] = masterBranchData[i][1];
  }

  // Master Course Map
  const masterCourseSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_COURSE);
  const masterCourseData = masterCourseSheet ? masterCourseSheet.getDataRange().getValues() : [];
  const courseMap = {};
  for (let i = 1; i < masterCourseData.length; i++) {
    courseMap[masterCourseData[i][0]] = masterCourseData[i][1];
  }

  function parseDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  const startFilter = startDate ? parseDate(startDate) : null;
  const endFilter = endDate ? parseDate(endDate) : null;

  let testRows = [];
  if (serviceType !== 'training') {
    for (let i = 1; i < testData.length; i++) {
      const row = testData[i];
      const appliedAt = parseDate(row[11]);
      if (startFilter && appliedAt && appliedAt < startFilter) continue;
      if (endFilter && appliedAt && appliedAt > endFilter) continue;
      testRows.push(row);
    }
  }

  let trainRows = [];
  if (serviceType !== 'test') {
    for (let i = 1; i < trainData.length; i++) {
      const row = trainData[i];
      const appliedAt = parseDate(row[9]);
      if (startFilter && appliedAt && appliedAt < startFilter) continue;
      if (endFilter && appliedAt && appliedAt > endFilter) continue;
      trainRows.push(row);
    }
  }

  // Count new members
  let newMembersCount = 0;
  for (let i = 1; i < memberData.length; i++) {
    const row = memberData[i];
    const createdAt = parseDate(row[18]); // index 18 is createdAt
    if (createdAt) {
      if (startFilter && createdAt < startFilter) continue;
      if (endFilter && createdAt > endFilter) continue;
      newMembersCount++;
    }
  }

  let totalQuotas = testRows.length + trainRows.length;
  
  let pendingCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let failedCount = 0;

  testRows.forEach(row => {
    const s = row[4];
    if (s === 'pending' || s === 'confirmed' || s === 'testing') pendingCount++;
    else if (s === 'passed') completedCount++;
    else if (s === 'failed') failedCount++;
    else if (s === 'cancelled') cancelledCount++;
  });

  trainRows.forEach(row => {
    const s = row[3];
    if (s === 'pending' || s === 'approved' || s === 'training') pendingCount++;
    else if (s === 'completed') completedCount++;
    else if (s === 'cancelled') cancelledCount++;
  });

  // Calculate 6-month trend (always last 6 months for plotting)
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const trend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    trend.push({
      key,
      label: monthNames[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2),
      test: 0,
      training: 0
    });
  }

  // Count trend for all (not just filtered, to show full historical trend)
  for (let i = 1; i < testData.length; i++) {
    const d = parseDate(testData[i][11]);
    if (d) {
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const item = trend.find(t => t.key === key);
      if (item) item.test++;
    }
  }

  for (let i = 1; i < trainData.length; i++) {
    const d = parseDate(trainData[i][9]);
    if (d) {
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const item = trend.find(t => t.key === key);
      if (item) item.training++;
    }
  }

  // Calculate popular items
  const popularMap = {};
  testRows.forEach(row => {
    const refId = row[2];
    const name = branchMap[refId] || refId;
    if (name) popularMap[name] = (popularMap[name] || 0) + 1;
  });

  trainRows.forEach(row => {
    const refId = row[2];
    const name = courseMap[refId] || refId;
    if (name) popularMap[name] = (popularMap[name] || 0) + 1;
  });

  const popular = Object.keys(popularMap)
    .map(name => ({ name, count: popularMap[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return _ok({
    totalQuotas,
    newMembersCount,
    pendingCount,
    completedCount,
    cancelledCount,
    failedCount,
    trend,
    popular
  });
}

function saveBatchJsonToDrive(payload) {
  const { token, fileName, json } = payload;
  if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');
  if (!fileName) return _err('ชื่อไฟล์ไม่ถูกต้อง');

  const folderId = _cfg('JSON_FOLDER_ID', '');
  if (!folderId) return _err('ยังไม่ได้ตั้งค่า JSON_FOLDER_ID');

  const folder = DriveApp.getFolderById(folderId);
  let finalName = String(fileName).trim();
  if (!/\.json$/i.test(finalName)) finalName += '.json';

  const exists = folder.getFilesByName(finalName).hasNext();
  if (exists) {
    const ts = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd-HHmmss');
    finalName = finalName.replace(/\.json$/i, '') + '_' + ts + '.json';
  }

  const file = folder.createFile(finalName, String(json || ''), MimeType.JSON);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return _ok({
    fileId: file.getId(),
    name: finalName,
    fileUrl: file.getUrl(),
    downloadUrl: file.getDownloadUrl(),
  });
}

// ── 7. PDF API ─────────────────────────────────────────────────

function generatePDF(payload) {
  const { token, role, queueId, type } = payload;

  // ทั้ง member และ admin เรียกได้
  if (role === 'admin') {
    if (!_requireAdminSession(token)) return _err('กรุณาเข้าสู่ระบบ Admin');
  } else {
    if (!_requireMemberSession(token)) return _err('กรุณาเข้าสู่ระบบ');
  }

  const ss = _ss();
  const isTest = type !== 'training';
  const qSheet = ss.getSheetByName(
    isTest ? CONFIG.SHEETS.TEST_QUEUE : CONFIG.SHEETS.TRAINING_QUEUE
  );
  const qData = qSheet.getDataRange().getValues();

  let qRow = null;
  let qRowIdx = -1;
  for (let i = 1; i < qData.length; i++) {
    if (qData[i][0] === queueId) { qRow = qData[i]; qRowIdx = i + 1; break; }
  }
  if (!qRow) return _err('ไม่พบคิวที่ต้องการ');

  // ดึงข้อมูล member
  const memberId  = qRow[1];
  const memSheet  = ss.getSheetByName(CONFIG.SHEETS.MEMBERS);
  const memData   = memSheet.getDataRange().getValues();
  const memCol    = _memberCols();
  let member = null;
  for (let i = 1; i < memData.length; i++) {
    if (memData[i][memCol.memberId] === memberId) { member = memData[i]; break; }
  }
  if (!member) return _err('ไม่พบข้อมูลสมาชิก');

  // ดึง template ID
  const refId = qRow[2];
  const masterSheet = ss.getSheetByName(
    isTest ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE
  );
  const masterData = masterSheet.getDataRange().getValues();
  let templateId = '';
  let refName    = '';
  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][0] === refId) {
      templateId = masterData[i][6] || '';
      refName    = masterData[i][1] || '';
      break;
    }
  }

  if (!templateId) return _err('ยังไม่ได้กำหนด Template สำหรับสาขา/หลักสูตรนี้');

  try {
    const templateFile = DriveApp.getFileById(templateId);
    const copyFile     = templateFile.makeCopy(
      'PDF_TEMP_' + queueId,
      DriveApp.getFolderById(_cfg('PDF_FOLDER_ID', CONFIG.PDF_FOLDER_ID))
    );
    const doc  = DocumentApp.openById(copyFile.getId());
    const body = doc.getBody();

    // แทนที่ placeholder
    const appointedDate = qRow[5]
      ? Utilities.formatDate(new Date(qRow[5]), 'Asia/Bangkok', 'dd/MM/yyyy')
      : '-';
    const applyDate = qRow[isTest ? 11 : 9]
      ? Utilities.formatDate(new Date(qRow[isTest ? 11 : 9]), 'Asia/Bangkok', 'dd/MM/yyyy')
      : '-';

    body.replaceText('{{queueId}}',    queueId);
    body.replaceText('{{fullName}}',   member[memCol.fullName] || '-');
    body.replaceText('{{fullName_EN}}', member[memCol.fullNameEN] || '-');
    body.replaceText('{{idCard}}',     member[memCol.idCard]   || '-');
    body.replaceText('{{phone}}',      member[memCol.phone]    || '-');
    body.replaceText('{{address}}',    member[memCol.address]  || '-');
    body.replaceText('{{moo}}',        member[memCol.moo]      || '-');
    body.replaceText('{{subDistrict}}', member[memCol.subDistrict] || '-');
    body.replaceText('{{district}}',   member[memCol.district] || '-');
    body.replaceText('{{province}}',   member[memCol.province] || '-');
    body.replaceText('{{postalCode}}', member[memCol.postalCode] || '-');
    body.replaceText('{{education}}',  member[memCol.education]|| '-');
    body.replaceText('{{birthDate}}',  member[memCol.birthDate]? Utilities.formatDate(new Date(member[memCol.birthDate]), 'Asia/Bangkok', 'dd/MM/yyyy') : '-');
    body.replaceText('{{refName}}',    refName);
    body.replaceText('{{level}}',      isTest ? (qRow[3] || '-') : '-');
    body.replaceText('{{appointedDate}}', appointedDate);
    body.replaceText('{{applyDate}}',  applyDate);
    body.replaceText('{{printDate}}',  Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy'));

    doc.saveAndClose();

    // Export เป็น PDF
    const pdfBlob = copyFile.getAs('application/pdf');
    pdfBlob.setName(queueId + '.pdf');
    const folder  = DriveApp.getFolderById(_cfg('PDF_FOLDER_ID', CONFIG.PDF_FOLDER_ID));
    const pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const pdfUrl = pdfFile.getDownloadUrl();

    // บันทึก URL กลับใน queue sheet
    if (isTest && qRowIdx > 0) {
      qSheet.getRange(qRowIdx, 11).setValue(pdfUrl);
    }

    // ลบ copy ชั่วคราว
    copyFile.setTrashed(true);

    return _ok({ pdfUrl, message: 'สร้าง PDF สำเร็จ' });
  } catch (e) {
    return _err('สร้าง PDF ไม่สำเร็จ: ' + e.message);
  }
}

// ── 8. CALENDAR API ────────────────────────────────────────────

function addCalendarEvent(payload) {
  const { token, queueId, type, title, appointedDate, description } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  try {
    const startDate = new Date(appointedDate);
    const endDate   = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // มาตรฐานบล็อกคิวไว้ 3 ชั่วโมง

    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
      || CalendarApp.getDefaultCalendar();

    // 1. สั่งสร้างกิจกรรมนัดหมายตามปกติ
    const event = calendar.createEvent(
      title || (type === 'test' ? 'ทดสอบมาตรฐานฝีมือแรงงาน — สพร.24 ยะลา' : 'ฝึกอบรมฯ — สพร.24 ยะลา'),
      startDate,
      endDate,
      {
        description: description || ('คิว: ' + queueId + '\nสพร.24 ยะลา'),
        location:    'สำนักงานพัฒนาฝีมือแรงงานยะลา',
      }
    );

    // 🌟🌟 2. แทรกคำสั่งส่งเสียงและข้อความแจ้งเตือนไปที่มือถือ 🌟🌟
    event.removeAllReminders(); // ล้างระบบแจ้งเตือนเริ่มต้นของระบบออกก่อนเพื่อไม่ให้ซ้ำซ้อน
    
    // 🔔 แจ้งเตือนข้อความพร้อมส่งเสียงเตือนล่วงหน้า 3 วัน (3 วัน x 24 ชม. x 60 นาที = 4320 นาที)
    event.addPopupReminder(4320); 
    
    // 🔔 แจ้งเตือนข้อความพร้อมส่งเสียงเตือนในวันนัดหมาย เวลา 07:00 น. 
    // (คำนวณจากเวลาเริ่มนัดมาตรฐาน 09:00 น. ย้อนกลับไป 2 ชั่วโมง = 120 นาที)
    event.addPopupReminder(120);  

    // 3. อัปเดตสถานะการอนุญาตปฏิทินในระบบตามปกติ
    const col = session.col;
    _ss().getSheetByName(CONFIG.SHEETS.MEMBERS)
      .getRange(session.row, col.calendarAuth + 1).setValue(true);

    return _ok({ eventId: event.getId(), message: 'บันทึกปฏิทินพร้อมตั้งค่าเสียงแจ้งเตือนบนมือถือสำเร็จ' });
  } catch (e) {
    return _err('บันทึกปฏิทินไม่สำเร็จ: ' + e.message);
  }
}

function deleteCalendarEvent(payload) {
  const { token, calendarEventId } = payload;
  const session = _requireMemberSession(token);
  if (!session) return _err('กรุณาเข้าสู่ระบบใหม่');

  if (!calendarEventId) return _ok({ message: 'ไม่มี event ที่ต้องลบ' });

  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
      || CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(calendarEventId);
    if (event) event.deleteEvent();
    return _ok({ message: 'ลบ event ออกจากปฏิทินแล้ว' });
  } catch (e) {
    return _ok({ message: 'ไม่พบ event (อาจถูกลบแล้ว)' });
  }
}

// ── 9. DAILY TRIGGER ───────────────────────────────────────────

// ตั้ง Trigger: ScriptApp.newTrigger('dailyAt7AM').timeBased().atHour(7).everyDays(1).create()
function dailyAt7AM() {
  const today      = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDays  = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const ss = _ss();
  [
    { sheetName: CONFIG.SHEETS.TEST_QUEUE,     apptCol: 5, d3Col: 7, d0Col: 8 },
    { sheetName: CONFIG.SHEETS.TRAINING_QUEUE, apptCol: 4, d3Col: 6, d0Col: 7 },
  ].forEach(({ sheetName, apptCol, d3Col, d0Col }) => {
    const sheet = ss.getSheetByName(sheetName);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const status = data[i][4];
      if (['cancelled', 'passed', 'failed', 'completed'].includes(status)) continue;

      const apptRaw = data[i][apptCol];
      if (!apptRaw) continue;
      const apptDate = new Date(apptRaw);
      apptDate.setHours(0, 0, 0, 0);

      // D-3
      if (apptDate.getTime() === threeDays.getTime() && !data[i][d3Col]) {
        sheet.getRange(i + 1, d3Col + 1).setValue(true);
        _writeNotification(data[i][1], data[i][0], sheetName, apptDate, 'd3');
      }
      // D-Day
      if (apptDate.getTime() === today.getTime() && !data[i][d0Col]) {
        sheet.getRange(i + 1, d0Col + 1).setValue(true);
        _writeNotification(data[i][1], data[i][0], sheetName, apptDate, 'd0');
      }
    }
  });
}

function _writeNotification(memberId, queueId, sheetName, apptDate, notifyType) {
  // บันทึกลง PropertiesService key = NOTIFY_{memberId}
  // Client จะ poll ตอน checkSession แล้วดึงมาแสดง
  const props  = PropertiesService.getScriptProperties();
  const key    = 'NOTIFY_' + memberId;
  const raw    = props.getProperty(key);
  const list   = raw ? JSON.parse(raw) : [];
  list.push({
    queueId,
    sheetName,
    date: apptDate.toISOString(),
    type: notifyType,
    createdAt: new Date().toISOString(),
  });
  // เก็บสูงสุด 10 รายการล่าสุด
  if (list.length > 10) list.splice(0, list.length - 10);
  props.setProperty(key, JSON.stringify(list));
  
  // ✅ ส่ง LINE reminder message (เพิ่มใหม่)
  try {
    const isTest = sheetName === CONFIG.SHEETS.TEST_QUEUE;
    const masterSheet = _ss().getSheetByName(
      isTest ? CONFIG.SHEETS.MASTER_BRANCH : CONFIG.SHEETS.MASTER_COURSE
    );
    const masterData = masterSheet.getDataRange().getValues();
    
    // ดึง queue info เพื่อหา branch name
    const queueSheet = _ss().getSheetByName(sheetName);
    const queueData = queueSheet.getDataRange().getValues();
    let branchId = null;
    for (let i = 1; i < queueData.length; i++) {
      if (queueData[i][0] === queueId) {
        branchId = queueData[i][2];  // col C = branchId
        break;
      }
    }
    
    let branchName = 'สาขา/หลักสูตร';
    if (branchId) {
      for (let j = 1; j < masterData.length; j++) {
        if (masterData[j][0] === branchId) {
          branchName = masterData[j][1];
          break;
        }
      }
    }
    
    const appointmentDate = Utilities.formatDate(apptDate, 'Asia/Bangkok', 'dd/MM/yyyy');
    const messageType = notifyType === 'd3' ? 'd3_reminder' : 'd0_reminder';
    
    const reminderMsg = sendMessage(memberId, messageType, {
      queueId: queueId,
      branchName: branchName,
      appointedDate: appointmentDate
    });
    
    Logger.log('📤 ' + messageType.toUpperCase() + ' sent for ' + queueId + ': ' + 
               (reminderMsg && reminderMsg.success ? '✓' : '✗'));
  } catch (e) {
    Logger.log('⚠️ Error sending ' + notifyType + ' reminder: ' + e.message);
  }
}

// เรียกเพื่อตั้ง Trigger ครั้งแรก (run once จาก editor)
function setupTrigger() {
  // ลบ trigger เก่าก่อน (ถ้ามี)
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'dailyAt7AM') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyAt7AM')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .inTimezone('Asia/Bangkok')
    .create();
  Logger.log('Trigger ตั้งแล้ว: dailyAt7AM ทุกวัน 07:00 (Asia/Bangkok)');
}

// ── SHEET INITIALIZER (Run once) ──────────────────────────────

// เรียกครั้งเดียวตอน setup: สร้าง Sheet + Headers ทั้งหมด
function initSheets() {
  const ss = _ss();
  const sheets = {
    [CONFIG.SHEETS.MEMBERS]: [
      'memberId','phone','idCard','fullName','fullNameEN','birthDate',
      'address','moo','subDistrict','district','province','postalCode',
      'education','otpHash','otpAttempts','sessionToken',
      'lineUserId','calendarAuth','createdAt','profileJson',
      'titleTH','titleEN',
    ],
    [CONFIG.SHEETS.TEST_QUEUE]: [
      'queueId','memberId','branchId','level','status',
      'appointedDate','calendarEventId','notifyD3Sent','notifyD0Sent',
      'memberAcknowledged','pdfUrl','appliedAt','updatedAt',
    ],
    [CONFIG.SHEETS.TRAINING_QUEUE]: [
      'enrollId','memberId','courseId','status',
      'appointedDate','calendarEventId','notifyD3Sent','notifyD0Sent',
      'memberAcknowledged','appliedAt',
    ],
    [CONFIG.SHEETS.MASTER_BRANCH]: [
      'branchId','branchName','levels','maxQueue','currentQueue','isOpen','docTemplateId',
    ],
    [CONFIG.SHEETS.MASTER_COURSE]: [
      'courseId','courseName','durationDays','maxSeats','currentQueue','isOpen','docTemplateId',
    ],
    [CONFIG.SHEETS.MESSAGING_LOG]: [
      'timestamp', 'messageId', 'recipientId', 'lineUserId', 
      'messageType', 'provider', 'status', 'responseCode', 
      'errorMessage', 'duration_ms', 'createdAt'
    ],
  };

  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log('สร้าง sheet: ' + name);
    }
    // เขียน header แถวแรก ถ้ายังว่าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1D4ED8')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      const lastCol = sheet.getLastColumn() || 1;
      const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const missingHeaders = headers.filter(h => !existingHeaders.includes(h));
      if (missingHeaders.length > 0) {
        const startCol = existingHeaders.length + 1;
        sheet.getRange(1, startCol, 1, missingHeaders.length)
          .setValues([missingHeaders])
          .setBackground('#1D4ED8')
          .setFontColor('#FFFFFF')
          .setFontWeight('bold');
      }
    }
  });
  Logger.log('✅ initSheets() เสร็จแล้ว — พร้อมใช้งาน');
}

// ── 9. MESSAGING API (LINE Integration) ────────────────────────
// Main messaging function
function sendMessage(recipientId, messageType, data) {
  try {
    const startTime = new Date().getTime();
    
    // Get recipient info (memberId or phone)
    const recipientInfo = _getRecipientInfo(recipientId);
    if (!recipientInfo) {
      return _err('ไม่พบข้อมูลผู้รับ');
    }
    
    // Get LINE user ID from member data
    let lineUserId = _getMemberLineUserId(recipientId);
    if (!lineUserId) {
      // Fallback: Store member's LINE ID or phone for later
      Logger.log('⚠️ ไม่พบ LINE User ID สำหรับ: ' + recipientId);
      return { success: false, error: 'No LINE User ID' };
    }
    
    // Generate message template
    const messageBody = _generateMessageTemplate(messageType, data);
    if (!messageBody) {
      return { success: false, error: 'Unknown message type: ' + messageType };
    }
    
    // Send via provider (LINE)
    const messageId = _genId() + '_' + messageType;
    const sendResult = _sendLineMessage(lineUserId, messageBody, messageId);
    
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    
    // Log the message
    if (CONFIG.MESSAGING.MESSAGING_LOG_ENABLED) {
      _logMessage({
        messageId: messageId,
        recipientId: recipientId,
        lineUserId: lineUserId,
        messageType: messageType,
        provider: 'line',
        status: sendResult.success ? 'sent' : 'failed',
        responseCode: sendResult.status || '',
        errorMessage: sendResult.error || '',
        duration: duration,
        timestamp: new Date().toISOString()
      });
    }
    
    return sendResult;
  } catch (e) {
    Logger.log('❌ sendMessage error: ' + e.message);
    return { success: false, error: e.message };
  }
}

// Send via LINE Messaging API (with Retry Logic)
function _sendLineMessage(lineUserId, messageBody, messageId) {
  const maxAttempts = CONFIG.MESSAGING.RETRY_ATTEMPTS || 3;
  const delayMs = CONFIG.MESSAGING.RETRY_DELAY_MS || 2000;
  
  let response = null;
  let status = null;
  let result = null;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const token = _cfg('LINE_CHANNEL_ACCESS_TOKEN', CONFIG.MESSAGING.LINE_CHANNEL_ACCESS_TOKEN) || LINE_TOKEN;
      const url = CONFIG.MESSAGING.LINE_PUSH_URL || 'https://api.line.me/v2/bot/message/push';
      
      const payload = {
        to: lineUserId,
        messages: [messageBody]
      };
      
      const options = {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      response = UrlFetchApp.fetch(url, options);
      status = response.getResponseCode();
      result = JSON.parse(response.getContentText());
      
      Logger.log('📤 LINE API Response [' + messageId + '] (Attempt ' + attempt + '/' + maxAttempts + '): ' + status);
      
      if (status === 200) {
        return { success: true, status: status, messageId: messageId };
      } else {
        lastError = result.message || 'LINE API error';
      }
    } catch (e) {
      Logger.log('❌ _sendLineMessage error (Attempt ' + attempt + '/' + maxAttempts + '): ' + e.message);
      lastError = e.message;
    }
    
    // หน่วงเวลาก่อนลองใหม่ (ยกเว้นรอบสุดท้าย)
    if (attempt < maxAttempts) {
      Utilities.sleep(delayMs);
    }
  }
  
  return { 
    success: false, 
    status: status || 500, 
    error: lastError || 'LINE API error after retries',
    messageId: messageId
  };
}

// Get member's LINE User ID (stored in Members sheet)
function _getMemberLineUserId(memberId) {
  try {
    const ss = _ss();
    const memSheet = ss.getSheetByName(CONFIG.SHEETS.MEMBERS);
    const memData = memSheet.getDataRange().getValues();
    const memCol = _memberCols();
    
    for (let i = 1; i < memData.length; i++) {
      if (memData[i][memCol.memberId] === memberId) {
        return memData[i][memCol.lineUserId] || null;
      }
    }
    return null;
  } catch (e) {
    Logger.log('❌ _getMemberLineUserId error: ' + e.message);
    return null;
  }
}

// Get recipient info
function _getRecipientInfo(recipientId) {
  try {
    const ss = _ss();
    const memSheet = ss.getSheetByName(CONFIG.SHEETS.MEMBERS);
    const memData = memSheet.getDataRange().getValues();
    const memCol = _memberCols();
    
    for (let i = 1; i < memData.length; i++) {
      if (memData[i][memCol.memberId] === recipientId) {
        return {
          memberId: memData[i][memCol.memberId],
          phone: memData[i][memCol.phone],
          fullName: memData[i][memCol.fullName],
          email: null // Add email column later
        };
      }
    }
    return null;
  } catch (e) {
    Logger.log('❌ _getRecipientInfo error: ' + e.message);
    return null;
  }
}

// Generate message template (flex message format for LINE)
function _generateMessageTemplate(messageType, data) {
  switch (messageType) {
    case 'otp':
      return {
        type: 'text',
        text: '🔐 รหัส OTP ของคุณ: ' + data.otp + '\n\n⏰ หมดอายุใน ' + data.expiryMinutes + ' นาที\n\n📱 DSD Yala Queue System'
      };
    
    case 'appointment':
      return {
        type: 'text',
        text: '📢 แจ้งเตือนนัดหมายจาก สพร.24 ยะลา\n' +
              'ท่านได้รับการนัดหมายในวันที่ ' + data.appointedDate + ' น.\n\n' +
              'กรุณากดลิงก์ด้านล่างเพื่อเข้าสู่ระบบ ยืนยันการนัดหมาย และบันทึกลงปฏิทินของท่านค่ะ 👇\n' + 
              data.webAppUrl
      };
    
    case 'd3_reminder':
      return {
        type: 'text',
        text: '⏰ เตือน: ทดสอบในอีก 3 วัน\n\n' +
              '🎯 รหัสคิว: ' + data.queueId + '\n' +
              '📅 วันที่: ' + data.appointedDate + '\n' +
              '🏢 สาขา: ' + data.branchName + '\n\n' +
              '⚠️ โปรดเตรียมตัวให้พร้อม'
      };
    
    case 'd0_reminder':
      return {
        type: 'text',
        text: '⏰ เตือน: วันทดสอบวันนี้\n\n' +
              '🎯 รหัสคิว: ' + data.queueId + '\n' +
              '⏱️ เวลา: 09:00 น. เป็นต้นไป\n' +
              '📍 สถานที่: สำนักงาน สพร.24 ยะลา\n\n' +
              '🚗 โปรดมาประทับตัวตรงเวลา'
      };
    
    case 'acknowledgment':
      return {
        type: 'text',
        text: '✅ ยืนยันการรับนัดหมาย\n\n' +
              '🎯 รหัสคิว: ' + data.queueId + '\n' +
              '✓ บันทึกลงปฏิทินของคุณแล้ว\n\n' +
              '📱 ขอบคุณที่ใช้งานระบบ DSD Yala'
      };
    
    case 'cancellation':
      return {
        type: 'text',
        text: '❌ ยกเลิกคิวสำเร็จ\n\n' +
              '🎯 รหัสคิว: ' + data.queueId + '\n' +
              '📝 เหตุผล: ' + (data.reason || 'ยกเลิกตามคำขอของผู้ใช้') + '\n\n' +
              'หากต้องการสมัครใหม่ สามารถเข้ามาที่ระบบได้'
      };
    
    default:
      return null;
  }
}

// Log message to MessagingLog sheet
function _logMessage(logData) {
  try {
    const ss = _ss();
    let sheet = ss.getSheetByName(CONFIG.SHEETS.MESSAGING_LOG);
    
    // Create sheet if not exists
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.MESSAGING_LOG);
      sheet.appendRow([
        'timestamp', 'messageId', 'recipientId', 'lineUserId', 
        'messageType', 'provider', 'status', 'responseCode', 
        'errorMessage', 'duration_ms', 'createdAt'
      ]);
    }
    
    // Append log entry
    sheet.appendRow([
      logData.timestamp,
      logData.messageId,
      logData.recipientId,
      logData.lineUserId || '',
      logData.messageType,
      logData.provider,
      logData.status,
      logData.responseCode,
      logData.errorMessage || '',
      logData.duration,
      new Date().toISOString()
    ]);
  } catch (e) {
    Logger.log('❌ _logMessage error: ' + e.message);
  }
}

// Test LINE message
function testLineMessage() {
  Logger.log('Testing LINE Message...');
  
  // Mock data
  const result = sendMessage('MEM001', 'otp', {
    otp: '123456',
    expiryMinutes: 5
  });
  
  Logger.log('Result: ' + JSON.stringify(result));
}

// ทดสอบง่ายๆ
function simpleTest() {
  Logger.log('✓ Simple Test - Browser.msgBox works!');
}

// ทดสอบ Logger
function testLogger() {
  Logger.log('✓ TEST LOGGER - This is a test');
}

// สร้าง Admin Password Hash (standalone - ไม่พึ่ง helper ใดๆ)
function generateAdminHash() {
  try {
    const password = 'dsd2495';
    
    // คำนวณ SHA256 โดยตรง ไม่ผ่าน _sha256()
    const rawBytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password,
      Utilities.Charset.UTF_8
    );
    const hash = rawBytes.map(function(b) {
      return ('0' + (b & 0xff).toString(16)).slice(-2);
    }).join('');
    
    // เขียนลง Spreadsheet ให้เห็นชัด
    const sheet = _ss().getSheets()[0];
    sheet.getRange('A1').setValue(hash);
    sheet.getRange('A2').setValue('← คัดลอก hash นี้ใส่ Script Properties: ADMIN_HASH');
    
    return 'DONE: ' + hash;
  } catch(err) {
    return 'ERROR: ' + err.message;
  }
}

// ── 10. SHEET HELPERS ──────────────────────────────────────────

function _ss() {
  return SpreadsheetApp.openById(_cfg('SPREADSHEET_ID', CONFIG.SPREADSHEET_ID));
}

// โหลด Sheet แบบทนทาน (ถ้าไม่มีชีท จะสร้างตารางเริ่มต้นให้อัตโนมัติ ป้องกันระบบพัง)
function _sheet(name) {
  const ss = _ss();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    initSheets();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
}

function _memberCols() {
  return {
    memberId:      0,
    phone:         1,
    idCard:        2,
    fullName:      3,
    fullNameEN:    4,
    birthDate:     5,
    address:       6,
    moo:           7,
    subDistrict:   8,
    district:      9,
    province:      10,
    postalCode:    11,
    education:     12,
    otpHash:       13,
    otpAttempts:   14,
    sessionToken:  15,
    lineUserId:    16,
    calendarAuth:  17,
    createdAt:     18,
    profileJson:   19,
    titleTH:       20,
    titleEN:       21,
  };
}

function _genId() {
  const d = new Date();
  return d.getFullYear().toString().slice(2)
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(Math.floor(Math.random() * 9000 + 1000));
}

function _genToken() {
  return Utilities.getUuid().replace(/-/g, '');
}

function _sha256(input) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  return raw.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function _ok(data) {
  return JSON.stringify({ success: true, data });
}

function _err(message) {
  return JSON.stringify({ success: false, error: message });
}

// ═══════════════════════════════════════════════════════
// รัน setAdminHash() ครั้งเดียว เพื่อบันทึก hash ลง PropertiesService
// (ไม่ต้องใช้ SpreadsheetApp — ไม่ต้องขอสิทธิ์พิเศษ!)
// ═══════════════════════════════════════════════════════
function setAdminHash() {
  const hash = _sha256('dsd2495');
  PropertiesService.getScriptProperties().setProperty('ADMIN_HASH', hash);
  Logger.log('✅ บันทึก ADMIN_HASH สำเร็จ: ' + hash);
}

// แปลงค่าวันที่เป็น ISO String อย่างปลอดภัย ป้องกันกรณีเซลล์ในชีตไม่ได้เป็นรูปแบบวันที่
function _toIsoStringSafe(val) {
  if (!val) return null;
  try {
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    return null;
  }
}

// =========================================================
// 🔔 NOTIFICATION HELPER
// =========================================================
function _createNotification(memberId, type, queueId, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let notifSheet = ss.getSheetByName("Notifications");
    
    // ถ้ายังไม่มีชีต Notifications ให้ระบบสร้างให้โดยอัตโนมัติ
    if (!notifSheet) {
      notifSheet = ss.insertSheet("Notifications");
      notifSheet.appendRow(["id", "memberId", "type", "queueId", "message", "read", "date"]);
      // ตกแต่งหัวตารางนิดหน่อย
      notifSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6");
      notifSheet.setFrozenRows(1);
    }
    
    // สร้างรหัสแจ้งเตือน และเวลาปัจจุบัน
    const notifId = "NOTIF-" + Utilities.getUuid().substring(0, 6).toUpperCase();
    const now = new Date().toISOString();
    
    // บันทึกข้อมูลลงชีต (id, memberId, type, queueId, message, read, date)
    notifSheet.appendRow([notifId, memberId, type, queueId, message, false, now]);
    
    return true;
  } catch(e) {
    console.error("Error creating notification: " + e);
    return false;
  }
}

// ═══ 11. LINE MESSAGING API WEBHOOK ═══════════════════════════
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var events = body.events || [];
    for (var i = 0; i < events.length; i++) {
      var evt = events[i];
      var replyToken = evt.replyToken;
      var userId = evt.source.userId;

      if (evt.type === 'follow') {
        _replyMessage(replyToken, [{ 
          type: 'text', 
          text: '\uD83D\uDC4B \u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\u0E04\u0E23\u0E31\u0E1A!\n\n\u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E04\u0E34\u0E27 DSD \u0E22\u0E30\u0E25\u0E32\n\n\u0E01\u0E23\u0E38\u0E13\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C **\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C** \u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E04\u0E34\u0E27 (10 \u0E2B\u0E25\u0E31\u0E01) \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E04\u0E23\u0E31\u0E1A\n\n\uD83D\uDCF1 \u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07: 0812345678' 
        }]);
        continue;
      }

      if (evt.type === 'message' && evt.message.type === 'text') {
        var text = evt.message.text.trim();
        var p = text.replace(/[^0-9]/g, '');
        if (p.startsWith('66') && p.length === 11) p = '0' + p.substring(2);

        if (/^0[0-9]{9}$/.test(p)) {
          var sheet = _sheet(CONFIG.SHEETS.MEMBERS);
          var data = sheet.getDataRange().getValues();
          var col = _memberCols();
          var foundRow = -1;
          var memberName = '';
          for (var r = 1; r < data.length; r++) {
            var rowPhone = String(data[r][col.phone]).replace(/[^0-9]/g, '');
            if (rowPhone.startsWith('66') && rowPhone.length === 11) rowPhone = '0' + rowPhone.substring(2);
            
            if (rowPhone === p) { 
              foundRow = r; 
              memberName = String(data[r][col.fullName] || '');
              break; 
            }
          }

          if (foundRow !== -1) {
            sheet.getRange(foundRow + 1, col.lineUserId + 1).setValue(userId);
            var successMsg = '\u2705 \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E04\u0E23\u0E31\u0E1A!\n\n\uD83D\uDC64 \u0E04\u0E38\u0E13: ' + memberName + '\n\uD83D\uDCF1 \u0E40\u0E1A\u0E2D\u0E23\u0E4C: ' + p + '\n\n\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E1C\u0E48\u0E32\u0E19 LINE \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E16\u0E34\u0E07\u0E04\u0E34\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E04\u0E23\u0E31\u0E1A \uD83D\uDD14';
            _replyMessage(replyToken, [{ type: 'text', text: successMsg }]);
          } else {
            var notFoundMsg = '\u274C \u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E1A\u0E2D\u0E23\u0E4C ' + p + ' \u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E23\u0E31\u0E1A\n\n\u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E04\u0E34\u0E27 \u0E2B\u0E23\u0E37\u0E2D\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E40\u0E08\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48';
            _replyMessage(replyToken, [{ type: 'text', text: notFoundMsg }]);
          }
        } else {
           var instructionMsg = '\uD83D\uDC4B \u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E35\u0E04\u0E23\u0E31\u0E1A!\n\u0E01\u0E23\u0E38\u0E13\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C **\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C** \u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E04\u0E34\u0E27 (10 \u0E2B\u0E25\u0E31\u0E01) \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E04\u0E23\u0E31\u0E1A\n\n\uD83D\uDCF1 \u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07: 0812345678';
           _replyMessage(replyToken, [{ type: 'text', text: instructionMsg }]);
        }
      } else if (evt.type === 'unfollow') {
         var sheet = _sheet(CONFIG.SHEETS.MEMBERS);
         var data = sheet.getDataRange().getValues();
         var col = _memberCols();
         for (var r = 1; r < data.length; r++) {
           if (data[r][col.lineUserId] === userId) {
             sheet.getRange(r + 1, col.lineUserId + 1).setValue('');
             break;
           }
         }
      }
    }
    return ContentService.createTextOutput('OK');
  } catch (err) {
    console.error('doPost Error:', err);
    return ContentService.createTextOutput('Error');
  }
}

function _replyMessage(replyToken, messages) {
  var token = _cfg('LINE_CHANNEL_ACCESS_TOKEN', CONFIG.MESSAGING.LINE_CHANNEL_ACCESS_TOKEN) || LINE_TOKEN;
  if (!token) return;
  var url = 'https://api.line.me/v2/bot/message/reply';
  var options = {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    payload: JSON.stringify({ replyToken: replyToken, messages: messages }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);
}


// ═══════════════════════════════════════════════════════
// ฟังก์ชันส่ง Flex Message แจ้งเตือนคิว
// ═══════════════════════════════════════════════════════
function pushQueueCallMessage(lineUid, queueInfo) {
  var token = _cfg('LINE_CHANNEL_ACCESS_TOKEN', CONFIG.MESSAGING.LINE_CHANNEL_ACCESS_TOKEN) || LINE_TOKEN;
  if (!token || !lineUid) return false;
  try {
    const now = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'HH:mm \u0E19.');
    const payload = {
      to: lineUid,
      messages: [
        {
          type: 'flex',
          altText: '\uD83D\uDD14 \u0E16\u0E36\u0E07\u0E04\u0E34\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E41\u0E25\u0E49\u0E27! \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02 ' + queueInfo.queueNo,
          contents: {
            type: 'bubble',
            size: 'mega',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '\uD83D\uDD14 \u0E16\u0E36\u0E07\u0E04\u0E34\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E41\u0E25\u0E49\u0E27!', weight: 'bold', size: 'xl', color: '#ffffff' },
                { type: 'text', text: 'DSD \u0E22\u0E30\u0E25\u0E32', size: 'sm', color: '#ffffff99' }
              ],
              backgroundColor: '#1751c8',
              paddingAll: '20px',
            },
            body: {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E04\u0E34\u0E27', size: 'sm', color: '#555555', flex: 2 },
                    { type: 'text', text: String(queueInfo.queueNo), size: 'xxl', weight: 'bold', color: '#1751c8', align: 'end', flex: 1 }
                  ]
                },
                { type: 'separator' },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: '\uD83D\uDC64 \u0E0A\u0E37\u0E48\u0E2D', size: 'sm', color: '#555555', flex: 3 },
                        { type: 'text', text: String(queueInfo.name), size: 'sm', weight: 'bold', align: 'end', flex: 4 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: '\u23F0 \u0E40\u0E27\u0E25\u0E32', size: 'sm', color: '#555555', flex: 3 },
                        { type: 'text', text: now, size: 'sm', weight: 'bold', align: 'end', flex: 4 }
                      ]
                    }
                  ]
                }
              ],
              paddingAll: '20px',
            }
          }
        }
      ]
    };
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
    return response.getResponseCode() === 200;
  } catch (err) {
    Logger.log('pushQueueCallMessage error: ' + err.message);
    return false;
  }
}
// Force clasp update
