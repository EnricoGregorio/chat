import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Extrai os parâmetros da URL.
    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');
    const username = searchParams.get('username');

    // Validação básica.
    if (!room || !username) {
        return NextResponse.json(
            { error: 'Faltam os parâmetros "room" e "username"' },
            { status: 400 }
        );
    }

    // Chaves de acesso.
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // Cria a identidade do usuário.
    const at = new AccessToken(apiKey, apiSecret, {
        identity: username, // ID único do usuário.
        name: username,     // Nome de exebição na chamada.
    });

    // Concede permissões.
    at.addGrant({
        roomJoin: true,
        room: room,
        canPublish: true,   // Permite abrir câmera/microfone.
        canSubscribe: true, // Permite ver os outros.
    })

    // Gera o JWT.
    const token = await at.toJwt();

    return NextResponse.json({ token });
}
