"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  Building2,
  Award,
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

export default function AdminTeamPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Multi-select & custom tag state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Mono-PERC Installation",
    "Hot-Dip GI Fabrication",
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load real team list from localStorage (Starts strictly with authentic Owner & zero mock records)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sunlife_admin_team_roster");
      if (saved) {
        try {
          setTeamList(JSON.parse(saved));
        } catch {
          setTeamList([
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
            },
          ]);
        }
      } else {
        setTeamList([
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
          },
        ]);
      }
      setIsLoaded(true);
    }
  }, []);

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

  // Form state for adding new technician/crew member
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    category: "Fitter" as TeamMember["category"],
    phone: "",
    territory: "Narmadapuram",
    status: "Available" as TeamMember["status"],
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
    };

    saveTeamList([created, ...teamList]);
    setIsAddModalOpen(false);
    setNewMember({
      name: "",
      role: "",
      category: "Fitter",
      phone: "",
      territory: "Narmadapuram",
      status: "Available",
    });
    setSelectedSkills(["Mono-PERC Installation", "Hot-Dip GI Fabrication"]);
  };

  const handleDeleteMember = (id: string) => {
    if (id === "owner-1") return; // Keep founder
    const updated = teamList.filter((m) => m.id !== id);
    saveTeamList(updated);
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

  const activeOnSiteCount = teamList.filter((m) => m.status === "Active On-Site").length;
  const onSurveyCount = teamList.filter((m) => m.status === "On Survey").length;
  const availableCount = teamList.filter((m) => m.status === "Available").length;

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Team & Field Crew
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered technicians, installation fitters, survey engineers, and operational staff.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-solar-deep hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* 4 Status KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 w-full">
        {/* Card 1: Total Staff */}
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

        {/* Card 2: On-Site Crew */}
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

        {/* Card 3: On Survey */}
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

        {/* Card 4: Available */}
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
              {availableCount}
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

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Staff Member</th>
                <th className="px-6 py-3.5">Designation & Role</th>
                <th className="px-6 py-3.5">Contact / Phone</th>
                <th className="px-6 py-3.5">Assigned Territory</th>
                <th className="px-6 py-3.5">Skills & Expertise</th>
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
                          Since {member.joinedYear}
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
                        title="Call"
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
                          title="Remove Staff Member"
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

      {/* Spacious, Beautifully Styled Add Team Member Modal with Brand Logo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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

                {/* Initial Duty Status */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Initial Duty Status
                  </label>
                  <select
                    value={newMember.status}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        status: e.target.value as TeamMember["status"],
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 text-sm"
                  >
                    <option value="Available">Available (Ready for assignment)</option>
                    <option value="Active On-Site">Active On-Site (In the field)</option>
                    <option value="On Survey">On Survey (Rooftop assessment)</option>
                    <option value="Off-Duty">Off-Duty</option>
                  </select>
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
        </div>
      )}
    </div>
  );
}
