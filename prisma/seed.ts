import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORIES: { name: string; icon: string }[] = [
  { name: "Sanallaştırma", icon: "layers" },
  { name: "Storage", icon: "hard-drive" },
  { name: "Server Management", icon: "server-cog" },
  { name: "Network", icon: "network" },
  { name: "Security", icon: "shield-check" },
  { name: "PAM", icon: "key-round" },
  { name: "Monitoring", icon: "activity" },
  { name: "Backup", icon: "archive" },
  { name: "DevOps", icon: "git-branch" },
  { name: "Container", icon: "box" },
  { name: "Microsoft", icon: "layout-grid" },
  { name: "Cloud", icon: "cloud" },
  { name: "ITSM", icon: "clipboard-list" },
  { name: "Database", icon: "database" },
  { name: "Diğer", icon: "folder" },
];

const EXAMPLE_SYSTEMS: {
  category: string;
  name: string;
  type: string;
  host: string;
  url: string;
  description: string;
  tags: string[];
  isFavorite?: boolean;
}[] = [
  {
    category: "Sanallaştırma",
    name: "vCenter Production",
    type: "VMware vCenter",
    host: "vcenter-prod.example.local",
    url: "https://vcenter-prod.example.local",
    description: "Üretim VMware küme yönetimi",
    tags: ["Production", "Critical", "Datacenter-1"],
    isFavorite: true,
  },
  {
    category: "Sanallaştırma",
    name: "vCenter DR",
    type: "VMware vCenter",
    host: "vcenter-dr.example.local",
    url: "https://vcenter-dr.example.local",
    description: "Felaket kurtarma sitesi vCenter",
    tags: ["DR", "Datacenter-2"],
  },
  {
    category: "Sanallaştırma",
    name: "Proxmox Cluster",
    type: "Proxmox VE",
    host: "proxmox.example.local",
    url: "https://proxmox.example.local:8006",
    description: "Proxmox sanallaştırma kümesi",
    tags: ["Production"],
  },
  {
    category: "Storage",
    name: "Dell Storage",
    type: "Dell PowerStore",
    host: "dell-storage.example.local",
    url: "https://dell-storage.example.local",
    description: "Dell blok/dosya depolama yönetimi",
    tags: ["Production", "Critical"],
  },
  {
    category: "Storage",
    name: "NetApp",
    type: "NetApp ONTAP",
    host: "netapp.example.local",
    url: "https://netapp.example.local",
    description: "NetApp depolama sistemi yönetim arayüzü",
    tags: ["Production"],
  },
  {
    category: "Storage",
    name: "Synology",
    type: "Synology DSM",
    host: "synology.example.local",
    url: "https://synology.example.local:5001",
    description: "Yedekleme ve dosya paylaşım cihazı",
    tags: ["Backup"],
  },
  {
    category: "Server Management",
    name: "iLO - ESX01",
    type: "HPE iLO",
    host: "ilo-esx01.example.local",
    url: "https://ilo-esx01.example.local",
    description: "HPE sunucu uzaktan yönetim arayüzü",
    tags: ["Datacenter-1"],
  },
  {
    category: "Server Management",
    name: "iDRAC - ESX02",
    type: "Dell iDRAC",
    host: "idrac-esx02.example.local",
    url: "https://idrac-esx02.example.local",
    description: "Dell sunucu uzaktan yönetim arayüzü",
    tags: ["Datacenter-1"],
  },
  {
    category: "Network",
    name: "FortiGate",
    type: "Fortinet FortiGate",
    host: "fortigate.example.local",
    url: "https://fortigate.example.local",
    description: "Kenar güvenlik duvarı yönetimi",
    tags: ["Critical", "Production"],
    isFavorite: true,
  },
  {
    category: "Network",
    name: "Aruba Central",
    type: "Aruba Central",
    host: "",
    url: "https://central.arubanetworks.com",
    description: "Kablosuz ve switch yönetim platformu",
    tags: ["Production"],
  },
  {
    category: "Network",
    name: "Network Controller",
    type: "SDN Controller",
    host: "netctrl.example.local",
    url: "https://netctrl.example.local",
    description: "Merkezi ağ kontrolcüsü",
    tags: ["Production"],
  },
  {
    category: "Monitoring",
    name: "Zabbix",
    type: "Zabbix",
    host: "zabbix.example.local",
    url: "https://zabbix.example.local",
    description: "Altyapı izleme ve alarm sistemi",
    tags: ["Production", "Critical"],
    isFavorite: true,
  },
  {
    category: "Monitoring",
    name: "Grafana",
    type: "Grafana",
    host: "grafana.example.local",
    url: "https://grafana.example.local",
    description: "Metrik görselleştirme paneli",
    tags: ["Production"],
  },
  {
    category: "Monitoring",
    name: "PRTG",
    type: "PRTG Network Monitor",
    host: "prtg.example.local",
    url: "https://prtg.example.local",
    description: "Ağ ve servis izleme",
    tags: ["Production"],
  },
  {
    category: "PAM",
    name: "TOTP Panel",
    type: "TOTP / MFA Yönetimi",
    host: "totp.example.local",
    url: "https://totp.example.local",
    description: "Çok faktörlü kimlik doğrulama kod yönetimi",
    tags: ["Security", "Critical"],
  },
  {
    category: "Backup",
    name: "Veeam Backup",
    type: "Veeam Backup & Replication",
    host: "veeam.example.local",
    url: "https://veeam.example.local:9443",
    description: "Yedekleme ve replikasyon yönetimi",
    tags: ["Production", "Critical"],
  },
  {
    category: "DevOps",
    name: "GitLab",
    type: "GitLab CE",
    host: "gitlab.example.local",
    url: "https://gitlab.example.local",
    description: "Kaynak kod ve CI/CD platformu",
    tags: ["Development"],
  },
  {
    category: "Container",
    name: "Rancher",
    type: "Rancher",
    host: "rancher.example.local",
    url: "https://rancher.example.local",
    description: "Kubernetes küme yönetimi",
    tags: ["Production"],
  },
  {
    category: "Microsoft",
    name: "Microsoft 365 Admin",
    type: "M365 Admin Center",
    host: "",
    url: "https://admin.microsoft.com",
    description: "Microsoft 365 kiracı yönetimi",
    tags: ["Production"],
  },
  {
    category: "Cloud",
    name: "Azure Portal",
    type: "Microsoft Azure",
    host: "",
    url: "https://portal.azure.com",
    description: "Azure bulut kaynak yönetimi",
    tags: ["Production", "Cloud"],
  },
  {
    category: "ITSM",
    name: "NetBox",
    type: "NetBox DCIM/IPAM",
    host: "netbox.example.local",
    url: "https://netbox.example.local",
    description: "Envanter ve dokümantasyon sistemi",
    tags: ["Documentation"],
  },
  {
    category: "Database",
    name: "pgAdmin",
    type: "PostgreSQL Admin",
    host: "pgadmin.example.local",
    url: "https://pgadmin.example.local",
    description: "PostgreSQL veritabanı yönetimi",
    tags: ["Production"],
  },
];

