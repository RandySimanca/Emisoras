import { Heart, MapPin, Play, Radio } from "lucide-react";
import type { Emisora } from "../services/radioApi";

interface Props {
  emisora: Emisora;
  favorita: boolean;
  onSeleccionar: () => void;
  onFavorita: () => void;
}

export default function TarjetaEmisora({
  emisora,
  favorita,
  onSeleccionar,
  onFavorita,
}: Props) {
  return (
    <article className="station-card">
      <button className="station-art real-station-art" onClick={onSeleccionar}>
        {emisora.favicon ? (
          <img
            src={emisora.favicon}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Radio size={43} strokeWidth={1.3} />
        )}

        <span className="station-frequency">
          {emisora.codec || "RADIO"} {emisora.bitrate ? `· ${emisora.bitrate} KBPS` : ""}
        </span>

        <span className="card-play"><Play size={19} fill="currentColor" /></span>
      </button>

      <div className="station-info">
        <div>
          <h3 title={emisora.name}>{emisora.name}</h3>
          <p>
            <MapPin size={13} />
            {emisora.state || "Colombia"} · {emisora.tags.split(",").slice(0, 2).join(", ") || "Radio"}
          </p>
          <p className={emisora.lastcheckok === 1 ? "station-status online" : "station-status offline"}>
            {emisora.lastcheckok === 1 ? "● Disponible según último chequeo" : "● Sin verificación reciente"}
          </p>
        </div>

        <button
          className={`heart-button ${favorita ? "is-favorite" : ""}`}
          onClick={onFavorita}
          aria-label={favorita ? "Quitar de favoritas" : "Agregar a favoritas"}
        >
          <Heart size={18} fill={favorita ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
