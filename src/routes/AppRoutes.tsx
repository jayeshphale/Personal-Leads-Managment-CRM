import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages
import { Dashboard } from '@/pages/Dashboard'
import { Leads } from '@/pages/Leads'
import { LeadDetails } from '@/pages/LeadDetails'
import { CallingTracker } from '@/pages/CallingTracker'
import { WhatsAppTracker } from '@/pages/WhatsAppTracker'
import { WorkshopTracker } from '@/pages/WorkshopTracker'
import { Enrollments } from '@/pages/Enrollments'
import { Reminders } from '@/pages/Reminders'
import { Reports } from '@/pages/Reports'
import { Settings } from '@/pages/Settings'
import { Login } from '@/pages/Login'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected CRM Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/calling" element={<CallingTracker />} />
          <Route path="/whatsapp" element={<WhatsAppTracker />} />
          <Route path="/workshops" element={<WorkshopTracker />} />
          <Route path="/enrollments" element={<Enrollments />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