async function main() {
  const categoryMap = new Map<string, string>();

  for (const [index, c] of CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, slug: slugify(c.name), icon: c.icon, sortOrder: index },
    });
    categoryMap.set(c.name, category.id);
  }

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME || "Administrator";

  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        name: adminName,
        role: "ADMIN",
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    });
    console.log(`Admin kullanıcı oluşturuldu: ${adminUsername}`);
  }

  const existingDemo = await prisma.user.findUnique({ where: { username: "demo" } });
  if (!existingDemo) {
    await prisma.user.create({
      data: {
        username: "demo",
        name: "Demo Kullanıcı",
        role: "USER",
        passwordHash: await bcrypt.hash("Demo123!", 10),
      },
    });
    console.log("Demo kullanıcı oluşturuldu: demo");
  }

  const systemCount = await prisma.system.count();
  if (systemCount === 0) {
    for (const s of EXAMPLE_SYSTEMS) {
      const categoryId = categoryMap.get(s.category);
      if (!categoryId) continue;

      const system = await prisma.system.create({
        data: {
          name: s.name,
          type: s.type,
          host: s.host || null,
          url: s.url,
          description: s.description,
          isFavorite: s.isFavorite ?? false,
          categoryId,
        },
      });

      for (const tagName of s.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await prisma.systemTag.create({ data: { systemId: system.id, tagId: tag.id } });
      }
    }
    console.log(`${EXAMPLE_SYSTEMS.length} örnek sistem oluşturuldu`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
