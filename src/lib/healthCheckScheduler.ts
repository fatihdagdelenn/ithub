import { prisma } from "@/lib/prisma";
import { checkSystemOnline } from "@/lib/healthCheck";

const DEFAULT_INTERVAL_MINUTES = 10;

let started = false;
let sweepRunning = false;

async function runSweep() {
  if (sweepRunning) return;
  sweepRunning = true;
  try {
    const systems = await prisma.system.findMany({ select: { id: true, url: true } });

    // Checked one at a time, not in parallel: some appliances (a PAM system in particular) sit
    // behind a firewall/IPS that treats a burst of simultaneous new connections from one source IP
    // as suspicious and drops/throttles them - a system that's genuinely reachable came back
    // "offline" purely because of that burst, and passed once checks were serialized.
    for (const system of systems) {
      const isOnline = await checkSystemOnline(system.url);
      await prisma.system
        .update({ where: { id: system.id }, data: { isOnline, lastCheckedAt: new Date() } })
        .catch(() => {});
    }
  } finally {
    sweepRunning = false;
  }
}

export function startHealthCheckScheduler() {
  if (started) return;
  started = true;

  const intervalMinutes = Number(process.env.HEALTH_CHECK_INTERVAL_MINUTES) || DEFAULT_INTERVAL_MINUTES;
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

  console.log(`[health-check] scheduler starting, interval=${intervalMinutes}min`);
  runSweep()
    .then(() => console.log("[health-check] initial sweep done"))
    .catch((err) => console.error("[health-check] sweep failed", err));
  setInterval(() => {
    runSweep().catch((err) => console.error("[health-check] sweep failed", err));
  }, intervalMs);
}
