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
  dailyRate?: number;
}

interface AttendanceRecord {
  memberId: string;
  status: "Present (On-Site)" | "Present (Survey)" | "Present (Office)" | "Absent" | "Half-Day";
  inTime: string;
  assignedProject: string;
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

  // Tab State: 'profiles' | 'attendance' | 'payroll'
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"profiles" | "attendance" | "payroll">(
    tabParam === "attendance" || tabParam === "payroll" ? tabParam : "profiles"
  );

  useEffect(() => {
    if (tabParam === "attendance" || tabParam === "payroll" || tabParam === "profiles") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "profiles" | "attendance" | "payroll") => {
    setActiveTab(tab);
    router.replace(`/admin/team?tab=${tab}`, { scroll: false });
  };

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Attendance State with Historical Date Support
  const getTodayISO = () => new Date().toISOString().split("T")[0];
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(getTodayISO());
  const [attendanceHistory, setAttendanceHistory] = useState<
    Record<string, Record<string, AttendanceRecord>>
  >({});

  // Payroll State
  const [payrollRecords, setPayrollRecords] = useState<Record<string, PayrollRecord>>({});

  // Multi-select & custom tag state for Add Member Modal
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Mono-PERC Installation",
    "Hot-Dip GI Fabrication",
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load real team list and records from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sunlife_admin_team_roster");
      let initialList: TeamMember[] = [];

      if (saved) {
        try {
          initialList = JSON.parse(saved);
        } catch {
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
      } else {
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

      // Initialize Attendance History
      const savedAtt = localStorage.getItem("sunlife_admin_attendance_history");
      const today = getTodayISO();
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
            status: m.status === "Active On-Site" ? "Present (On-Site)" : "Present (Office)",
            inTime: "09:00 AM",
            assignedProject: m.territory ? `${m.territory} Solar Site` : "Narmadapuram HQ",
          };
        });
        history[today] = todayRecords;
      }

      setAttendanceHistory(history);

      // Initialize Payroll Records
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
          m.category === "Management" || m.category === "Engineer" ? "Monthly Salary" : "Daily Rate",
        baseAmount: m.monthlySalary || (m.dailyRate ? m.dailyRate * 26 : 18000),
        fieldAllowance: 2500,
        bonus: 0,
        paymentStatus: "PAID",
        paymentMode: "UPI",
        payoutDate: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      };
    });
    setPayrollRecords(records);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSkillDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveTeamList = (updated: TeamMember[]) => {
    setTeamList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_team_roster", JSON.stringify(updated));
    }
  };

  const saveAttendanceHistory = (
    updatedHistory: Record<string, Record<string, AttendanceRecord>>
  ) => {
    setAttendanceHistory(updatedHistory);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sunlife_admin_attendance_history",
        JSON.stringify(updatedHistory)
      );
    }
  };

  const savePayroll = (updated: Record<string, PayrollRecord>) => {
    setPayrollRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_payroll", JSON.stringify(updated));
    }
  };

  // Get current active date's attendance records
  const currentDayAttendance = attendanceHistory[selectedAttendanceDate] || {};

  const handleUpdateAttendanceField = (
    memberId: string,
    field: keyof AttendanceRecord,
    value: string
  ) => {
    const dayRecords = attendanceHistory[selectedAttendanceDate] || {};
    const current = dayRecords[memberId] || {
      memberId,
      status: "Present (Office)",
      inTime: "09:00 AM",
      assignedProject: "Narmadapuram HQ",
    };

    const updatedDay = {
      ...dayRecords,
      [memberId]: { ...current, [field]: value },
    };

    saveAttendanceHistory({
      ...attendanceHistory,
      [selectedAttendanceDate]: updatedDay,
    });
  };

  const handleMarkAllAttendance = (status: AttendanceRecord["status"]) => {
    const dayRecords = attendanceHistory[selectedAttendanceDate] || {};
    const updatedDay = { ...dayRecords };

    teamList.forEach((m) => {
      const current = dayRecords[m.id] || {
        memberId: m.id,
        status: "Present (Office)",
        inTime: "09:00 AM",
        assignedProject: `${m.territory} Site`,
      };
      updatedDay[m.id] = { ...current, status };
    });

    saveAttendanceHistory({
      ...attendanceHistory,
      [selectedAttendanceDate]: updatedDay,
    });
  };

  // Download Attendance Report as Excel (.csv format)
  const handleDownloadExcelReport = () => {
    const formattedDate = new Date(selectedAttendanceDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let csvContent = "";
    csvContent += "SUNLIFE SOLAR ENERGY SOLUTION - DAILY WORKFORCE ATTENDANCE REPORT\n";
    csvContent += `Report Date:,"${formattedDate}"\n`;
    csvContent += `Generated On:,"${new Date().toLocaleString("en-IN")}"\n\n`;

    // Table Header
    csvContent +=
      "Employee Name,Designation,Department,Contact Phone,Territory,Attendance Status,In-Time,Assigned Project Site\n";

    // Table Rows
    teamList.forEach((member) => {
      const record = currentDayAttendance[member.id] || {
        status: "Present (Office)",
        inTime: "09:00 AM",
        assignedProject: `${member.territory} Site`,
      };

      const row = [
        `"${member.name.replace(/"/g, '""')}"`,
        `"${member.role.replace(/"/g, '""')}"`,
        `"${member.category}"`,
        `"${member.phone}"`,
        `"${member.territory.replace(/"/g, '""')}"`,
        `"${record.status}"`,
        `"${record.inTime}"`,
        `"${record.assignedProject.replace(/"/g, '""')}"`,
      ];
      csvContent += row.join(",") + "\n";
    });

    // Summary Calculations
    const presentOnSite = Object.values(currentDayAttendance).filter(
      (a) => a.status === "Present (On-Site)"
    ).length;
    const presentSurvey = Object.values(currentDayAttendance).filter(
      (a) => a.status === "Present (Survey)"
    ).length;
    const presentOffice = Object.values(currentDayAttendance).filter(
      (a) => a.status === "Present (Office)"
    ).length;
    const absentCount = Object.values(currentDayAttendance).filter(
      (a) => a.status === "Absent"
    ).length;

    csvContent += "\n--- ATTENDANCE SUMMARY ---\n";
    csvContent += `Total Staff Registered:,"${teamList.length}"\n`;
    csvContent += `Present On-Site Installation:,"${presentOnSite}"\n`;
    csvContent += `Present Site Survey:,"${presentSurvey}"\n`;
    csvContent += `Present Office/Logistics:,"${presentOffice}"\n`;
    csvContent += `Absent / On Leave:,"${absentCount}"\n`;

    // Trigger File Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sunlife_Solar_Attendance_${selectedAttendanceDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Form state for adding new technician/crew member
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    category: "Fitter" as TeamMember["category"],
    phone: "",
    territory: "Narmadapuram",
    status: "Available" as TeamMember["status"],
    monthlySalary: 18000,
  });

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
      setCustomSkillInput("");
    }
  };

  const removeSkillTag = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
  };

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

    const updatedList = [created, ...teamList];
    saveTeamList(updatedList);

    // Add attendance entry to current day
    const dayRecords = attendanceHistory[selectedAttendanceDate] || {};
    saveAttendanceHistory({
      ...attendanceHistory,
      [selectedAttendanceDate]: {
        ...dayRecords,
        [created.id]: {
          memberId: created.id,
          status: "Present (Office)",
          inTime: "09:00 AM",
          assignedProject: `${created.territory} Site`,
        },
      },
    });

    // Add payroll entry
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
        payoutDate: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      },
    });

    setIsAddModalOpen(false);
    setNewMember({
      name: "",
      role: "",
      category: "Fitter",
      phone: "",
      territory: "Narmadapuram",
      status: "Available",
      monthlySalary: 18000,
    });
    setSelectedSkills(["Mono-PERC Installation", "Hot-Dip GI Fabrication"]);
  };

  const handleDeleteMember = (id: string) => {
    if (id === "owner-1") return;
    const updated = teamList.filter((m) => m.id !== id);
    saveTeamList(updated);
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

  const filteredTeam = teamList.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase()) ||
      member.territory.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.includes(search);

    const matchesCategory =
      selectedCategory === "All" || member.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // KPI Calculations
  const activeOnSiteCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Present (On-Site)"
  ).length;
  const onSurveyCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Present (Survey)"
  ).length;
  const presentOfficeCount = Object.values(currentDayAttendance).filter(
    (a) => a.status === "Present (Office)"
  ).length;
  const totalPresentCount = activeOnSiteCount + onSurveyCount + presentOfficeCount;

  const totalPayrollAmount = Object.values(payrollRecords).reduce(
    (acc, cur) => acc + (cur.baseAmount || 0) + (cur.fieldAllowance || 0) + (cur.bonus || 0),
    0
  );
  const paidPayrollAmount = Object.values(payrollRecords)
    .filter((p) => p.paymentStatus === "PAID")
    .reduce((acc, cur) => acc + (cur.baseAmount || 0) + (cur.fieldAllowance || 0) + (cur.bonus || 0), 0);
  const pendingPayrollAmount = totalPayrollAmount - paidPayrollAmount;

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-solar-emerald mb-1">
            Workforce & Operations Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Team & Field Crew
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daily field attendance logging, technician profiles, and monthly payroll reports.
          </p>
        </div>

        {/* Action Buttons based on Tab */}
        {activeTab === "profiles" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}

        {activeTab === "attendance" && (
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Excel Download Button */}
            <button
              onClick={handleDownloadExcelReport}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel Report (.csv)</span>
            </button>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-2 bg-slate-900 text-sun-amber text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cycle: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
            </span>
          </div>
        )}
      </div>

      {/* 3 Sub-Heading Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap sm:flex-nowrap gap-1.5 w-full">
        {/* Tab 1: Employee Profiles */}
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

        {/* Tab 2: Attendance & Duty */}
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
            {totalPresentCount} Logged
          </span>
        </button>

        {/* Tab 3: Payroll and Payment */}
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
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "payroll"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            ₹{totalPayrollAmount ? `${Math.round(totalPayrollAmount / 1000)}k` : "0"}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBHEADING 1: EMPLOYEE PROFILES */}
      {/* ======================================================== */}
      {activeTab === "profiles" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Status KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Staff
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                  {teamList.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Registered personnel
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active On-Site
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-solar-deep flex items-center justify-center">
                  <HardHat className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-solar-deep">
                  {activeOnSiteCount}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Field installation duty
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Roof Surveys
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">
                  {onSurveyCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Site assessments
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                  {teamList.length - activeOnSiteCount - onSurveyCount}
                </div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  Ready for dispatch
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center w-full">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, role, territory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {["All", "Management", "Fitter", "Electrician", "Survey"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat
                      ? "bg-solar-deep text-white shadow-xs font-bold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Designation & Category</th>
                    <th className="px-6 py-3.5">Contact Number</th>
                    <th className="px-6 py-3.5">Territory Hub</th>
                    <th className="px-6 py-3.5">Skills & Technical Expertise</th>
                    <th className="px-6 py-3.5">Duty Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeam.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-solar-deep border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Joined {member.joinedYear}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {member.role}
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {member.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <a
                          href={`tel:${member.phone}`}
                          className="font-bold text-solar-deep hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </a>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
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

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                            member.status === "Active On-Site"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : member.status === "On Survey"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === "Active On-Site"
                                ? "bg-emerald-500 animate-pulse"
                                : member.status === "On Survey"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                          />
                          <span>{member.status}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${member.phone}`}
                            title="Call Member"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-700 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${member.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Message on WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          {member.id !== "owner-1" && (
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              title="Remove Staff"
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
      {/* SUBHEADING 2: DAILY ATTENDANCE & EXCEL REPORT */}
      {/* ======================================================== */}
      {activeTab === "attendance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Attendance Control Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Picker */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-solar-deep shrink-0" />
                <label className="text-xs font-bold text-slate-700">Attendance Date:</label>
                <input
                  type="date"
                  value={selectedAttendanceDate}
                  onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              {selectedAttendanceDate === getTodayISO() && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Today
                </span>
              )}
            </div>

            {/* Quick Bulk Actions & Excel Export */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleMarkAllAttendance("Present (On-Site)")}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All On-Site</span>
              </button>

              <button
                onClick={() => handleMarkAllAttendance("Present (Office)")}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-800 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Mark All Office</span>
              </button>

              <button
                onClick={handleDownloadExcelReport}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Daily Attendance Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Present
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-solar-deep flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                  {totalPresentCount} / {teamList.length}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Logged on {selectedAttendanceDate}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  On-Site Installs
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-solar-deep flex items-center justify-center">
                  <HardHat className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-solar-deep">
                  {activeOnSiteCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Rooftop execution crew
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  On Survey
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">
                  {onSurveyCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Shadow analysis & scoping
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Absent / Leave
                </span>
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                  {
                    Object.values(currentDayAttendance).filter((a) => a.status === "Absent")
                      .length
                  }
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Off duty
                </div>
              </div>
            </div>
          </div>

          {/* Daily Attendance Sheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold font-heading text-base text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-solar-deep" />
                  <span>Daily Attendance Sheet • {selectedAttendanceDate}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mark daily presence, adjust arrival punch in-time, and assign specific rooftop project sites.
                </p>
              </div>

              <button
                onClick={handleDownloadExcelReport}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-sun-amber" />
                <span>Export to Excel (.csv)</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Employee Name</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Daily Duty Status</th>
                    <th className="px-6 py-3.5">In-Time</th>
                    <th className="px-6 py-3.5">Assigned Solar Project Site</th>
                    <th className="px-6 py-3.5 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamList.map((member) => {
                    const record = currentDayAttendance[member.id] || {
                      memberId: member.id,
                      status: "Present (Office)",
                      inTime: "09:00 AM",
                      assignedProject: `${member.territory} Site`,
                    };

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {member.role}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                            {member.category}
                          </span>
                        </td>

                        {/* Daily Status Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={record.status}
                            onChange={(e) =>
                              handleUpdateAttendanceField(
                                member.id,
                                "status",
                                e.target.value as AttendanceRecord["status"]
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              record.status === "Present (On-Site)"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : record.status === "Present (Survey)"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : record.status === "Present (Office)"
                                ? "bg-blue-50 text-blue-800 border-blue-300"
                                : "bg-red-50 text-red-800 border-red-300"
                            }`}
                          >
                            <option value="Present (On-Site)">🟢 Present (On-Site Installation)</option>
                            <option value="Present (Survey)">🟡 Present (Rooftop Survey)</option>
                            <option value="Present (Office)">🔵 Present (Office / Logistics)</option>
                            <option value="Half-Day">🟠 Half-Day</option>
                            <option value="Absent">🔴 Absent / Leave</option>
                          </select>
                        </td>

                        {/* In-Time Editable */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={record.inTime}
                              onChange={(e) =>
                                handleUpdateAttendanceField(member.id, "inTime", e.target.value)
                              }
                              placeholder="09:00 AM"
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </td>

                        {/* Assigned Site Editable */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                            <input
                              type="text"
                              value={record.assignedProject}
                              onChange={(e) =>
                                handleUpdateAttendanceField(
                                  member.id,
                                  "assignedProject",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. 5kW Rooftop - Narmadapuram"
                              className="w-48 sm:w-64 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </td>

                        {/* Call */}
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`tel:${member.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-solar-deep hover:text-white rounded-lg text-slate-700 font-semibold transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
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
      {/* SUBHEADING 3: PAYROLL AND PAYMENT */}
      {/* ======================================================== */}
      {activeTab === "payroll" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Monthly Payroll
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
                  ₹{totalPayrollAmount.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Base + Site Allowances
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Disbursed Payouts
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-solar-deep flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-solar-deep">
                  ₹{paidPayrollAmount.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Cleared via UPI / Bank
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pending Payouts
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-600">
                  ₹{pendingPayrollAmount.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Awaiting clearance
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Disbursement Mode
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-bold font-heading text-slate-900">
                  Direct UPI & NEFT
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Instant settlement
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold font-heading text-base text-slate-900">
                  Staff Wage & Payment Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly wage calculation, field allowances (Bhatta), and payment clearance status
                </p>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Payment Type</th>
                    <th className="px-6 py-3.5">Base Pay</th>
                    <th className="px-6 py-3.5">Site Allowance (Bhatta)</th>
                    <th className="px-6 py-3.5">Total Payable</th>
                    <th className="px-6 py-3.5">Payment Mode</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamList.map((member) => {
                    const record = payrollRecords[member.id] || {
                      memberId: member.id,
                      payType: "Monthly Salary",
                      baseAmount: member.monthlySalary || 18000,
                      fieldAllowance: 2500,
                      bonus: 0,
                      paymentStatus: "PENDING",
                      paymentMode: "UPI",
                      payoutDate: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
                    };

                    const totalPay = (record.baseAmount || 0) + (record.fieldAllowance || 0) + (record.bonus || 0);

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {member.role}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md">
                            {record.payType}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          ₹{record.baseAmount.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-emerald-700 font-semibold">
                          +₹{record.fieldAllowance.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-extrabold text-sm text-slate-900">
                            ₹{totalPay.toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                            {record.paymentMode}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              record.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {record.paymentStatus === "PAID" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{record.paymentStatus}</span>
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

      {/* Spacious Add Team Member Modal with Brand Logo rendered via Portal */}
      {isAddModalOpen &&
        isLoaded &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-auto">
              {/* Modal Header with Sunlife Logo */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <Image
                    src="/logo/logo.svg"
                    alt="Sunlife Solar Energy Solution"
                    width={140}
                    height={40}
                    className="h-8 w-auto object-contain"
                    priority
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddMember} className="space-y-5 text-xs">
                {/* 2-Column Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Technician / Engineer Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Contact Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98260XXXXX"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                    />
                  </div>

                  {/* Role / Title */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Designation / Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Rooftop GI Fitter"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                    />
                  </div>

                  {/* Department Dropdown */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                    >
                      <option value="Fitter">Installation Fitter & GI Rigging</option>
                      <option value="Electrician">Solar Electrician & Wiring</option>
                      <option value="Survey">Site Survey & Shadow Analysis</option>
                      <option value="Engineer">Solar PV Design Engineer</option>
                      <option value="Management">Operations & Management</option>
                    </select>
                  </div>

                  {/* Territory */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Assigned Territory Hub
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Narmadapuram / Itarsi"
                      value={newMember.territory}
                      onChange={(e) =>
                        setNewMember({ ...newMember, territory: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                    />
                  </div>

                  {/* Monthly Base Pay */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Monthly Wage / Base Salary (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 18000"
                      value={newMember.monthlySalary}
                      onChange={(e) =>
                        setNewMember({ ...newMember, monthlySalary: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                    />
                  </div>
                </div>

                {/* Skills & Certifications Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">
                      Skills & Technical Certifications
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {selectedSkills.length} selected
                    </span>
                  </div>

                  {/* Selected Skills Chips */}
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[44px]">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-solar-deep text-xs font-semibold rounded-xl border border-emerald-200/80 animate-in fade-in"
                        >
                          <Tag className="w-3 h-3 text-solar-emerald" />
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkillTag(skill)}
                            className="p-0.5 rounded-md hover:bg-emerald-200/60 text-emerald-800 cursor-pointer transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dropdown Toggle & Custom Write-in Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Predefined Dropdown Trigger */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-slate-700 flex items-center justify-between transition-colors cursor-pointer text-xs font-medium"
                      >
                        <span className="truncate">
                          {isSkillDropdownOpen ? "Close Skills List" : "Select Predefined Skills..."}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isSkillDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Options Box */}
                      {isSkillDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 space-y-1.5 max-h-56 overflow-y-auto">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                            Click to toggle skill:
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {PREDEFINED_SKILLS.map((skill) => {
                              const isSelected = selectedSkills.includes(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => toggleSkill(skill)}
                                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-50 text-solar-deep font-bold border border-emerald-200/80"
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <span>{skill}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-solar-emerald shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom Write-in Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type custom skill..."
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomSkill();
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSkill}
                        className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-solar-deep text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors shrink-0 cursor-pointer text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold cursor-pointer transition-all shadow-md shadow-emerald-950/15"
                  >
                    Save Team Member
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
