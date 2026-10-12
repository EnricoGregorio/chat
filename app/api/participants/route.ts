import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Desativa o cache do Vercel para esta rota especificamente.

export async function GET() {
  const roomName = "Chat-SalaPrincipal";
  
  // O RoomServiceClient precisa de HTTP/HTTPS, mas a variável de ambiente usa WSS.
  // Então substitui-se o 'wss://' por 'https://' dinamicamente.
  const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace('wss://', 'https://') || '';
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitHost || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Credenciais do LiveKit ausentes" }, { status: 500 });
  }

  try {
    const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
    const participants = await roomService.listParticipants(roomName);

    // Mapeia o resultado para extrair apenas o nome que a pessoa digitou.
    const names = participants.map(p => p.name || p.identity);

    return NextResponse.json({ participants: names });
  } catch (error) {
    // Se a sala estiver vazia e não existir no servidor ainda, o LiveKit pode retornar um erro.
    // Aqui captura esse erro e simplesmente informa que não há ninguém.
    return NextResponse.json({ participants: [] });
  }
}