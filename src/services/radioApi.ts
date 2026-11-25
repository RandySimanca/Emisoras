
const API = "https://de1.api.radio-browser.info/json";

export interface Emisora {
    stationuuid: string;
    name: string;
    url: string;
    url_resolved: string;
    homepage: string;
    favicon: string;
    tags: string;
    country: string;
    countrycode: string;
    state: string;
    language: string;
    votes: number;
    codec: string;
    bitrate: number;
    lastcheckok: number;
    lastcheckoktime_iso8601?: string;
    geo_lat?: number | null;
    geo_long?: number | null;
}

export interface FiltrosEmisoras {
    nombre?: string;
    departamento?: string;
    genero?: string;
    ciudad?: string;
    limite?: number;
    offset?: number;
}

async function consultar<T>(ruta: string): Promise<T> {
    const respuesta = await fetch(`${API}${ruta}`);

    if (!respuesta.ok) {
        throw new Error(`Error de Radio Browser: ${respuesta.status}`);
    }

    return respuesta.json();
}

// Catálogo colombiano. Incluye emisoras que pueden estar fuera de línea.
export async function obtenerEmisoras(
    limite = 409,
    offset = 0
): Promise<Emisora[]> {
    const parametros = new URLSearchParams({
        countrycode: "CO",
        limit: String(limite),
        offset: String(offset),
        order: "votes",
        reverse: "true",
        hidebroken: "false",
    });

    return consultar<Emisora[]>(
        `/stations/search?${parametros.toString()}`
    );
}

// Búsqueda combinada por nombre, departamento y género.
export async function buscarEmisoras(
    filtros: FiltrosEmisoras
): Promise<Emisora[]> {
    const parametros = new URLSearchParams({
        countrycode: "CO",
        limit: String(filtros.limite ?? 409),
        offset: String(filtros.offset ?? 0),
        order: "votes",
        reverse: "true",
        hidebroken: "false",
    });

    if (filtros.nombre?.trim()) {
        parametros.set("name", filtros.nombre.trim());
    }

    if (filtros.departamento?.trim()) {
        parametros.set("state", filtros.departamento.trim());
    }

    if (filtros.genero?.trim()) {
        parametros.set("tag", filtros.genero.trim());
    }

    return consultar<Emisora[]>(
        `/stations/search?${parametros.toString()}`
    );
}

// Obtener los departamentos que aparecen en el catálogo consultado.
// Obtener las ubicaciones que Radio Browser tiene registradas.
// No necesariamente son departamentos oficiales.
export function obtenerUbicacionesRegistradas(
    emisoras: Emisora[]
): string[] {
    return [...new Set(
        emisoras
            .map((emisora) => emisora.state?.trim())
            .filter((ubicacion): ubicacion is string => Boolean(ubicacion))
    )].sort((a, b) => a.localeCompare(b, "es"));
}

// Obtener los géneros registrados.
export function obtenerGeneros(emisoras: Emisora[]): string[] {
    const generos = emisoras.flatMap((emisora) =>
        emisora.tags
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)
    );

    return [...new Set(generos)].sort((a, b) =>
        a.localeCompare(b, "es")
    );
}

// Registrar una reproducción en Radio Browser.
export async function registrarEscucha(uuid: string): Promise<void> {
    try {
        await consultar<unknown>(`/url/${encodeURIComponent(uuid)}`);
    } catch (error) {
        console.warn("No se pudo registrar la escucha:", error);
    }
}

// Consultar una emisora puntual (para enlaces directos a /emisora/:uuid).
export async function obtenerEmisoraPorUuid(uuid: string): Promise<Emisora | null> {
    const lista = await consultar<Emisora[]>(
        `/stations/byuuid/${encodeURIComponent(uuid)}`
    );

    return lista[0] ?? null;
}
