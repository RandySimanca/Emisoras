import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ExternalLink, LoaderCircle } from "lucide-react";

import ReproductorTarjeta from "../components/ReproductorTarjeta";
import TarjetaEmisora from "../components/TarjetaEmisora";
import { obtenerEmisoraPorUuid, type Emisora } from "../services/radioApi";

interface Props {
  uuid: string;
  emisoras: Emisora[];
  cargandoCatalogo: boolean;
  favoritas: string[];
  onFavorita: (uuid: string) => void;
  onAbrir: (emisora: Emisora) => void;
}

export default function EmisoraPage({
  uuid,
  emisoras,
  cargandoCatalogo,
  favoritas,
  onFavorita,
  onAbrir,
}: Props) {
  const delCatalogo = useMemo(
    () => emisoras.find((e) => e.stationuuid === uuid) ?? null,
    [emisoras, uuid]
  );

  // Respaldo para enlaces directos a emisoras que no están en el catálogo cargado.
  const [remota, setRemota] = useState<Emisora | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (delCatalogo || cargandoCatalogo) return;

    let activo = true;

    async function buscar() {
      try {
        setBuscando(true);
        const resultado = await obtenerEmisoraPorUuid(uuid);
        if (activo) setRemota(resultado);
      } catch {
        if (activo) setRemota(null);
      } finally {
        if (activo) setBuscando(false);
      }
    }

    buscar();

    return () => {
      activo = false;
    };
  }, [uuid, delCatalogo, cargandoCatalogo]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [uuid]);

  const emisora =
    delCatalogo ?? (remota?.stationuuid === uuid ? remota : null);

  const relacionadas = useMemo(() => {
    if (!emisora) return [];

    const etiquetas = new Set(
      emisora.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    );

    return emisoras
      .filter((e) => e.stationuuid !== emisora.stationuuid)
      .map((e) => {
        let puntos = emisora.state && e.state === emisora.state ? 1 : 0;
        for (const t of e.tags.split(",")) {
          if (etiquetas.has(t.trim().toLowerCase())) puntos += 2;
        }
        return { e, puntos };
      })
      .filter((x) => x.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 8)
      .map((x) => x.e);
  }, [emisoras, emisora]);

  if (!emisora) {
    return (
      <section className="section station-page">
        {cargandoCatalogo || buscando ? (
          <p className="loading-message">
            <LoaderCircle className="spin" /> Cargando emisora...
          </p>
        ) : (
          <div className="empty-state">
            <AlertCircle size={40} />
            <h3>No encontramos esta emisora</h3>
            <p>Puede que ya no esté disponible en el catálogo.</p>
            <Link className="hero-button" to="/">Volver al catálogo</Link>
          </div>
        )}
      </section>
    );
  }

  const etiquetas = emisora.tags.split(",").map((t) => t.trim()).filter(Boolean);

  const detalles: [string, string][] = [
    ["Ubicación", emisora.state || "Colombia"],
    ["Idioma", emisora.language || "No registrado"],
    [
      "Formato",
      emisora.codec
        ? `${emisora.codec}${emisora.bitrate ? ` · ${emisora.bitrate} kbps` : ""}`
        : "No registrado",
    ],
    ["Votos", String(emisora.votes)],
  ];

  return (
    <section className="station-page">
      <nav className="station-breadcrumb" aria-label="Ruta">
        <Link to="/"><ArrowLeft size={15} /> Emisoras</Link>
        {emisora.state && (<><span>/</span><span>{emisora.state}</span></>)}
        <span>/</span>
        <strong>{emisora.name}</strong>
      </nav>

      <div className="station-hero">
        <ReproductorTarjeta
          key={emisora.stationuuid}
          emisora={emisora}
          favorita={favoritas.includes(emisora.stationuuid)}
          onFavorita={() => onFavorita(emisora.stationuuid)}
        />
      </div>

      {relacionadas.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">SEGUIR ESCUCHANDO</div>
              <h2>Emisoras relacionadas</h2>
              <p>Del mismo lugar o con géneros parecidos.</p>
            </div>
          </div>

          <div className="station-grid">
            {relacionadas.map((e) => (
              <TarjetaEmisora
                key={e.stationuuid}
                emisora={e}
                favorita={favoritas.includes(e.stationuuid)}
                onSeleccionar={() => onAbrir(e)}
                onFavorita={() => onFavorita(e.stationuuid)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="station-about">
        <h2>Sobre {emisora.name}</h2>

        {etiquetas.length > 0 && (
          <div className="scp-tags">
            {etiquetas.map((t) => <span key={t}>{t}</span>)}
          </div>
        )}

        <dl className="station-details">
          {detalles.map(([titulo, valor]) => (
            <div key={titulo}>
              <dt>{titulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>

        {emisora.homepage && (
          <a
            className="station-site"
            href={emisora.homepage}
            target="_blank"
            rel="noreferrer noopener"
          >
            Sitio web de la emisora <ExternalLink size={15} />
          </a>
        )}
      </section>
    </section>
  );
}
