import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { BookingsPage } from '@/features/bookings/BookingsPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { CustomerProfilePage } from '@/features/customers/CustomerProfilePage'
import { MarketingPage } from '@/features/marketing/MarketingPage'
import { OperationsPage } from '@/features/operations/OperationsPage'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { NotFound } from '@/components/layout/NotFound'
import { SitePage } from '@/features/site/SitePage'

export function App() {
  return (
    <Routes>
      <Route path="shop" element={<SitePage />} />
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerProfilePage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
