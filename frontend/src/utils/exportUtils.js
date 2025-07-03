import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

//Method to export as CSV
export const exportToCSV = (data, filename, headers, mapper) => {
  if (!data || data.length === 0) return;
  console.log(data);
  console.log(headers);
  console.log(mapper);
  const headerRow = headers.join(",");

  //Convert row data into array of values within ""
  const rows = [];

  data.forEach((item) => {
    const mappedRow = mapper(item);
    const quotedValues = mappedRow.map((val) => `"${val}"`); //To make sure already existing , or " are preserved
    const csvRow = quotedValues.join(",");
    rows.push(csvRow);
  });

  //CSV string with line breaks to represnet each row
  const csv = [headerRow, ...rows].join("\n");

  //Convert data into blob
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  //Download the blob as csv
  saveAs(blob, `${filename}.csv`);
};

//Method to export as PDF
export const exportToPDF = (data, filename, headers, mapper) => {
  const doc = new jsPDF();
  const tableColumn = headers;
  const tableRows = [];

  //Covert row data into array of values
  data.forEach((item) => {
    const row = mapper(item);
    tableRows.push(row);
  });
  const exportDate = dayjs().format("YYYY-MM-DD HH:mm");

  doc.text("Bug Report Export", 14, 15);
  doc.setFontSize(10);
  doc.text(`Exported on: ${exportDate}`, 14, 22);

  //Use autotable plugin to add tablein the pdf
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    styles: { fontSize: 9 },
  });

  //Save pdf with timestamp
  doc.save(`${filename}_${dayjs().format("YYYY-MM-DD_HH-mm")}.pdf`);
};
