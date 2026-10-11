"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  GridLayout,
  ParticipantTile,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '@/components/footer';

// Componente de grade de vídeos.
function GradeDeVideos() {
  // O hook useTracks busca todas as câmeras e telas compartilhadas da sala.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    // O GridLayout organiza os quadrados de vídeo automaticamente.
    <GridLayout tracks={tracks} className="h-full w-full p-4">
      {/* O ParticipantTile é o quadrado individual de cada pessoa. */}
      <ParticipantTile className="rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800" />
    </GridLayout>
  );
}

// Layout customizado da sala.
function LayoutDaSala() {
  return (
    <div className="flex h-screen w-full flex-col">
      
      {/* Cabeçalho Customizado */}
      <header className="flex w-full items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 rotate-45 rounded-sm bg-red-700/90 dark:bg-red-600"></div>
          <span className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">Chat</span>
        </div>
      </header>

      {/* Área principal de vídeo */}
      <main className="flex-1 overflow-hidden">
        <GradeDeVideos />
      </main>

      {/* Barra de controles inferior */}
      <div className="flex justify-center pb-8 pt-4">
        {/* O ControlBar do LiveKit já traz os botões de Mutar, Câmera, Tela e Sair */}
        <ControlBar className="rounded-2xl bg-zinc-900 px-4 py-2 shadow-lg dark:bg-zinc-100" />
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