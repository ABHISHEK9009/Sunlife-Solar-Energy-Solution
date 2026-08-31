"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle,
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

export default function AdminTeamPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load real team list from localStorage (Starts strictly with authentic Owner & zero mock records)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sunlife_admin_team_roster");
      if (saved) {
        try {
          setTeamList(JSON.parse(saved));
        } catch {
          // Fallback to real owner
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
        // Initial authentic record: Founder
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
    skillInput: "",
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
      skills: newMember.skillInput
        ? newMember.skillInput.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Solar EPC"],
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
      skillInput: "",
    });
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold font-heading text-lg text-slate-900">
                  Add Team Member
                </h3>
                <p className="text-xs text-slate-500">
                  Register a solar installer, electrician, or survey engineer
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technician Name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rooftop GI Fitter"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={newMember.category}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        category: e.target.value as TeamMember["category"],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                  >
                    <option value="Fitter">Installation Fitter</option>
                    <option value="Electrician">Solar Electrician</option>
                    <option value="Survey">Site Survey Officer</option>
                    <option value="Engineer">PV Engineer</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98260XXXXX"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Territory
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Narmadapuram / Itarsi"
                    value={newMember.territory}
                    onChange={(e) =>
                      setNewMember({ ...newMember, territory: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Skills & Certifications (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mono-PERC, Net Metering, Earthing"
                  value={newMember.skillInput}
                  onChange={(e) =>
                    setNewMember({ ...newMember, skillInput: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-solar-deep hover:bg-slate-900 text-white font-bold cursor-pointer"
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
