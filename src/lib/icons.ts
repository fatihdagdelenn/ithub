import {
  Layers,
  HardDrive,
  ServerCog,
  Server,
  Network,
  ShieldCheck,
  KeyRound,
  Activity,
  Archive,
  GitBranch,
  Box,
  LayoutGrid,
  Cloud,
  ClipboardList,
  Database,
  Folder,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  "hard-drive": HardDrive,
  "server-cog": ServerCog,
  network: Network,
  "shield-check": ShieldCheck,
  "key-round": KeyRound,
  activity: Activity,
  archive: Archive,
  "git-branch": GitBranch,
  box: Box,
  "layout-grid": LayoutGrid,
  cloud: Cloud,
  "clipboard-list": ClipboardList,
  database: Database,
  folder: Folder,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export function getIcon(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Folder;
}

// Presentation-only heuristic: pick a more specific line icon from the free-text
// "type" field when it clearly matches a known system, otherwise fall back to
// the category's configured icon. Doesn't touch stored data.
const TYPE_ICON_RULES: [RegExp, LucideIcon][] = [
  [/vmware|vcenter|proxmox|hyper-?v|xenserver|nutanix/i, Layers],
  [/ilo|idrac|hpe|poweredge|blade|rack/i, Server],
  [/fortigate|firewall|palo ?alto|checkpoint|pfsense|sonicwall/i, ShieldCheck],
  [/zabbix|grafana|prtg|nagios|monitor|datadog|prometheus/i, Activity],
  [/veeam|backup|acronis/i, Archive],
  [/gitlab|github|jenkins|devops|ci\/?cd|terraform|ansible/i, GitBranch],
  [/aruba|switch|router|controller|network|sd-?wan/i, Network],
  [/pam|totp|mfa|vault|2fa|sso/i, KeyRound],
  [/netapp|synology|storage|dorado|powerstore|san|nas/i, HardDrive],
  [/postgres|mysql|mssql|mariadb|database|pgadmin/i, Database],
  [/kubernetes|rancher|docker|container|k8s/i, Box],
  [/microsoft|m365|office ?365|active directory/i, LayoutGrid],
  [/azure|aws|gcp|cloud/i, Cloud],
  [/netbox|itsm|documentation|wiki/i, ClipboardList],
];

export function getSystemIcon(type: string, categoryIcon: string): LucideIcon {
  for (const [pattern, icon] of TYPE_ICON_RULES) {
    if (pattern.test(type)) return icon;
  }
  return getIcon(categoryIcon);
}
