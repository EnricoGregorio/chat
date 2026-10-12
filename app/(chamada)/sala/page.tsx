"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  useIsMuted,
  useIsSpeaking,
  useTrackToggle,
  useMediaDeviceSelect,
  useDisconnectButton,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
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

//  Item individual da webcam.
function WebcamItem({ trackRef, isSharing }: { trackRef: TrackReferenceOrPlaceholder, isSharing: boolean }) {
  const participant = trackRef.participant;
  
  // O hook  prefere receber a referência da track.
  const isCameraMuted = useIsMuted(trackRef);

  // Hook para detectar se o usuário está falando.
  const isSpeaking = useIsSpeaking(participant);

  // Gera o Hash único baseado no nome para escolher a cor e o emoji.
  const hash = Array.from(participant.identity).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = PASTEL_COLORS[hash % PASTEL_COLORS.length];
  const emoji = EMOJIS[hash % EMOJIS.length];

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 aspect-video ${
        isSharing ? 'w-64' : 'w-160' 
      } ${isCameraMuted ? colorClass : 'bg-zinc-900'} ${
        // Lógica da borda verde: Se estiver falando, coloca a borda verde grossa e um brilho (glow) verde.
        isSpeaking 
          ? 'ring-4 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
          : 'ring-1 ring-zinc-200 dark:ring-zinc-800'
      }`}
    >
      {isCameraMuted ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-white/40 text-5xl backdrop-blur-md dark:bg-black/20 transition-all duration-300 ${
            // Faz o avatar pulsar levemente quando fala e a câmera está desligada.
            isSpeaking ? 'scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'shadow-sm scale-100'
          }`}>
            {emoji}
          </div>
        </div>
      ) : (
        // A câmera real (se não estiver mutado)
        // Checa se trackRef.publication e trackRef.participant existem
        // e faz um "Type Assertion" para forçar o TypeScript a aceitar.
        trackRef.publication && (
          <VideoTrack 
            trackRef={trackRef as any} 
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
function WebcamsBar({ tracks, isSharing }: { tracks: TrackReferenceOrPlaceholder[], isSharing: boolean }) {
  if (tracks.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {tracks.map((trackRef) => (
        // Chama o componente individual.
        <WebcamItem key={trackRef.participant.identity} trackRef={trackRef} isSharing={isSharing} />
      ))}
    </div>
  );
}

// Componente da tela compartilhada.
function ScreenShareArea({ track }: { track: TrackReferenceOrPlaceholder }) {
  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 flex flex-col justify-center">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-200 dark:ring-zinc-800 bg-zinc-900">
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

  // Fecha o popup de forma inteligente se o usuário clicar fora dele.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all" ref={menuRef}>
      
      {/* Botão Principal de Ligar/Desligar */}
      <button 
        onClick={() => toggle()}
        className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-l-xl transition-colors duration-200 ${
          enabled 
            ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800' 
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
        }`}
      >
        {enabled ? iconOn : iconOff}
        <span className="text-sm font-medium">{label}</span>
      </button>
      
      {/* Divisória sutil */}
      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>

      {/* Botão da Seta com Rotação Suave */}
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

      {/* Lista de Opções Animada com Fundo Sólido */}
      <div 
        className={`absolute bottom-[calc(100%+8px)] left-0 min-w-65 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-50 origin-bottom transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-2 py-1.5 mb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Selecione {label === 'Câmera' ? 'a' : 'o'} {label}
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {devices.map(device => (
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
              <span className="truncate pr-2">{device.label || 'Dispositivo Padrão'}</span>
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
function BotaoSimples({ source, label, iconOn, iconOff }: { source: Track.Source, label: string, iconOn: React.ReactNode, iconOff: React.ReactNode }) {
  const { toggle, enabled } = useTrackToggle({ source: source as any });
  
  return (
    <button 
      onClick={() => toggle()}
      className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all duration-200 ${
        enabled 
          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' 
          : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      {enabled ? iconOn : iconOff}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// Montagem da bara customizada.
function BarraDeControlesCustomizada() {
  const { buttonProps } = useDisconnectButton({}); // Hook para sair da sala.

  // Ícones SVG minimalistas (On/Off)
const iconMicOn = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
  
  const iconMicOff = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );

  const iconCamOn = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8v8l-6-4.32V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2.32Z" />
    </svg>
  );
  
  const iconCamOff = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8l-2.08-2.082" />
      <path d="M16.95 16.95A2 2 0 0 1 14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 1.05-1.75" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

  const iconScreenOn = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 10 3-3 3 3" />
      <path d="M12 7v8" />
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  );
  
  const iconScreenOff = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 17H4a2 2 0 0 1-2-2V5c0-1.5 1-2 1-2" />
      <path d="M22 15V5a2 2 0 0 0-2-2H9" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

  return (
    <div className="flex items-center gap-4 bg-white/50 dark:bg-zinc-900/50 p-2 rounded-2xl backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg">
      <BotaoDispositivo source={Track.Source.Microphone} kind="audioinput" label="Microfone" iconOn={iconMicOn} iconOff={iconMicOff} />
      <BotaoDispositivo source={Track.Source.Camera} kind="videoinput" label="Câmera" iconOn={iconCamOn} iconOff={iconCamOff} />
      <BotaoSimples source={Track.Source.ScreenShare} label="Tela" iconOn={iconScreenOn} iconOff={iconScreenOff} />
      
      <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
      
      {/* Botão de Sair Customizado */}
      <button 
        onClick={buttonProps.onClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors font-medium ml-auto cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sair da Sala
      </button>
    </div>
  );
}

// Layout customizado da sala.
function LayoutDaSala() {
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const isSharingScreen = screenShareTracks.length > 0;

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Cabeçalho */}
      <header className="relative flex w-full items-center justify-center px-8 py-6 shrink-0">
        <div className="absolute left-8">
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 rotate-45 rounded-sm bg-red-700/90 dark:bg-red-600 shadow-sm"></div>
          <span className="text-xl font-medium tracking-tight">Chat</span>
        </div>
      </header>

      {/* Área Principal */}
      <main className={`flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-6 ${isSharingScreen ? 'justify-start' : 'justify-center'}`}>
        
        {/* Passa a informação de compartilhamento de tela, para encolher as webcams */}
        <WebcamsBar tracks={cameraTracks} isSharing={isSharingScreen} />

        {isSharingScreen && (
          <ScreenShareArea track={screenShareTracks[0]} />
        )}
      </main>

      {/* Barra de controles inferior */}
      <div className="flex justify-center pb-8 pt-4 shrink-0 relative z-50">
        <BarraDeControlesCustomizada />
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
      video={true}
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