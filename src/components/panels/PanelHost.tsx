import { useGame } from "@/store/store";
import { AnalyticsPanel, FloorPanel, FounderPanel, LeaderboardPanel, LedgerPanel, MeetingPanel, SettingsPanel, StaffPanel } from "./FirmPanels";
import { HirePanel } from "./HirePanel";
import { PairPanel } from "./PairPanel";
import { RiskPanel } from "./RiskPanel";
import { StrategyPanel } from "./StrategyPanel";
import { ConnectPanel, ElevatorPanel, HowPanel, LockedPanel, MenuPanel } from "./SystemPanels";
import { TraderPanel } from "./TraderPanel";
import { VaultPanel } from "./VaultPanel";

/** Renderar aktiv panel (modal) utifrån spel-state. */
export function PanelHost() {
  const panel = useGame((s) => s.panel);
  if (!panel) return null;
  switch (panel.type) {
    case "hire":
      return <HirePanel idx={panel.idx} />;
    case "pair":
      return <PairPanel id={panel.traderId} />;
    case "strategy":
      return <StrategyPanel id={panel.traderId} />;
    case "risk":
      return <RiskPanel id={panel.traderId} />;
    case "vault":
      return <VaultPanel id={panel.traderId} />;
    case "trader":
      return <TraderPanel id={panel.traderId} />;
    case "analytics":
      return <AnalyticsPanel />;
    case "leaderboard":
      return <LeaderboardPanel />;
    case "floor":
      return <FloorPanel />;
    case "menu":
      return <MenuPanel />;
    case "staff":
      return <StaffPanel />;
    case "ledger":
      return <LedgerPanel />;
    case "settings":
      return <SettingsPanel />;
    case "how":
      return <HowPanel />;
    case "connect":
      return <ConnectPanel />;
    case "elevator":
      return <ElevatorPanel />;
    case "meeting":
      return <MeetingPanel />;
    case "founder":
      return <FounderPanel />;
    case "locked":
      return <LockedPanel name={panel.name} />;
  }
}
