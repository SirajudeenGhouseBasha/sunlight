'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Save, Loader2, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UpiConfig {
  upi_id: string
  phone: string
  qr_code_url: string
  merchant_name: string
}

export function PaymentSettingsModule() {
  const [config, setConfig] = useState<UpiConfig>({
    upi_id: '',
    phone: '',
    qr_code_url: '',
    merchant_name: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qrUploading, setQrUploading] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/upi')
      if (res.ok) {
        const data = await res.json()
        setConfig({
          upi_id: data.upi_id || '',
          phone: data.phone || '',
          qr_code_url: data.qr_code_url || '',
          merchant_name: data.merchant_name || '',
        })
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setQrUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/qr-code', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setConfig({ ...config, qr_code_url: data.url })
      toast.success('QR code uploaded')
    } catch {
      toast.error('Failed to upload QR code')
    } finally {
      setQrUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/upi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Payment settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>UPI Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="upi_id">UPI ID</Label>
            <Input
              id="upi_id"
              value={config.upi_id}
              onChange={(e) => setConfig({ ...config, upi_id: e.target.value })}
              placeholder="sunlightcases@upi"
              className="h-11 mt-1.5"
            />
            <p className="text-xs text-neutral-400 mt-1">Your UPI VPA ID (e.g. name@upi)</p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              placeholder="+919999999999"
              className="h-11 mt-1.5"
            />
            <p className="text-xs text-neutral-400 mt-1">Phone number displayed for UPI payments</p>
          </div>

          <div>
            <Label htmlFor="merchant_name">Merchant Name</Label>
            <Input
              id="merchant_name"
              value={config.merchant_name}
              onChange={(e) => setConfig({ ...config, merchant_name: e.target.value })}
              placeholder="Sunlight Cases"
              className="h-11 mt-1.5"
            />
            <p className="text-xs text-neutral-400 mt-1">Your business name shown at checkout</p>
          </div>

          <div>
            <Label>QR Code Image (optional)</Label>
            <div className="mt-1.5">
              {config.qr_code_url ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={config.qr_code_url}
                    alt="UPI QR Code"
                    className="w-40 h-40 object-contain rounded-xl border border-neutral-100"
                  />
                  <div className="flex gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Change
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleQrUpload}
                        disabled={qrUploading}
                      />
                    </label>
                    <button
                      onClick={() => setConfig({ ...config, qr_code_url: '' })}
                      className="h-9 px-4 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors">
                  {qrUploading ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-5 h-5 text-neutral-400" />
                      <span className="text-sm text-neutral-500">Click to upload QR code</span>
                      <span className="text-xs text-neutral-400">JPEG, PNG, WebP (max 5MB)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleQrUpload}
                    disabled={qrUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
