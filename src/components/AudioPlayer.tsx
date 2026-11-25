
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Radio, AlertCircle } from "lucide-react";
import type { Emisora } from "../services/radioApi";

interface Props {
    emisora: Emisora | null;
}

export default function AudioPlayer({ emisora }: Props) {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [reproduciendo, setReproduciendo] = useState(false);
    const [volumen, setVolumen] = useState(0.7);
    const [error, setError] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.removeAttribute("src");
        audio.load();

        setReproduciendo(false);
        setError(false);
    }, [emisora?.stationuuid]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volumen;
        }
    }, [volumen]);

    async function reproducir() {
        const audio = audioRef.current;
        if (!audio || !emisora) return;

        try {
            setError(false);

            if (!audio.src || audio.dataset.uuid !== emisora.stationuuid) {
                audio.src = emisora.url_resolved || emisora.url;
                audio.dataset.uuid = emisora.stationuuid;
            }

            await audio.play();
            setReproduciendo(true);
        } catch {
            setReproduciendo(false);
            setError(true);
        }
    }

    function pausar() {
        audioRef.current?.pause();
        setReproduciendo(false);
    }

    return (
        <>
            <audio
                ref={audioRef}
                preload="none"
                onPlaying={() => setReproduciendo(true)}
                onPause={() => setReproduciendo(false)}
                onError={() => {
                    setReproduciendo(false);
                    setError(true);
                }}
            />

            <div className="player">
                <div className="player-station">
                    <div className="player-cover">
                        {emisora?.favicon ? (
                            <img
                                src={emisora.favicon}
                                alt=""
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <Radio size={24} />
                        )}
                    </div>

                    <div>
                        <strong>{emisora?.name || "Radio Colombia"}</strong>
                        <span>
                            {emisora
                                ? `${emisora.state || "Colombia"} · ${emisora.tags || "Radio en vivo"}`
                                : "Selecciona una emisora"}
                        </span>
                    </div>
                </div>

                <div className="player-center">
                    <button
                        className="player-play"
                        disabled={!emisora}
                        onClick={reproduciendo ? pausar : reproducir}
                        aria-label={reproduciendo ? "Pausar" : "Reproducir"}
                    >
                        {reproduciendo
                            ? <Pause size={21} />
                            : <Play size={21} fill="currentColor" />}
                    </button>

                    <span>
                        {error
                            ? <><AlertCircle size={13} /> No se pudo reproducir esta emisora</>
                            : reproduciendo
                                ? "Reproduciendo en vivo"
                                : "En espera de reproducción"}
                    </span>
                </div>

                <div className="player-volume">
                    <Volume2 size={19} />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volumen}
                        onChange={(e) => setVolumen(Number(e.target.value))}
                        aria-label="Volumen"
                    />
                </div>
            </div>
        </>
    );
}
