/**
 * import_from_excel.js
 * Import data from Excel file into SQLite database via Prisma
 * Sheets: Members, MasterBranch, MasterCourse
 */

const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Convert Excel serial date number to Date object
function excelDateToJSDate(serial) {
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    return new Date(utc_value * 1000);
  }
  // Try parse as string date
  const d = new Date(serial);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function importMasterBranch(data) {
  console.log(`\n--- Importing MasterBranch (${data.length} rows) ---`);
  let created = 0, skipped = 0;

  for (const row of data) {
    const name = row.branchName?.trim();
    if (!name) { skipped++; continue; }

    // Check if already exists by name
    const existing = await prisma.masterBranch.findFirst({ where: { branchName: name } });
    if (existing) {
      console.log(`  SKIP (exists): ${name}`);
      skipped++;
      continue;
    }

    await prisma.masterBranch.create({
      data: {
        branchName: name,
        levels: String(row.levels ?? 1),
        maxQueue: Number(row.maxQueue ?? 20),
        LocationName: row.LocationName || null,
        LocationGPS: row.LocationGPS || null,
        status: row.isOpen === true || row.isOpen === 'true' || row.isOpen === 1 ? 'active' : 'inactive',
      }
    });
    console.log(`  CREATED: ${name}`);
    created++;
  }
  console.log(`  => Created: ${created}, Skipped: ${skipped}`);
}

async function importMasterCourse(data) {
  console.log(`\n--- Importing MasterCourse (${data.length} rows) ---`);
  let created = 0, skipped = 0;

  for (const row of data) {
    const name = row.courseName?.trim();
    if (!name) { skipped++; continue; }

    const existing = await prisma.masterCourse.findFirst({ where: { courseName: name } });
    if (existing) {
      console.log(`  SKIP (exists): ${name}`);
      skipped++;
      continue;
    }

    // Parse Date range "2026-06-01|2026-06-05"
    let dateStart = null;
    let dateEnd = null;
    if (row.Date) {
      if (typeof row.Date === 'string' && row.Date.includes('|')) {
        [dateStart, dateEnd] = row.Date.split('|');
      } else if (typeof row.Date === 'number') {
        dateStart = excelDateToJSDate(row.Date).toISOString().split('T')[0];
      } else {
        dateStart = String(row.Date);
      }
    }

    await prisma.masterCourse.create({
      data: {
        courseName: name,
        durationDays: Number(row.durationDays ?? 5),
        maxSeats: Number(row.maxSeats ?? 20),
        currentQueue: Number(row.currentQueue ?? 0),
        LocationName: row.LocationName || null,
        LocationGPS: row.LocationGPS || null,
        Date: dateStart || null,
        DateEnd: dateEnd || null,
        status: row.isOpen === true || row.isOpen === 'true' || row.isOpen === 1 ? 'active' : 'inactive',
      }
    });
    console.log(`  CREATED: ${name} (${dateStart} - ${dateEnd ?? '-'})`);
    created++;
  }
  console.log(`  => Created: ${created}, Skipped: ${skipped}`);
}

async function importMembers(data) {
  console.log(`\n--- Importing Members (${data.length} rows) ---`);
  let created = 0, skipped = 0;
  const defaultPassword = 'dsd1234'; // default password for imported members

  for (const row of data) {
    const phone = String(row.phone || '').trim();
    if (!phone) { console.log('  SKIP: no phone'); skipped++; continue; }

    const existing = await prisma.user.findFirst({ where: { phoneNumber: phone } });
    if (existing) {
      console.log(`  SKIP (exists): ${row.fullName} / ${phone}`);
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Build profileJson from Members sheet data
    const profileJson = JSON.stringify({
      register_type: '01',
      reg_title: row.titleTH === 'นาย' ? '001' : row.titleTH === 'นาง' ? '002' : '003',
      reg_firstname: row.fullName?.split(' ')[0] || '',
      reg_lastname: row.fullName?.split(' ').slice(1).join(' ') || '',
      reg_citizenid: String(row.idCard || ''),
      reg_birth: row.birthDate ? String(row.birthDate) : '',
      reg_telephone: phone,
      reg_email: row.email || '',
      reg_address_no: row.address || '',
      reg_address_moo: row.moo || '',
      reg_address_subdistrict: row.subDistrict || '',
      reg_address_district: row.district || '',
      reg_address_province: row.province || '',
      postcode: row.postalCode || '',
      reg_education: row.education || '03',
      gender: row.titleTH === 'นาย' ? '1' : '2',
      nationality: '099',
      info_type: '04',
      info_agree: '1',
      info_findjob: '1',
      profileImage: '',
      sign_img: '',
      regist_date: new Date().toISOString().split('T')[0],
      // extra raw fields from Excel (safe parse - truncated JSON in Excel is possible)
      ...(() => { try { return row.profileJson ? JSON.parse(row.profileJson) : {}; } catch { return {}; } })(),
    });

    const memberId = row.memberId || null;

    await prisma.user.create({
      data: {
        phoneNumber: phone,
        email: row.email || null,
        passwordHash,
        fullName: row.fullName || '',
        role: 'member',
        memberId,
        lineUserId: row.lineUserId || null,
        profileJson,
      }
    });
    console.log(`  CREATED: ${row.fullName} / ${phone} / memberId=${memberId}`);
    created++;
  }
  console.log(`  => Created: ${created}, Skipped: ${skipped}`);
  if (created > 0) console.log(`  Default password: "${defaultPassword}"`);
}

async function main() {
  console.log('=== EXCEL IMPORT STARTED ===');
  console.log('File: public/DSD YALA SKILL & TRAINING QUEUE SYSTEM.xlsx');

  const wb = xlsx.readFile('public/DSD YALA SKILL & TRAINING QUEUE SYSTEM.xlsx');

  // 1. MasterBranch
  if (wb.SheetNames.includes('MasterBranch')) {
    const data = xlsx.utils.sheet_to_json(wb.Sheets['MasterBranch']);
    await importMasterBranch(data);
  }

  // 2. MasterCourse
  if (wb.SheetNames.includes('MasterCourse')) {
    const data = xlsx.utils.sheet_to_json(wb.Sheets['MasterCourse']);
    await importMasterCourse(data);
  }

  // 3. Members (Users)
  if (wb.SheetNames.includes('Members')) {
    const data = xlsx.utils.sheet_to_json(wb.Sheets['Members']);
    await importMembers(data);
  }

  console.log('\n=== IMPORT COMPLETE ===');
}

main()
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
