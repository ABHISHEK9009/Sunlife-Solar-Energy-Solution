"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import {
  Users,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  Search,
  CheckCircle2,
  X,
  Trash2,
  Calendar,
  CreditCard,
  Clock,
  FileSpreadsheet,
  CheckCheck,
  Smartphone,
  Edit3,
  Download,
  LogIn,
  LogOut,
  Share2,
  FileText,
  BarChart3,
  ImageIcon,
  Loader2,
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

type ExportPreset =
  | "today"
  | "yesterday"
  | "last3days"
  | "thisweek"
  | "lastweek"
  | "thismonth"
  | "lastmonth"
  | "last6months"
  | "thisyear"
  | "custom";

function TeamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab State: 'attendance' | 'monthly' | 'profiles' | 'payroll'
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"attendance" | "monthly" | "profiles" | "payroll">(
    tabParam === "monthly" || tabParam === "profiles" || tabParam === "payroll"
      ? tabParam
      : "attendance"
  );

  useEffect(() => {
    if (
      tabParam === "attendance" ||
      tabParam === "monthly" ||
      tabParam === "profiles" ||
      tabParam === "payroll"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: "attendance" | "monthly" | "profiles" | "payroll") => {
    setActiveTab(tab);
    router.replace(`/admin/team?tab=${tab}`, { scroll: false });
  };

  // Date is strictly locked to TODAY for real-time punch
  const getTodayISO = () => new Date().toISOString().split("T")[0];
  const todayISO = getTodayISO();
  const [todayFormatted, setTodayFormatted] = useState("");
  const [liveClockTime, setLiveClockTime] = useState("");

  const [search, setSearch] = useState("");
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  
  // Date-wise Attendance Store: { [YYYY-MM-DD]: { [memberId]: AttendanceRecord } }
  const [attendanceHistory, setAttendanceHistory] = useState<
    Record<string, Record<string, AttendanceRecord>>
  >({});
  const [payrollRecords, setPayrollRecords] = useState<Record<string, PayrollRecord>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Update Attendance Card / Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMemberForUpdate, setSelectedMemberForUpdate] = useState<TeamMember | null>(null);
  const [modalFormStatus, setModalFormStatus] = useState<AttendanceRecord["status"]>("Present");
  const [modalFormCheckIn, setModalFormCheckIn] = useState("--");
  const [modalFormCheckOut, setModalFormCheckOut] = useState("--");
  const [modalFormSite, setModalFormSite] = useState("");
  const [modalFormRemarks, setModalFormRemarks] = useState("");

  // Download / Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<ExportPreset>("thismonth");
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState(todayISO);

  // Monthly Page State (Month & Selected Member Filter)
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthlyFilterMemberId, setMonthlyFilterMemberId] = useState<string>("ALL");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

  // Clock ticker & formatted date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClockTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setTodayFormatted(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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
            checkOut: "--",
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

  // Save Helpers
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
      localStorage.setItem("sunlife_admin_attendance_v2", JSON.stringify(updated));
    }
  };

  const savePayroll = (updated: Record<string, PayrollRecord>) => {
    setPayrollRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sunlife_admin_payroll_v3", JSON.stringify(updated));
    }
  };

  // Current selected date's attendance records (strictly today)
  const todayAttendance = attendanceHistory[todayISO] || {};

  // Open Update Modal Card for specific staff member
  const handleOpenUpdateModal = (member: TeamMember) => {
    setSelectedMemberForUpdate(member);

    const existing = todayAttendance[member.id] || {
      memberId: member.id,
      status: "Present" as const,
      checkIn: "--",
      checkOut: "--",
      assignedSite: `${member.territory} Solar Site`,
      remarks: "",
    };

    setModalFormStatus(existing.status || "Present");
    setModalFormCheckIn(existing.checkIn || "--");
    setModalFormCheckOut(existing.checkOut || "--");
    setModalFormSite(existing.assignedSite || `${member.territory} Solar Site`);
    setModalFormRemarks(existing.remarks || "");
    setIsUpdateModalOpen(true);
  };

  // Trigger Punch In (Captures exact current real-time clock)
  const handleTriggerPunchIn = () => {
    const timeNow = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setModalFormCheckIn(timeNow);
    if (modalFormStatus === "Absent" || modalFormStatus === "Leave") {
      setModalFormStatus("Present");
    }
  };

  // Trigger Punch Out (Captures exact current real-time clock)
  const handleTriggerPunchOut = () => {
    const timeNow = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setModalFormCheckOut(timeNow);
  };

  // Save Attendance from Modal Card
  const handleSaveModalAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForUpdate) return;

    const memberId = selectedMemberForUpdate.id;
    const targetDate = todayISO;

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

  // Quick Action: Mark All Present for Today
  const handleMarkAllPresent = () => {
    const timeNow = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedDay = { ...todayAttendance };
    teamList.forEach((m) => {
      const current = todayAttendance[m.id] || {
        memberId: m.id,
        status: "Present",
        checkIn: timeNow,
        checkOut: "--",
        assignedSite: `${m.territory} Solar Site`,
      };
      updatedDay[m.id] = {
        ...current,
        status: "Present",
        checkIn: current.checkIn && current.checkIn !== "--" ? current.checkIn : timeNow,
      };
    });

    saveAttendanceHistory({
      ...attendanceHistory,
      [todayISO]: updatedDay,
    });
  };

  // Calculate Date Range based on Presets
  const computeExportRange = () => {
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().split("T")[0];

    let start = toISO(now);
    let end = toISO(now);
    let label = "Today";

    if (exportPreset === "today") {
      start = toISO(now);
      end = toISO(now);
      label = "Today";
    } else if (exportPreset === "yesterday") {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      start = toISO(y);
      end = toISO(y);
      label = "Yesterday";
    } else if (exportPreset === "last3days") {
      const d = new Date(now);
      d.setDate(now.getDate() - 2);
      start = toISO(d);
      end = toISO(now);
      label = "Last 3 Days";
    } else if (exportPreset === "thisweek") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      start = toISO(monday);
      end = toISO(now);
      label = "This Week";
    } else if (exportPreset === "lastweek") {
      const d = new Date(now);
      const day = d.getDay();
      const prevMon = new Date(d.setDate(d.getDate() - day - 6));
      const prevSun = new Date(prevMon);
      prevSun.setDate(prevMon.getDate() + 6);
      start = toISO(prevMon);
      end = toISO(prevSun);
      label = "Last Week";
    } else if (exportPreset === "thismonth") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      start = toISO(first);
      end = toISO(now);
      label = "This Month";
    } else if (exportPreset === "lastmonth") {
      const firstLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastLast = new Date(now.getFullYear(), now.getMonth(), 0);
      start = toISO(firstLast);
      end = toISO(lastLast);
      label = "Last Month";
    } else if (exportPreset === "last6months") {
      const sixM = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      start = toISO(sixM);
      end = toISO(now);
      label = "Last 6 Months";
    } else if (exportPreset === "thisyear") {
      const firstY = new Date(now.getFullYear(), 0, 1);
      start = toISO(firstY);
      end = toISO(now);
      label = "This Year";
    } else if (exportPreset === "custom") {
      start = customStartDate || toISO(now);
      end = customEndDate || toISO(now);
      label = `Custom Range (${start} to ${end})`;
    }

    return { start, end, label };
  };

  // Perform Date-Range Excel (.csv) Export
  const handleExecuteExport = () => {
    const { start, end, label } = computeExportRange();

    let csv = "SUNLIFE SOLAR ENERGY SOLUTION - WORKFORCE ATTENDANCE REPORT\n";
    csv += `Date Range:,"${label}" (${start} to ${end})\n`;
    csv += `Exported On:,"${new Date().toLocaleString("en-IN")}"\n`;
    csv += `Organization:,"Sunlife Solar Energy Solution, Narmadapuram MP"\n\n`;

    csv += "Date,Employee Name,Role,Department,Contact Phone,Attendance Status,Check-In Time,Check-Out Time,Assigned Project Site,Remarks\n";

    let totalEntries = 0;
    let presentCountTotal = 0;
    let halfDayCountTotal = 0;
    let absentCountTotal = 0;
    let leaveCountTotal = 0;

    const allDates = Object.keys(attendanceHistory).sort();
    const matchedDates = allDates.filter((d) => d >= start && d <= end);

    if (matchedDates.length === 0) {
      teamList.forEach((m) => {
        csv += `"${start}","${m.name}","${m.role}","${m.category}","${m.phone}","Present","09:15 AM","--","${m.territory} Site","Regular Duty"\n`;
        totalEntries++;
        presentCountTotal++;
      });
    } else {
      matchedDates.forEach((dateKey) => {
        const dayMap = attendanceHistory[dateKey] || {};
        teamList.forEach((m) => {
          const rec = dayMap[m.id] || {
            status: "Present",
            checkIn: "--",
            checkOut: "--",
            assignedSite: `${m.territory} Site`,
            remarks: "",
          };

          csv += `"${dateKey}","${m.name}","${m.role}","${m.category}","${m.phone}","${rec.status}","${rec.checkIn}","${rec.checkOut}","${rec.assignedSite}","${rec.remarks || ""}"\n`;
          totalEntries++;

          if (rec.status === "Present" || rec.status === "On Survey") presentCountTotal++;
          else if (rec.status === "Half Day") halfDayCountTotal++;
          else if (rec.status === "Absent") absentCountTotal++;
          else if (rec.status === "Leave") leaveCountTotal++;
        });
      });
    }

    csv += "\nSUMMARY TOTALS:\n";
    csv += `Total Staff Logged:,"${totalEntries}"\n`;
    csv += `Total Full-Day Present:,"${presentCountTotal}"\n`;
    csv += `Total Half-Days:,"${halfDayCountTotal}"\n`;
    csv += `Total Absent:,"${absentCountTotal}"\n`;
    csv += `Total On Leave:,"${leaveCountTotal}"\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Sunlife_Attendance_${exportPreset}_${start}_to_${end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportModalOpen(false);
  };

  // Compute stats for a specific member in the selected month
  const getMemberMonthlyStats = (memberId: string, monthYear: string) => {
    let present = 0;
    let onSurvey = 0;
    let halfDay = 0;
    let absent = 0;
    let leave = 0;

    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayBreakdown: {
      day: number;
      dateISO: string;
      formattedDate: string;
      status: string;
      checkIn: string;
      checkOut: string;
      assignedSite: string;
      remarks: string;
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateISO = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;
      const dayDate = new Date(year, month - 1, d);
      const formattedDate = dayDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      const dayMap = attendanceHistory[dateISO] || {};
      const rec = dayMap[memberId];

      if (rec) {
        if (rec.status === "Present") present++;
        else if (rec.status === "On Survey") onSurvey++;
        else if (rec.status === "Half Day") halfDay++;
        else if (rec.status === "Absent") absent++;
        else if (rec.status === "Leave") leave++;

        dayBreakdown.push({
          day: d,
          dateISO,
          formattedDate,
          status: rec.status,
          checkIn: rec.checkIn || "--",
          checkOut: rec.checkOut || "--",
          assignedSite: rec.assignedSite || "Narmadapuram Solar Site",
          remarks: rec.remarks || "On-site solar installation duty",
        });
      } else {
        const isSunday = dayDate.getDay() === 0;
        dayBreakdown.push({
          day: d,
          dateISO,
          formattedDate,
          status: isSunday ? "Sunday" : "--",
          checkIn: "--",
          checkOut: "--",
          assignedSite: isSunday ? "Weekly Off" : "--",
          remarks: isSunday ? "Scheduled Weekly Off" : "--",
        });
      }
    }

    const totalLogged = present + onSurvey + halfDay + absent + leave;
    const verifiedPayableDays = present + onSurvey + halfDay * 0.5;
    const attendancePercentage =
      totalLogged > 0
        ? (((present + onSurvey + halfDay * 0.5) / totalLogged) * 100).toFixed(1)
        : "100.0";

    return {
      present,
      onSurvey,
      halfDay,
      absent,
      leave,
      totalLogged,
      verifiedPayableDays,
      attendancePercentage,
      daysInMonth,
      dayBreakdown,
    };
  };

  // State for Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate WhatsApp Web Sharing Link
  const getWhatsAppShareUrl = (member: TeamMember, monthYear: string) => {
    const stats = getMemberMonthlyStats(member.id, monthYear);
    const [year, month] = monthYear.split("-");
    const monthName = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toLocaleString(
      "en-IN",
      { month: "long", year: "numeric" }
    );

    const origin = typeof window !== "undefined" ? window.location.origin : "https://sunlifesolar.in";
    const slipUrl = `${origin}/crew/slip?id=${member.id}&month=${monthYear}`;

    let msg = `☀️ *SUNLIFE SOLAR ENERGY SOLUTION*\n`;
    msg += `📋 *Monthly Attendance Report — ${monthName}*\n\n`;
    msg += `👤 *Staff Member:* ${member.name}\n`;
    msg += `🔧 *Designation:* ${member.role} (${member.category})\n`;
    msg += `📍 *Territory:* ${member.territory}\n\n`;
    msg += `📊 *ATTENDANCE BREAKDOWN:*\n`;
    msg += `✅ *Present (Full Day):* ${stats.present} Days\n`;
    msg += `🟡 *On Site Survey:* ${stats.onSurvey} Days\n`;
    msg += `🟠 *Half Days:* ${stats.halfDay} Days\n`;
    msg += `❌ *Absent Days:* ${stats.absent} Days\n`;
    msg += `🟣 *Approved Leave:* ${stats.leave} Days\n\n`;
    msg += `📈 *Attendance Score:* ${stats.attendancePercentage}%\n`;
    msg += `💰 *Verified Payable Days:* ${stats.verifiedPayableDays} Days\n\n`;
    msg += `🖼️ *View Full Digital Slip:* ${slipUrl}\n\n`;
    msg += `_Generated by Sunlife Solar Workforce HRM Portal._`;

    const phoneClean = member.phone.replace(/[^0-9]/g, "");
    return `https://web.whatsapp.com/send?phone=91${phoneClean}&text=${encodeURIComponent(msg)}`;
  };

  // Capture and Download Monthly Slip as High-Res PNG Image
  const handleDownloadSlipImage = async (member: TeamMember) => {
    const element = document.getElementById("printable-attendance-slip");
    if (!element) return;

    try {
      setIsGeneratingImage(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const cleanName = member.name.replace(/\s+/g, "_");
      link.href = image;
      link.download = `Sunlife_Attendance_Slip_${cleanName}_${selectedMonthYear}.png`;
      link.click();
    } catch (err) {
      console.error("Error generating attendance image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Share Attendance Slip as Image directly to WhatsApp Web
  const handleShareSlipImage = async (member: TeamMember) => {
    const element = document.getElementById("printable-attendance-slip");
    if (!element) return;

    try {
      setIsGeneratingImage(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGeneratingImage(false);
          return;
        }

        const cleanName = member.name.replace(/\s+/g, "_");

        // 1. Copy image to Clipboard for instant pasting in WhatsApp Web
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
              }),
            ]);
            setToastMessage("📸 Image copied to clipboard! In WhatsApp Web, simply press Ctrl + V to attach the image to your message.");
            setTimeout(() => setToastMessage(null), 8000);
          } catch (clipErr) {
            console.log("Clipboard write image skipped:", clipErr);
          }
        }

        // 2. Download high-res PNG image as backup
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Sunlife_Attendance_Slip_${cleanName}_${selectedMonthYear}.png`;
        link.click();

        // 3. Open WhatsApp Web directly with staff contact and pre-filled report
        const waWebUrl = getWhatsAppShareUrl(member, selectedMonthYear);
        window.open(waWebUrl, "_blank");

        setIsGeneratingImage(false);
      }, "image/png");
    } catch (err) {
      console.error("Error sharing attendance image to WhatsApp Web:", err);
      setIsGeneratingImage(false);
    }
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

    const todayRecords = attendanceHistory[todayISO] || {};
    saveAttendanceHistory({
      ...attendanceHistory,
      [todayISO]: {
        ...todayRecords,
        [created.id]: {
          memberId: created.id,
          status: "Present",
          checkIn: "--",
          checkOut: "--",
          assignedSite: `${created.territory} Site`,
        },
      },
    });

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

  // KPI calculations for today
  const totalStaff = teamList.length;
  const presentCount = Object.values(todayAttendance).filter(
    (a) => a.status === "Present" || a.status === "On Survey"
  ).length;
  const halfDayCount = Object.values(todayAttendance).filter(
    (a) => a.status === "Half Day"
  ).length;
  const absentCount = Object.values(todayAttendance).filter(
    (a) => a.status === "Absent"
  ).length;
  const leaveCount = Object.values(todayAttendance).filter(
    (a) => a.status === "Leave"
  ).length;

  const filteredTeam = teamList.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search) ||
    m.territory.toLowerCase().includes(search.toLowerCase())
  );

  const activeExportRange = computeExportRange();

  const [selYearStr, selMonthStr] = selectedMonthYear.split("-");
  const selYear = parseInt(selYearStr, 10);
  const selMonth = parseInt(selMonthStr, 10);
  const totalDaysInSelectedMonth = new Date(selYear, selMonth, 0).getDate();
  const monthNameFormatted = new Date(selYear, selMonth - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">
            {toastMessage}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-300 ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-solar-emerald mb-1">
            Workforce & Attendance Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Team & Field Crew
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time punch attendance, month-wise employee report slips, and verified wage records.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href="/crew/punch"
            target="_blank"
            className="px-3.5 py-2.5 bg-solar-deep hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>Open Mobile Punch App ↗</span>
          </Link>

          {(activeTab === "attendance" || activeTab === "monthly") && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Reports (.csv)</span>
            </button>
          )}

          {activeTab === "profiles" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-solar-deep hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Clean Subheading Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap sm:flex-nowrap gap-1.5 w-full">
        {/* Tab 1: Daily Attendance */}
        <button
          onClick={() => handleTabChange("attendance")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "attendance"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Attendance</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "attendance"
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-solar-deep"
            }`}
          >
            {presentCount}
          </span>
        </button>

        {/* Tab 2: Monthly Attendance & Reports (FULL PAGE VIEW) */}
        <button
          onClick={() => handleTabChange("monthly")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "monthly"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Monthly Reports & Slips</span>
        </button>

        {/* Tab 3: Employee Profiles */}
        <button
          onClick={() => handleTabChange("profiles")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "profiles"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
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

        {/* Tab 4: Payroll & Wages */}
        <button
          onClick={() => handleTabChange("payroll")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "payroll"
              ? "bg-solar-deep text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payroll & Payment</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY ATTENDANCE (AUTO-DATE + PUNCH IN/OUT BUTTONS) */}
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
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Present Today
              </span>
              <div className="text-2xl font-extrabold font-heading text-solar-deep mt-1">
                {presentCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Half Day
              </span>
              <div className="text-2xl font-extrabold font-heading text-amber-800 mt-1">
                {halfDayCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Absent
              </span>
              <div className="text-2xl font-extrabold font-heading text-rose-800 mt-1">
                {absentCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                On Leave
              </span>
              <div className="text-2xl font-extrabold font-heading text-purple-800 mt-1">
                {leaveCount}
              </div>
            </div>
          </div>

          {/* Auto-Locked Live Date Banner & Search Strip */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl text-solar-deep">
                <Calendar className="w-4 h-4 text-solar-emerald" />
                <span className="text-xs font-extrabold">
                  Today: {todayFormatted || "Live Today"}
                </span>
                <span className="px-2 py-0.5 bg-solar-deep text-white rounded-md text-[10px] font-bold">
                  {liveClockTime || "LIVE"}
                </span>
              </div>

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

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-solar-deep text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={() => handleTabChange("monthly")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-solar-emerald" />
                <span>Monthly Reports ↗</span>
              </button>
            </div>
          </div>

          {/* Clean Read-Only Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Attendance Status</th>
                    <th className="px-6 py-3.5">Check-In Time</th>
                    <th className="px-6 py-3.5">Check-Out Time</th>
                    <th className="px-6 py-3.5">Assigned Solar Site</th>
                    <th className="px-6 py-3.5 text-right min-w-[200px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeam.map((member) => {
                    const rec = todayAttendance[member.id] || {
                      memberId: member.id,
                      status: "Present",
                      checkIn: "--",
                      checkOut: "--",
                      assignedSite: `${member.territory} Solar Site`,
                    };

                    const statusStyles: Record<string, string> = {
                      Present: "bg-emerald-50 text-emerald-800 border-emerald-200",
                      "On Survey": "bg-amber-50 text-amber-900 border-amber-200",
                      "Half Day": "bg-amber-50 text-amber-800 border-amber-200",
                      Absent: "bg-rose-50 text-rose-800 border-rose-200",
                      Leave: "bg-purple-50 text-purple-800 border-purple-200",
                    };

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {member.role}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                            {member.category}
                          </span>
                        </td>

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
                                  ? "bg-amber-500"
                                  : rec.status === "Absent"
                                  ? "bg-rose-500"
                                  : "bg-purple-500"
                              }`}
                            />
                            <span>{rec.status}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {rec.checkIn && rec.checkIn !== "--" ? (
                            <span className="text-emerald-700 font-bold">{rec.checkIn}</span>
                          ) : (
                            <span className="text-slate-400">Not Punched</span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {rec.checkOut && rec.checkOut !== "--" ? (
                            <span className="text-amber-800 font-bold">{rec.checkOut}</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-700 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-solar-emerald shrink-0" />
                            <span>{rec.assignedSite || `${member.territory} Site`}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenUpdateModal(member)}
                              className="px-3.5 py-1.5 rounded-xl bg-solar-deep hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Punch</span>
                            </button>

                            <button
                              onClick={() => {
                                setMonthlyFilterMemberId(member.id);
                                handleTabChange("monthly");
                              }}
                              title={`View Monthly Slip for ${member.name}`}
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-solar-deep transition-colors cursor-pointer border border-emerald-200"
                            >
                              <FileText className="w-3.5 h-3.5 text-solar-emerald" />
                            </button>

                            <a
                              href={`tel:${member.phone}`}
                              title={`Call ${member.name}`}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
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
      {/* 2. MONTHLY ATTENDANCE & REPORTS (DEDICATED FULL PAGE VIEW) */}
      {/* ======================================================== */}
      {activeTab === "monthly" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Month & Filter Controls Strip */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-solar-deep" />
                <label className="text-xs font-bold text-slate-700">Target Month:</label>
                <input
                  type="month"
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Filter Staff Member */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                <Users className="w-4 h-4 text-solar-deep" />
                <label className="text-xs font-bold text-slate-700">View Staff:</label>
                <select
                  value={monthlyFilterMemberId}
                  onChange={(e) => setMonthlyFilterMemberId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">👥 All Team Members (Monthly Matrix)</option>
                  {teamList.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Month CSV</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: ALL STAFF MONTHLY MATRIX */}
          {monthlyFilterMemberId === "ALL" && (() => {
            // Aggregate Monthly Stats across ALL team members for selectedMonthYear
            let totalPresentDays = 0;
            let totalSurveyDays = 0;
            let totalHalfDays = 0;
            let totalAbsentDays = 0;
            let totalLeaveDays = 0;
            let totalPayableDays = 0;
            let totalLoggedEntries = 0;

            teamList.forEach((m) => {
              const stats = getMemberMonthlyStats(m.id, selectedMonthYear);
              totalPresentDays += stats.present;
              totalSurveyDays += stats.onSurvey;
              totalHalfDays += stats.halfDay;
              totalAbsentDays += stats.absent;
              totalLeaveDays += stats.leave;
              totalPayableDays += stats.verifiedPayableDays;
              totalLoggedEntries += stats.totalLogged;
            });

            const avgAttendanceRate =
              totalLoggedEntries > 0
                ? (((totalPresentDays + totalSurveyDays + totalHalfDays * 0.5) / totalLoggedEntries) * 100).toFixed(1)
                : "100.0";

            return (
              <div className="space-y-6">
                {/* Data-Centric Real Monthly KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Team Attendance
                    </span>
                    <div className="text-2xl font-extrabold font-heading text-emerald-700 mt-1">
                      {avgAttendanceRate}%
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Avg across {teamList.length} staff
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Present Man-Days
                    </span>
                    <div className="text-2xl font-extrabold font-heading text-solar-deep mt-1">
                      {totalPresentDays + totalSurveyDays} <span className="text-xs font-semibold text-slate-500">Days</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {totalPresentDays} Full • {totalSurveyDays} Survey
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Half Days Logged
                    </span>
                    <div className="text-2xl font-extrabold font-heading text-amber-800 mt-1">
                      {totalHalfDays} <span className="text-xs font-semibold text-slate-500">Days</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      0.5 wage equivalent
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                      Absences & Leaves
                    </span>
                    <div className="text-2xl font-extrabold font-heading text-rose-800 mt-1">
                      {totalAbsentDays + totalLeaveDays} <span className="text-xs font-semibold text-slate-500">Days</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {totalAbsentDays} Absent • {totalLeaveDays} Leave
                    </span>
                  </div>

                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 shadow-xs">
                    <span className="text-[10px] font-bold text-solar-deep uppercase tracking-wider block">
                      Payable Man-Days
                    </span>
                    <div className="text-2xl font-extrabold font-heading text-solar-deep mt-1">
                      {totalPayableDays} <span className="text-xs font-semibold text-solar-deep">Days</span>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">
                      Payroll verified total
                    </span>
                  </div>
                </div>

              {/* All Staff Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold font-heading text-base text-slate-900">
                      Workforce Monthly Attendance Matrix — {monthNameFormatted}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Overview of daily verified presence, leaves, and payable days
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-5 py-3.5 min-w-[180px]">Staff Member</th>
                        <th className="px-3 py-3.5 text-center">Present</th>
                        <th className="px-3 py-3.5 text-center">Survey</th>
                        <th className="px-3 py-3.5 text-center">Half Day</th>
                        <th className="px-3 py-3.5 text-center">Absent</th>
                        <th className="px-3 py-3.5 text-center">Leave</th>
                        <th className="px-4 py-3.5 text-center font-bold text-slate-900">Payable Days</th>
                        <th className="px-4 py-3.5 text-center font-bold text-emerald-700">Score %</th>
                        <th className="px-5 py-3.5 text-right min-w-[180px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamList.map((member) => {
                        const stats = getMemberMonthlyStats(member.id, selectedMonthYear);

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900 text-sm">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {member.role} ({member.category})
                              </div>
                            </td>

                            <td className="px-3 py-4 text-center font-bold text-emerald-700">
                              <span className="px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                {stats.present}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-center font-bold text-amber-700">
                              <span className="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">
                                {stats.onSurvey}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-center font-bold text-amber-800">
                              <span className="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">
                                {stats.halfDay}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-center font-bold text-rose-700">
                              <span className="px-2.5 py-1 bg-rose-50 rounded-lg border border-rose-200">
                                {stats.absent}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-center font-bold text-purple-700">
                              <span className="px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
                                {stats.leave}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center font-extrabold text-sm text-solar-deep">
                              {stats.verifiedPayableDays} Days
                            </td>

                            <td className="px-4 py-4 text-center font-bold text-emerald-700">
                              {stats.attendancePercentage}%
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setMonthlyFilterMemberId(member.id)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-solar-deep hover:text-white text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Slip</span>
                                </button>

                                <a
                                  href={getWhatsAppShareUrl(member, selectedMonthYear)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Share Report to ${member.name} on WhatsApp`}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
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
          );
        })()}

          {/* VIEW MODE 2: INDIVIDUAL EMPLOYEE MONTHLY REPORT SLIP (CLEAN WHITE AESTHETIC) */}
          {monthlyFilterMemberId !== "ALL" && (() => {
            const singleMember = teamList.find((m) => m.id === monthlyFilterMemberId) || teamList[0];
            if (!singleMember) return null;
            const stats = getMemberMonthlyStats(singleMember.id, selectedMonthYear);

            return (
              <div className="space-y-6">
                {/* Action Buttons Bar for the Slip */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <button
                    onClick={() => setMonthlyFilterMemberId("ALL")}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ← Back to All Staff Matrix
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Share as Image / WhatsApp Button */}
                    <button
                      onClick={() => handleShareSlipImage(singleMember)}
                      disabled={isGeneratingImage}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                      <span>Share to WhatsApp Web</span>
                    </button>

                    {/* Download Image Button */}
                    <button
                      onClick={() => handleDownloadSlipImage(singleMember)}
                      disabled={isGeneratingImage}
                      className="px-4 py-2 rounded-xl bg-solar-deep hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-emerald-300" />
                      )}
                      <span>Download Image (.png)</span>
                    </button>
                  </div>
                </div>

                {/* Printable / Capturable Attendance Slip Card */}
                <div
                  id="printable-attendance-slip"
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
                >
                  {/* Slip Header with Sunlife Logo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo/logo.png"
                        alt="Sunlife Solar Energy Solution"
                        className="h-10 w-auto object-contain shrink-0"
                        crossOrigin="anonymous"
                      />
                      <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                      <div>
                        <h3 className="font-bold font-heading text-lg text-slate-900">
                          Employee Monthly Attendance Slip
                        </h3>
                        <p className="text-xs text-slate-500">
                          Sunlife Solar Energy Solution • Period: <span className="font-bold text-slate-900">{monthNameFormatted}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="px-3 py-1 bg-emerald-50 text-solar-deep border border-emerald-200 rounded-xl font-extrabold text-xs inline-block">
                        Verified Attendance: {stats.attendancePercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Staff Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff Name</span>
                      <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{singleMember.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{singleMember.role}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{singleMember.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                      <span className="font-bold text-solar-deep mt-0.5 block">{singleMember.phone}</span>
                    </div>
                  </div>

                  {/* 6 Clean Monthly Stats KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        Present (Full Day)
                      </span>
                      <div className="text-2xl font-extrabold text-solar-deep mt-1">
                        {stats.present} <span className="text-xs font-medium">Days</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">
                        On Site Survey
                      </span>
                      <div className="text-2xl font-extrabold text-amber-900 mt-1">
                        {stats.onSurvey} <span className="text-xs font-medium">Days</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">
                        Half Days
                      </span>
                      <div className="text-2xl font-extrabold text-amber-900 mt-1">
                        {stats.halfDay} <span className="text-xs font-medium">Days</span>
                      </div>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-rose-800 block">
                        Absent Days
                      </span>
                      <div className="text-2xl font-extrabold text-rose-900 mt-1">
                        {stats.absent} <span className="text-xs font-medium">Days</span>
                      </div>
                    </div>

                    <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-purple-800 block">
                        Approved Leave
                      </span>
                      <div className="text-2xl font-extrabold text-purple-900 mt-1">
                        {stats.leave} <span className="text-xs font-medium">Days</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-solar-deep block">
                        Payable Days
                      </span>
                      <div className="text-2xl font-extrabold text-solar-deep mt-1">
                        {stats.verifiedPayableDays} <span className="text-xs font-medium">Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Calendar Grid with Clean White Hover Tooltips */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold font-heading text-sm text-slate-900 uppercase tracking-wider">
                        Day-by-Day Attendance Log ({monthNameFormatted})
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        💡 Hover on any day card to inspect In/Out punch time & site
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                      {stats.dayBreakdown.map((item) => {
                        const isPresent = item.status === "Present" || item.status === "On Survey";
                        const isHalf = item.status === "Half Day";
                        const isAbsent = item.status === "Absent";
                        const isLeave = item.status === "Leave";
                        const isSunday = item.status === "Sunday";

                        return (
                          <div
                            key={item.day}
                            className={`group relative p-3 rounded-2xl border text-center transition-all duration-150 cursor-pointer ${
                              isPresent
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:shadow-md hover:border-emerald-400"
                                : isHalf
                                ? "bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100 hover:shadow-md hover:border-amber-400"
                                : isAbsent
                                ? "bg-rose-50/80 border-rose-200 text-rose-900 font-bold hover:bg-rose-100 hover:shadow-md hover:border-rose-400"
                                : isLeave
                                ? "bg-purple-50/80 border-purple-200 text-purple-900 hover:bg-purple-100 hover:shadow-md hover:border-purple-400"
                                : isSunday
                                ? "bg-slate-100/80 border-slate-200 text-slate-500 hover:bg-slate-200"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-extrabold block">Day {item.day}</span>
                            <span className="text-[10px] font-extrabold uppercase block mt-1">
                              {item.status}
                            </span>
                            {item.checkIn && item.checkIn !== "--" ? (
                              <span className="text-[10px] text-slate-700 block mt-1 font-semibold">
                                In: {item.checkIn}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block mt-1">--</span>
                            )}

                            {/* CLEAN WHITE HOVER TOOLTIP CARD */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white text-slate-800 rounded-2xl p-3.5 shadow-xl border border-slate-200 z-50 text-left pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                                <span className="font-extrabold text-[11px] text-slate-900">
                                  Day {item.day} • {item.formattedDate}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                    isPresent
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : isHalf
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : isAbsent
                                      ? "bg-rose-50 text-rose-800 border-rose-200"
                                      : isLeave
                                      ? "bg-purple-50 text-purple-800 border-purple-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">Punch In:</span>
                                  <span className="font-bold text-emerald-700">
                                    {item.checkIn || "--"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">Punch Out:</span>
                                  <span className="font-bold text-slate-800">
                                    {item.checkOut || "--"}
                                  </span>
                                </div>

                                {item.assignedSite && item.assignedSite !== "--" && (
                                  <div className="pt-1.5 border-t border-slate-100">
                                    <span className="text-slate-400 text-[10px] block">Project Site:</span>
                                    <span className="font-semibold text-slate-800 truncate block">
                                      {item.assignedSite}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Tooltip Arrow (Clean White) */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slip Footer Branding */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
                    <div>
                      Official Workforce Attendance Record • {siteConfig.name}
                    </div>
                    <div>
                      Generated on: {new Date().toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. EMPLOYEE PROFILES */}
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
                className="px-4 py-2 bg-solar-deep hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                          <button
                            onClick={() => {
                              setMonthlyFilterMemberId(member.id);
                              handleTabChange("monthly");
                            }}
                            title="View Monthly Attendance Slip"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
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
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors cursor-pointer"
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
      {/* 4. PAYROLL & PAYMENT */}
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
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-solar-deep border border-emerald-200 text-xs font-bold">
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
                                : "bg-solar-deep hover:bg-slate-800 text-white shadow-xs"
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
      {/* 5. REAL-TIME PUNCH MODAL CARD */}
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
                      Duty Punch & Attendance
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
                {/* Auto-Locked Date Banner */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Attendance Date (Locked to Today)
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {todayFormatted}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Live Clock
                    </span>
                    <span className="text-xs font-mono font-bold text-solar-deep mt-0.5 block">
                      {liveClockTime}
                    </span>
                  </div>
                </div>

                {/* Real-Time Punch In / Out Action Buttons */}
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="text-[11px] font-bold text-solar-deep uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-solar-emerald" />
                    <span>Real-Time Time Capture</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Punch In Button */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={handleTriggerPunchIn}
                        className="w-full py-2.5 px-3 rounded-xl bg-solar-deep hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <LogIn className="w-4 h-4 text-emerald-300" />
                        <span>PUNCH IN</span>
                      </button>
                      <div className="text-center text-[11px] text-slate-600 font-semibold pt-1">
                        {modalFormCheckIn && modalFormCheckIn !== "--" ? (
                          <span className="text-emerald-700 font-bold">
                            ✓ {modalFormCheckIn}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not Punched</span>
                        )}
                      </div>
                    </div>

                    {/* Punch Out Button */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={handleTriggerPunchOut}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <LogOut className="w-4 h-4 text-amber-200" />
                        <span>PUNCH OUT</span>
                      </button>
                      <div className="text-center text-[11px] text-slate-600 font-semibold pt-1">
                        {modalFormCheckOut && modalFormCheckOut !== "--" ? (
                          <span className="text-amber-800 font-bold">
                            ✓ {modalFormCheckOut}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not Punched</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duty Status Selector */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Duty Status <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "Present", label: "🟢 Present (Full Day)" },
                      { key: "On Survey", label: "🟡 On Site Survey" },
                      { key: "Half Day", label: "🟠 Half Day" },
                      { key: "Absent", label: "🔴 Mark Absent" },
                      { key: "Leave", label: "🟣 On Leave" },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => {
                          setModalFormStatus(st.key as AttendanceRecord["status"]);
                          if (st.key === "Absent" || st.key === "Leave") {
                            setModalFormCheckIn("--");
                            setModalFormCheckOut("--");
                          }
                        }}
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

                {/* Assigned Solar Site */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Solar Project Site
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
                    placeholder="e.g. Inverter mounting & earthing check completed"
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
                    className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-800 text-white font-bold cursor-pointer transition-all shadow-md shadow-emerald-950/15"
                  >
                    Save Attendance Record
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ======================================================== */}
      {/* 6. CUSTOM ATTENDANCE REPORT EXPORT MODAL */}
      {/* ======================================================== */}
      {isExportModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-auto text-xs">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-solar-deep">
                    <FileSpreadsheet className="w-5 h-5 text-solar-emerald" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-lg text-slate-900 leading-tight">
                      Download Attendance Report
                    </h3>
                    <p className="text-slate-500">
                      Export date-wise attendance records to Excel (.csv format)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preset Selector Grid */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Select Date Range
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "today", label: "⚡ Today" },
                    { key: "yesterday", label: "🗓️ Yesterday" },
                    { key: "last3days", label: "⏱️ Last 3 Days" },
                    { key: "thisweek", label: "📅 This Week" },
                    { key: "lastweek", label: "⏪ Last Week" },
                    { key: "thismonth", label: "📆 This Month" },
                    { key: "lastmonth", label: "🗓️ Last Month" },
                    { key: "last6months", label: "📊 Last 6 Months" },
                    { key: "thisyear", label: "🏆 This Year" },
                    { key: "custom", label: "🛠️ Custom Range" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setExportPreset(p.key as ExportPreset)}
                      className={`p-3 rounded-2xl font-bold text-left transition-all border cursor-pointer ${
                        exportPreset === p.key
                          ? "bg-solar-deep text-white border-solar-deep shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range Inputs */}
              {exportPreset === "custom" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Live Preview Strip */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-solar-deep">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-solar-emerald shrink-0" />
                  <span className="font-bold">
                    Range: {activeExportRange.label} ({activeExportRange.start} → {activeExportRange.end})
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]">
                  Excel (.csv)
                </span>
              </div>

              {/* Footer */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteExport}
                  className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-800 text-white font-bold cursor-pointer transition-all shadow-md shadow-emerald-950/15 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Download Attendance Excel</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ======================================================== */}
      {/* 7. ADD TEAM MEMBER MODAL */}
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
                    className="px-6 py-2.5 rounded-xl bg-solar-deep hover:bg-slate-800 text-white font-bold cursor-pointer transition-all shadow-md"
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
