'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { ImageField } from '@/src/components/admin/shared/ImageField'
import { Save, Loader2 } from 'lucide-react'
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

  const uploadQrCode = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload/qr-code', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Upload failed')
    }
    const data = await res.json()
    return data.url as string
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
            <ImageField
              id="qr_code_url"
              label="QR Code Image (optional)"
              value={config.qr_code_url}
              onChange={(url) => setConfig({ ...config, qr_code_url: url })}
              onUpload={uploadQrCode}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              maxSizeMB={5}
              previewClassName="w-40 h-40 mx-auto"
              placeholder="Paste a QR code image URL"
              helpText="Upload a QR code image from your device or paste an image URL."
            />
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
