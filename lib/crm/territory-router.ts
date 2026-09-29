import { prisma } from "@/lib/prisma";

export interface TerritoryMatch {
  salesExecutiveId: string | null;
  territoryName: string;
}

/**
 * Assigns an incoming lead to an active sales executive based on City/PIN code.
 * Falls back to round-robin among active sales staff, or Central Sales Desk.
 */
export async function assignLeadToSales(city?: string | null, pinCode?: string | null): Promise<TerritoryMatch> {
  try {
    const cleanCity = (city || "").trim().toLowerCase();
    
    // Find active sales team members
    const salesMembers = await prisma.teamMember.findMany({
      where: {
        activeStatus: true,
        OR: [
          { role: { contains: "Sales", mode: "insensitive" } },
          { department: { contains: "Sales", mode: "insensitive" } },
          { category: { contains: "Sales", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, territory: true, phone: true },
    });

    if (salesMembers.length === 0) {
      // Fall back to any active team member
      const anyMember = await prisma.teamMember.findFirst({
        where: { activeStatus: true },
        select: { id: true, name: true, territory: true },
      });
      return {
        salesExecutiveId: anyMember ? anyMember.id : null,
        territoryName: cleanCity || "Central Desk",
      };
    }

    // 1. Direct territory match by city name
    if (cleanCity) {
      const match = salesMembers.find(
        (m) => m.territory && m.territory.toLowerCase().includes(cleanCity)
      );
      if (match) {
        return {
          salesExecutiveId: match.id,
          territoryName: match.territory || cleanCity,
        };
      }
    }

    // 2. Round-robin based on least number of active leads
    const memberLeadCounts = await Promise.all(
      salesMembers.map(async (m) => {
        const count = await prisma.lead.count({
          where: {
            assignedSalesExecutiveId: m.id,
            status: { in: ["NEW", "CONTACTED", "SURVEY_SCHEDULED"] },
          },
        });
        return { id: m.id, territory: m.territory, count };
      })
    );

    memberLeadCounts.sort((a, b) => a.count - b.count);
    const chosen = memberLeadCounts[0];

    return {
      salesExecutiveId: chosen.id,
      territoryName: chosen.territory || cleanCity || "Central Desk",
    };
  } catch (error) {
    console.error("[Territory Router Error]:", error);
    return { salesExecutiveId: null, territoryName: city || "Central Desk" };
  }
}
