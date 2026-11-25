
import { useEffect, useMemo, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import {
  Radio, Search, Home, Compass, Heart, Music2, Sun, Moon,
  MapPin, ChevronRight, Menu, RadioTower, Sparkles,
  LoaderCircle, AlertCircle
} from "lucide-react";

import TarjetaEmisora from "./components/TarjetaEmisora";
import EmisoraPage from "./pages/EmisoraPage";
import {
  obtenerEmisoras,
  obtenerUbicacionesRegistradas,
  obtenerGeneros,
  type Emisora,
} from "./services/radioApi";

import "./App.css";


function App() {
  const [dark, setDark] = useState(true);
  const [emisoras, setEmisoras] = useState<Emisora[]>([]);
  const navigate = useNavigate();
  const coincidencia = useMatch("/emisora/:uuid");
  const [busqueda, setBusqueda] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [genero, setGenero] = useState("");
  const [menu, setMenu] = useState("Inicio");
  const [favoritas, setFavoritas] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("radio-favoritas") || "[]");
    } catch {
      return [];
    }
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        setCargando(true);
        setError("");
        const resultado = await obtenerEmisoras(409);

        if (activo) {
          setEmisoras(resultado);
        }
      } catch {
        if (activo) {
          setError("No pudimos conectar con el catálogo. Intenta nuevamente.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("radio-favoritas", JSON.stringify(favoritas));
  }, [favoritas]);

  const departamentos = useMemo(
    () => obtenerUbicacionesRegistradas(emisoras),
    [emisoras]
  );

  const generos = useMemo(
    () => obtenerGeneros(emisoras),
    [emisoras]
  );



  const emisorasFiltradas = useMemo(() => {
    let resultado = [...emisoras];

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter((e) =>
        `${e.name} ${e.state} ${e.tags} ${e.language}`
          .toLowerCase()
          .includes(termino)
      );
    }

    if (departamento) {
      resultado = resultado.filter((e) => e.state === departamento);
    }

    if (genero) {
      resultado = resultado.filter((e) =>
        e.tags.toLowerCase().includes(genero.toLowerCase())
      );
    }


    if (menu === "Favoritas") {
      resultado = resultado.filter((e) =>
        favoritas.includes(e.stationuuid)
      );
    }

    return resultado;
  }, [emisoras, busqueda, departamento, genero, menu, favoritas]);

  function alternarFavorita(uuid: string) {
    setFavoritas((actuales) =>
      actuales.includes(uuid)
        ? actuales.filter((id) => id !== uuid)
        : [...actuales, uuid]
    );
  }

  function abrirEmisora(emisora: Emisora) {
    navigate(`/emisora/${emisora.stationuuid}`);
  }

  function irA(nombre: string) {
    setMenu(nombre);
    navigate("/");
  }

  function seleccionarGenero(valor: string) {
    setGenero(valor);
    setDepartamento("");
    irA("Explorar");
  }

  function limpiarFiltros() {
    setBusqueda("");
    setDepartamento("");
    setGenero("");
  }

  return (
    <div className={`app ${dark ? "dark" : "light"}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Radio size={25} /></div>
          <div>
            <h2>Radio<span>Colombia</span></h2>
            <small>EN VIVO</small>
          </div>
        </div>

        <div className="sidebar-label">MENÚ PRINCIPAL</div>
        <nav className="navigation">
          {[
            { name: "Inicio", icon: Home },
            { name: "Explorar", icon: Compass },
            { name: "Favoritas", icon: Heart },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-link ${!coincidencia && menu === name ? "active" : ""}`}
              onClick={() => {
                irA(name);
                if (name === "Inicio") limpiarFiltros();
              }}
            >
              <Icon size={19} /> {name}
            </button>
          ))}
        </nav>

        <div className="sidebar-label category-label">DESCUBRE MÚSICA</div>
        <div className="navigation">
          <button className="nav-link" onClick={() => {
            irA("Explorar");
            limpiarFiltros();
          }}>
            <Music2 size={19} /> Géneros musicales
          </button>
          <button className="nav-link" onClick={() => {
            irA("Explorar");
            setDepartamento("");
            setGenero("");
          }}>
            <MapPin size={19} /> Por ciudades
          </button>
        </div>

        <div className="sidebar-ad">
          <Sparkles size={22} />
          <strong>Tu marca aquí</strong>
          <p>Un espacio para conectar con miles de oyentes.</p>
          <button onClick={() => alert("Próximamente: información para anunciantes.")}>
            Anúnciate aquí <ChevronRight size={15} />
          </button>
        </div>

        <div className="sidebar-footer">
          <span className="live-dot" /> La radio de Colombia
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Menú">
            <Menu />
          </button>

          <div className="breadcrumb">
            Radio Colombia <span>/</span> {coincidencia ? "Emisora" : menu}
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={18} />
              <input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  irA("Explorar");
                }}
                placeholder="Buscar emisoras, ciudades..."
              />
            </div>
            <button
              className="theme-button"
              onClick={() => setDark(!dark)}
              aria-label="Cambiar tema"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        <div className="page-content">
          {coincidencia?.params.uuid ? (
            <EmisoraPage
              uuid={coincidencia.params.uuid}
              emisoras={emisoras}
              cargandoCatalogo={cargando}
              favoritas={favoritas}
              onFavorita={alternarFavorita}
              onAbrir={abrirEmisora}
            />
          ) : (
          <>
          {menu === "Inicio" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-tag">
                    <span className="live-dot" /> SONIDO COLOMBIANO, EN UN SOLO LUGAR
                  </div>
                  <h1>Colombia suena<br />mejor <span>contigo.</span></h1>
                  <p>
                    Descubre y escucha tus emisoras favoritas en vivo.
                    Toda la música, las noticias y la cultura de nuestro país.
                  </p>
                  <button className="hero-button" onClick={() => setMenu("Explorar")}>
                    <RadioTower size={19} /> Explorar emisoras
                    <ChevronRight size={17} />
                  </button>
                </div>

                <div className="hero-art">
                  <div className="sound-ring ring-one" />
                  <div className="sound-ring ring-two" />
                  <div className="hero-radio"><RadioTower size={100} /></div>
                  <div className="floating-note note-one">♫</div>
                  <div className="floating-note note-two">♪</div>
                  <div className="hero-caption">COLOMBIA ♥ EN VIVO</div>
                </div>
                <div className="hero-decoration">RC</div>
              </section>

              <section className="stats-row">
                <div><strong>{emisoras.length}</strong><span>Emisoras cargadas</span></div>
                <div><strong>{departamentos.length}</strong><span>Departamentos registrados</span></div>
                <div><strong>{generos.length}</strong><span>Etiquetas musicales</span></div>
                <div className="stat-live">
                  <span className="live-dot" />
                  <strong>COLOMBIA</strong>
                  <span>Radio en un solo lugar</span>
                </div>
              </section>

              <section className="section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">PARA EMPEZAR</div>
                    <h2>Emisoras destacadas</h2>
                    <p>Estaciones colombianas para descubrir.</p>
                  </div>
                  <button className="text-link" onClick={() => setMenu("Explorar")}>
                    Ver todas <ChevronRight size={17} />
                  </button>
                </div>

                {cargando ? (
                  <p className="loading-message">
                    <LoaderCircle className="spin" /> Cargando emisoras colombianas...
                  </p>
                ) : (
                  <div className="station-grid">
                    {emisoras.slice(0, 8).map((emisora) => (
                      <TarjetaEmisora
                        key={emisora.stationuuid}
                        emisora={emisora}
                        favorita={favoritas.includes(emisora.stationuuid)}
                        onSeleccionar={() => abrirEmisora(emisora)}
                        onFavorita={() => alternarFavorita(emisora.stationuuid)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="section genre-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">ENCUENTRA TU RITMO</div>
                    <h2>Explora por géneros</h2>
                    <p>Hay un sonido colombiano para cada momento.</p>
                  </div>
                </div>

                <div className="genre-grid">
                  {["Vallenato", "Salsa", "Urbana", "Popular", "Rock", "Noticias"].map((g, i) => (
                    <button
                      className={`genre-card ${["genre-yellow", "genre-red", "genre-purple", "genre-blue", "genre-green", "genre-orange"][i]}`}
                      key={g}
                      onClick={() => seleccionarGenero(g)}
                    >
                      <span>{["🪗", "💃", "🎧", "🎤", "🎸", "📰"][i]}</span>
                      <strong>{g}</strong>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="ad-banner">
                <div>
                  <span className="eyebrow">PUBLICIDAD</span>
                  <h2>Este espacio puede ser tuyo.</h2>
                  <p>Llega a oyentes de toda Colombia con tu marca o negocio.</p>
                </div>
                <button onClick={() => alert("Próximamente: información para anunciantes.")}>
                  Conoce más <ChevronRight size={17} />
                </button>
              </section>
            </>
          )}

          {menu !== "Inicio" && (
            <section className="section explore-page">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">RADIO COLOMBIA EN VIVO</div>
                  <h2>{menu === "Favoritas" ? "Mis emisoras favoritas" : "Explorar emisoras"}</h2>
                  <p>Encuentra tu estación favorita entre las emisoras colombianas.</p>
                </div>
              </div>

              <div className="filter-panel">
                <label>
                  Departamento / ubicación
                  <select value={departamento} onChange={(e) => {
                    setDepartamento(e.target.value);
                  }}>
                    <option value="">Todos los departamentos</option>
                    {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>



                <label>
                  Género / etiqueta
                  <select value={genero} onChange={(e) => setGenero(e.target.value)}>
                    <option value="">Todos los géneros</option>
                    {generos.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>

                <button className="clear-filters" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              </div>

              <div className="results-heading">
                <strong>{emisorasFiltradas.length} emisoras encontradas</strong>
                <span>Incluye emisoras temporalmente fuera de línea</span>
              </div>

              {cargando ? (
                <p className="loading-message">
                  <LoaderCircle className="spin" /> Cargando catálogo...
                </p>
              ) : emisorasFiltradas.length > 0 ? (
                <div className="station-grid">
                  {emisorasFiltradas.map((emisora) => (
                    <TarjetaEmisora
                      key={emisora.stationuuid}
                      emisora={emisora}
                      favorita={favoritas.includes(emisora.stationuuid)}
                      onSeleccionar={() => abrirEmisora(emisora)}
                      onFavorita={() => alternarFavorita(emisora.stationuuid)}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Radio size={40} />
                  <h3>No encontramos emisoras</h3>
                  <p>Prueba cambiando los filtros o el término de búsqueda.</p>
                  <button className="hero-button" onClick={limpiarFiltros}>
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </section>
          )}
          </>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={18} /> {error}
              <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
          )}

          <footer className="footer">
            <div className="footer-brand"><Radio size={19} /> Radio Colombia</div>
            <span>La radio que nos conecta.</span>
            <span>© 2026 Radio Colombia. Todos los derechos reservados.</span>
          </footer>
        </div>
      </main>

    </div>
  );
}

export default App;
