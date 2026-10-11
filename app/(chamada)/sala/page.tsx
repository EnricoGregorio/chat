"use client";

import '@livekit/components-styles';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { useEffect, useState } from 'react';

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

  if (token === "") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-900 text-white">
        Conectando ao Chat...
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: '100vh', backgroundColor: '#18181b' }}
    >
      {/* O VideoConference monta a grade de webcams, telas compartilhadas e a barra de controles (mutar, tela, sair) */}
      <VideoConference />
      
      {/* O RoomAudioRenderer garante que o áudio das outras pessoas saia nas suas caixas de som */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}