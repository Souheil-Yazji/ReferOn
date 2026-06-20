import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from '../../i18n/useTranslation'

const patientIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#1d4ed8;border:2px solid white;box-shadow:0 0 0 1px #1d4ed8"></div>',
  iconSize: [14, 14],
})

const specialistIcon = (active) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${active ? '#16a34a' : '#64748b'};border:2px solid white;box-shadow:0 0 0 1px ${active ? '#16a34a' : '#64748b'}"></div>`,
    iconSize: [14, 14],
  })

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 11)
      return
    }
    map.fitBounds(points, { padding: [40, 40] })
  }, [map, points])
  return null
}

export default function SpecialistMap({ patientLocation, specialists, highlightedId, onMarkerHover }) {
  const { t } = useTranslation()

  const points = useMemo(() => {
    const pts = specialists.map((s) => [s.location.lat, s.location.lng])
    if (patientLocation) pts.push([patientLocation.lat, patientLocation.lng])
    return pts
  }, [specialists, patientLocation])

  const center = patientLocation ? [patientLocation.lat, patientLocation.lng] : [43.6532, -79.3832]

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-slate-200">
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds points={points} />
        {patientLocation && (
          <Marker position={[patientLocation.lat, patientLocation.lng]} icon={patientIcon}>
            <Popup>{t('specialist.patientLocation')}</Popup>
          </Marker>
        )}
        {specialists.map((s) => (
          <Marker
            key={s.id}
            position={[s.location.lat, s.location.lng]}
            icon={specialistIcon(highlightedId === s.id)}
            eventHandlers={{
              mouseover: () => onMarkerHover?.(s.id),
              mouseout: () => onMarkerHover?.(null),
            }}
          >
            <Popup>
              {s.name}
              <br />
              {s.clinic}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
