const sheetName = 'Sheet1';
const scriptProp = PropertiesService.getScriptProperties();
const recipientEmail = 'yadhumanikandan0@gmail.com'; // Replace with the recipient's email address

function intialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', activeSpreadsheet.getId());
}

function sendEmail(data) {
  const subject = 'Website | New inquiry ' + data["EMAIL"];
  let body = '';

  // Construct email body with formatted data
  for (const key in data) {
    body += `${key}: ${data[key]}\n\n`;
  }

  // Add line breaks between records for better readability
  const formattedBody = body.replace(/(?:\r\n|\r|\n){2,}/g, '\n\n');

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: formattedBody
  });
}


function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
    const sheet = doc.getSheetByName(sheetName);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    const newRow = headers.map(function (header) {
      return header === 'Date' ? new Date() : e.parameter[header];
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    // Send email with the new record data
    const recordData = {};
    headers.forEach((header, index) => {
      recordData[header] = newRow[index];
    });
    sendEmail(recordData);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
