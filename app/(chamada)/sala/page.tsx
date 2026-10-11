"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useEffect, useState } from 'react';
import Footer from "@/components/footer";


export default function SalaDeChamada() {
  const [token, setToken] = useState("");

  // Fixamos a sala e o usuário por enquanto para testar
  const room = "Chat-SalaPrincipal";
  const name = "Enrico"; 

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/token?room=${room}&username=${name}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error("Erro ao buscar o token:", e);
      }
    })();
  }, [room, name]);

  // Tela de "conectando".
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

  // Sala conectada.
  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      // Remove o estilo fixo e aplica as classes do Tailwind que de acordo com o tema.
      className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 font-sans"
    >
      {/* Por enquanto, mantém o componente padrão do LiveKit para não quebrar o vídeo */}
      <VideoConference />
      
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}