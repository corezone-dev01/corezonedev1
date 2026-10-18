/** COREZONEDEV lead capture. Bind to the "COREZONEDEV CRM" sheet (Extensions > Apps Script). */
const OWNER_EMAIL = "PASTE_BUSINESS_EMAIL";
const SHEET_NAME = "Leads";
const SERVICES = ["Web development","AI solutions","Business automation","Custom software","Business digitalisation","Not sure yet"];
const HEADERS = ["Timestamp","Lead ID","Client name","Company","Email","WhatsApp","Service","Budget","Project details","Source","Consent","Lead status","Follow-up date","Assigned person","Internal notes"];

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (_) { return out({ ok: false, error: "Invalid request" }); }
  if (d.website) return out({ ok: true, leadId: "OK" });            // honeypot: pretend success to bots
  const clean = (v, n) => String(v || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
  const safe = v => /^[=+\-@\t\r]/.test(v) ? "'" + v : v;         // blocks spreadsheet formula injection
  const lead = { name: clean(d.name,100), company: clean(d.company,120), email: clean(d.email,254).toLowerCase(),
    whatsapp: clean(d.whatsapp,20), service: clean(d.service,60), budget: clean(d.budget,40),
    details: clean(d.details,2000), source: clean(d.source,60) };
  if (lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) ||
      SERVICES.indexOf(lead.service) < 0 || lead.details.length < 10 || d.consent !== true)
    return out({ ok: false, error: "Validation failed" });
  if (lead.whatsapp && !/^\+?[\d\s()-]{7,20}$/.test(lead.whatsapp)) return out({ ok: false, error: "Validation failed" });

  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  const id = "CZ-" + Utilities.formatDate(new Date(), "UTC", "yyMMdd") + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    sh.appendRow([new Date(), id, safe(lead.name), safe(lead.company), safe(lead.email), safe(lead.whatsapp), lead.service,
      safe(lead.budget), safe(lead.details), safe(lead.source), "Yes", "New", "", "", ""]);
  } catch (err) { return out({ ok: false, error: "Could not save inquiry" }); }
  finally { lock.releaseLock(); }

  try {   // email failure is reported separately and never loses the lead
    MailApp.sendEmail(OWNER_EMAIL, "New COREZONEDEV inquiry — " + lead.name,
      ["Lead ID: " + id, "Time: " + new Date(), "Name: " + lead.name, "Company: " + lead.company, "Email: " + lead.email,
       "WhatsApp: " + lead.whatsapp, "Service: " + lead.service, "Budget: " + lead.budget, "", lead.details, "",
       "CRM: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()].join("\n"));
  } catch (err) { console.error("Owner email failed"); return out({ ok: true, leadId: id, emailed: false }); }
  return out({ ok: true, leadId: id, emailed: true });
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
