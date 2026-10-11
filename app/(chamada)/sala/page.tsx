"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '@/components/footer';

// Separamos a lógica principal em um subcomponente
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
      <VideoConference />
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