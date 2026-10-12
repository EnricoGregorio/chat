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
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useState, Suspense } from 'react';
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
      <div className="flex justify-center pb-8 pt-4 shrink-0">
        <ControlBar 
          className="rounded-2xl bg-white dark:bg-zinc-900 px-4 py-2 shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-800" 
          controls={{ microphone: true, camera: true, screenShare: true, chat: false, leave: true }}
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