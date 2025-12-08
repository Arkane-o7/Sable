import { useState, useEffect, useCallback } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, MapPin, RefreshCw, Thermometer, Eye, Search, CloudFog } from 'lucide-react'
import { WidgetComponentProps, WidgetConfig } from './types'
import { registerWidget } from './registry'

// ============= Widget Configuration =============
export const weatherWidgetConfig: WidgetConfig = {
  type: 'weather',
  label: 'Weather',
  defaultSize: { width: 260, height: 300 },
  minSize: { width: 220, height: 260 },
  component: WeatherWidget,
}

// ============= Types =============
interface WeatherData {
  temp: number
  feelsLike: number
  condition: string
  conditionCode: number
  humidity: number
  windSpeed: number
  visibility: number
  location: string
  country: string
  isDay: boolean
  hourly: { time: string; temp: number; conditionCode: number; isDay: boolean }[]
}

// ============= Weather Icons based on condition code =============
const getWeatherIcon = (code: number, isDay: boolean, size: number = 24) => {
  const className = "text-current"
  
  // wttr.in uses WWO condition codes
  if (code === 113) return <Sun size={size} className={className} />
  if (code === 116) return <Cloud size={size} className={className} />
  if (code === 119 || code === 122) return <Cloud size={size} className={className} />
  if (code === 143 || code === 248 || code === 260) return <CloudFog size={size} className={className} />
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return <CloudRain size={size} className={className} />
  if (code === 386 || code === 389 || code === 392 || code === 395) return <CloudLightning size={size} className={className} />
  if ([179, 182, 185, 227, 230, 281, 284, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) return <CloudSnow size={size} className={className} />
  if ([185, 263, 266].includes(code)) return <CloudDrizzle size={size} className={className} />
  
  return isDay ? <Sun size={size} className={className} /> : <Cloud size={size} className={className} />
}

// ============= Fetch Weather from wttr.in (free, no API key) =============
async function fetchWeatherData(location: string): Promise<WeatherData | null> {
  try {
    const query = location || ''
    const response = await fetch(`https://wttr.in/${encodeURIComponent(query)}?format=j1`)
    if (!response.ok) throw new Error('Weather fetch failed')
    
    const data = await response.json()
    const current = data.current_condition[0]
    const area = data.nearest_area[0]
    const hourlyData = data.weather[0].hourly
    
    const currentHour = new Date().getHours()
    const isDay = currentHour >= 6 && currentHour < 20
    
    return {
      temp: parseInt(current.temp_C),
      feelsLike: parseInt(current.FeelsLikeC),
      condition: current.weatherDesc[0].value,
      conditionCode: parseInt(current.weatherCode),
      humidity: parseInt(current.humidity),
      windSpeed: parseInt(current.windspeedKmph),
      visibility: parseInt(current.visibility),
      location: area.areaName[0].value,
      country: area.country[0].value,
      isDay,
      hourly: hourlyData.map((h: { time: string; tempC: string; weatherCode: string }, i: number) => {
        const hour = parseInt(h.time) / 100
        const hourStr = hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`
        return {
          time: i === 0 ? 'Now' : hourStr,
          temp: parseInt(h.tempC),
          conditionCode: parseInt(h.weatherCode),
          isDay: hour >= 6 && hour < 20
        }
      })
    }
  } catch (error) {
    console.error('Weather fetch error:', error)
    return null
  }
}

// ============= Widget Component =============
function WeatherWidget({ data, updateData }: WidgetComponentProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  
  const location = (data.location as string) || ''

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchWeatherData(location)
    if (result) {
      setWeather(result)
      if (!location && result.location) {
        updateData({ location: result.location })
      }
    } else {
      setError('Could not fetch weather')
    }
    setLoading(false)
  }, [location, updateData])

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeather])

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locationInput.trim()) {
      updateData({ location: locationInput.trim() })
      setIsEditing(false)
      setLocationInput('')
    }
  }

  if (loading && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl">
        <RefreshCw size={24} className="text-white/60 animate-spin mb-2" />
        <span className="text-white/40 text-xs">Loading weather...</span>
      </div>
    )
  }

  if (error && !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4">
        <Cloud size={32} className="text-white/40 mb-2" />
        <span className="text-white/60 text-xs text-center mb-3">{error}</span>
        <button
          onClick={fetchWeather}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-xs transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!weather) return null

  const bgGradient = weather.isDay 
    ? 'from-sky-400 via-sky-500 to-blue-600' 
    : 'from-indigo-900 via-slate-800 to-slate-900'

  return (
    <div className={`h-full flex flex-col bg-gradient-to-br ${bgGradient} rounded-xl text-white overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        {isEditing ? (
          <form onSubmit={handleLocationSubmit} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city..."
              autoFocus
              className="flex-1 bg-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button type="submit" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <Search size={14} />
            </button>
          </form>
        ) : (
          <>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors group"
            >
              <MapPin size={12} />
              <span className="text-xs font-medium group-hover:underline">{weather.location}</span>
            </button>
            <button 
              onClick={fetchWeather}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </>
        )}
      </div>

      {/* Main Temperature */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex items-start">
          <span className="text-6xl font-extralight tracking-tighter">{weather.temp}</span>
          <span className="text-2xl font-light mt-2">°C</span>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {getWeatherIcon(weather.conditionCode, weather.isDay, 20)}
          <span className="text-sm text-white/90">{weather.condition}</span>
        </div>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
          <Thermometer size={10} />
          <span>Feels like {weather.feelsLike}°</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-around px-4 py-2.5 bg-white/10">
        <div className="flex flex-col items-center">
          <Droplets size={14} className="text-white/70 mb-0.5" />
          <span className="text-xs font-medium">{weather.humidity}%</span>
          <span className="text-[9px] text-white/50">Humidity</span>
        </div>
        <div className="flex flex-col items-center">
          <Wind size={14} className="text-white/70 mb-0.5" />
          <span className="text-xs font-medium">{weather.windSpeed}</span>
          <span className="text-[9px] text-white/50">km/h</span>
        </div>
        <div className="flex flex-col items-center">
          <Eye size={14} className="text-white/70 mb-0.5" />
          <span className="text-xs font-medium">{weather.visibility}</span>
          <span className="text-[9px] text-white/50">km vis</span>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="px-2 py-2 bg-black/20">
        <div className="flex justify-between">
          {weather.hourly.slice(0, 6).map((hour, i) => (
            <div key={i} className="flex flex-col items-center min-w-[36px] py-1">
              <span className="text-[9px] text-white/60 mb-1">{hour.time}</span>
              {getWeatherIcon(hour.conditionCode, hour.isDay, 14)}
              <span className="text-[10px] font-medium mt-1">{hour.temp}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Register this widget
registerWidget(weatherWidgetConfig)

export default WeatherWidget
