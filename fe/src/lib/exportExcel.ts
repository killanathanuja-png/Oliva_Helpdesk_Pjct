import * as XLSX from "xlsx";

export function exportToExcel(data: Record<string, unknown>[], fileName: string, sheetName = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  // Build the file as a Blob and trigger a direct anchor download. This avoids
  // some browsers' default Save-As prompt that XLSX.writeFile can sometimes show.
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer cleanup so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
