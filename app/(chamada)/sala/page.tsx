"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  useTrackToggle,
  useMediaDeviceSelect,
  useDisconnectButton,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import { 
  Track,
  Participant,
} from 'livekit-client';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/footer";

const PASTEL_COLORS = [
  'bg-red-200', 'bg-orange-200', 'bg-amber-200', 'bg-yellow-200',
  'bg-lime-200', 'bg-green-200', 'bg-emerald-200', 'bg-teal-200',
  'bg-cyan-200', 'bg-sky-200', 'bg-blue-200', 'bg-indigo-200',
  'bg-violet-200', 'bg-purple-200', 'bg-fuchsia-200', 'bg-pink-200', 'bg-rose-200'
];

const EMOJIS = ['👽', '👾', '🤖', '👻', '🤠', '🐱', '🦊', '🐼', '🐨', '🦁', '🐸', '🐙', '🐢', '🦖', '🐳', '🦉', '🦦'];

// Novo WebcamItem recebendo o Participant
function WebcamItem({ participant, isSharing }: { participant: Participant, isSharing: boolean }) {
  const isSpeaking = participant.isSpeaking;
  const isCameraMuted = !participant.isCameraEnabled;
  const cameraPublication = participant.getTrackPublication(Track.Source.Camera);

  const hash = Array.from(participant.identity).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = PASTEL_COLORS[hash % PASTEL_COLORS.length];
  const emoji = EMOJIS[hash % EMOJIS.length];

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 aspect-video ${
        isSharing ? 'w-64' : 'w-full max-w-[90vw] sm:w-100 lg:w-150' 
      } ${isCameraMuted ? colorClass : 'bg-zinc-900'} ${
        isSpeaking 
          ? 'ring-4 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
          : 'ring-1 ring-zinc-200 dark:ring-zinc-800'
      }`}
    >
      {isCameraMuted ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-white/40 text-5xl backdrop-blur-md dark:bg-black/20 transition-all duration-300 ${
            isSpeaking ? 'scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'shadow-sm scale-100'
          }`}>
            {emoji}
          </div>
        </div>
      ) : (
        cameraPublication?.track && (
          <VideoTrack 
             trackRef={{
               participant: participant,
               publication: cameraPublication,
               source: Track.Source.Camera,
             }} 
             className="h-full w-full object-cover" 
           />
        )
      )}

      <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm z-10">
        {participant.name || participant.identity}
      </div>
    </div>
  );
}

// A propriedade 'isSharing' para serve para saber qual tamanho usar.
// baseada em Participantes e não mais em Tracks.
function WebcamsBar({ isSharing }: { isSharing: boolean }) {
  const participants = useParticipants();

  if (participants.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {participants.map((participant) => (
        <WebcamItem key={participant.identity} participant={participant} isSharing={isSharing} />
      ))}
    </div>
  );
}

// Componente da tela compartilhada.
function ScreenShareArea({ track }: { track: TrackReferenceOrPlaceholder }) {
  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 flex flex-col justify-center">
      <div className="relative w-full h-full max-h-[75vh] overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-200 dark:ring-zinc-800 bg-zinc-900">
        <VideoTrack trackRef={track as any} className="h-full w-full object-contain" />
      </div>
    </div>
  );
}

