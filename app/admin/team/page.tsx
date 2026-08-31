"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Zap,
  Search,
  CheckCircle2,
  HardHat,
  X,
  Trash2,
  ChevronDown,
  Check,
  Tag,
  Calendar,
  CreditCard,
  Clock,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  CheckCheck,
  Smartphone,
  ExternalLink,
  Edit3,
  Download,
  MoreVertical,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: "Engineer" | "Fitter" | "Electrician" | "Survey" | "Management";
  phone: string;
  territory: string;
  status: "Active On-Site" | "Available" | "On Survey" | "Off-Duty";
  skills: string[];
  joinedYear: string;
  monthlySalary?: number;
}

interface AttendanceRecord {
  memberId: string;
  status: "Present" | "On Survey" | "Half Day" | "Absent" | "Leave";
  checkIn: string;
  checkOut: string;
  assignedSite: string;
  remarks?: string;
  updatedAt?: string;
}

interface PayrollRecord {
  memberId: string;
  baseAmount: number;
  fieldAllowance: number;
  paymentStatus: "PAID" | "PENDING";
  paymentMode: "UPI" | "Bank Transfer" | "Cash";
}

const PREDEFINED_SKILLS = [
  "Mono-PERC Installation",
  "Bifacial Module Handling",
  "Hot-Dip GI Fabrication",
  "Solar Inverter Synchronization",
  "DISCOM Net-Metering Liaison",
  "High Voltage AC/DC Earthing",
  "3D Shadow & CAD Sizing",
  "PM Surya Ghar Documentation",
  "Commercial Shed EPC",
];

function TeamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State: 'attendance' | 'profiles' | 'payroll'
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"attendance" | "profiles" | "payroll">(
    tabParam === "profiles" || tabParam === "payroll" ? tabParam : "attendance"
  );

  useEffect(() => {
    if (tabParam === "profiles" || tabParam === "payroll" || tabParam === "attendance") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "attendance" | "profiles" | "payroll") => {
    setActiveTab(tab);
    router.replace(`/admin/team?tab=${tab}`, { scroll: false });
  };

  const getTodayISO = () => new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [search, setSearch] = useState("");
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  
  // Date-wise Attendance Store: { [YYYY-MM-DD]: { [memberId]: AttendanceRecord } }
  const [attendanceHistory, setAttendanceHistory] = useState<
    Record<string, Record<string, AttendanceRecord>>
  >({});
  const [payrollRecords, setPayrollRecords] = useState<Record<string, PayrollRecord>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Active Action Menu Dropdown State (Member ID or null)
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);

  // Update Attendance Card / Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMemberForUpdate, setSelectedMemberForUpdate] = useState<TeamMember | null>(null);
  const [modalFormDate, setModalFormDate] = useState(getTodayISO());
  const [modalFormStatus, setModalFormStatus] = useState<AttendanceRecord["status"]>("Present");
  const [modalFormCheckIn, setModalFormCheckIn] = useState("09:15 AM");
  const [modalFormCheckOut, setModalFormCheckOut] = useState("05:30 PM");
  const [modalFormSite, setModalFormSite] = useState("");
  const [modalFormRemarks, setModalFormRemarks] = useState("");

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    category: "Fitter" as TeamMember["category"],
    phone: "",
    territory: "Narmadapuram",
    monthlySalary: 18000,
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Mono-PERC Installation",
    "Hot-Dip GI Fabrication",
  ]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest(".action-menu-container")) {
        setActiveMenuMemberId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load real team list and date-wise attendance from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const today = getTodayISO();

      // Team Roster
      const savedTeam = localStorage.getItem("sunlife_admin_team_roster");
      let initialList: TeamMember[] = [];
      if (savedTeam) {
        try {
          initialList = JSON.parse(savedTeam);
        } catch {
          initialList = [];
        }
      }
      if (initialList.length === 0) {
        initialList = [
          {
            id: "owner-1",
            name: siteConfig.owner.name,
            role: "Founder & Lead Solar Specialist",
            category: "Management",
            phone: siteConfig.contact.phoneClean,
            territory: `${siteConfig.contact.address.city}, MP`,
            status: "Available",
            skills: ["Solar EPC", "DISCOM Liaison", "System Sizing"],
            joinedYear: "2021",
            monthlySalary: 75000,
          },
        ];
      }
      setTeamList(initialList);

      // Date-wise Attendance History
      const savedAtt = localStorage.getItem("sunlife_attendance_database_v3");
      let history: Record<string, Record<string, AttendanceRecord>> = {};
      if (savedAtt) {
        try {
          history = JSON.parse(savedAtt);
        } catch {
          history = {};
        }
      }

      if (!history[today]) {
        const todayRecords: Record<string, AttendanceRecord> = {};
        initialList.forEach((m) => {
          todayRecords[m.id] = {
            memberId: m.id,
            status: "Present",
            checkIn: "09:15 AM",
            checkOut: "05:30 PM",
            assignedSite: m.territory ? `${m.territory} Solar Site` : "Narmadapuram HQ",
            remarks: "On-site EPC duty",
          };
        });
        history[today] = todayRecords;
      }
      setAttendanceHistory(history);

      // Payroll Records
      const savedPay = localStorage.getItem("sunlife_admin_payroll_v3");
      if (savedPay) {
        try {
          setPayrollRecords(JSON.parse(savedPay));
        } catch {
          initializeDefaultPayroll(initialList);
        }
      } else {
        initializeDefaultPayroll(initialList);
      }

      setIsLoaded(true);
    }
  }, []);

  const initializeDefaultPayroll = (members: TeamMember[]) => {
    const records: Record<string, PayrollRecord> = {};
    members.forEach((m) => {
      records[m.id] = {
        memberId: m.id,
        baseAmount: m.monthlySalary || 18000,
        fieldAllowance: 2500,
        paymentStatus: "PAID",
        paymentMode: "UPI",
      };
    });
    setPayrollRecords(records);
  };

  // Save Helpers (Preserves all historical dates permanently)
  const saveTeamList = (updated: TeamMember[]) => {
    setTeamList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_team_roster", JSON.stringify(updated));
    }
  };

  const saveAttendanceHistory = (
    updated: Record<string, Record<string, AttendanceRecord>>
  ) => {
    setAttendanceHistory(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_attendance_database_v3", JSON.stringify(updated));
      // Also sync with mobile punch storage
      localStorage.setItem("sunlife_admin_attendance_v2", JSON.stringify(updated));
    }
  };

  const savePayroll = (updated: Record<string, PayrollRecord>) => {
    setPayrollRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_payroll_v3", JSON.stringify(updated));
    }
  };

  // Current selected date's attendance records
  const currentDayAttendance = attendanceHistory[selectedDate] || {};

  // Open Update Attendance Modal Card for specific staff member
  const handleOpenUpdateModal = (member: TeamMember) => {
    setActiveMenuMemberId(null);
    setSelectedMemberForUpdate(member);
    setModalFormDate(selectedDate);

    const existing = currentDayAttendance[member.id] || {
      memberId: member.id,
      status: "Present" as const,
      checkIn: "09:15 AM",
      checkOut: "05:30 PM",
      assignedSite: `${member.territory} Solar Site`,
      remarks: "",
    };

    setModalFormStatus(existing.status || "Present");
    setModalFormCheckIn(existing.checkIn || "09:15 AM");
    setModalFormCheckOut(existing.checkOut || "05:30 PM");
    setModalFormSite(existing.assignedSite || `${member.territory} Solar Site`);
    setModalFormRemarks(existing.remarks || "");
    setIsUpdateModalOpen(true);
  };

  // Save Attendance from Modal Card (Date-Wise Persistent)
  const handleSaveModalAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForUpdate) return;

    const memberId = selectedMemberForUpdate.id;
    const targetDate = modalFormDate;

    const dayRecords = attendanceHistory[targetDate] || {};
    const updatedRecord: AttendanceRecord = {
      memberId,
      status: modalFormStatus,
      checkIn: modalFormStatus === "Absent" || modalFormStatus === "Leave" ? "--" : modalFormCheckIn,
      checkOut: modalFormStatus === "Absent" || modalFormStatus === "Leave" ? "--" : modalFormCheckOut,
      assignedSite: modalFormSite.trim() || `${selectedMemberForUpdate.territory} Site`,
      remarks: modalFormRemarks.trim(),
      updatedAt: new Date().toISOString(),
    };

    const updatedHistory = {
      ...attendanceHistory,
      [targetDate]: {
        ...dayRecords,
        [memberId]: updatedRecord,
      },
    };

    saveAttendanceHistory(updatedHistory);
    setIsUpdateModalOpen(false);
  };

  // Quick Action: Mark All Present for Selected Date
  const handleMarkAllPresent = () => {
    const updatedDay = { ...currentDayAttendance };
    teamList.forEach((m) => {
      const current = currentDayAttendance[m.id] || {
        memberId: m.id,
        status: "Present",
        checkIn: "09:15 AM",
        checkOut: "05:30 PM",
        assignedSite: `${m.territory} Solar Site`,
      };
      updatedDay[m.id] = { ...current, status: "Present" };
    });

    saveAttendanceHistory({
      ...attendanceHistory,
      [selectedDate]: updatedDay,
    });
  };

  // Export to Excel (.csv)
  const handleExportCSV = () => {
    let csv = "SUNLIFE SOLAR ENERGY SOLUTION - WORKFORCE ATTENDANCE REPORT\n";
    csv += `Date:,"${selectedDate}"\n`;
    csv += `Exported On:,"${new Date().toLocaleString("en-IN")}"\n\n`;

    csv += "Employee Name,Department,Contact Phone,Attendance Status,Check-In,Check-Out,Assigned Project Site,Remarks\n";

    teamList.forEach((m) => {
      const rec = currentDayAttendance[m.id] || {
        status: "Present",
        checkIn: "09:15 AM",
        checkOut: "05:30 PM",
        assignedSite: `${m.territory} Site`,
        remarks: "",
      };

      csv += `"${m.name}","${m.category}","${m.phone}","${rec.status}","${rec.checkIn}","${rec.checkOut}","${rec.assignedSite}","${rec.remarks || ""}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sunlife_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle Payment Status
  const handleTogglePayment = (memberId: string) => {
    const current = payrollRecords[memberId];
    if (!current) return;
    const newStatus = current.paymentStatus === "PAID" ? "PENDING" : "PAID";
    savePayroll({
      ...payrollRecords,
      [memberId]: { ...current, paymentStatus: newStatus },
    });
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.phone.trim()) return;

    const created: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name.trim(),
      role: newMember.role.trim() || "Solar Technician",
      category: newMember.category,
      phone: newMember.phone.trim(),
      territory: newMember.territory.trim() || "Narmadapuram",
      status: "Available",
      skills: selectedSkills,
      joinedYear: new Date().getFullYear().toString(),
      monthlySalary: Number(newMember.monthlySalary) || 18000,
    };

    const updatedList = [created, ...teamList];
    saveTeamList(updatedList);

    // Add attendance entry for selected date
    const todayRecords = attendanceHistory[selectedDate] || {};
    saveAttendanceHistory({
      ...attendanceHistory,
      [selectedDate]: {
        ...todayRecords,
        [created.id]: {
          memberId: created.id,
          status: "Present",
          checkIn: "09:15 AM",
          checkOut: "05:30 PM",
          assignedSite: `${created.territory} Site`,
        },
      },
    });

    // Add payroll record
    savePayroll({
      ...payrollRecords,
      [created.id]: {
        memberId: created.id,
        baseAmount: Number(newMember.monthlySalary) || 18000,
        fieldAllowance: 2000,
        paymentStatus: "PENDING",
        paymentMode: "UPI",
      },
    });

    setIsAddModalOpen(false);
    setNewMember({
      name: "",
      role: "",
      category: "Fitter",
      phone: "",
      territory: "Narmadapuram",
      monthlySalary: 18000,
    });
  };

  const handleDeleteMember = (id: string) => {
    if (id === "owner-1") return;
    const updated = teamList.filter((m) => m.id !== id);
    saveTeamList(updated);
  };

  // Aggregate monthly attendance count across all logged dates
  const calculateTotalMonthlyDays = (memberId: string) => {
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    Object.values(attendanceHistory).forEach((dayMap) => {
      const rec = dayMap[memberId];
      if (rec) {
        if (rec.status === "Present" || rec.status === "On Survey") {
          presentDays += 1;
        } else if (rec.status === "Half Day") {
          halfDays += 1;
        } else if (rec.status === "Absent") {
          absentDays += 1;
        }
      }
    });

    return {
      verifiedPaidDays: presentDays + halfDays * 0.5,
      absentDays: absentDays + halfDays * 0.5,
    };
  };

  // KPI calculations for selected date
  const totalStaff = teamList.length;
  const presentCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Present" || a.status === "On Survey"
  ).length;
  const halfDayCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Half Day"
  ).length;
  const absentCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Absent"
  ).length;
  const leaveCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Leave"
  ).length;

  const filteredTeam = teamList.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search) ||
    m.territory.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-solar-emerald mb-1">
            Workforce & Attendance Manager
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Team & Field Crew
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage daily attendance records date-wise, staff profiles, and monthly salary calculations.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href="/crew/punch"
            target="_blank"
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-sun-amber text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-sun-amber" />
            <span>Open Mobile Punch App ↗</span>
          </Link>

          {activeTab === "profiles" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          )}

          {activeTab === "attendance" && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.csv)</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Simple Subheading Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap sm:flex-nowrap gap-1.5 w-full">
        {/* Tab 1: Daily Attendance */}
        <button
          onClick={() => handleTabChange("attendance")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "attendance"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === "attendance" ? "text-sun-amber" : "text-slate-400"}`} />
          <span>Daily Attendance</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "attendance"
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-solar-deep"
            }`}
          >
            {presentCount} Present
          </span>
        </button>

        {/* Tab 2: Employee Profiles */}
        <button
          onClick={() => handleTabChange("profiles")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profiles"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === "profiles" ? "text-sun-amber" : "text-slate-400"}`} />
          <span>Employee Profiles</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "profiles"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {teamList.length}
          </span>
        </button>

        {/* Tab 3: Payroll & Wages */}
        <button
          onClick={() => handleTabChange("payroll")}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "payroll"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeTab === "payroll" ? "text-sun-amber" : "text-slate-400"}`} />
          <span>Payroll & Payment</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY ATTENDANCE (CLEAN TABLE + THREE DOT ACTIONS) */}
      {/* ======================================================== */}
      {activeTab === "attendance" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Simple KPI Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Staff
              </span>
              <div className="text-2xl font-extrabold font-heading text-slate-900 mt-1">
                {totalStaff}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Present on {selectedDate}
              </span>
              <div className="text-2xl font-extrabold font-heading text-solar-deep mt-1">
                {presentCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                Half Day
              </span>
              <div className="text-2xl font-extrabold font-heading text-orange-600 mt-1">
                {halfDayCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                Absent
              </span>
              <div className="text-2xl font-extrabold font-heading text-red-600 mt-1">
                {absentCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                On Leave
              </span>
              <div className="text-2xl font-extrabold font-heading text-purple-600 mt-1">
                {leaveCount}
              </div>
            </div>
          </div>

          {/* Date Picker & Action Strip */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Input */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-solar-deep" />
                <label className="text-xs font-bold text-slate-700">Attendance Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              {selectedDate === getTodayISO() && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Today
                </span>
              )}

              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter staff by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-solar-deep text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sun-amber" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Clean Read-Only Attendance Table with Three-Dot Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-visible w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Attendance Status</th>
                    <th className="px-6 py-3.5">Check-In</th>
                    <th className="px-6 py-3.5">Check-Out</th>
                    <th className="px-6 py-3.5">Assigned Solar Site</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeam.map((member) => {
                    const rec = currentDayAttendance[member.id] || {
                      memberId: member.id,
                      status: "Present",
                      checkIn: "09:15 AM",
                      checkOut: "05:30 PM",
                      assignedSite: `${member.territory} Solar Site`,
                    };

                    const isMenuOpen = activeMenuMemberId === member.id;

                    const statusStyles: Record<string, string> = {
                      Present: "bg-emerald-50 text-emerald-800 border-emerald-200",
                      "On Survey": "bg-amber-50 text-amber-900 border-amber-200",
                      "Half Day": "bg-orange-50 text-orange-800 border-orange-200",
                      Absent: "bg-red-50 text-red-800 border-red-200",
                      Leave: "bg-purple-50 text-purple-800 border-purple-200",
                    };

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {member.role}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                            {member.category}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                              statusStyles[rec.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                rec.status === "Present"
                                  ? "bg-emerald-500"
                                  : rec.status === "On Survey"
                                  ? "bg-amber-500"
                                  : rec.status === "Half Day"
                                  ? "bg-orange-500"
                                  : rec.status === "Absent"
                                  ? "bg-red-500"
                                  : "bg-purple-500"
                              }`}
                            />
                            <span>{rec.status}</span>
                          </span>
                        </td>

                        {/* Check-In */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {rec.checkIn || "--"}
                        </td>

                        {/* Check-Out */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {rec.checkOut || "--"}
                        </td>

                        {/* Assigned Site */}
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                            <span>{rec.assignedSite || `${member.territory} Site`}</span>
                          </span>
                        </td>

                        {/* Three Dot Action Menu */}
                        <td className="px-6 py-4 text-right relative action-menu-container">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() =>
                                setActiveMenuMemberId(isMenuOpen ? null : member.id)
                              }
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Floating Menu */}
                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button
                                  onClick={() => handleOpenUpdateModal(member)}
                                  className="w-full px-3.5 py-2 text-xs font-bold text-solar-deep hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-solar-emerald" />
                                  <span>Update Attendance</span>
                                </button>

                                <div className="h-px bg-slate-100 my-1" />

                                <a
                                  href={`tel:${member.phone}`}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Call {member.name.split(" ")[0]}</span>
                                </a>

                                <a
                                  href={`https://wa.me/91${member.phone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50/60 flex items-center gap-2 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WhatsApp Message</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EMPLOYEE PROFILES */}
      {/* ======================================================== */}
      {activeTab === "profiles" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-heading text-base text-slate-900">
                  Solar Technical Workforce Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Registered installation technicians, electricians, and site supervisors
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Designation</th>
                    <th className="px-6 py-3.5">Contact Number</th>
                    <th className="px-6 py-3.5">Territory Hub</th>
                    <th className="px-6 py-3.5">Skills & Technical Expertise</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeam.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Joined {member.joinedYear}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {member.role}
                        </div>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {member.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <a
                          href={`tel:${member.phone}`}
                          className="font-bold text-solar-deep hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.phone}</span>
                        </a>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-solar-emerald" />
                          <span>{member.territory}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {member.skills.map((skill, sidx) => (
                            <span
                              key={sidx}
                              className="px-2 py-0.5 bg-emerald-50 text-solar-deep text-[10px] font-medium rounded-md border border-emerald-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${member.phone}`}
                            title="Call Staff"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-700 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${member.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          {member.id !== "owner-1" && (
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              title="Delete Member"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PAYROLL & PAYMENT (CONNECTED TO DATE-WISE ATTENDANCE) */}
      {/* ======================================================== */}
      {activeTab === "payroll" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-heading text-base text-slate-900">
                  Staff Wage & Payment Ledger (Attendance Verified)
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly wage calculation based on verified date-wise attendance records
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-sun-amber text-xs font-bold">
                Cycle: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Verified Paid Days</th>
                    <th className="px-6 py-3.5">Base Monthly Pay</th>
                    <th className="px-6 py-3.5">Site Allowance (Bhatta)</th>
                    <th className="px-6 py-3.5">Total Payable</th>
                    <th className="px-6 py-3.5">Disbursement Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamList.map((member) => {
                    const { verifiedPaidDays } = calculateTotalMonthlyDays(member.id);
                    const record = payrollRecords[member.id] || {
                      memberId: member.id,
                      baseAmount: member.monthlySalary || 18000,
                      fieldAllowance: 2500,
                      paymentStatus: "PENDING" as const,
                      paymentMode: "UPI" as const,
                    };

                    const totalPay = (record.baseAmount || 0) + (record.fieldAllowance || 0);

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {member.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {member.role}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-extrabold text-solar-deep">
                          {verifiedPaidDays} Days Logged
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          ₹{record.baseAmount.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-emerald-700 font-semibold">
                          +₹{record.fieldAllowance.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 font-extrabold text-sm text-slate-900">
                          ₹{totalPay.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                              record.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {record.paymentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleTogglePayment(member.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              record.paymentStatus === "PAID"
                                ? "bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 border border-slate-200"
                                : "bg-solar-deep hover:bg-slate-900 text-white shadow-xs"
                            }`}
                          >
                            {record.paymentStatus === "PAID" ? "Mark Pending" : "Mark as Paid"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. UPDATE ATTENDANCE CARD / MODAL (DATE-WISE PERSISTENT) */}
      {/* ======================================================== */}
      {isUpdateModalOpen &&
        selectedMemberForUpdate &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo/logo.svg"
                    alt="Sunlife Solar"
                    width={130}
                    height={38}
                    className="h-7 w-auto object-contain"
                  />
                  <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                  <div>
                    <h3 className="font-bold font-heading text-base text-slate-900 leading-tight">
                      Update Attendance
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedMemberForUpdate.name} ({selectedMemberForUpdate.role})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveModalAttendance} className="space-y-4 text-xs">
                {/* Date Picker */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attendance Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalFormDate}
                    onChange={(e) => setModalFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Record will be saved permanently under date: {modalFormDate}
                  </span>
                </div>

                {/* Duty Status Buttons */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duty Status <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "Present", label: "🟢 Present (Full Day)" },
                      { key: "On Survey", label: "🟡 On Site Survey" },
                      { key: "Half Day", label: "🟠 Half Day" },
                      { key: "Absent", label: "🔴 Absent" },
                      { key: "Leave", label: "🟣 On Leave" },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setModalFormStatus(st.key as AttendanceRecord["status"])}
                        className={`p-2 rounded-xl font-bold text-left transition-all border cursor-pointer ${
                          modalFormStatus === st.key
                            ? "bg-solar-deep text-white border-solar-deep shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timings (if present/survey/halfday) */}
                {modalFormStatus !== "Absent" && modalFormStatus !== "Leave" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Check-In Time
                      </label>
                      <input
                        type="text"
                        value={modalFormCheckIn}
                        onChange={(e) => setModalFormCheckIn(e.target.value)}
                        placeholder="09:15 AM"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Check-Out Time
                      </label>
                      <input
                        type="text"
                        value={modalFormCheckOut}
                        onChange={(e) => setModalFormCheckOut(e.target.value)}
                        placeholder="05:30 PM"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Assigned Solar Site */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Solar Site / Location
                  </label>
                  <input
                    type="text"
                    value={modalFormSite}
                    onChange={(e) => setModalFormSite(e.target.value)}
                    placeholder="e.g. Narmadapuram 5kW Rooftop Site"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Remarks / Work Notes
                  </label>
                  <input
                    type="text"
                    value={modalFormRemarks}
                    onChange={(e) => setModalFormRemarks(e.target.value)}
                    placeholder="e.g. Structure erection and DC cabling completed"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold cursor-pointer transition-all shadow-md shadow-emerald-950/15"
                  >
                    Save Attendance
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ======================================================== */}
      {/* 5. ADD TEAM MEMBER MODAL */}
      {/* ======================================================== */}
      {isAddModalOpen &&
        isLoaded &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <Image
                    src="/logo/logo.svg"
                    alt="Sunlife Solar"
                    width={140}
                    height={40}
                    className="h-8 w-auto object-contain"
                  />
                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                  <div>
                    <h3 className="font-bold font-heading text-lg text-slate-900 leading-tight">
                      Add Team Member
                    </h3>
                    <p className="text-xs text-slate-500">
                      Register technicians, fitters, electricians & survey crew
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder="e.g. Technician Name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="e.g. 98260XXXXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      placeholder="e.g. Solar Rooftop Fitter"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Department Category
                    </label>
                    <select
                      value={newMember.category}
                      onChange={(e) =>
                        setNewMember({
                          ...newMember,
                          category: e.target.value as TeamMember["category"],
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Fitter">Installation Fitter</option>
                      <option value="Electrician">Solar Electrician</option>
                      <option value="Survey">Site Survey</option>
                      <option value="Engineer">PV Engineer</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold cursor-pointer transition-all shadow-md"
                  >
                    Save Member
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default function AdminTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading workforce management portal...
        </div>
      }
    >
      <TeamContent />
    </Suspense>
  );
}
