export const cityLookup = {
  toronto: { lat: 43.6532, lng: -79.3832, label: 'Toronto, ON' },
  ottawa: { lat: 45.4215, lng: -75.6972, label: 'Ottawa, ON' },
  kitchener: { lat: 43.4516, lng: -80.4925, label: 'Kitchener, ON' },
  kingston: { lat: 44.2312, lng: -76.4860, label: 'Kingston, ON' },
  hamilton: { lat: 43.2557, lng: -79.8711, label: 'Hamilton, ON' },
  london: { lat: 42.9849, lng: -81.2453, label: 'London, ON' },
}

export function geocodeCity(input) {
  const key = input.trim().toLowerCase().split(',')[0]
  return cityLookup[key] || { lat: 43.6532, lng: -79.3832, label: input }
}
