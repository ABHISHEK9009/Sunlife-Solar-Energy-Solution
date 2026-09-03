export const siteConfig = {
  name: "Sunlife Solar Energy Solution",
  legalName: "Sunlife Solar Energy Solution",
  tagline: "Power Your Future With Solar Energy",
  description:
    "Sunlife Solar Energy Solution provides professional rooftop solar installations and clean energy solutions for homes, businesses, and industries in Narmadapuram and across Madhya Pradesh.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://sunlifesolar.in",
  owner: {
    name: "Rahul Kumar Bamne",
    role: "Founder & Owner",
    message:
      "Our goal is simple — make solar energy easier to understand, easier to adopt and more valuable for every customer we serve.",
    phone: "7722995100",
  },
  foundedDate: "2021-12-11",
  foundedDateFormatted: "11 December 2021",
  contact: {
    phone: "7722995100",
    phoneDisplay: "+91 77229 95100",
    phoneClean: "7722995100",
    whatsapp: "7722995100",
    whatsappText:
      "Hello Sunlife Solar Energy Solution, I am interested in installing a solar system. I would like to know more about the available options and pricing.",
    email: "infosses24@gmail.com",
    address: {
      street: "VINAYAK COMPLEX, Near AZAD CHOWK, Malakhedi",
      city: "Narmadapuram",
      state: "Madhya Pradesh",
      postalCode: "461001",
      country: "India",
      fullAddress:
        "VINAYAK COMPLEX, Near AZAD CHOWK, Malakhedi, Narmadapuram, Madhya Pradesh – 461001, India",
    },
    serviceAreas: [
      "Narmadapuram",
      "Itarsi",
      "Seoni Malwa",
      "Sohagpur",
      "Pipariya",
      "Babai",
      "Hoshangabad District",
      "Madhya Pradesh",
    ],
  },
  navLinks: [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    {
      name: "Solutions",
      href: "/solar-solutions",
      children: [
        { name: "Residential Solar", href: "/residential-solar", desc: "For homes, villas & independent houses" },
        { name: "Commercial Solar", href: "/commercial-solar", desc: "For offices, shops, schools & complexes" },
        { name: "Industrial Solar", href: "/industrial-solar", desc: "For factories, warehouses & plants" },
        { name: "Rooftop Solar", href: "/rooftop-solar", desc: "Maximizing unused rooftop spaces" },
        { name: "Installation Process", href: "/solar-panel-installation", desc: "Engineering & safety standards" },
      ],
    },
    { name: "Solar Calculator", href: "/solar-calculator" },
    { name: "Subsidy Guide", href: "/solar-subsidy" },
    { name: "Projects", href: "/projects" },
    { name: "Blog", href: "/blog" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact", href: "/contact" },
  ],
};