// Botão com menu dropdown para o microfone e câmera.
function BotaoDispositivo({ 
  source, 
  kind, 
  label, 
  iconOn, 
  iconOff 
}: { 
  source: Track.Source, 
  kind: 'audioinput' | 'videoinput', 
  label: string,
  iconOn: React.ReactNode,
  iconOff: React.ReactNode
}) {
  const { toggle, enabled } = useTrackToggle({ source: source as any });
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Removemos o dispositivo virtual "default" que duplica itens
  const dispositivosFiltrados = devices.filter(device => device.deviceId !== 'default');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCycleDevice = () => {
    if (dispositivosFiltrados.length > 1) { // Usa a lista filtrada
      const currentIndex = dispositivosFiltrados.findIndex(d => d.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % dispositivosFiltrados.length;
      setActiveMediaDevice(dispositivosFiltrados[nextIndex].deviceId);
    }
  };

  return (
    <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all" ref={menuRef}>
      
      {/* ... Botão Principal e Divisória continuam iguais ... */}
      <button 
        onClick={() => toggle()}
        className={`cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-l-xl transition-colors duration-200 ${
          enabled 
            ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800' 
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
        }`}
      >
        {enabled ? iconOn : iconOff}
        <span className="hidden sm:inline text-sm font-medium">{label}</span>
      </button>
      
      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>

      {/* Usa dispositivosFiltrados para checar se deve mostrar o botão de giro */}
      {dispositivosFiltrados.length > 1 && (
        <>
          <button 
            onClick={handleCycleDevice}
            className="cursor-pointer px-2 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 sm:hidden"
            title={`Trocar ${label}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 sm:hidden"></div>
        </>
      )}

      {/* ... Botão da Seta continua igual ... */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer px-2 py-2.5 rounded-r-xl transition-colors duration-200 ${
          isOpen ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lista Animada */}
      <div 
        className={`absolute bottom-[calc(100%+8px)] left-0 min-w-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-50 origin-bottom transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-2 py-1.5 mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Selecione {label === 'Câmera' ? 'a' : 'o'} {label}
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {/* O map usa os dispositivosFiltrados */}
          {dispositivosFiltrados.map((device, index) => (
            <button
              key={device.deviceId}
              onClick={() => {
                setActiveMediaDevice(device.deviceId);
                setIsOpen(false);
              }}
              className={`cursor-pointer w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                activeDeviceId === device.deviceId 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {/* Usa um fallback para o nome se a label vier vazia, removendo a necessidade de mostrar índices */}
              <span className="truncate pr-2">{device.label || `${label} ${index + 1}`}</span>
              {activeDeviceId === device.deviceId && (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          {dispositivosFiltrados.length === 0 && (
             <div className="px-3 py-2 text-sm text-zinc-500">Nenhum encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Botão para Saída de Áudio.
function BotaoSaidaAudio() {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind: 'audiooutput' });
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const dispositivosFiltrados = devices.filter(device => device.deviceId !== 'default');

  useEffect(() => {
    if (dispositivosFiltrados.length > 0 && !dispositivosFiltrados.some(d => d.deviceId === activeDeviceId)) {
      setActiveMediaDevice(dispositivosFiltrados[0].deviceId);
    }
  }, [dispositivosFiltrados, activeDeviceId, setActiveMediaDevice]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Removido o if(!isSupported) daqui
  if (devices.length === 0) return null;

  return (
    <div className="relative hidden sm:flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all" ref={menuRef}>

      {/* Botão Principal da Esquerda */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-l-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 text-zinc-900 dark:text-zinc-100"
        title="Saída de Áudio"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
        </svg>
        <span className="text-sm font-medium">Áudio</span>
      </button>

      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>

      {/* Botão Exclusivo da Seta */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer px-2 py-2.5 rounded-r-xl transition-colors duration-200 ${
          isOpen ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lista Animada */}
      <div 
        className={`absolute bottom-[calc(100%+8px)] left-0 min-w-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-50 origin-bottom transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-2 py-1.5 mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Saída de Áudio
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {/* Usa o array filtrado para não renderizar a opção "Padrão" */}
          {dispositivosFiltrados.map((device, index) => (
            <button
              key={device.deviceId}
              onClick={() => {
                setActiveMediaDevice(device.deviceId);
                setIsOpen(false);
              }}
              className={`cursor-pointer w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                activeDeviceId === device.deviceId 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span className="truncate pr-2">{device.label || `Saída ${index + 1}`}</span>
              {activeDeviceId === device.deviceId && (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Botão para compartilhar a tela.
function BotaoSimples({ 
  source,
  label,
  iconOn,
  iconOff,
  isDisabled,
  isOtherSharing
}: { 
  source: Track.Source, 
  label: string, 
  iconOn: React.ReactNode, 
  iconOff: React.ReactNode,
  isDisabled?: boolean,
  isOtherSharing?: boolean
}) {
  // Opções de áudio e vídeo dinamicamente caso a fonte seja o ScreenShare.
  const captureOpts = source === Track.Source.ScreenShare ? { audio: true, video: true } : undefined;

  const { toggle, enabled } = useTrackToggle({ 
    source: source as any, 
    captureOptions: captureOpts as any 
  });
  
  return (
    <button 
      onClick={isDisabled ? undefined : () => toggle()}
      disabled={isDisabled}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border rounded-xl shadow-sm transition-all duration-200 ${
        isDisabled
          ? 'opacity-40 bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-500 cursor-not-allowed'
          : enabled 
            ? 'cursor-pointer bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' 
            : 'cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      {isDisabled ? (
        // Ícone de Cadeado/Ocupado se outra pessoa estiver transmitindo
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ) : enabled ? iconOn : iconOff}
      <span className="hidden sm:inline text-sm font-medium">
        {isOtherSharing ? 'Em uso' : label}
      </span>
    </button>
  );
}

// Montagem da bara customizada.
function BarraDeControlesCustomizada({ 
  isOtherSharing, 
  isFullscreen, 
  onToggleFullscreen 
}: { 
  isOtherSharing: boolean, 
  isFullscreen: boolean, 
  onToggleFullscreen: () => void 
}) {
  const { buttonProps } = useDisconnectButton({}); // Hook para sair da sala.

  // Verifica se o navegador suporta troca de saída de áudio antes de montar o botão.
  const [isAudioOutputSupported, setIsAudioOutputSupported] = useState(false);
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isAppleBrowser = navigator.vendor && navigator.vendor.includes('Apple');
      setIsAudioOutputSupported(!isAppleBrowser);
    }
  }, []); // Hook para sair da sala.

  // Ícones SVG minimalistas (On/Off)
  const iconMicOn = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
  const iconMicOff = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
  const iconCamOn = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M22 8v8l-6-4.32V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2.32Z" /></svg>;
  const iconCamOff = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8l-2.08-2.082" /><path d="M16.95 16.95A2 2 0 0 1 14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 1.05-1.75" /><line x1="2" y1="2" x2="22" y2="22" /></svg>;
  const iconScreenOn = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m9 10 3-3 3 3" /><path d="M12 7v8" /><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M12 17v4" /><path d="M8 21h8" /></svg>;
  const iconScreenOff = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 17H4a2 2 0 0 1-2-2V5c0-1.5 1-2 1-2" /><path d="M22 15V5a2 2 0 0 0-2-2H9" /><path d="M8 21h8" /><path d="M12 17v4" /><line x1="2" y1="2" x2="22" y2="22" /></svg>;

  return (
    // Adicionado flex-wrap, max-w-[95vw] para limitar a largura da tela, e ajuste de gaps
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-white/55 dark:bg-zinc-900/55 p-2 rounded-2xl backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg w-full max-w-[95vw] sm:max-w-fit mx-auto overflow-visible">
      <BotaoDispositivo source={Track.Source.Microphone} kind="audioinput" label="Microfone" iconOn={iconMicOn} iconOff={iconMicOff} />

      {/* NOVO: Renderização Condicional - O componente (e seus hooks) NUNCA rodam no Safari */}
      {isAudioOutputSupported && <BotaoSaidaAudio />}

      <BotaoDispositivo source={Track.Source.Camera} kind="videoinput" label="Câmera" iconOn={iconCamOn} iconOff={iconCamOff} />
      
      {/* Botão de Tela Com Compartilhamento Unificado */}
      <BotaoSimples 
        source={Track.Source.ScreenShare} 
        label="Tela" 
        iconOn={iconScreenOn} 
        iconOff={iconScreenOff} 
        isDisabled={isOtherSharing} 
        isOtherSharing={isOtherSharing}
      />
      
      {/* Botão para Ativar/Desativar Tela Cheia */}
      <button 
        onClick={onToggleFullscreen}
        className="cursor-pointer flex items-center justify-center p-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all duration-200"
        title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
      >
        {isFullscreen ? (
          // Ícone de "Sair da Tela Cheia".
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          // Ícone de "Tela Cheia".
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        )}
      </button>

      <div className="hidden sm:block w-px h-8 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
      
      <button 
        onClick={buttonProps.onClick}
        className="cursor-pointer flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors font-medium ml-auto"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Sair<span className="hidden sm:inline"> da Sala</span></span>
      </button>
    </div>
  );
}

// Layout customizado da sala.
function LayoutDaSala() {
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const { localParticipant } = useLocalParticipant();

  const isSharingScreen = screenShareTracks.length > 0;
  
  // Descobre se outrem está compartilhando a tela.
  const isOtherSharing = screenShareTracks.some(
    (track) => track.participant.identity !== localParticipant?.identity
  );

  // Controle de Tela Cheia nativo / pseudo-fullscreen.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        if (!document.fullscreenElement) {
          // Usa await para forçar o browser a esperar a ativação
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      } else {
        // Fallback seguro para iOS
        setIsFullscreen(!isFullscreen);
      }
    } catch (err) {
      console.warn("Erro ao tentar gerenciar fullscreen:", err);
      // Fallback para CSS fullscreen (pseudo-fullscreen) caso a API nativa falhe
      setIsFullscreen(!isFullscreen);
    }
  };

  // Garante que o estado sincronize se o usuário sair do fullscreen pelo Esc do teclado.
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    // Se isFullscreen for true, fixa a div por cima de tudo
    <div className={`flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 ${
      isFullscreen ? 'fixed inset-0 z-100 h-screen w-screen' : 'h-screen w-full'
    }`}>
      
      {/* Cabeçalho que desaparece ao deitar no smartphone ou usar tela cheia */}
      {(!isFullscreen) && (
        <header className="relative flex w-full items-center justify-between px-6 py-4 sm:px-8 sm:py-6 shrink-0 landscape:hidden sm:landscape:flex z-50">
          
          <div className="flex-1 flex justify-start">
            <ThemeToggle />
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <div className="h-6 w-6 rotate-45 rounded-sm bg-red-700/90 dark:bg-red-600 shadow-sm"></div>
            <span className="text-xl font-medium tracking-tight">Chat</span>
          </div>

          <div className="flex-1 flex justify-end"></div>
          
        </header>
      )}

      {/* Área Principal */}
      <main className={`flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6 ${isSharingScreen ? 'justify-start' : 'justify-center'} ${isFullscreen ? 'pt-4' : ''}`}>
        
        {/* Encolhe e reestrutura webcams dependendo do modo */}
        <WebcamsBar isSharing={isSharingScreen} />

        {isSharingScreen && (
          <ScreenShareArea track={screenShareTracks[0]} />
        )}
      </main>

      {/* Barra de controles inferior */}
      <div className="flex justify-center pb-8 pt-4 shrink-0 relative z-50">
        <BarraDeControlesCustomizada 
          isOtherSharing={isOtherSharing} 
          isFullscreen={isFullscreen} 
          onToggleFullscreen={toggleFullscreen} 
        />
      </div>

    </div>
  );
}

function SalaContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");

  const room = "Chat";
  
  // Se o nome vier vazio ou nulo da URL, manda de volta para a Home.
  const name = searchParams.get("username");
  const router = useRouter();

  useEffect(() => {
    // Se o token já existe, interrompe a função imediatamente!
    if (token !== "") return;

    // Verifica se não está vazio.
    if (!name) {
      router.replace("/");
      return;
    }

    // Verifica se contém pelo menos uma letra E se possui apenas os caracteres permitidos.
    const isValidName = 
      name.length <= 20 && 
      /^[a-zA-ZÀ-ÿ0-9\-_ ]+$/.test(name) && 
      /[a-zA-ZÀ-ÿ]/.test(name);
    if (!isValidName) {
      router.replace("/");
      return;
    }

    // Exige pelo menos uma letra, para bloquear "123", "---", "___", etc.
    if (!/[a-zA-ZÀ-ÿ]/.test(name)) {
      router.replace("/");
      return;
    }

    (async () => {
      try {
        const resp = await fetch(`/api/token?room=${room}&username=${encodeURIComponent(name)}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error("Erro ao buscar o token:", e);
      }
    })();
  }, [room, name, router]);

  if (token === "") {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
        <main className="flex flex-1 items-center justify-center">
          <h1 className="text-3xl font-medium tracking-tight">Conectando</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={{ facingMode: "user" }}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      // Quando a conexão cair (seja pelo botão Sair ou queda de rede), o roteador nos manda para a Home.
      onDisconnected={() => router.push("/")}
      className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 font-sans"
    >
      <LayoutDaSala />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// O componente principal apenas encapsula a lógica com o Suspense obrigatório.
export default function SalaDeChamada() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 font-sans items-center justify-center">
        <h1 className="text-3xl font-medium tracking-tight">Carregando...</h1>
      </div>
    }>
      <SalaContent />
    </Suspense>
  );
}