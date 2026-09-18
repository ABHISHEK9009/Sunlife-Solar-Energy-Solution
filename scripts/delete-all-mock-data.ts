import { prisma } from "../lib/prisma";

async function main() {
  console.log("==========================================");
  console.log("  PURGING ALL MOCK DATA FROM SUNLIFE CRM  ");
  console.log("==========================================\n");

  // 1. Delete Attendance records
  const delAttendance = await prisma.attendance.deleteMany({});
  console.log(`✔ Deleted Attendance records: ${delAttendance.count}`);

  // 2. Delete Employee Advances
  const delAdvances = await prisma.employeeAdvance.deleteMany({});
  console.log(`✔ Deleted Employee Advances: ${delAdvances.count}`);

  // 3. Delete Monthly Payroll records
  const delMonthlyPayroll = await prisma.monthlyPayroll.deleteMany({});
  console.log(`✔ Deleted Monthly Payroll records: ${delMonthlyPayroll.count}`);

  // 4. Delete Payroll Profiles for non-owner/mock accounts
  const delPayrollProfiles = await prisma.payrollProfile.deleteMany({});
  console.log(`✔ Deleted Payroll Profiles: ${delPayrollProfiles.count}`);

  // 5. Delete Leave Requests
  const delLeave = await prisma.leaveRequest.deleteMany({});
  console.log(`✔ Deleted Leave Requests: ${delLeave.count}`);

  // 6. Delete Service Tickets & Attachments
  const delTicketAtt = await prisma.ticketAttachment.deleteMany({});
  const delTickets = await prisma.serviceTicket.deleteMany({});
  console.log(`✔ Deleted Service Tickets: ${delTickets.count} (Attachments: ${delTicketAtt.count})`);

  // 7. Delete Plant Monitoring & Readings
  const delReadings = await prisma.generationReading.deleteMany({});
  const delMaintenance = await prisma.maintenanceRecord.deleteMany({});
  const delMonitoring = await prisma.plantMonitoring.deleteMany({});
  console.log(`✔ Deleted Plant Monitoring: ${delMonitoring.count}`);

  // 8. Delete Referrals
  const delReferrals = await prisma.referral.deleteMany({});
  console.log(`✔ Deleted Referrals: ${delReferrals.count}`);

  // 9. Delete Subsidies
  const delSubsidyHist = await prisma.subsidyHistory.deleteMany({});
  const delSubsidies = await prisma.subsidyRecord.deleteMany({});
  console.log(`✔ Deleted Subsidies: ${delSubsidies.count} (History: ${delSubsidyHist.count})`);

  // 10. Delete Payments
  const delPayments = await prisma.payment.deleteMany({});
  console.log(`✔ Deleted Payments: ${delPayments.count}`);

  // 11. Delete Documents
  const delDocuments = await prisma.document.deleteMany({});
  console.log(`✔ Deleted Documents: ${delDocuments.count}`);

  // 12. Delete Quotations
  const delQuotations = await prisma.quotation.deleteMany({});
  console.log(`✔ Deleted Quotations: ${delQuotations.count}`);

  // 13. Delete Site Surveys
  const delSurveys = await prisma.siteSurvey.deleteMany({});
  console.log(`✔ Deleted Site Surveys: ${delSurveys.count}`);

  // 14. Delete Projects & Timeline
  const delTimelines = await prisma.projectTimeline.deleteMany({});
  const delProjects = await prisma.solarProject.deleteMany({});
  console.log(`✔ Deleted Solar Projects: ${delProjects.count} (Timelines: ${delTimelines.count})`);

  // 15. Delete Leads
  const delLeads = await prisma.lead.deleteMany({});
  console.log(`✔ Deleted Leads: ${delLeads.count}`);

  // 16. Delete Customers
  const delCustomers = await prisma.customer.deleteMany({});
  console.log(`✔ Deleted Customers: ${delCustomers.count}`);

  // 17. Delete Mock Team Members & Mock Agents
  // Keep only the real Super Admin (Rahul Kumar Bamne / phone: 7722995100)
  const delTeamMembers = await prisma.teamMember.deleteMany({
    where: {
      NOT: {
        phone: "7722995100",
      },
    },
  });
  console.log(`✔ Deleted Mock Team Members & Agents: ${delTeamMembers.count}`);

  // 18. Delete Test Audit Logs
  const delAudit = await prisma.auditLog.deleteMany({});
  console.log(`✔ Deleted Test Audit Logs: ${delAudit.count}`);

  // 19. Delete Notifications
  const delNotifications = await prisma.notification.deleteMany({});
  console.log(`✔ Deleted Notifications: ${delNotifications.count}`);

  // 20. Delete Inquiries & Calculator Estimates
  const delInquiries = await prisma.contactInquiry.deleteMany({});
  const delEstimates = await prisma.calculatorEstimate.deleteMany({});
  console.log(`✔ Deleted Inquiries: ${delInquiries.count} | Estimates: ${delEstimates.count}`);

  console.log("\n==========================================");
  console.log("  ALL MOCK DATA HAS BEEN PURGED CLEAN!    ");
  console.log("==========================================\n");

  // Summary of remaining data:
  const remainingTeam = await prisma.teamMember.findMany({ select: { name: true, role: true, phone: true, employeeId: true } });
  console.log("Remaining Verified Admin Accounts:", remainingTeam);
}

main()
  .catch((err) => {
    console.error("Failed to delete mock data:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
