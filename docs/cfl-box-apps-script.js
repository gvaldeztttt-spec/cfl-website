/**
 * Paste this into Google Apps Script (Extensions → Apps Script on your Sheet).
 * Then: Deploy → Manage deployments → Edit (pencil) → New version → Deploy
 *
 * Tab name must be exactly: Inscripciones
 * Header row must match the form field names.
 */
const SHEET_NAME = "Inscripciones";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // Works when the script is bound to the Sheet (opened from Extensions → Apps Script)
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    if (!doc) {
      return json_({ result: "error", message: "No active spreadsheet. Open Apps Script from the Sheet." });
    }

    const sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return json_({ result: "error", message: 'Missing tab named "Inscripciones"' });
    }

    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
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

function doGet() {
  return json_({ result: "ok", message: "CFL Box endpoint ready" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
