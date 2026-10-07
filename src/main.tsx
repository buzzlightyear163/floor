import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes";
import { BRAND } from "@/config/brand";
import { startDemoTrading } from "@/services/simulator";
import { startBalancePolling } from "@/services/vault";
import "@/styles/index.css";

document.title = `${BRAND.name} — Run Your Own SI Trading Floor`;

startBalancePolling();
startDemoTrading();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
);
