/**
 * Paste this into Google Apps Script (Extensions → Apps Script on your Sheet).
 * Then: Deploy → Manage deployments → Edit (pencil) → New version → Deploy
 *
 * Tab "Inscripciones" is the championship form. Header row must match those field names.
 * Signups with form: "comms" go to a tab named Comms, created automatically.
 */
const SHEET_NAME = "Inscripciones";
const SCRIPT_VERSION = "comms-2";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // Works when the script is bound to the Sheet (opened from Extensions → Apps Script)
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    if (!doc) {
      return json_({ result: "error", message: "No active spreadsheet. Open Apps Script from the Sheet." });
    }

    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    if (data.form === "comms") {
      appendComms_(doc, data);
      return json_({ result: "success" });
    }

    const sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return json_({ result: "error", message: 'Missing tab named "Inscripciones"' });
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map((header) => {
      if (header === "timestamp") return new Date();
      const value = data[header];
      if (value === true || value === "true" || value === "on") return "TRUE";
      if (value === false || value === "false") return "FALSE";
      return value == null ? "" : value;
    });

    sheet.appendRow(row);
    return json_({ result: "success" });
  } catch (err) {
    return json_({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

const COMMS_SHEET = "Comms";
const COMMS_HEADERS = ["timestamp", "name", "email", "lang", "source", "tickets", "events", "news"];

function appendComms_(doc, data) {
  let sheet = doc.getSheetByName(COMMS_SHEET);
  if (!sheet) {
    sheet = doc.insertSheet(COMMS_SHEET);
    sheet.appendRow(COMMS_HEADERS);
  }

  const email = String(data.email || "").trim().toLowerCase();
  const lastRow = sheet.getLastRow();
  if (email && lastRow > 1) {
    const existing = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    const already = existing.some((row) => String(row[0] || "").trim().toLowerCase() === email);
    if (already) return;
  }

  const row = COMMS_HEADERS.map((header) => {
    if (header === "timestamp") return new Date();
    if (header === "email") return email;
    const value = data[header];
    if (value === true || value === "true") return "TRUE";
    if (value === false || value === "false") return "FALSE";
    return value == null ? "" : value;
  });
  sheet.appendRow(row);
}

function doGet() {
  return json_({ result: "ok", message: "CFL endpoint ready", version: SCRIPT_VERSION });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
