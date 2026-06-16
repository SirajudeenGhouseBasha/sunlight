'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Search, Crosshair, Loader2, X } from 'lucide-react'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

interface LocationData {
  lat: number
  lng: number
  address: string
}

interface LocationPickerProps {
  onLocationChange?: (location: LocationData | null) => void
  initialLocation?: LocationData
}

const LOCATION_KEY = 'sunlight_checkout_location'

function persist(loc: LocationData) {
  try { sessionStorage.setItem(LOCATION_KEY, JSON.stringify(loc)) } catch { /* noop */ }
}

function loadPersisted(): LocationData | null {
  try {
    const raw = sessionStorage.getItem(LOCATION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
    { headers: { 'Accept-Language': 'en' } }
  )
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (res.ok) {
      const data = await res.json()
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  } catch { /* fall through */ }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export function LocationPicker({ onLocationChange, initialLocation }: LocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loc, setLoc] = useState<LocationData | null>(
    initialLocation || loadPersisted() || null
  )
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await searchNominatim(query)
        setResults(r)
      } catch { setResults([]) }
      setSearching(false)
    }, 400)
    return () => clearTimeout(timer.current)
  }, [query])

  const onMove = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true)
    const address = await reverseGeocode(lat, lng)
    const data: LocationData = { lat, lng, address }
    setLoc(data)
    setMapCenter({ lat, lng })
    persist(data)
    onLocationChange?.(data)
    setGeocoding(false)
  }, [onLocationChange])

  const pickResult = useCallback((r: NominatimResult) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const data: LocationData = { lat, lng, address: r.display_name }
    setLoc(data)
    setMapCenter({ lat, lng })
    setQuery(r.display_name)
    setResults([])
    persist(data)
    onLocationChange?.(data)
    setOpen(true)
  }, [onLocationChange])

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const address = await reverseGeocode(lat, lng)
        const data: LocationData = { lat, lng, address }
        setLoc(data)
        setMapCenter({ lat, lng })
        setQuery(address)
        persist(data)
        onLocationChange?.(data)
        setLocating(false)
        setOpen(true)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onLocationChange])

  const clear = useCallback(() => {
    setLoc(null)
    setQuery('')
    setResults([])
    try { sessionStorage.removeItem(LOCATION_KEY) } catch { /* noop */ }
    onLocationChange?.(null)
  }, [onLocationChange])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">Drop Location</span>
          <span className="text-[11px] text-neutral-400">(optional)</span>
        </div>
        {loc && (
          <button onClick={clear} className="text-xs text-neutral-400 hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search area, landmark, pincode..."
          className="w-full h-10 pl-9 pr-10 text-sm bg-neutral-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-neutral-400"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />}
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-neutral-100 max-h-48 overflow-y-auto -mt-2 relative z-10">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => pickResult(r)}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
            >
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {open ? 'Hide map' : loc ? 'View on map' : 'Open map'}
        </button>
        <span className="text-neutral-300">|</span>
        <button
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:text-neutral-400"
        >
          <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating...' : 'Current location'}
        </button>
      </div>

      {loc && !open && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 line-clamp-2">{loc.address}</p>
        </div>
      )}

      {open && (
        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-neutral-100">
          <MapView lat={mapCenter.lat} lng={mapCenter.lng} onMove={onMove} />
          {geocoding && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm z-[1000]">
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Getting address...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export type { LocationData }
