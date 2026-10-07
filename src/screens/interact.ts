import { BRAND } from "@/config/brand";
import { MAX_TRADERS } from "@/data/traders";
import { nextObjective, store } from "@/store/store";
import type { TraderStatus } from "@/store/types";

/** Vad som händer när spelaren trycker E vid en interaktionspunkt. */
export function interact(id: string) {
  const s = store.get();
  const obj = nextObjective(s);
  const firstWith = (status: TraderStatus) => s.traders.find((t) => t.status === status);
  const open = store.set;

  if (id.startsWith("hire-")) return open({ panel: { type: "hire", idx: Number(id.split("-")[1]) } });
  if (id.startsWith("desk-")) {
    const t = s.traders.find((tr) => tr.desk === Number(id.split("-")[1]));
    return t
      ? open({ panel: { type: "trader", traderId: t.id } })
      : store.say("DESK", ["AN EMPTY DESK.", "PUT A TRADER ON SHIFT TO CLAIM IT."]);
  }
  if (id.startsWith("locked-desk")) return open({ panel: { type: "locked", name: "EXTRA DESKS" } });

  switch (id) {
    case "receptionist":
      return s.traders.length
        ? store.say("RECEPTION", [`${obj.text}.`])
        : store.say("RECEPTION", [`WELCOME TO ${BRAND.name}.`, "EVERY FLOOR STARTS WITH ONE TRADER.", "HIRE YOUR FIRST. HR IS THE NEXT ROOM EAST."]);
    case "hr-desk":
      return s.traders.length >= MAX_TRADERS
        ? store.say("RECRUITER", ["ALL DESKS ARE FULL.", "EXPAND THE FLOOR TO HIRE MORE."])
        : store.say("RECRUITER", ["CANDIDATES ARE WAITING ON THE RUG.", "WALK UP AND PRESS E TO INTERVIEW."]);
    case "si-machine": {
      const t = firstWith("hired");
      return t
        ? open({ panel: { type: "pair", traderId: t.id } })
        : store.say("LAB TECH", ["NO ONE WAITING ON THE PAD.", "HIRE A TRADER FIRST."]);
    }
    case "strategy-board": {
      const t = firstWith("paired");
      return t
        ? open({ panel: { type: "strategy", traderId: t.id } })
        : store.say("STRATEGIST", ["NO PAIRED TRADER WAITING.", "EDIT EXISTING BUILDS FROM A TRADER'S DESK."]);
    }
    case "risk-terminal": {
      const t = firstWith("configured");
      return t
        ? open({ panel: { type: "risk", traderId: t.id } })
        : store.say("RISK OFFICER", ["NOTHING TO REVIEW.", "RISK IS EVERYONE'S JOB."]);
    }
    case "vault-terminal": {
      const t = firstWith("risk") ?? firstWith("funded");
      return t
        ? open({ panel: { type: "vault", traderId: t.id } })
        : store.say("VAULT", ["VAULT SECURE.", "NO TRADER NEEDS A WALLET RIGHT NOW."]);
    }
    case "analytics-terminal":
    case "research-terminal":
      return open({ panel: { type: "analytics" } });
    case "leaderboard":
      return open({ panel: { type: "leaderboard" } });
    case "floor-directory":
      return open({ panel: { type: "floor" } });
    case "founder-desk":
      return open({ panel: { type: "founder" } });
    case "meeting-table":
      return open({ panel: { type: "meeting" } });
    case "elevator":
      return open({ panel: { type: "elevator" } });
    case "coffee":
      return store.say("COFFEE", ["YOU POUR A COFFEE.", "+1 FOCUS. (NOT A REAL STAT.)"]);
  }
}
