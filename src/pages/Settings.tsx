import React, { useState } from 'react'
import {
  Settings as SettingsIcon, User, Sparkles, Moon, Sun, Bell, Volume2,
  Shield, Download, Trash2, CheckCircle2, AlertCircle, Save, LogOut,
  Key, ExternalLink, RefreshCw, Eye, EyeOff
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, Input, Textarea, Select, Badge, Avatar } from '../components/ui'
import { useAuthStore, useUIStore } from '../store'
import { getAIKey, saveAIKey, getActiveProvider, setActiveProvider, generateCompletion } from '../lib/ai'
import { toast } from 'sonner'

export function Settings() {
  const { profile, setProfile, signOut } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name || 'Ramesh Yadav')
  const [email, setEmail] = useState(profile?.email || 'ramesh.yadav@example.com')
  const [bio, setBio] = useState(profile?.bio || 'B.Tech CS Student (2027 Grad). Targeting SDE-1 at top tier tech companies.')
  const [education, setEducation] = useState(profile?.education || 'B.Tech in Computer Science & Engineering')
  const [gradYear, setGradYear] = useState(profile?.graduation_year?.toString() || '2027')
  const [careerTarget, setCareerTarget] = useState(profile?.career_target || 'SDE-1 (Google, Microsoft, Amazon)')
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata')

  // AI Keys & Provider
  const [aiProvider, setAiProvider] = useState<'groq' | 'gemini' | 'none'>(getActiveProvider())
  const [geminiKey, setGeminiKey] = useState(getAIKey('gemini'))
  const [groqKey, setGroqKey] = useState(getAIKey('groq'))
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showGroqKey, setShowGroqKey] = useState(false)
  const [testingAI, setTestingAI] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Preferences
  const [dailyGoalHours, setDailyGoalHours] = useState('5')
  const [enableSound, setEnableSound] = useState(true)
  const [enableGamification, setEnableGamification] = useState(true)

  const handleSaveProfile = () => {
    if (profile) {
      setProfile({
        ...profile,
        full_name: fullName.trim(),
        email: email.trim(),
        bio: bio.trim(),
        education: education.trim(),
        graduation_year: Number(gradYear) || 2027,
        career_target: careerTarget.trim(),
        timezone,
      })
    }
    toast.success('Profile settings updated successfully!')
  }

  const handleSaveAIConfig = () => {
    saveAIKey('gemini', geminiKey)
    saveAIKey('groq', groqKey)
    let effective = aiProvider
    if (aiProvider === 'gemini' && !geminiKey.trim() && groqKey.trim()) {
      effective = 'groq'
    } else if (aiProvider === 'groq' && !groqKey.trim() && geminiKey.trim()) {
      effective = 'gemini'
    }
    setActiveProvider(effective)
    setAiProvider(effective)
    toast.success(`AI credentials saved! Active: ${effective.toUpperCase()}`)
  }

  const handleTestAI = async () => {
    handleSaveAIConfig()
    setTestingAI(true)
    setAiTestResult(null)

    try {
      const res = await generateCompletion({
        messages: [
          { role: 'user', content: 'Respond with a short, 1-sentence confirmation: "LifeOS AI is connected and ready to assist you!"' }
        ],
        maxTokens: 60,
      })

      if (res.success) {
        setAiTestResult({
          success: true,
          message: `${res.content} (Engine: ${res.provider.toUpperCase()} - ${res.model})`
        })
        toast.success(`Connected to ${res.provider.toUpperCase()}!`)
      } else {
        setAiTestResult({ success: false, message: res.error || 'Failed to connect' })
        toast.error(res.error || 'Connection failed')
      }
    } catch (err: any) {
      setAiTestResult({ success: false, message: err.message || 'Error testing connection' })
      toast.error('Connection failed')
    } finally {
      setTestingAI(false)
    }
  }

  const handleExportData = () => {
    const backup = {
      profile,
      projects: localStorage.getItem('lifeos_projects'),
      dsa_problems: localStorage.getItem('lifeos_dsa_problems'),
      german_vocab: localStorage.getItem('lifeos_german_vocab'),
      quests: localStorage.getItem('lifeos_daily_quests'),
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('LifeOS data exported as JSON!')
  }

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="Settings & System Preferences"
        subtitle="Manage your profile, academic timeline, AI engine, and data storage"
      />

      <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Profile Card */}
        <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={fullName} size="lg" />
              <div>
                <h3 className="text-base font-bold text-surface-100">{fullName}</h3>
                <p className="text-xs text-surface-400 font-mono">{email}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={handleSaveProfile} className="gap-1.5">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-surface-800">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Degree / Major"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
            />
            <Input
              label="Graduation Year"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
            />
            <Input
              label="Target Career Goal"
              value={careerTarget}
              onChange={(e) => setCareerTarget(e.target.value)}
            />
            <Input
              label="Default Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>

          <Textarea
            label="Personal Bio & Mission Statement"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
          />
        </Card>

        {/* AI & Engine Configuration Card */}
        <Card className="p-6 bg-surface-900/60 border-accent-500/30 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent-600 to-electric-600 flex items-center justify-center text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-100">AI Intelligence Engine</h3>
                <p className="text-xs text-surface-400">Power your daily AI briefing, learning notes analyzer, mentor chat, and language coach</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestAI}
                loading={testingAI}
                className="gap-1.5 text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Test Connection
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAIConfig}
                className="gap-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save AI Keys
              </Button>
            </div>
          </div>

          {/* Test connection alert */}
          {aiTestResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              aiTestResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {aiTestResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div>
                <p className="font-semibold">{aiTestResult.success ? 'AI Connected & Working!' : 'Connection Error'}</p>
                <p className="mt-0.5 opacity-90">{aiTestResult.message}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-surface-800">
            <Select
              label="Active AI Provider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as any)}
              options={[
                { value: 'gemini', label: 'Google Gemini (Gemini 1.5 Flash — Free)' },
                { value: 'groq', label: 'Groq (Ultra-fast Llama 3.3 70B — Free)' },
                { value: 'none', label: 'Offline / None' },
              ]}
            />
            <Input
              label="Daily Learning Goal (Hours)"
              type="number"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(e.target.value)}
            />
          </div>

          {/* API Key Inputs */}
          <div className="space-y-4 pt-2">
            {/* Google Gemini Key */}
            <div className="space-y-1.5 bg-surface-950/60 p-4 rounded-xl border border-surface-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-surface-200 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-accent-400" />
                  Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xs text-accent-400 hover:text-accent-300 flex items-center gap-1"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-surface-900 border border-surface-800 rounded-lg text-xs font-mono px-3 py-2 pr-10 text-surface-200 outline-none focus:border-accent-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-2.5 text-surface-500 hover:text-surface-300"
                >
                  {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-3xs text-surface-500">
                Saved in your browser localStorage or configure via <code className="font-mono text-accent-300">VITE_GEMINI_API_KEY</code> in <code className="font-mono text-accent-300">.env</code>.
              </p>
            </div>

            {/* Groq Key */}
            <div className="space-y-1.5 bg-surface-950/60 p-4 rounded-xl border border-surface-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-surface-200 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-electric-400" />
                  Groq Cloud API Key
                </label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xs text-electric-400 hover:text-electric-300 flex items-center gap-1"
                >
                  <span>Get Free Key (Groq Console)</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full bg-surface-900 border border-surface-800 rounded-lg text-xs font-mono px-3 py-2 pr-10 text-surface-200 outline-none focus:border-electric-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-3 top-2.5 text-surface-500 hover:text-surface-300"
                >
                  {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-3xs text-surface-500">
                Provides lightning-fast Llama 3.3 70B inferences or set via <code className="font-mono text-electric-300">VITE_GROQ_API_KEY</code> in <code className="font-mono text-electric-300">.env</code>.
              </p>
            </div>
          </div>
        </Card>

        {/* Display & Notification Preferences */}
        <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-4">
          <h3 className="text-base font-bold text-surface-100">UI & Notifications</h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/60 border border-surface-800">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-accent-400" /> : <Sun className="h-5 w-5 text-amber-400" />}
                <div>
                  <h4 className="text-xs font-semibold text-surface-200">Color Theme</h4>
                  <p className="text-3xs text-surface-500">Currently using sleek {theme} mode</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/60 border border-surface-800">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-semibold text-surface-200">Sound Effects & Speech Synthesis</h4>
                  <p className="text-3xs text-surface-500">Play pronunciation audio and feedback clicks</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSound}
                onChange={(e) => setEnableSound(e.target.checked)}
                className="h-4 w-4 accent-accent-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/60 border border-surface-800">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="text-xs font-semibold text-surface-200">Gamification & XP Levels</h4>
                  <p className="text-3xs text-surface-500">Enable streak tracking, daily quests, and level progress</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableGamification}
                onChange={(e) => setEnableGamification(e.target.checked)}
                className="h-4 w-4 accent-accent-500 rounded"
              />
            </div>
          </div>
        </Card>

        {/* Data & Privacy Card */}
        <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-4">
          <h3 className="text-base font-bold text-surface-100">Data Management & Backup</h3>
          <p className="text-xs text-surface-400">
            Export a full JSON archive of your flashcards, projects, DSA catalog, and settings.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={handleExportData} className="gap-2">
              <Download className="h-4 w-4" />
              Export JSON Backup
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm('Sign out of your session?')) {
                  signOut()
                  toast.success('Signed out')
                }
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
