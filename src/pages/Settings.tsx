import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCurrentProfile,
  updateProfile,
  getLeadSources,
  createLeadSource,
  deleteLeadSource,
  getSettingsPackages,
  updatePackageSettings,
  checkDatabaseConnection,
} from '@/services/settings.service'
import type { Profile, LeadSource, Package } from '@/types/crm.types'
import { Settings as SettingsIcon, User, Database, Package as PkgIcon, Tag, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

export const Settings: React.FC = () => {
  const { user, profile, refreshProfile, isConfigured } = useAuth()
  const { success, error } = useToast()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [newSourceName, setNewSourceName] = useState('')
  const [isAddingSource, setIsAddingSource] = useState(false)

  const [packages, setPackages] = useState<Package[]>([])
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [isCheckingDb, setIsCheckingDb] = useState(false)

  const loadSettings = async () => {
    try {
      const [p, sources, pkgs] = await Promise.all([
        getCurrentProfile(),
        getLeadSources(),
        getSettingsPackages(),
      ])
      if (p) setFullName(p.full_name || '')
      setLeadSources(sources)
      setPackages(pkgs)
    } catch (err: any) {
      console.warn('Could not load settings:', err)
    }
  }

  useEffect(() => {
    loadSettings()
    handleTestConnection()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsUpdatingProfile(true)
      await updateProfile({ full_name: fullName })
      await refreshProfile()
      success('Profile Updated', 'Your display name has been saved.')
    } catch (err: any) {
      error('Failed to update profile', err.message)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourceName.trim()) return
    try {
      setIsAddingSource(true)
      await createLeadSource(newSourceName.trim())
      setNewSourceName('')
      const sources = await getLeadSources()
      setLeadSources(sources)
      success('Source Added', 'New lead source created.')
    } catch (err: any) {
      error('Failed to add source', err.message)
    } finally {
      setIsAddingSource(false)
    }
  }

  const handleDeleteSource = async (id: string) => {
    try {
      await deleteLeadSource(id)
      const sources = await getLeadSources()
      setLeadSources(sources)
      success('Source Removed', 'Lead source deleted.')
    } catch (err: any) {
      error('Failed to delete source', err.message)
    }
  }

  const handlePackagePriceUpdate = async (id: string, price: number) => {
    try {
      await updatePackageSettings(id, price)
      const pkgs = await getSettingsPackages()
      setPackages(pkgs)
      success('Package Updated', 'Package pricing updated.')
    } catch (err: any) {
      error('Update failed', err.message)
    }
  }

  const handleTestConnection = async () => {
    setIsCheckingDb(true)
    const res = await checkDatabaseConnection()
    setDbStatus(res)
    setIsCheckingDb(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-slate-700" />
          CRM Settings & System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure owner profile, custom lead sources, package pricing tiers, and verify PostgreSQL database health.
        </p>
      </div>

      {/* Database Connection Health Card */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Supabase PostgreSQL Connection
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={isCheckingDb}
              className="text-xs"
            >
              Test Connection
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
            {dbStatus?.ok ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-semibold text-slate-900">
                {dbStatus?.ok ? 'Connected to Supabase PostgreSQL' : 'Connection Status'}
              </p>
              <p className="text-slate-500 mt-0.5">{dbStatus?.message || 'Testing...'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Profile Card */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Owner Account Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Email (Read-only)
                </label>
                <Input value={user?.email || ''} disabled className="bg-slate-50 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={isUpdatingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lead Sources Configuration */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" />
            Lead Acquisition Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Source Form */}
          <form onSubmit={handleAddSource} className="flex gap-2">
            <Input
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="e.g. LinkedIn Ads, Campus Ambassador"
              className="text-xs"
            />
            <Button type="submit" size="sm" isLoading={isAddingSource}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Source
            </Button>
          </form>

          {/* Sources Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {leadSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                <span>{source.name}</span>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="text-slate-400 hover:text-rose-600 ml-1 rounded p-0.5"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Packages Configuration */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PkgIcon className="w-4 h-4 text-emerald-600" />
            Standard Course Package Tiers & Default Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y divide-slate-100">
            {packages.map((pkg) => (
              <div key={pkg.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{pkg.name} Package</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{pkg.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    defaultValue={Number(pkg.price)}
                    onBlur={(e) => handlePackagePriceUpdate(pkg.id, Number(e.target.value))}
                    className="w-24 h-8 px-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
