import { siteConfig } from "@/lib/site-config";

export function GET() {
  const body = `# ${siteConfig.name}\n\n> ${siteConfig.description}\n\n## About\n${siteConfig.name} is a rooftop solar installation company serving ${siteConfig.contact.serviceAreas.join(", ")}.\n\n## Services\n- Residential rooftop solar\n- Commercial solar solutions\n- Industrial solar power plants\n- Site surveys, system design, installation and net-metering support\n\n## Contact\n- Website: ${siteConfig.url}\n- Email: ${siteConfig.contact.email}\n- Phone: +91 ${siteConfig.contact.phoneDisplay}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
