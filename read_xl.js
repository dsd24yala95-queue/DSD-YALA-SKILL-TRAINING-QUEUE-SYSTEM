const xlsx = require('xlsx');
const wb = xlsx.readFile('public/DSD YALA SKILL & TRAINING QUEUE SYSTEM.xlsx');
console.log("Sheets:", wb.SheetNames);
for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log("Total Rows:", data.length);
    if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
        console.log("Row 1:", data[0]);
    }
}
