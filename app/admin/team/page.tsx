"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
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
  DollarSign,
  Clock,
  Briefcase,
  AlertCircle,
  FileText,
  ArrowUpRight,
  TrendingUp,
  Download,
  FileSpreadsheet,
  CheckCheck,
  Filter,
  Eye,
  Edit3,
  LogIn,
  LogOut,
  CalendarRange,
  FileSignature,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import {
  AttendanceRecord,
  CorrectionRequest,
  LeaveRecord,
  ORG_CONFIG,
  calculateLateMinutes,
  calculateWorkingMinutes,
  formatMinutesToHours,
  isSundayDate,
  getPublicHolidayName,
} from "@/lib/attendance-utils";
import { AttendanceMarkModal } from "@/components/admin/attendance/AttendanceMarkModal";
import { AttendanceDetailDrawer } from "@/components/admin/attendance/AttendanceDetailDrawer";
import { MonthlyMatrixView } from "@/components/admin/attendance/MonthlyMatrixView";
import { CorrectionRequestsView } from "@/components/admin/attendance/CorrectionRequestsView";

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
  dailyRate?: number;
}

interface PayrollRecord {
  memberId: string;
  payType: "Monthly Salary" | "Daily Rate";
  baseAmount: number;
  fieldAllowance: number;
  bonus: number;
  paymentStatus: "PAID" | "PENDING";
  paymentMode: "UPI" | "Bank Transfer" | "Cash";
  payoutDate: string;
}

const PREDEFINED_SKILLS = [
  "Mono-PERC Installation",
  "Bifacial Module Handling",
  "Hot-Dip GI Fabrication",
  "Solar Inverter Synchronization",
  "DISCOM Net-Metering Liaison",
  "High Voltage AC/DC Earthing & SPD",
  "3D Shadow & CAD Sizing",
  "Rooftop Safety & Rigging",
  "PM Surya Ghar Documentation",
  "Battery Storage (BESS)",
  "HT / LT Electrical Wiring",
  "Commercial Shed EPC",
];

function TeamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State: 'profiles' | 'attendance' | 'monthly' | 'corrections' | 'payroll'
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<
    "profiles" | "attendance" | "monthly" | "corrections" | "payroll"
  >(
    tabParam === "attendance" ||
      tabParam === "monthly" ||
      tabParam === "corrections" ||
      tabParam === "payroll"
      ? tabParam
      : "attendance" // default to attendance for fast daily operations
  );

  useEffect(() => {
    if (
      tabParam === "attendance" ||
      tabParam === "monthly" ||
      tabParam === "corrections" ||
      tabParam === "payroll" ||
      tabParam === "profiles"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (
    tab: "profiles" | "attendance" | "monthly" | "corrections" | "payroll"
  ) => {
    setActiveTab(tab);
    router.replace(`/admin/team?tab=${tab}`, { scroll: false });
  };

  const getTodayISO = () => new Date().toISOString().split("T")[0];

  // Core Data States
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<
    Record<string, Record<string, AttendanceRecord>>
  >({});
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [approvedLeaves, setApprovedLeaves] = useState<LeaveRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<Record<string, PayrollRecord>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters State
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(getTodayISO());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [selectedTerritoryFilter, setSelectedTerritoryFilter] = useState("All");

  // Modal / Drawer States
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<Partial<AttendanceRecord> | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<AttendanceRecord | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Add Member Multi-Select Skills State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Mono-PERC Installation",
    "Hot-Dip GI Fabrication",
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load and initialize persistent state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const today = getTodayISO();

      // 1. Team Roster
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

      // 2. Attendance History
      const savedAtt = localStorage.getItem("sunlife_admin_attendance_v2");
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
            id: `att_${m.id}_${today}`,
            memberId: m.id,
            date: today,
            checkIn: "09:15 AM",
            checkOut: "05:30 PM",
            breakMinutes: 30,
            workingHoursMinutes: 465, // 7h 45m
            status: "Present",
            location: m.territory ? `${m.territory} Solar Site` : "Narmadapuram HQ",
            remarks: "Standard on-site solar EPC shift",
            lateMinutes: 0,
            overtimeMinutes: 0,
            createdBy: "System / Admin",
            lastUpdated: new Date().toISOString(),
            auditTrail: [
              {
                id: "init-1",
                timestamp: "09:15 AM",
                author: "System Punch",
                field: "Check-In",
                oldValue: "--",
                newValue: "09:15 AM (Present)",
              },
            ],
          };
        });
        history[today] = todayRecords;
      }
      setAttendanceHistory(history);

      // 3. Correction Requests
      const savedCorrections = localStorage.getItem("sunlife_admin_corrections");
      if (savedCorrections) {
        try {
          setCorrectionRequests(JSON.parse(savedCorrections));
        } catch {
          setCorrectionRequests([]);
        }
      }

      // 4. Payroll Records
      const savedPay = localStorage.getItem("sunlife_admin_payroll");
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
        payType:
          m.category === "Management" || m.category === "Engineer"
            ? "Monthly Salary"
            : "Daily Rate",
        baseAmount: m.monthlySalary || (m.dailyRate ? m.dailyRate * 26 : 18000),
        fieldAllowance: 2500,
        bonus: 0,
        paymentStatus: "PAID",
        paymentMode: "UPI",
        payoutDate: new Date().toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
      };
    });
    setPayrollRecords(records);
  };

  // Close skill dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSkillDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save helpers
  const saveTeamList = (updated: TeamMember[]) => {
    setTeamList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sunlife_admin_team_roster",
        JSON.stringify(updated)
      );
    }
  };

  const saveAttendanceHistory = (
    updated: Record<string, Record<string, AttendanceRecord>>
  ) => {
    setAttendanceHistory(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sunlife_admin_attendance_v2",
        JSON.stringify(updated)
      );
    }
  };

  const saveCorrections = (updated: CorrectionRequest[]) => {
    setCorrectionRequests(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sunlife_admin_corrections",
        JSON.stringify(updated)
      );
    }
  };

  const savePayroll = (updated: Record<string, PayrollRecord>) => {
    setPayrollRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_payroll", JSON.stringify(updated));
    }
  };

  // Active Day Attendance Records
  const currentDayAttendance =
    attendanceHistory[selectedAttendanceDate] || {};

  // KPI Calculations for Active Day
  const totalEmployees = teamList.length;
  const presentTodayCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Present" || a.status === "Late"
  ).length;
  const absentTodayCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Absent"
  ).length;
  const onLeaveCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Leave"
  ).length;
  const halfDayCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Half Day"
  ).length;
  const lateTodayCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Late" || a.lateMinutes > 0
  ).length;

  const attendanceRate =
    totalEmployees > 0
      ? Math.round(
          ((presentTodayCount + halfDayCount * 0.5) / totalEmployees) * 100
        )
      : 100;

  // Filtered Roster for Active Day Table
  const filteredDailyRecords = teamList.filter((member) => {
    const record = currentDayAttendance[member.id];
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase()) ||
      member.territory.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.includes(search);

    const matchesCategory =
      selectedCategory === "All" || member.category === selectedCategory;

    const matchesStatus =
      selectedStatusFilter === "All" ||
      (record && record.status === selectedStatusFilter) ||
      (!record && selectedStatusFilter === "Pending");

    const matchesTerritory =
      selectedTerritoryFilter === "All" ||
      member.territory.toLowerCase().includes(selectedTerritoryFilter.toLowerCase());

    return matchesSearch && matchesCategory && matchesStatus && matchesTerritory;
  });

  // Handle Mark / Save Attendance Record
  const handleSaveAttendanceRecord = (record: AttendanceRecord) => {
    const dayRecords = attendanceHistory[record.date] || {};
    const updatedHistory = {
      ...attendanceHistory,
      [record.date]: {
        ...dayRecords,
        [record.memberId]: record,
      },
    };
    saveAttendanceHistory(updatedHistory);
  };

  // Quick Self/Admin Punch Check-in & Check-out for Founder/User
  const loggedInMemberId = teamList[0]?.id || "owner-1";
  const userTodayRecord = currentDayAttendance[loggedInMemberId];

  const handleQuickCheckIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isLate = calculateLateMinutes(timeStr) > 0;
    const newRecord: AttendanceRecord = {
      id: `att_${loggedInMemberId}_${selectedAttendanceDate}`,
      memberId: loggedInMemberId,
      date: selectedAttendanceDate,
      checkIn: timeStr,
      checkOut: "--",
      breakMinutes: 0,
      workingHoursMinutes: 0,
      status: isLate ? "Late" : "Present",
      location: "Narmadapuram HQ",
      remarks: "Self Web Punch Check-In",
      lateMinutes: calculateLateMinutes(timeStr),
      overtimeMinutes: 0,
      createdBy: "Self Punch",
      lastUpdated: now.toISOString(),
      auditTrail: [
        {
          id: Date.now().toString(),
          timestamp: timeStr,
          author: "Self Punch",
          field: "Check-In",
          oldValue: "--",
          newValue: timeStr,
        },
      ],
    };
    handleSaveAttendanceRecord(newRecord);
  };

  const handleQuickCheckOut = () => {
    if (!userTodayRecord || !userTodayRecord.checkIn || userTodayRecord.checkIn === "--") return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const { workingMinutes } = calculateWorkingMinutes(
      userTodayRecord.checkIn,
      timeStr,
      userTodayRecord.breakMinutes || 0
    );

    const updatedRecord: AttendanceRecord = {
      ...userTodayRecord,
      checkOut: timeStr,
      workingHoursMinutes: workingMinutes,
      overtimeMinutes: Math.max(0, workingMinutes - 480),
      lastUpdated: now.toISOString(),
      auditTrail: [
        ...(userTodayRecord.auditTrail || []),
        {
          id: Date.now().toString(),
          timestamp: timeStr,
          author: "Self Punch",
          field: "Check-Out",
          oldValue: "--",
          newValue: `${timeStr} (${formatMinutesToHours(workingMinutes)})`,
        },
      ],
    };
    handleSaveAttendanceRecord(updatedRecord);
  };

  // Correction Request Approvals
  const handleApproveCorrection = (req: CorrectionRequest) => {
    const { workingMinutes } = calculateWorkingMinutes(
      req.requestedCheckIn,
      req.requestedCheckOut,
      30
    );

    const updatedAttendance: AttendanceRecord = {
      id: `att_${req.memberId}_${req.date}`,
      memberId: req.memberId,
      date: req.date,
      checkIn: req.requestedCheckIn,
      checkOut: req.requestedCheckOut,
      breakMinutes: 30,
      workingHoursMinutes: workingMinutes,
      status: "Present",
      location: "Verified Site Duty",
      remarks: `Correction Approved: ${req.reason}`,
      lateMinutes: calculateLateMinutes(req.requestedCheckIn),
      overtimeMinutes: Math.max(0, workingMinutes - 480),
      createdBy: "HR Approval",
      lastUpdated: new Date().toISOString(),
      auditTrail: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString("en-IN"),
          author: "Admin Approval",
          field: "Attendance Correction",
          oldValue: "Missing Punch / Request",
          newValue: `${req.requestedCheckIn} - ${req.requestedCheckOut}`,
        },
      ],
    };

    handleSaveAttendanceRecord(updatedAttendance);

    const updatedRequests = correctionRequests.map((r) =>
      r.id === req.id
        ? {
            ...r,
            status: "Approved" as const,
            reviewedBy: "Rahul Kumar Bamne (Admin)",
            reviewedAt: new Date().toLocaleDateString("en-IN"),
          }
        : r
    );
    saveCorrections(updatedRequests);
  };

  const handleRejectCorrection = (requestId: string) => {
    const updatedRequests = correctionRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "Rejected" as const,
            reviewedBy: "Admin",
            reviewedAt: new Date().toLocaleDateString("en-IN"),
          }
        : r
    );
    saveCorrections(updatedRequests);
  };

  const handleSubmitNewCorrection = (
    data: Omit<CorrectionRequest, "id" | "status" | "submittedAt">
  ) => {
    const newReq: CorrectionRequest = {
      id: `cr_${Date.now()}`,
      ...data,
      status: "Pending",
      submittedAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    saveCorrections([newReq, ...correctionRequests]);
  };

  // Export Daily Attendance as Excel (.csv)
  const handleExportDailyExcel = () => {
    let csv = "SUNLIFE SOLAR ENERGY SOLUTION - DAILY WORKFORCE ATTENDANCE REPORT\n";
    csv += `Report Date:,"${selectedAttendanceDate}"\n`;
    csv += `Generated On:,"${new Date().toLocaleString("en-IN")}"\n\n`;

    csv +=
      "Employee Name,Employee ID,Role,Department,Phone,Territory,Date,Check-In,Check-Out,Working Hours,Status,Location,Remarks\n";

    teamList.forEach((m, idx) => {
      const record = currentDayAttendance[m.id] || {
        checkIn: "--",
        checkOut: "--",
        workingHoursMinutes: 0,
        status: "Pending",
        location: `${m.territory} Site`,
        remarks: "",
      };

      const row = [
        `"${m.name.replace(/"/g, '""')}"`,
        `"SL-${String(idx + 1).padStart(3, "0")}"`,
        `"${m.role}"`,
        `"${m.category}"`,
        `"${m.phone}"`,
        `"${m.territory}"`,
        `"${selectedAttendanceDate}"`,
        `"${record.checkIn}"`,
        `"${record.checkOut}"`,
        `"${formatMinutesToHours(record.workingHoursMinutes)}"`,
        `"${record.status}"`,
        `"${record.location.replace(/"/g, '""')}"`,
        `"${(record.remarks || "").replace(/"/g, '""')}"`,
      ];
      csv += row.join(",") + "\n";
    });

    csv += `\nSUMMARY STATISTICS\n`;
    csv += `Total Registered Workforce:,"${totalEmployees}"\n`;
    csv += `Present Today:,"${presentTodayCount}"\n`;
    csv += `Absent Today:,"${absentTodayCount}"\n`;
    csv += `On Leave:,"${onLeaveCount}"\n`;
    csv += `Half Day:,"${halfDayCount}"\n`;
    csv += `Late Attendance:,"${lateTodayCount}"\n`;
    csv += `Attendance Percentage:,"${attendanceRate}%"\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Sunlife_Solar_Attendance_Report_${selectedAttendanceDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add Member Handler
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    category: "Fitter" as TeamMember["category"],
    phone: "",
    territory: "Narmadapuram",
    status: "Available" as TeamMember["status"],
    monthlySalary: 18000,
  });

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
      status: newMember.status,
      skills: selectedSkills.length > 0 ? selectedSkills : ["Solar EPC"],
      joinedYear: new Date().getFullYear().toString(),
      monthlySalary: Number(newMember.monthlySalary) || 18000,
    };

    const updated = [created, ...teamList];
    saveTeamList(updated);

    // Add payroll record
    savePayroll({
      ...payrollRecords,
      [created.id]: {
        memberId: created.id,
        payType: "Monthly Salary",
        baseAmount: Number(newMember.monthlySalary) || 18000,
        fieldAllowance: 2000,
        bonus: 0,
        paymentStatus: "PENDING",
        paymentMode: "UPI",
        payoutDate: new Date().toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
      },
    });

    setIsAddMemberModalOpen(false);
    setNewMember({
      name: "",
      role: "",
      category: "Fitter",
      phone: "",
      territory: "Narmadapuram",
      status: "Available",
      monthlySalary: 18000,
    });
  };

  // Payroll Calculation linked to Attendance
  const calculateAttendanceForMember = (memberId: string) => {
    // Count attendance across the current month
    let presentDays = 0;
    let leaveDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let overtimeHours = 0;

    Object.entries(attendanceHistory).forEach(([date, dayRecord]) => {
      const rec = dayRecord[memberId];
      if (rec) {
        if (rec.status === "Present" || rec.status === "Late") {
          presentDays += 1;
          if (rec.overtimeMinutes > 0) {
            overtimeHours += Math.round(rec.overtimeMinutes / 60);
          }
        } else if (rec.status === "Half Day") {
          halfDays += 1;
        } else if (rec.status === "Leave") {
          leaveDays += 1;
        } else if (rec.status === "Absent") {
          absentDays += 1;
        }
      }
    });

    const paidDays = presentDays + leaveDays + halfDays * 0.5;
    const unpaidDays = absentDays + halfDays * 0.5;

    return {
      presentDays,
      leaveDays,
      halfDays,
      absentDays,
      paidDays,
      unpaidDays,
      overtimeHours,
    };
  };

  const handleTogglePaymentStatus = (memberId: string) => {
    const current = payrollRecords[memberId];
    if (!current) return;
    const newStatus = current.paymentStatus === "PAID" ? "PENDING" : "PAID";
    savePayroll({
      ...payrollRecords,
      [memberId]: { ...current, paymentStatus: newStatus },
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-solar-emerald mb-1">
            Workforce & Operations Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Team & Field Crew
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daily biometric & site attendance tracking, monthly calendar matrix, and attendance-verified payroll.
          </p>
        </div>

        {/* Action Button depending on active tab */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {activeTab === "profiles" && (
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="px-4 py-2.5 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}

          {activeTab === "attendance" && (
            <button
              onClick={handleExportDailyExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel Sheet (.csv)</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern 5-Tab Subheadings Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5 w-full">
        {/* Tab 1: Daily Attendance */}
        <button
          onClick={() => handleTabChange("attendance")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            {presentTodayCount} Today
          </span>
        </button>

        {/* Tab 2: Monthly Matrix */}
        <button
          onClick={() => handleTabChange("monthly")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "monthly"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CalendarRange className={`w-4 h-4 ${activeTab === "monthly" ? "text-sun-amber" : "text-slate-400"}`} />
          <span>Monthly Matrix (1-31)</span>
        </button>

        {/* Tab 3: Corrections & Requests */}
        <button
          onClick={() => handleTabChange("corrections")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "corrections"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileSignature className={`w-4 h-4 ${activeTab === "corrections" ? "text-sun-amber" : "text-slate-400"}`} />
          <span>Correction Requests</span>
          {correctionRequests.filter((r) => r.status === "Pending").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
              {correctionRequests.filter((r) => r.status === "Pending").length}
            </span>
          )}
        </button>

        {/* Tab 4: Employee Profiles */}
        <button
          onClick={() => handleTabChange("profiles")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

        {/* Tab 5: Payroll & Payment */}
        <button
          onClick={() => handleTabChange("payroll")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
      {/* 1. DAILY ATTENDANCE SUBHEADING (FEATURE PACKED) */}
      {/* ======================================================== */}
      {activeTab === "attendance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Check-In / Check-Out Widget for Logged In User / Founder */}
          <div className="bg-gradient-to-r from-solar-deep to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sun-amber text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Duty Attendance Punch</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-heading">
                {teamList[0]?.name || siteConfig.owner.name} ({teamList[0]?.role || "Founder"})
              </h3>
              <p className="text-xs text-slate-300">
                Log real-time check-in and check-out for today ({selectedAttendanceDate})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Check-In Action */}
              {!userTodayRecord || !userTodayRecord.checkIn || userTodayRecord.checkIn === "--" ? (
                <button
                  onClick={handleQuickCheckIn}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Check In Now</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 text-xs">
                    <span className="text-slate-300 block text-[10px] uppercase font-bold">
                      Checked In
                    </span>
                    <span className="font-extrabold text-sun-amber text-sm">
                      {userTodayRecord.checkIn}
                    </span>
                  </div>

                  {/* Check-Out Action */}
                  {!userTodayRecord.checkOut || userTodayRecord.checkOut === "--" ? (
                    <button
                      onClick={handleQuickCheckOut}
                      className="px-5 py-3 rounded-2xl bg-sun-amber hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Check Out</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 text-xs">
                      <span className="text-emerald-300 block text-[10px] uppercase font-bold">
                        Shift Finished
                      </span>
                      <span className="font-extrabold text-white text-sm">
                        {formatMinutesToHours(userTodayRecord.workingHoursMinutes)} Logged
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Mark Trigger */}
              <button
                onClick={() => {
                  setEditingAttendanceRecord({
                    memberId: loggedInMemberId,
                    date: selectedAttendanceDate,
                  });
                  setIsMarkModalOpen(true);
                }}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Mark Other Staff</span>
              </button>
            </div>
          </div>

          {/* 7 Auto-Updating Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 w-full">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Staff
              </span>
              <div className="text-xl font-extrabold font-heading text-slate-900 mt-2">
                {totalEmployees}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Present Today
              </span>
              <div className="text-xl font-extrabold font-heading text-solar-deep mt-2">
                {presentTodayCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Absent Today
              </span>
              <div className="text-xl font-extrabold font-heading text-red-600 mt-2">
                {absentTodayCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                On Leave
              </span>
              <div className="text-xl font-extrabold font-heading text-purple-600 mt-2">
                {onLeaveCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                Half Day
              </span>
              <div className="text-xl font-extrabold font-heading text-orange-600 mt-2">
                {halfDayCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Late (&gt;09:30)
              </span>
              <div className="text-xl font-extrabold font-heading text-amber-600 mt-2">
                {lateTodayCount}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-solar-deep uppercase tracking-wider">
                Attendance %
              </span>
              <div className="text-xl font-extrabold font-heading text-solar-deep mt-2">
                {attendanceRate}%
              </div>
            </div>
          </div>

          {/* Instant Multi-Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Date Picker */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-solar-deep shrink-0" />
                <label className="text-xs font-bold text-slate-700">Date:</label>
                <input
                  type="date"
                  value={selectedAttendanceDate}
                  onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, role, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Management">Management</option>
                <option value="Fitter">Fitter & Rigging</option>
                <option value="Electrician">Solar Electrician</option>
                <option value="Survey">Site Survey</option>
                <option value="Engineer">PV Engineer</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
                <option value="Pending">Pending / Unmarked</option>
              </select>
            </div>
          </div>

          {/* Structured Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Employee ID</th>
                    <th className="px-6 py-3.5">Team / Dept</th>
                    <th className="px-6 py-3.5">Check-In</th>
                    <th className="px-6 py-3.5">Check-Out</th>
                    <th className="px-6 py-3.5">Working Hours</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyRecords.map((member, idx) => {
                    const record = currentDayAttendance[member.id] || {
                      id: `att_${member.id}_${selectedAttendanceDate}`,
                      memberId: member.id,
                      date: selectedAttendanceDate,
                      checkIn: "--",
                      checkOut: "--",
                      breakMinutes: 0,
                      workingHoursMinutes: 0,
                      status: "Pending" as const,
                      location: `${member.territory} Site`,
                      remarks: "",
                      lateMinutes: 0,
                      overtimeMinutes: 0,
                      createdBy: "System",
                      lastUpdated: "",
                      auditTrail: [],
                    };

                    const statusStyles: Record<string, string> = {
                      Present: "bg-emerald-100 text-emerald-800 border-emerald-200",
                      Late: "bg-amber-100 text-amber-900 border-amber-300",
                      "Half Day": "bg-orange-100 text-orange-800 border-orange-200",
                      Absent: "bg-red-100 text-red-800 border-red-200",
                      Leave: "bg-purple-100 text-purple-800 border-purple-200",
                      Holiday: "bg-blue-100 text-blue-800 border-blue-200",
                      "Week Off": "bg-slate-100 text-slate-700 border-slate-200",
                      Pending: "bg-slate-100 text-slate-500 border-slate-200",
                    };

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Employee Name */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {member.role}
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                          SL-{String(idx + 1).padStart(3, "0")}
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                            {member.category}
                          </span>
                        </td>

                        {/* Check-In */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{record.checkIn}</span>
                            {record.lateMinutes > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Late ({record.lateMinutes}m)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Check-Out */}
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {record.checkOut}
                        </td>

                        {/* Working Hours */}
                        <td className="px-6 py-4 font-bold text-solar-deep">
                          {formatMinutesToHours(record.workingHoursMinutes)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                              statusStyles[record.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {record.location || `${member.territory} Site`}
                            </span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingAttendanceRecord(record);
                                setIsMarkModalOpen(true);
                              }}
                              title="Mark or Edit Record"
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                setDrawerRecord(record);
                                setIsDetailDrawerOpen(true);
                              }}
                              title="View Audit Trail"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
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
      {/* 2. MONTHLY MATRIX VIEW (EMPLOYEE X 1-31 DAYS) */}
      {/* ======================================================== */}
      {activeTab === "monthly" && (
        <MonthlyMatrixView
          teamMembers={teamList}
          attendanceHistory={attendanceHistory}
          onSelectCell={(memberId, date) => {
            const existing = attendanceHistory[date]?.[memberId];
            setEditingAttendanceRecord(
              existing || {
                memberId,
                date,
              }
            );
            setIsMarkModalOpen(true);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 3. CORRECTION REQUESTS WORKFLOW */}
      {/* ======================================================== */}
      {activeTab === "corrections" && (
        <CorrectionRequestsView
          teamMembers={teamList}
          correctionRequests={correctionRequests}
          onApprove={handleApproveCorrection}
          onReject={handleRejectCorrection}
          onSubmitNew={handleSubmitNewCorrection}
        />
      )}

      {/* ======================================================== */}
      {/* 4. EMPLOYEE PROFILES SUBHEADING */}
      {/* ======================================================== */}
      {activeTab === "profiles" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Employee Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-heading text-base text-slate-900">
                  Solar Technical Workforce Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Technicians, fitters, engineers, and site managers
                </p>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
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
                    <th className="px-6 py-3.5 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamList.map((member) => (
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
      {/* 5. PAYROLL & PAYMENT CONNECTED TO ATTENDANCE */}
      {/* ======================================================== */}
      {activeTab === "payroll" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold font-heading text-base text-slate-900">
                Attendance-Verified Payroll Calculation
              </h3>
              <p className="text-xs text-slate-500">
                Wages automatically calculated based on verified present days, approved paid leaves, and deductions.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
              Cycle: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Verified Paid Days</th>
                    <th className="px-6 py-3.5">Unpaid / Absent</th>
                    <th className="px-6 py-3.5">Base Monthly Pay</th>
                    <th className="px-6 py-3.5">Site Allowance (Bhatta)</th>
                    <th className="px-6 py-3.5">Total Payable</th>
                    <th className="px-6 py-3.5">Disbursement Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamList.map((member) => {
                    const attMetrics = calculateAttendanceForMember(member.id);
                    const record = payrollRecords[member.id] || {
                      memberId: member.id,
                      payType: "Monthly Salary",
                      baseAmount: member.monthlySalary || 18000,
                      fieldAllowance: 2500,
                      bonus: 0,
                      paymentStatus: "PENDING" as const,
                      paymentMode: "UPI" as const,
                      payoutDate: "",
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
                          {attMetrics.paidDays} Days
                        </td>

                        <td className="px-6 py-4 font-semibold text-red-600">
                          {attMetrics.unpaidDays} Days
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
                            onClick={() => handleTogglePaymentStatus(member.id)}
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
      {/* DIALOGS & DRAWERS */}
      {/* ======================================================== */}

      {/* 1. Mark / Edit Attendance Modal */}
      <AttendanceMarkModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        teamMembers={teamList}
        initialRecord={editingAttendanceRecord}
        onSave={handleSaveAttendanceRecord}
        approvedLeaves={approvedLeaves}
        currentAdminUser="Rahul Kumar Bamne (Admin)"
      />

      {/* 2. Slide-Over Detail Drawer with Audit Trail */}
      <AttendanceDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        record={drawerRecord}
        member={teamList.find((m) => m.id === drawerRecord?.memberId) || null}
        onEdit={() => {
          setEditingAttendanceRecord(drawerRecord);
          setIsMarkModalOpen(true);
        }}
      />

      {/* 3. Add Member Modal */}
      {isAddMemberModalOpen &&
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
                      Register solar installation technicians, electricians & survey crew
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
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
                      placeholder="e.g. Solar Fitter"
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
                    onClick={() => setIsAddMemberModalOpen(false)}
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
