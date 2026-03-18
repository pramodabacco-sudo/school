import { Routes, Route, Navigate } from "react-router-dom";
import FinanceDashboard from "./FinanceDashboard";
import Studentfinance from "./pages/Studentfinance/Studentfinance";
import Teachersfinance from "./pages/Teachersfinance/Teachersfinance";
import GroupASalary from "./pages/Teachersfinance/GroupASalary";
import GroupBSalary from "./pages/Teachersfinance/GroupBSalary";
import GroupCSalary from "./pages/Teachersfinance/GroupCSalary";
import GroupDSalary from "./pages/Teachersfinance/GroupDSalary";

import PageLayout from "./components/PageLayout";

const FinanceAppRoutes = () => {
  return (
    <Routes>
      <Route path="pagelayout" element={<PageLayout />} />
      <Route path="/" element={<FinanceDashboard />} />
      <Route path="/finance/studentfinance" element={<Studentfinance />} />
      <Route path="/finance/teachersfinance" element={<Teachersfinance />} />

      <Route path="/group-a" element={<GroupASalary />} />
      <Route path="/group-b" element={<GroupBSalary />} />
      <Route path="/group-c" element={<GroupCSalary />} />
      <Route path="/group-d" element={<GroupDSalary />} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default FinanceAppRoutes;