import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, CloudLightning } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WeatherCardProps {
  location?: string;
  temp?: string;
  condition?: string;
  humidity?: string;
  wind?: string;
  pressure?: string;
  unit?: string;
}

export default function WeatherCard({
  location,
  temp,
  condition,
  humidity,
  wind,
  pressure,
  unit = 'C',
}: WeatherCardProps) {
  const hasLocation = !!location;
  const hasTemp = !!temp;

  const displayLocation = location || 'Unknown Location';
  const displayCondition = condition || 'Clear';
  const displayTemp = temp || '0';
  const displayHumidity = humidity || '0%';
  const displayWind = wind || '0km/h';
  const displayPressure = pressure || '1013 hPa';

  // Parse temp to number for mock forecast offsets
  const baseTemp = parseInt(displayTemp.replace(/[^0-9-]/g, '')) || 0;

  // Strip any trailing °C, °F, C, F, or ° signs from the temp to prevent double units (e.g. 26°F°C)
  const tempNumber = displayTemp.replace(/[°CF]/gi, '').trim();

  // Map condition to styled Lucide icons with vibrant colors
  const getConditionIcon = (cond: string) => {
    const term = cond.toLowerCase();
    const iconClass = "w-5 h-5 shrink-0 stroke-[1.5]";
    if (term.includes('rain') || term.includes('drizzle') || term.includes('shower')) {
      return <CloudRain className={cn(iconClass, "text-sky-500 dark:text-sky-400")} />;
    }
    if (term.includes('snow') || term.includes('ice') || term.includes('freeze')) {
      return <CloudSnow className={cn(iconClass, "text-blue-400 dark:text-blue-300")} />;
    }
    if (term.includes('thunder') || term.includes('lightning') || term.includes('storm')) {
      return <CloudLightning className={cn(iconClass, "text-amber-500 dark:text-amber-400")} />;
    }
    if (term.includes('wind') || term.includes('breeze') || term.includes('gale')) {
      return <Wind className={cn(iconClass, "text-teal-500 dark:text-teal-400")} />;
    }
    if (term.includes('cloud') || term.includes('overcast') || term.includes('haze') || term.includes('fog')) {
      return <Cloud className={cn(iconClass, "text-zinc-400 dark:text-zinc-500")} />;
    }
    return <Sun className={cn(iconClass, "text-amber-500 dark:text-amber-400")} />;
  };

  // Calculate day of the week timeline names
  const getForecastDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    return [
      'Tomorrow',
      days[(today + 2) % 7],
      days[(today + 3) % 7]
    ];
  };

  const forecastDays = getForecastDays();

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Compact Location and Inline Temperature + Icon */}
      <div className="p-4 flex justify-between items-center bg-white dark:bg-zinc-950">
        {/* Left Column: Location & Condition Stack */}
        <div className="flex flex-col min-w-0 flex-1 mr-3">
          {hasLocation ? (
            <span className="text-[13px] sm:text-sm font-semibold tracking-tight text-foreground leading-none truncate">
              {displayLocation}
            </span>
          ) : (
            <div className="w-20 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          )}

          <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1.5 leading-normal truncate">
            {displayCondition}
          </span>
        </div>

        {/* Right Column: Inline Temp + Icon */}
        <div className="flex items-center gap-2 shrink-0">
          {hasTemp ? (
            <span className="text-xl sm:text-2xl font-light font-mono tracking-tight text-foreground leading-none">
              {tempNumber}°{unit}
            </span>
          ) : (
            <div className="w-12 h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          )}
          
          {getConditionIcon(displayCondition)}
        </div>
      </div>

      {/* Bottom Panel: Today's Climate Stats (Inline and Slim) */}
      <div className="px-4 py-2.5 flex justify-between items-center bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60 text-[9.5px] font-semibold text-muted-foreground">
        <span>Humidity: <span className="font-mono text-foreground font-semibold">{displayHumidity}</span></span>
        <span>Wind: <span className="font-mono text-foreground font-semibold">{displayWind}</span></span>
        <span>Baro: <span className="font-mono text-foreground font-semibold">{displayPressure}</span></span>
      </div>
    </div>
  );
}
