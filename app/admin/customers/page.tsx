"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from "@/lib/admin-live";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Building,
  Plus,
  X,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Eye,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  AlertTriangle,
  Clipboard,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface ParsedCustomerRow {
  fullName: string;
  primaryMobile: string;
  alternateMobile?: string;
  email?: string;
  installationAddress: string;
  billingAddress?: string;
  propertyType?: string;
  plantCapacityKw?: string;
  solarType?: string;
  consumerNumber?: string;
  discom?: string;
  customerStatus?: string;
  isValid: boolean;
  error?: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
  const [importedFileName, setImportedFileName] = useState("");
  const [importResult, setImportResult] = useState<any>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Customer Form State
  const [formData, setFormData] = useState({
    fullName: "",
    primaryMobile: "",
    alternateMobile: "",
    email: "",
    installationAddress: "",
    propertyType: "RESIDENTIAL",
  });

  const loadRequest = useRef(0);
  const fetchCustomers = async (background = false) => {
    const request = ++loadRequest.current;
    if (!background) setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/customers");
      const data = await res.json();
      if (request !== loadRequest.current) return;
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useLiveRefresh(() => fetchCustomers(true), !loading);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          fullName: "",
          primaryMobile: "",
          alternateMobile: "",
          email: "",
          installationAddress: "",
          propertyType: "RESIDENTIAL",
        });
        fetchCustomers();
        alert("Customer created successfully!");
      } else {
        alert(data.error || "Unable to complete the request right now. Please try again.");
      }
    } catch (err: any) {
      console.error("[Customer Create Error]:", err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/customers?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      } else {
        alert(data.error || "Unable to complete the request right now. Please try again.");
      }
    } catch (err: any) {
      console.error("[Customer Delete Error]:", err);
      alert(err.message || "Unable to complete the request right now. Please try again.");
    }
  };

  // Row Validator
  const validateRow = (row: Partial<ParsedCustomerRow>): { isValid: boolean; error?: string } => {
    const cleanPhone = (row.primaryMobile || "").replace(/\D/g, "").slice(-10);
    if (!row.fullName || !row.fullName.trim()) {
      return { isValid: false, error: "Missing Name" };
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      return { isValid: false, error: "Invalid 10-digit Phone" };
    }
    if (!row.installationAddress || !row.installationAddress.trim()) {
      return { isValid: false, error: "Missing Address" };
    }
    return { isValid: true };
  };

  // Helper to process raw objects (e.g. from Excel file upload) into validated customer rows
  const processRawObjects = (rawList: Record<string, any>[]) => {
    if (!rawList || rawList.length === 0) {
      setParsedRows([]);
      return;
    }

    const validatedRows: ParsedCustomerRow[] = rawList.map((item) => {
      // Find keys case-insensitively
      const getKey = (...candidates: string[]) => {
        const found = Object.keys(item).find((k) =>
          candidates.some((c) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(c.toLowerCase().replace(/[^a-z0-9]/g, "")))
        );
        return found ? String(item[found] ?? "").trim() : "";
      };

      const fullName = getKey("fullname", "name", "customername", "client");
      const rawPhone = getKey("primarymobile", "mobile", "phone", "contact");
      const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
      const installationAddress = getKey("installationaddress", "address", "siteaddress", "location");
      const alternateMobile = getKey("alternatemobile", "alternate", "altphone", "secondphone");
      const email = getKey("email", "mail");
      const billingAddress = getKey("billingaddress", "billing");
      const propertyType = getKey("propertytype", "property", "type") || "RESIDENTIAL";
      const plantCapacityKw = getKey("plantcapacitykw", "capacity", "kw", "capacitykw") || "5.0";
      const solarType = getKey("solartype", "solar", "grid") || "ON_GRID";
      const consumerNumber = getKey("consumernumber", "consumer", "ivrs", "account");
      const discom = getKey("discom", "electricityboard", "board") || "MPMKVVCL";
      const customerStatus = getKey("customerstatus", "status") || "ACTIVE";

      const rowItem: ParsedCustomerRow = {
        fullName,
        primaryMobile: cleanPhone || rawPhone,
        alternateMobile: alternateMobile || undefined,
        email: email || undefined,
        installationAddress,
        billingAddress: billingAddress || undefined,
        propertyType,
        plantCapacityKw,
        solarType,
        consumerNumber: consumerNumber || undefined,
        discom,
        customerStatus,
        isValid: true,
      };

      const { isValid, error } = validateRow(rowItem);
      rowItem.isValid = isValid;
      rowItem.error = error;
      return rowItem;
    });

    setParsedRows(validatedRows);
  };

  // Split line with quote awareness
  const splitCSVRow = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ""));
    return result;
  };

  // Robust multi-format tabular text parser (Excel Tabs, CSV, Semicolons, with or without headers)
  const parseTabularText = (text: string): ParsedCustomerRow[] => {
    if (!text || !text.trim()) return [];

    let cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    // Fix cases where header and first data item are pasted on one line without newline
    cleanText = cleanText.replace(/([a-zA-Z0-9_]+)\s+(["][A-Z0-9])/g, "$1\n$2");

    const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);
    if (!lines.length) return [];

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ",";
    if (firstLine.includes("\t")) {
      delimiter = "\t";
    } else if (firstLine.includes(",")) {
      delimiter = ",";
    } else if (firstLine.includes(";")) {
      delimiter = ";";
    } else if (firstLine.includes("|")) {
      delimiter = "|";
    }

    const rawRows = lines.map((line) => splitCSVRow(line, delimiter));
    if (!rawRows.length) return [];

    // Check if the first line is a header row
    const headerKeywords = [
      "name",
      "fullname",
      "client",
      "customer",
      "mobile",
      "phone",
      "contact",
      "address",
      "installation",
      "site",
      "capacity",
      "kw",
      "email",
      "property",
      "solar",
      "consumer",
      "discom",
    ];

    const firstRowTokens = rawRows[0].map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const matchCount = firstRowTokens.filter((token) =>
      headerKeywords.some((kw) => token.includes(kw))
    ).length;

    const hasHeader = matchCount >= 1 && !firstRowTokens.some((t) => t.replace(/\D/g, "").length === 10);

    let dataRows: string[][] = [];
    const colMap: Record<string, number> = {};

    if (hasHeader) {
      dataRows = rawRows.slice(1);
      firstRowTokens.forEach((token, idx) => {
        if (token.includes("name") || token.includes("client")) colMap["fullName"] = idx;
        else if (token.includes("primary") || token.includes("mobile") || token.includes("phone") || token.includes("contact")) {
          if (token.includes("alt") || token.includes("second")) {
            colMap["alternateMobile"] = idx;
          } else if (colMap["primaryMobile"] === undefined) {
            colMap["primaryMobile"] = idx;
          }
        } else if (token.includes("address") || token.includes("site") || token.includes("location")) {
          if (token.includes("bill")) colMap["billingAddress"] = idx;
          else colMap["installationAddress"] = idx;
        } else if (token.includes("capacity") || token.includes("kw")) colMap["plantCapacityKw"] = idx;
        else if (token.includes("property") || token.includes("type")) colMap["propertyType"] = idx;
        else if (token.includes("solar") || token.includes("grid")) colMap["solarType"] = idx;
        else if (token.includes("email") || token.includes("mail")) colMap["email"] = idx;
        else if (token.includes("consumer") || token.includes("account") || token.includes("ivrs")) colMap["consumerNumber"] = idx;
        else if (token.includes("discom") || token.includes("board")) colMap["discom"] = idx;
      });
    } else {
      dataRows = rawRows;
    }

    return dataRows.map((row) => {
      let fullName = "";
      let primaryMobile = "";
      let alternateMobile = "";
      let email = "";
      let installationAddress = "";
      let plantCapacityKw = "5.0";
      let propertyType = "RESIDENTIAL";
      let solarType = "ON_GRID";
      let consumerNumber = "";
      let discom = "MPMKVVCL";

      if (hasHeader) {
        fullName = colMap["fullName"] !== undefined ? row[colMap["fullName"]] || "" : row[0] || "";
        primaryMobile = colMap["primaryMobile"] !== undefined ? row[colMap["primaryMobile"]] || "" : row[1] || "";
        alternateMobile = colMap["alternateMobile"] !== undefined ? row[colMap["alternateMobile"]] || "" : "";
        email = colMap["email"] !== undefined ? row[colMap["email"]] || "" : "";
        installationAddress = colMap["installationAddress"] !== undefined ? row[colMap["installationAddress"]] || "" : row[2] || "";
        plantCapacityKw = colMap["plantCapacityKw"] !== undefined ? row[colMap["plantCapacityKw"]] || "5.0" : "5.0";
        propertyType = colMap["propertyType"] !== undefined ? row[colMap["propertyType"]] || "RESIDENTIAL" : "RESIDENTIAL";
        solarType = colMap["solarType"] !== undefined ? row[colMap["solarType"]] || "ON_GRID" : "ON_GRID";
        consumerNumber = colMap["consumerNumber"] !== undefined ? row[colMap["consumerNumber"]] || "" : "";
        discom = colMap["discom"] !== undefined ? row[colMap["discom"]] || "MPMKVVCL" : "MPMKVVCL";
      } else {
        const phoneIdx = row.findIndex((c) => c.replace(/\D/g, "").length === 10);
        const emailIdx = row.findIndex((c) => c.includes("@"));

        if (phoneIdx !== -1) {
          primaryMobile = row[phoneIdx];
          fullName = phoneIdx > 0 ? row[0] : row[1] || "";
          installationAddress = row[phoneIdx + 1] || row[2] || "";
          plantCapacityKw = row[phoneIdx + 2] || "5.0";
        } else {
          fullName = row[0] || "";
          primaryMobile = row[1] || "";
          installationAddress = row[2] || "";
          plantCapacityKw = row[3] || "5.0";
          propertyType = row[4] || "RESIDENTIAL";
        }

        if (emailIdx !== -1) {
          email = row[emailIdx];
        }
      }

      const cleanPhone = primaryMobile.replace(/\D/g, "").slice(-10);
      const rowItem: ParsedCustomerRow = {
        fullName: fullName.trim(),
        primaryMobile: cleanPhone || primaryMobile.trim(),
        alternateMobile: alternateMobile.trim() || undefined,
        email: email.trim() || undefined,
        installationAddress: installationAddress.trim(),
        plantCapacityKw: plantCapacityKw.replace(/[^0-9.]/g, "") || "5.0",
        propertyType: propertyType.toUpperCase().includes("COMMERCIAL") ? "COMMERCIAL" : "RESIDENTIAL",
        solarType: solarType.toUpperCase().includes("HYBRID") ? "HYBRID" : solarType.toUpperCase().includes("OFF") ? "OFF_GRID" : "ON_GRID",
        consumerNumber: consumerNumber.trim() || undefined,
        discom: discom.trim() || "MPMKVVCL",
        isValid: true,
      };

      const { isValid, error } = validateRow(rowItem);
      rowItem.isValid = isValid;
      rowItem.error = error;
      return rowItem;
    });
  };

  // File Processor (Supports .xlsx, .xls, .csv)
  const processFile = async (file: File) => {
    setImportedFileName(file.name);
    setImportResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      processRawObjects(json);
    } catch (err) {
      console.error("[Excel/CSV File Parse Error]:", err);
      alert("Could not parse the selected file. Please ensure it is a valid Excel or CSV file.");
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    setImportResult(null);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const rows = parseTabularText(text);
    setParsedRows(rows);
  };

  // Inline Cell Edit Handler
  const handleCellChange = (index: number, field: keyof ParsedCustomerRow, value: string) => {
    setParsedRows((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };
      const { isValid, error } = validateRow(row);
      copy[index] = { ...row, isValid, error };
      return copy;
    });
  };

  // Add Empty Row for Direct Manual Entry
  const handleAddEmptyRow = () => {
    const newRow: ParsedCustomerRow = {
      fullName: "",
      primaryMobile: "",
      installationAddress: "",
      plantCapacityKw: "5.0",
      propertyType: "RESIDENTIAL",
      solarType: "ON_GRID",
      discom: "MPMKVVCL",
      isValid: false,
      error: "Missing Name",
    };
    setParsedRows((prev) => [newRow, ...prev]);
  };

  // Delete Individual Row
  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear All Rows
  const handleClearAllRows = () => {
    if (parsedRows.length === 0) return;
    if (confirm("Are you sure you want to clear all rows in the table?")) {
      setParsedRows([]);
      setPastedText("");
    }
  };

  // Load Sample Pre-formatted Customer Records
  const handleLoadSampleData = () => {
    const sampleRows: ParsedCustomerRow[] = [
      {
        fullName: "Ramesh Verma",
        primaryMobile: "9826812345",
        installationAddress: "Hoshangabad Road, Narmadapuram, MP",
        plantCapacityKw: "5.0",
        propertyType: "RESIDENTIAL",
        solarType: "ON_GRID",
        email: "ramesh.verma@gmail.com",
        discom: "MPMKVVCL",
        isValid: true,
      },
      {
        fullName: "Suresh Sharma",
        primaryMobile: "9876543210",
        installationAddress: "Main Market, Itarsi, MP",
        plantCapacityKw: "3.3",
        propertyType: "COMMERCIAL",
        solarType: "ON_GRID",
        email: "suresh.itarsi@gmail.com",
        discom: "MPMKVVCL",
        isValid: true,
      },
      {
        fullName: "Anita Patel",
        primaryMobile: "9425098765",
        installationAddress: "Civil Lines, Bhopal, MP",
        plantCapacityKw: "10.0",
        propertyType: "RESIDENTIAL",
        solarType: "HYBRID",
        email: "anita.patel@gmail.com",
        discom: "MPMKVVCL",
        isValid: true,
      },
    ];
    setParsedRows(sampleRows);
    setPasteMode(true);
    setImportResult(null);
  };

  // One-click paste from browser clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handlePasteChange(text);
      }
    } catch {
      alert("Clipboard access was blocked by the browser. Please paste directly into the box with Ctrl+V.");
    }
  };

  // Listen for Ctrl+V paste anywhere on table
  const handleTableContainerPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text && (text.includes("\t") || text.includes("\n") || text.includes(","))) {
      // If user is actively typing in a normal input and pasted a simple word without delimiters, allow it
      if (!text.includes("\t") && !text.includes("\n") && !text.includes(",") && (e.target as HTMLElement).tagName === "INPUT") {
        return;
      }
      e.preventDefault();
      handlePasteChange(text);
    }
  };

  const downloadExcelTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/customer_import_template.xlsx";
    link.download = "sunlife_customer_import_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCsvTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/customer_import_template.csv";
    link.download = "sunlife_customer_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (!validRows.length) {
      alert("No valid records found to import. Please check required fields.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/v1/admin/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: validRows }),
      });

      const data = await res.json();
      if (data.success) {
        setImportResult(data);
        fetchCustomers();
        if (data.importedCount > 0) {
          alert(`Successfully saved ${data.importedCount} customer(s) to the database!`);
          resetImportModal();
        } else if (data.skippedCount > 0) {
          alert(`No new customers were saved. All ${data.skippedCount} record(s) already exist in the database with these mobile numbers.`);
        } else if (data.errorCount > 0) {
          alert(`Import encountered ${data.errorCount} error(s). Please review the error details in the table.`);
        }
      } else {
        alert(data.error || "Import failed. Please verify format and try again.");
      }
    } catch (err: any) {
      console.error("[Customer Bulk Import Error]:", err);
      alert(err.message || "Failed to complete customer import.");
    } finally {
      setImporting(false);
    }
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setParsedRows([]);
    setImportedFileName("");
    setImportResult(null);
    setPastedText("");
    setPasteMode(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.customerId.toLowerCase().includes(q) ||
      c.primaryMobile.includes(q) ||
      c.installationAddress.toLowerCase().includes(q)
    );
  });

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  const renderTableGrid = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
      {/* Table Sub-Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-xs">Customer Table Grid:</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {parsedRows.length} Rows
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{validCount} Ready</span>
          </span>
          {invalidCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-600" />
              <span>{invalidCount} Needs Correction</span>
            </span>
          )}
        </div>

        {parsedRows.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter rows in table..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Table Body & Grid */}
      <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/95 backdrop-blur-xs text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="px-2.5 py-2.5 w-10 text-center">#</th>
              <th className="px-2.5 py-2.5 w-24 text-center">Validation</th>
              <th className="px-2.5 py-2.5 min-w-[130px]">Customer Name *</th>
              <th className="px-2.5 py-2.5 w-32">Primary Phone (OTP) *</th>
              <th className="px-2.5 py-2.5 min-w-[160px]">Installation Address *</th>
              <th className="px-2.5 py-2.5 w-20 text-center">Capacity</th>
              <th className="px-2.5 py-2.5 w-24">Property</th>
              <th className="px-2.5 py-2.5 w-20">Solar</th>
              <th className="px-2.5 py-2.5 min-w-[120px]">Email</th>
              <th className="px-2.5 py-2.5 w-24">Alt Mobile</th>
              <th className="px-2.5 py-2.5 w-24">Consumer No.</th>
              <th className="px-2.5 py-2.5 w-20">Discom</th>
              <th className="px-2.5 py-2.5 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {parsedRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-14 text-center bg-slate-50/20">
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                      <TableIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-sm">Spreadsheet Grid is Ready</h4>
                      <p className="text-xs text-slate-500">
                        Click below to add a blank row, load sample data, or paste copied cells from Excel (Ctrl+V).
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleLoadSampleData}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Load 3 Sample Customers</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddEmptyRow}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Blank Row</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              parsedRows
                .map((row, originalIdx) => ({ row, originalIdx }))
                .filter(({ row }) => {
                  if (!tableSearch.trim()) return true;
                  const q = tableSearch.toLowerCase();
                  return (
                    row.fullName.toLowerCase().includes(q) ||
                    row.primaryMobile.includes(q) ||
                    row.installationAddress.toLowerCase().includes(q) ||
                    (row.email && row.email.toLowerCase().includes(q))
                  );
                })
                .map(({ row, originalIdx }) => {
                  const cleanPhone = (row.primaryMobile || "").replace(/\D/g, "").slice(-10);
                  const isNameMissing = !row.fullName || !row.fullName.trim();
                  const isPhoneInvalid = !cleanPhone || cleanPhone.length !== 10;
                  const isAddressMissing = !row.installationAddress || !row.installationAddress.trim();

                  return (
                    <tr
                      key={originalIdx}
                      className={row.isValid ? "hover:bg-slate-50/80 transition-colors" : "bg-red-50/30 hover:bg-red-50/50 transition-colors"}
                    >
                      {/* Row Number */}
                      <td className="px-2.5 py-2 text-center text-[11px] font-mono text-slate-400">
                        {originalIdx + 1}
                      </td>

                      {/* Validation Status Pill */}
                      <td className="px-2.5 py-2 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Ready</span>
                          </span>
                        ) : (
                          <span
                            title={row.error}
                            className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold text-[10px] max-w-[110px] truncate"
                          >
                            <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                            <span className="truncate">{row.error}</span>
                          </span>
                        )}
                      </td>

                      {/* Full Name */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="text"
                          value={row.fullName}
                          onChange={(e) => handleCellChange(originalIdx, "fullName", e.target.value)}
                          placeholder="Client Name *"
                          className={`w-full px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${isNameMissing
                              ? "border border-red-300 bg-red-50/60 text-red-900 focus:ring-red-500/20"
                              : "border border-transparent hover:border-slate-200 bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-900"
                            }`}
                        />
                      </td>

                      {/* Primary Mobile */}
                      <td className="px-1.5 py-1.5">
                        <div className="relative">
                          <input
                            type="tel"
                            value={row.primaryMobile}
                            onChange={(e) => handleCellChange(originalIdx, "primaryMobile", e.target.value)}
                            placeholder="10-digit number *"
                            className={`w-full px-2 py-1 pr-11 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 transition-all ${isPhoneInvalid
                                ? "border border-red-300 bg-red-50/60 text-red-900 focus:ring-red-500/20"
                                : "border border-transparent hover:border-slate-200 bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-900"
                              }`}
                          />
                          <span className={`absolute right-2 top-1.5 text-[9px] font-mono font-bold ${cleanPhone.length === 10 ? "text-emerald-600" : "text-amber-600"}`}>
                            {cleanPhone.length}/10
                          </span>
                        </div>
                      </td>

                      {/* Installation Address */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="text"
                          value={row.installationAddress}
                          onChange={(e) => handleCellChange(originalIdx, "installationAddress", e.target.value)}
                          placeholder="Site address *"
                          className={`w-full px-2 py-1 rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${isAddressMissing
                              ? "border border-red-300 bg-red-50/60 text-red-900 focus:ring-red-500/20"
                              : "border border-transparent hover:border-slate-200 bg-transparent focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-800"
                            }`}
                        />
                      </td>

                      {/* Plant Capacity kW */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="text"
                          value={row.plantCapacityKw || "5.0"}
                          onChange={(e) => handleCellChange(originalIdx, "plantCapacityKw", e.target.value)}
                          placeholder="kW"
                          className="w-full px-1.5 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>

                      {/* Property Type */}
                      <td className="px-1.5 py-1.5">
                        <select
                          value={row.propertyType || "RESIDENTIAL"}
                          onChange={(e) => handleCellChange(originalIdx, "propertyType", e.target.value)}
                          className="w-full px-1.5 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="RESIDENTIAL">Residential</option>
                          <option value="COMMERCIAL">Commercial</option>
                        </select>
                      </td>

                      {/* Solar Type */}
                      <td className="px-1.5 py-1.5">
                        <select
                          value={row.solarType || "ON_GRID"}
                          onChange={(e) => handleCellChange(originalIdx, "solarType", e.target.value)}
                          className="w-full px-1.5 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="ON_GRID">On-Grid</option>
                          <option value="HYBRID">Hybrid</option>
                          <option value="OFF_GRID">Off-Grid</option>
                        </select>
                      </td>

                      {/* Email */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="email"
                          value={row.email || ""}
                          onChange={(e) => handleCellChange(originalIdx, "email", e.target.value)}
                          placeholder="Optional email"
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>

                      {/* Alt Mobile */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="tel"
                          value={row.alternateMobile || ""}
                          onChange={(e) => handleCellChange(originalIdx, "alternateMobile", e.target.value)}
                          placeholder="Optional phone"
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>

                      {/* Consumer Number */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="text"
                          value={row.consumerNumber || ""}
                          onChange={(e) => handleCellChange(originalIdx, "consumerNumber", e.target.value)}
                          placeholder="IVRS / Account"
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>

                      {/* Discom */}
                      <td className="px-1.5 py-1.5">
                        <input
                          type="text"
                          value={row.discom || "MPMKVVCL"}
                          onChange={(e) => handleCellChange(originalIdx, "discom", e.target.value)}
                          placeholder="Discom"
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-200 bg-transparent focus:bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-1.5 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(originalIdx)}
                          title="Remove row"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
            </tbody>
          </table>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Customer Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered solar clients eligible for mobile app OTP login and project tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchCustomers()}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-solar-deep hover:bg-solar-deep/90 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer ID, name, mobile, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredCustomers.length} of {customers.length} Customers
        </span>
      </div>

      {/* Customer Cards & Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Installation Address</th>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Projects</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">App Access</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    Loading customer records...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No customers registered yet. Click &ldquo;Add Customer&rdquo; or &ldquo;Import Excel / CSV&rdquo; to register clients.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <Link href={`/admin/customers/${c.id}`} className="font-bold hover:text-solar-deep hover:underline">
                        {c.fullName}
                      </Link>
                      <div className="text-[11px] font-mono text-emerald-700">{c.customerId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 font-medium text-slate-900">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {c.primaryMobile}</span>
                      </div>
                      {c.email && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {c.email}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-[220px] truncate text-slate-600">
                      {c.installationAddress}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {c.propertyType}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {c._count?.projects || 0} Projects
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {c.customerStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {c.appAccessEnabled ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold text-[11px]">Disabled</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/client-profile/${c.id}`}
                          title="View 360° Profile & Activity Timeline"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.fullName)}
                          title="Delete Customer"
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar Verma"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Primary Mobile (OTP Login) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.primaryMobile}
                    onChange={(e) => setFormData({ ...formData, primaryMobile: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={formData.alternateMobile}
                    onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                    placeholder="Optional"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@gmail.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Installation Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.installationAddress}
                  onChange={(e) => setFormData({ ...formData, installationAddress: e.target.value })}
                  placeholder="House No, Street, Landmark, Narmadapuram, MP"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Property Type</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="RESIDENTIAL">Residential Rooftop</option>
                  <option value="COMMERCIAL">Commercial / Industrial</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-solar-deep text-white font-semibold rounded-xl hover:bg-solar-deep/90 shadow-xs"
                >
                  {submitting ? "Saving..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Customers Modal (Spacious, Clean Spreadsheet Studio & Multi-Format Pasting) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 lg:p-6">
          <div
            onPaste={handleTableContainerPaste}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[1400px] 2xl:max-w-[1550px] h-[90vh] max-h-[920px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Import Customer Registry</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Spreadsheet Studio
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bulk upload or paste client & project records into the interactive table grid
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                {/* Download Example Templates */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 px-1.5 uppercase tracking-wider hidden sm:inline">
                    Templates:
                  </span>
                  <button
                    onClick={downloadExcelTemplate}
                    type="button"
                    title="Download Excel Template"
                    className="px-2.5 py-1 hover:bg-emerald-50 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={downloadCsvTemplate}
                    type="button"
                    title="Download CSV Template"
                    className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>CSV</span>
                  </button>
                </div>

                <button
                  onClick={resetImportModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top Toolbar: Tabs & Actions */}
            <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setPasteMode(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${!pasteMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload File (.xlsx, .csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasteMode(true);
                    if (parsedRows.length === 0) {
                      handleAddEmptyRow();
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${pasteMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Spreadsheet Table Grid</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {pasteMode && (
                  <>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Paste directly from clipboard"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Paste Clipboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Load 3 sample customer records to test"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Load Sample</span>
                    </button>
                  </>
                )}

                {(pasteMode || parsedRows.length > 0) && (
                  <button
                    type="button"
                    onClick={handleAddEmptyRow}
                    className="px-3.5 py-1.5 bg-solar-deep hover:bg-solar-deep/90 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Add a blank row to the table"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                )}

                {parsedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllRows}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear all rows from table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* VIEW 1: UPLOAD FILE TAB */}
              {!pasteMode ? (
                parsedRows.length === 0 ? (
                  // Dedicated Empty Upload Dropzone
                  <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`w-full max-w-xl border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all text-center group shadow-2xs ${
                        isDragging
                          ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                          : "border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20"
                      }`}
                    >
                      <div className="p-4 bg-white rounded-2xl shadow-xs border border-slate-200 group-hover:border-emerald-200 group-hover:scale-105 transition-all">
                        <Upload className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-base">
                          Upload Customer Spreadsheet
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md">
                          Drag and drop your Excel (.xlsx, .xls) or CSV file here, or click to browse files
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                          .XLSX
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                          .XLS
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-600">
                          .CSV
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Browse Files from Computer</span>
                      </button>

                      <div className="pt-2 flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Need a template?</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadExcelTemplate();
                          }}
                          className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Excel Template</span>
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadCsvTemplate();
                          }}
                          className="text-slate-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV Template</span>
                        </button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  // When File is Uploaded: Show File Bar + Table Grid
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-900">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>File Loaded: <strong>{importedFileName}</strong> ({parsedRows.length} rows parsed)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-800 font-semibold rounded-xl text-xs cursor-pointer transition-colors shadow-2xs"
                      >
                        Upload Different File
                      </button>
                    </div>

                    {/* Render Table Grid */}
                    {renderTableGrid()}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )
              ) : (
                // VIEW 2: SPREADSHEET TABLE GRID / PASTE TAB
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  {/* Sleek Quick Paste Bar */}
                  <div className="bg-slate-50/90 border border-slate-200 rounded-2xl px-4 py-2 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
                      <Clipboard className="w-4 h-4 text-emerald-600" />
                      <span>Quick Paste:</span>
                      <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                        (Ctrl+V)
                      </span>
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={pastedText}
                        onChange={(e) => handlePasteChange(e.target.value)}
                        placeholder="Click here and press Ctrl+V to paste cells copied from Excel / Google Sheets..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 placeholder:font-sans transition-all shadow-2xs"
                      />
                      {pastedText && (
                        <button
                          type="button"
                          onClick={() => {
                            setPastedText("");
                            setParsedRows([]);
                          }}
                          className="text-xs text-slate-400 hover:text-red-500 underline cursor-pointer whitespace-nowrap"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render Table Grid */}
                  {renderTableGrid()}
                </div>
              )}

              {/* Import Result Report (Post-execution) */}
              {importResult && (
                <div
                  className={`mt-3 p-3.5 rounded-2xl border space-y-1.5 shrink-0 ${importResult.importedCount > 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {importResult.importedCount > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{importResult.message}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px]">
                    <span>Imported: <strong>{importResult.importedCount}</strong></span>
                    <span>Skipped (duplicates): <strong>{importResult.skippedCount}</strong></span>
                    {importResult.errorCount > 0 && (
                      <span>Errors: <strong>{importResult.errorCount}</strong></span>
                    )}
                  </div>

                  {importResult.skipped?.length > 0 && (
                    <div className="pt-1.5 border-t border-emerald-200/60 text-[11px] space-y-1">
                      <span className="font-semibold text-slate-700 block">Skipped Details:</span>
                      {importResult.skipped.slice(0, 5).map((s: any, idx: number) => (
                        <div key={idx} className="text-slate-600 flex items-center gap-2">
                          <span className="font-mono">Row {s.row} ({s.phone}):</span>
                          <span>{s.reason}</span>
                        </div>
                      ))}
                      {importResult.skipped.length > 5 && (
                        <span className="text-slate-400 italic block">
                          ...and {importResult.skipped.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                {validCount > 0 ? (
                  <>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{validCount} valid record{validCount === 1 ? "" : "s"} ready for database import</span>
                    </span>
                    {invalidCount > 0 && (
                      <span className="text-amber-700 font-medium">
                        (⚠️ {invalidCount} invalid row{invalidCount === 1 ? "" : "s"} need correction above)
                      </span>
                    )}
                  </>
                ) : parsedRows.length > 0 ? (
                  <span className="text-red-600 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>All {parsedRows.length} rows have missing or invalid fields. Please correct the highlighted cells.</span>
                  </span>
                ) : (
                  <span>Upload an Excel/CSV file or paste data above to begin</span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={resetImportModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {importResult ? "Close" : "Cancel"}
                </button>

                {!importResult ? (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importing || validCount === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing to Database...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import {validCount} Customer{validCount === 1 ? "" : "s"}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetImportModal}
                    className="px-5 py-2.5 bg-solar-deep hover:bg-solar-deep/90 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Done & Refresh
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
