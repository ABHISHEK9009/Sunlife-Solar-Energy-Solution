export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
  content: string;
  faqs?: { q: string; a: string }[];
}

export const blogPosts: BlogPostItem[] = [
  {
    id: "1",
    slug: "how-much-does-rooftop-solar-cost-in-madhya-pradesh",
    title: "How Much Does Rooftop Solar Cost in Madhya Pradesh? (2026 Price & Subsidy Guide)",
    excerpt:
      "A transparent breakdown of rooftop solar system pricing, equipment components, net metering procedures, and government subsidy eligibility in MP.",
    category: "Cost & Subsidy",
    readTime: "6 min read",
    publishedDate: "January 15, 2026",
    author: "Rahul Kumar Bamne",
    content: `
## Understanding Rooftop Solar Costs in Madhya Pradesh

If you are planning to install a rooftop solar system on your home or commercial building in Narmadapuram, Itarsi, or anywhere in Madhya Pradesh, understanding the actual cost drivers helps you make an informed investment decision.

### Key Factors Determining Solar System Cost

1. **System Capacity (kW)**: Residential systems commonly range from 3 kW to 10 kW, while commercial setups often start from 10 kW and scale upward.
2. **Solar Panel Technology**: High-efficiency Monocrystalline PERC and TopCon bi-facial panels deliver higher generation per square foot.
3. **Inverter Technology**: Grid-tied string inverters with high MTBF ratings ensure seamless synchronization with MPMKVVCL / MPPKVVCL electricity grids.
4. **Mounting Structures**: Hot-dip galvanized iron (GI) structures engineered to withstand wind speeds up to 150 km/h.
5. **Electrical Protections & Earthing**: High-grade ACDB/DCDB boxes, Lightning Arresters (LA), and dedicated chemical earthing pits for system safety.

### Indicative Benchmark Price Range (Central India)

- **3 kW Residential On-Grid System**: ₹1,70,000 – ₹2,10,000 (Gross cost before applicable subsidies)
- **5 kW Residential On-Grid System**: ₹2,75,000 – ₹3,30,000
- **10 kW Commercial / Large Residential System**: ₹5,00,000 – ₹5,80,000

*Note: Final quotations vary based on structural elevation, shadow profile, cable run length, and specific equipment brands.*

### Net Metering in Madhya Pradesh

Under the MP electricity regulatory framework, on-grid solar systems feed surplus electricity generated during daylight hours directly into the DISCOM grid. At the end of the monthly billing cycle, your power bill reflects only the **net units consumed**, dramatically reducing recurring electricity expenditure.
    `,
    faqs: [
      {
        q: "How many units does a 3 kW solar system produce daily in MP?",
        a: "A standard 3 kW system in Madhya Pradesh generates approximately 12 to 14 units (kWh) per sunny day, totaling around 4,200 to 4,500 units per year.",
      },
      {
        q: "What is the typical warranty on solar panels and inverters?",
        a: "Tier-1 solar panels carry a 25-year performance warranty (guaranteeing >80% output after 25 years), while on-grid inverters typically come with 5 to 10 years of manufacturer warranty.",
      },
    ],
  },
  {
    id: "2",
    slug: "how-many-solar-panels-does-a-3kw-system-need",
    title: "How Many Solar Panels Does a 3 kW System Need? (Rooftop Area & Sizing)",
    excerpt:
      "Calculate the exact number of solar panels, required shadow-free rooftop area, and daily electricity generation for a typical 3 kW solar power system.",
    category: "Technical Guide",
    readTime: "5 min read",
    publishedDate: "February 2, 2026",
    author: "Rahul Kumar Bamne",
    content: `
## Sizing a 3 kW Rooftop Solar System

A 3 kW rooftop solar power system is the most popular choice for Indian middle-class households running appliances such as 1.5-ton split ACs, refrigerators, washing machines, water pumps, and lighting fixtures.

### Number of Solar Panels Required

The total number of panels depends on the wattage rating of individual photovoltaic modules:

- **Using 540W / 550W Mono-PERC Panels**: Exactly **6 panels** (6 × 540W = 3,240W or 3.24 kW).
- **Using 440W Half-Cut Panels**: **7 panels** (7 × 440W = 3,080W or 3.08 kW).
- **Older 330W Polycrystalline Panels**: 9 to 10 panels.

At Sunlife Solar Energy Solution, we recommend modern high-efficiency **540W+ Mono-PERC modules** because they minimize the number of mounting clamps, reduce wiring connections, and require less roof space.

### Rooftop Area Needed for 3 kW

- **Required Shadow-Free Area**: Approximately **250 to 300 square feet**.
- **Roof Orientation**: South-facing orientation with an optimal tilt angle of 20° to 25° for Central India ensures maximum sunlight capture throughout summer and winter.
    `,
  },
  {
    id: "3",
    slug: "on-grid-vs-off-grid-solar-systems-for-indian-homes",
    title: "On-Grid vs Off-Grid vs Hybrid Solar Systems: Which is Right for You?",
    excerpt:
      "Compare on-grid, off-grid, and hybrid solar power systems to choose the most reliable and cost-effective setup for your home or enterprise.",
    category: "System Comparison",
    readTime: "7 min read",
    publishedDate: "February 18, 2026",
    author: "Rahul Kumar Bamne",
    content: `
## Comparing Solar System Types

When transitioning to solar energy, choosing the correct system architecture is essential for both reliability and return on investment.

### 1. On-Grid (Grid-Tied) Solar System
- **How it works**: Connects directly to the state electricity grid via a bidirectional Net Meter.
- **Battery**: No battery bank required.
- **Best for**: Locations with reliable grid power (such as Narmadapuram, Itarsi, and urban/semi-urban MP).
- **Advantage**: Lowest upfront cost, highest ROI, zero battery maintenance, eligible for government rooftop subsidy programs.

### 2. Off-Grid Solar System
- **How it works**: Operates completely independently of the power grid, storing solar energy in deep-cycle solar batteries (Tubular or Lithium-ion).
- **Best for**: Remote agricultural farms, rural areas with frequent power outages.
- **Consideration**: Higher initial cost due to battery storage and periodic battery replacement every 5–8 years.

### 3. Hybrid Solar System
- **How it works**: Combines the benefits of both on-grid net metering and emergency battery backup.
- **Best for**: Homes and clinics requiring uninterrupted power during night-time grid outages while enjoying net-metering credits.
    `,
  },
  {
    id: "4",
    slug: "5-things-to-check-before-installing-rooftop-solar",
    title: "5 Important Things to Check Before Installing Rooftop Solar in Narmadapuram",
    excerpt:
      "A practical checklist covering roof structural strength, shadow analysis, sanctioned load, and net metering approvals before starting installation.",
    category: "Installation Tips",
    readTime: "4 min read",
    publishedDate: "March 5, 2026",
    author: "Rahul Kumar Bamne",
    content: `
## Pre-Installation Checklist for Rooftop Solar

Installing solar is a 25-year investment. Before booking an installation, here are 5 essential engineering checks our team at Sunlife Solar Energy Solution conducts during every site assessment:

1. **Roof Structural Strength & Accessibility**: Concrete RCC flat roofs are ideal. For tin sheds or industrial roofs, structure thickness and load-bearing capacities must be verified.
2. **Shadow Analysis**: Identify trees, parapet walls, water tanks, or nearby buildings that cast shadows between 9:00 AM and 4:00 PM.
3. **Current Sanctioned Load (kW)**: Check your latest DISCOM electricity bill. The rooftop solar capacity cannot exceed your sanctioned electrical load without applying for load enhancement.
4. **Earthing & Surge Protection Route**: Ensure adequate space near the building for 2 to 3 separate earthing pits (AC, DC, and Lightning Protection).
5. **Quality of Hardware & Wiring**: Verify that UV-resistant DC solar cables, IP65-rated junction boxes, and corrosion-resistant GI structures are specified in the engineering proposal.
    `,
  },
];
