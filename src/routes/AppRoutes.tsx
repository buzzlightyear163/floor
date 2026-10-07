import { Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

/**
 * Route inventory (se REFERENCE_ANALYSIS.md):
 *   /   → spelet (titelskärm + kontor)
 *   *   → 404
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
