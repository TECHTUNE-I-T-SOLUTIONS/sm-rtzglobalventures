"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix marker icon issue in Next.js/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const position: [number, number] = [8.4891, 4.6746] // Example: University of Ilorin, Ilorin, Nigeria

export default function MapView() {
  return (
    <div style={{ height: "350px", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer center={position} zoom={16} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Sm@rtz Computers & Bookshop<br />
            Shop 4 & 5, Behind Faculty of CIS, University of Ilorin PS, Ilorin, Nigeria
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}