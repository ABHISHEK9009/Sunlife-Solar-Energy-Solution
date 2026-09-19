'use client';

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { adminFetch as fetch } from '@/lib/admin-live';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';

type Member = Record<string, unknown> & {
  id: string;
  name: string;
  role: string;
  phone: string;
  territory: string;
  category: string;
  status: string;
  skills: string[];
  email?: string;
  dob?: string;
  address?: string;
  department?: string;
  joiningDate?: string;
  employmentType?: string;
  reportingManager?: string;
  monthlySalary?: number;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankBranch?: string;
  upiId?: string;
  emailVerifiedAt?: string | null;
};

const input =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-solar-emerald focus:ring-4 focus:ring-emerald-50';
const label =
  'text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400';
const legacyDefaultSkills = new Set([
  'Mono-PERC Installation',
  'Hot-Dip GI Fabrication',
]);
const skillGroups = [
  {
    category: 'Solar installation',
    skills: [
      'Rooftop Solar Installation',
      'Ground-Mount Installation',
      'Solar Panel Mounting',
      'Mono-PERC Installation',
      'Bifacial Module Installation',
      'Solar Structure Assembly',
      'DC Cabling',
      'AC Cabling',
    ],
  },
  {
    category: 'Electrical',
    skills: [
      'Solar Electrical Wiring',
      'Inverter Installation',
      'Battery Installation',
      'Earthing & Lightning Protection',
      'LT Panel Work',
      'HT Panel Work',
      'Transformer Work',
      'Meter Installation',
      'Electrical Troubleshooting',
    ],
  },
  {
    category: 'Design & engineering',
    skills: [
      'AutoCAD',
      'PV System Design',
      'Solar Sizing',
      'Shadow Analysis',
      'Site Survey',
      'Load Assessment',
      'Single Line Diagram',
      'Bill of Materials',
      'PVsyst',
    ],
  },
  {
    category: 'Fabrication & civil',
    skills: [
      'Hot-Dip GI Fabrication',
      'Mild Steel Fabrication',
      'Welding',
      'RCC Foundation',
      'Civil Site Work',
      'Roof Waterproofing',
      'Structure Alignment',
    ],
  },
  {
    category: 'Operations & maintenance',
    skills: [
      'Preventive Maintenance',
      'Corrective Maintenance',
      'Plant Monitoring',
      'Performance Analysis',
      'Module Cleaning',
      'Fault Diagnosis',
      'Commissioning',
      'Quality Inspection',
    ],
  },
  {
    category: 'Safety & compliance',
    skills: [
      'Rooftop Safety',
      'Electrical Safety',
      'Working at Height',
      'Fire Safety',
      'First Aid',
      'PPE Compliance',
      'DISCOM Liaison',
      'Net Metering Documentation',
    ],
  },
  {
    category: 'Management & support',
    skills: [
      'Project Planning',
      'Site Supervision',
      'Team Management',
      'Vendor Coordination',
      'Customer Support',
      'Inventory Management',
      'Payroll',
      'HR Operations',
      'Documentation',
    ],
  },
] as const;

