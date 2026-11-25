import { useEffect, useRef, useState } from "react";
import {
  AlertCircle, Heart, Pause, Play, Radio, Share2, ThumbsUp, Volume2, VolumeX,
} from "lucide-react";
import { registrarEscucha, type Emisora } from "../services/radioApi";

interface Props {
  emisora: Emisora;
  favorita: boolean;
  onFavorita: () => void;
}

export default function ReproductorTarjeta({ emisora, favorita, onFavorita }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [reproduciendo, setReproduciendo] = useState(false);
  const [volumen, setVolumen] = useState(0.7);
  const [silenciado, setSilenciado] = useState(false);
  const [error, setError] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const etiquetas = emisora.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  async function reproducir(automatico = false) {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setError(false);

      if (!audio.getAttribute("src")) {
        audio.src = emisora.url_resolved || emisora.url;
        void registrarEscucha(emisora.stationuuid);
      }

      await audio.play();
      setReproduciendo(true);
    } catch (e) {
      const nombre = e instanceof DOMException ? e.name : "";

      // Cambiar de página o de emisora interrumpe el play(): no es un fallo real.
      if (nombre === "AbortError") return;

      setReproduciendo(false);

      // Si el navegador bloquea el inicio automático, se espera al botón de play.
      if (automatico && nombre === "NotAllowedError") return;

      setError(true);
    }
  }

  function pausar() {
    audioRef.current?.pause();
    setReproduciendo(false);
  }

  // Al abrir la página intenta reproducir; al salir corta la transmisión.
  useEffect(() => {
    const audio = audioRef.current;
    void reproducir(true);

    return () => {
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emisora.stationuuid]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volumen;
  }, [volumen]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = silenciado;
  }, [silenciado]);

  async function compartir() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: emisora.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      // El usuario canceló el diálogo de compartir.
    }
  }

  const estado = error
    ? null
    : reproduciendo
      ? "Reproduciendo en vivo"
      : "En pausa";

  return (
    <div className="station-card-player">
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onError={(e) => {
          if (!e.currentTarget.getAttribute("src")) return;
          setReproduciendo(false);
          setError(true);
        }}
      />

      <div className="scp-top">
        <div className="scp-cover">
          {emisora.favicon ? (
            <img
              src={emisora.favicon}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Radio size={46} strokeWidth={1.4} />
          )}
        </div>

        <div className="scp-meta">
          <span className="scp-place">
            {emisora.state || "Colombia"}
            {emisora.bitrate ? ` · ${emisora.codec || "Radio"} ${emisora.bitrate} kbps` : ""}
          </span>
          <h1 title={emisora.name}>{emisora.name}</h1>
          {etiquetas.length > 0 && (
            <div className="scp-tags">
              {etiquetas.map((t) => <span key={t}>{t}</span>)}
            </div>
          )}
        </div>

        <div className="scp-votes" title="Votos en Radio Browser">
          <ThumbsUp size={14} /> {emisora.votes}
        </div>
      </div>

      <div className="scp-controls">
        <div className="scp-actions">
          <button onClick={compartir} aria-label="Compartir emisora" title="Compartir">
            <Share2 size={20} />
          </button>
          <button
            className={favorita ? "is-favorite" : ""}
            onClick={onFavorita}
            aria-label={favorita ? "Quitar de favoritas" : "Agregar a favoritas"}
            title="Favorita"
          >
            <Heart size={20} fill={favorita ? "currentColor" : "none"} />
          </button>
        </div>

        <button
          className="scp-play"
          onClick={reproduciendo ? pausar : () => reproducir()}
          aria-label={reproduciendo ? "Pausar" : "Reproducir"}
        >
          {reproduciendo
            ? <Pause size={34} fill="currentColor" />
            : <Play size={34} fill="currentColor" />}
        </button>

        <div className="scp-volume">
          <button
            onClick={() => setSilenciado((s) => !s)}
            aria-label={silenciado ? "Activar sonido" : "Silenciar"}
          >
            {silenciado || volumen === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volumen}
            onChange={(e) => {
              setVolumen(Number(e.target.value));
              setSilenciado(false);
            }}
            aria-label="Volumen"
          />
        </div>
      </div>

      <p className={`scp-status ${error ? "is-error" : ""}`}>
        {error ? (
          <><AlertCircle size={14} /> No se pudo reproducir esta emisora. Prueba con otra de la lista.</>
        ) : copiado ? (
          "Enlace copiado"
        ) : (
          estado
        )}
      </p>
    </div>
  );
}
