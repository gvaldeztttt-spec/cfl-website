/**
 * Paste this into Google Apps Script (Extensions → Apps Script on your Sheet).
 * Then: Deploy → Manage deployments → Edit (pencil) → New version → Deploy
 *
 * Daily signup mail: select installCommsDigestTrigger in the toolbar and click Run
 * once. Approve the email permission. After that, a note goes to
 * info@continentalfightleague.com every day at 8:00 PM Atlantic Time.
 *
 * Tab "Inscripciones" is the championship form. Header row must match those field names.
 * Signups with form: "comms" go to a tab named Comms, created automatically.
 */
const SHEET_NAME = "Inscripciones";
const SCRIPT_VERSION = "comms-3";
const COMMS_DIGEST_TO = "info@continentalfightleague.com";
const COMMS_DIGEST_TZ = "America/Santo_Domingo";

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

function installCommsDigestTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "sendCommsDigest") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger("sendCommsDigest").timeBased().everyHours(1).create();
}

function sendCommsDigest() {
  const now = new Date();
  const hour = Number(Utilities.formatDate(now, COMMS_DIGEST_TZ, "H"));
  if (hour !== 20) return;

  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(now, COMMS_DIGEST_TZ, "yyyy-MM-dd");
  if (props.getProperty("COMMS_DIGEST_DATE") === today) return;

  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc ? doc.getSheetByName(COMMS_SHEET) : null;
  const since = Number(props.getProperty("COMMS_DIGEST_LAST_MS") || "0");
  const rows = sheet ? newCommsRows_(sheet, since) : [];
  const count = rows.length;
  const lines = [
    count === 0
      ? "No new signups since the last update."
      : count + " new signup" + (count === 1 ? "" : "s") + " since the last update.",
    "",
  ];
  rows.forEach(function (row) {
    lines.push(row.name ? row.name + " — " + row.email : row.email);
  });
  if (count) {
    lines.push("", "Emails");
    rows.forEach(function (row) { lines.push(row.email); });
  }

  MailApp.sendEmail({
    to: COMMS_DIGEST_TO,
    subject: "CFL signups: " + count + " new",
    body: lines.join("\n"),
  });

  props.setProperty("COMMS_DIGEST_DATE", today);
  props.setProperty("COMMS_DIGEST_LAST_MS", String(now.getTime()));
}

function newCommsRows_(sheet, sinceMs) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function (header) { return String(header || "").trim(); });
  const emailCol = headers.indexOf("email");
  const nameCol = headers.indexOf("name");
  const timeCol = headers.indexOf("timestamp");
  if (emailCol < 0) return [];

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const email = String(values[i][emailCol] || "").trim();
    if (!email) continue;
    const stamp = timeCol < 0 ? null : values[i][timeCol];
    const ms = stamp instanceof Date ? stamp.getTime() : Date.parse(String(stamp || ""));
    if (sinceMs && !isNaN(ms) && ms <= sinceMs) continue;
    rows.push({
      email: email,
      name: nameCol < 0 ? "" : String(values[i][nameCol] || "").trim(),
      ms: isNaN(ms) ? 0 : ms,
    });
  }
  rows.sort(function (a, b) { return a.ms - b.ms; });
  return rows;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