export default function EmployeeProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');

  const loadMember = () => fetch('/api/team')
      .then(async (response) => {
        const data = await response.json();
        const roster = (data.members || []) as Member[];
        setMembers(roster);
        const selectedMember = roster.find((item) => item.id === memberId);
        setMember(
          selectedMember
            ? {
                ...selectedMember,
                skills:
                  selectedMember.skills?.length === legacyDefaultSkills.size &&
                  selectedMember.skills.every((skill) =>
                    legacyDefaultSkills.has(skill),
                  )
                    ? []
                    : selectedMember.skills || [],
              }
            : null,
        );
      })
      .catch(() => setNotice('Unable to load employee information.'));

  useEffect(() => { void loadMember(); }, [memberId]);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mode') === 'edit'
    ) {
      setEditing(true);
    }
  }, []);
  useLiveRefresh(loadMember, !editing && !saving && !verifying);

  const update = (key: keyof Member, value: string) =>
    setMember((current) =>
      current
        ? { ...current, [key]: key === 'monthlySalary' ? Number(value) : value }
        : current,
    );
  const toggleSkill = (skill: string) =>
    setMember((current) => {
      if (!current) return current;
      const selected = current.skills.includes(skill);
      return {
        ...current,
        skills: selected
          ? current.skills.filter((item) => item !== skill)
          : [...current.skills, skill],
      };
    });
  const save = async () => {
    if (!member) return;
    setSaving(true);
    try {
      const response = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: [member],
        }),
      });
      if (!response.ok) throw new Error();
      setEditing(false);
      setNotice('Profile changes saved successfully.');
    } catch {
      setNotice('Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };
  const verify = async (action: 'send' | 'verify') => {
    if (!member) return;
    setVerifying(true);
    try {
      const response = await fetch(
        `/api/team/${member.id}/email-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, code }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (action === 'verify')
        setMember({ ...member, emailVerifiedAt: new Date().toISOString() });
      setNotice(
        action === 'send'
          ? 'Verification code sent to the employee email.'
          : 'Email verified and employee access enabled.',
      );
    } catch (error) {
      console.error("[Email Verification Error]:", error);
      setNotice('Unable to complete the request right now. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!member)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-solar-emerald" />
      </div>
    );
  const field = (key: keyof Member, type = 'text') =>
    editing ? (
      <input
        type={type}
        value={String(member[key] ?? '')}
        onChange={(event) => update(key, event.target.value)}
        className={input}
      />
    ) : (
      <p className="mt-1.5 max-w-full break-words text-sm font-bold leading-6 text-slate-800 [overflow-wrap:anywhere]">
        {String(member[key] || 'Not provided')}
      </p>
    );
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const details: [keyof Member, string, typeof Building2][] = [
    ['department', 'Department', Building2],
    ['role', 'Job title', CircleUserRound],
    ['employmentType', 'Employment type', Wallet],
    ['joiningDate', 'Joining date', CalendarDays],
    ['reportingManager', 'Reporting manager', CircleUserRound],
    ['monthlySalary', 'Monthly salary', Wallet],
  ];

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/team?tab=profiles"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-solar-deep"
        >
          <ArrowLeft className="h-4 w-4" /> Team directory
        </Link>
        <span className="rounded-full bg-solar-subtle px-3 py-1.5 text-xs font-bold text-solar-deep">
          ID · {member.id}
        </span>
      </div>
      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </span>
          <button aria-label="Dismiss message" onClick={() => setNotice('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-solar-dark via-solar-deep to-solar-emerald px-6 py-7 text-white shadow-premium sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
        <div className="absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-sun-amber/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sun-amber to-emerald-300 text-2xl font-black text-solar-dark shadow-lg">
              {initials}
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-200">
                Employee profile
              </p>
              {editing ? (
                <input
                  value={member.name}
                  onChange={(event) => update('name', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-2xl font-extrabold outline-none"
                />
              ) : (
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                  {member.name}
                </h1>
              )}
              {editing ? (
                <input
                  value={member.role}
                  onChange={(event) => update('role', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm outline-none"
                />
              ) : (
                <p className="mt-1 text-sm text-emerald-50">
                  {member.role} <span className="mx-1 text-emerald-200">·</span>{' '}
                  {member.territory || 'Location not set'}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  {member.category}
                </span>
                <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-bold text-emerald-100">
                  {member.status}
                </span>
              </div>
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-solar-deep shadow-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-solar-deep shadow-sm hover:bg-solar-subtle"
            >
              <Pencil className="h-4 w-4" /> Edit profile
            </button>
          )}
        </div>
      </section>

      <div className="employee-profile-grid grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.8fr)]">
        <main className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className={label}>Role & responsibilities</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  Employment overview
                </h2>
              </div>
              <div className="rounded-xl bg-solar-subtle p-2.5">
                <Building2 className="h-5 w-5 text-solar-emerald" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {details.map(([key, title, Icon]) => (
                <div
                  key={String(key)}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <Icon className="h-4 w-4 text-solar-emerald" />
                  <p className={`${label} mt-3`}>{title}</p>
                  {field(
                    key,
                    key === 'joiningDate'
                      ? 'date'
                      : key === 'monthlySalary'
                        ? 'number'
                        : 'text',
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-solar-emerald" />
              <div>
                <p className={label}>Finance</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  Payment details
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DataItem title="Account holder">
                {field('bankAccountHolder')}
              </DataItem>
              <DataItem title="Bank name">{field('bankName')}</DataItem>
              <DataItem title="Account number">
                {editing ? (
                  field('bankAccountNumber')
                ) : (
                  <p className="mt-1.5 font-mono text-sm font-bold text-slate-800">
                    {member.bankAccountNumber
                      ? `•••• ${member.bankAccountNumber.slice(-4)}`
                      : 'Not provided'}
                  </p>
                )}
              </DataItem>
              <DataItem title="IFSC code">{field('bankIFSC')}</DataItem>
              <DataItem title="Branch">{field('bankBranch')}</DataItem>
              <DataItem title="UPI ID">{field('upiId')}</DataItem>
            </div>
          </section>
        </main>
        <aside className="space-y-6">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-solar-emerald" />
              <h2 className="font-extrabold text-slate-900">Contact details</h2>
            </div>
            <div className="mt-5 space-y-5">
              <ContactItem icon={Phone} title="Mobile number">
                {field('phone', 'tel')}
              </ContactItem>
              <ContactItem icon={Mail} title="Email address">
                {field('email', 'email')}
              </ContactItem>
              <ContactItem icon={MapPin} title="Address">
                {field('address')}
              </ContactItem>
            </div>
          </section>
          <section className="rounded-2xl border border-emerald-100 bg-solar-subtle p-5">
            <p className={label}>Expertise</p>
            <h2 className="mt-1 font-extrabold text-solar-dark">
              Skills & certifications
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {editing ? (
                <div className="relative w-full">
                  {member.skills.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {member.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-solar-deep"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            aria-label={`Remove ${skill}`}
                            className="rounded-full text-slate-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSkillMenuOpen((open) => !open)}
                    aria-expanded={skillMenuOpen}
                    className="flex w-full items-center justify-between rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-slate-700 outline-none transition hover:border-solar-emerald focus:ring-4 focus:ring-emerald-100"
                  >
                    <span>
                      {member.skills.length
                        ? `${member.skills.length} skill${member.skills.length === 1 ? '' : 's'} selected`
                        : 'Select skills & certifications'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition ${skillMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {skillMenuOpen && (
                    <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 p-3">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3">
                          <Search className="h-4 w-4 text-slate-400" />
                          <input
                            value={skillSearch}
                            onChange={(event) =>
                              setSkillSearch(event.target.value)
                            }
                            placeholder="Search solar skills..."
                            className="w-full bg-transparent py-2.5 text-sm font-semibold outline-none"
                          />
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {skillGroups.map((group) => {
                          const options = group.skills.filter((skill) =>
                            skill
                              .toLowerCase()
                              .includes(skillSearch.toLowerCase()),
                          );
                          if (!options.length) return null;
                          return (
                            <div
                              key={group.category}
                              className="mb-2 last:mb-0"
                            >
                              <p className="px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                {group.category}
                              </p>
                              {options.map((skill) => {
                                const selected = member.skills.includes(skill);
                                return (
                                  <button
                                    type="button"
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${selected ? 'bg-emerald-50 text-solar-deep' : 'text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    <span>{skill}</span>
                                    <span
                                      className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-solar-emerald bg-solar-emerald text-white' : 'border-slate-300 bg-white'}`}
                                    >
                                      {selected && (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Choose all skills that apply. You can select multiple
                    options.
                  </p>
                </div>
              ) : member.skills?.length ? (
                member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-solar-deep"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm font-semibold text-slate-500">
                  Not added
                </span>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="lg:border-r lg:border-slate-100 lg:pr-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-solar-subtle p-3">
                    <ShieldCheck className="h-6 w-6 text-solar-emerald" />
                  </div>
                  <div>
                    <p className={label}>Portal security</p>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                      Email verification
                    </h2>
                  </div>
                </div>
                <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
                  Confirm this employee&apos;s email once to activate secure
                  portal access.
                </p>
                <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                  <Mail className="h-4 w-4 shrink-0 text-solar-emerald" />
                  <span className="truncate">
                    {member.email || 'Email address not added'}
                  </span>
                </div>
              </div>

              {member.emailVerifiedAt ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white p-2">
                      <BadgeCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-extrabold text-emerald-900">
                        Verified and active
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-700">
                        This employee can sign in using their verified email.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={label}>Step 1</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-800">
                        Send the verification code
                      </p>
                    </div>
                    <button
                      disabled={!member.email || verifying}
                      onClick={() => void verify('send')}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-solar-deep px-4 py-2.5 text-sm font-bold text-white transition hover:bg-solar-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {verifying ? 'Sending...' : 'Send code'}
                    </button>
                  </div>
                  <div className="pt-4">
                    <p className={label}>Step 2 · Enter received code</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={code}
                        maxLength={6}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, ''))
                        }
                        inputMode="numeric"
                        placeholder="6-digit verification code"
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold tracking-[0.15em] outline-none placeholder:font-medium placeholder:tracking-normal focus:border-solar-emerald focus:ring-2 focus:ring-emerald-100"
                      />
                      <button
                        disabled={code.length !== 6 || verifying}
                        onClick={() => void verify('verify')}
                        className="rounded-lg bg-emerald-100 px-5 py-2.5 text-sm font-extrabold text-solar-deep transition hover:bg-emerald-200 disabled:opacity-50"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DataItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={label}>{title}</p>
      {children}
    </div>
  );
}
function ContactItem({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Phone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className={label}>{title}</p>
        {children}
      </div>
    </div>
  );
}
