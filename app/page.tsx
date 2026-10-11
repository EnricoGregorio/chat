"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/footer";

export default function Home() {
  const [username, setUsername] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch('/api/participants');
        const data = await res.json();
        if (data.participants) {
          setParticipants(data.participants);
        }
      } catch (e) {
        console.error("Erro ao buscar participantes:", e);
      }
    };

    fetchParticipants();
    
    // Atualiza a lista a cada 10 segundos para quem deixar a tela aberta
    const interval = setInterval(fetchParticipants, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();

    // Verifica se não está vazio.
    if (!name) {
      setError("O nome é obrigatório.");
      return;
    }

    // Permite letras (com acentos), números, espaços, hífens e underlines.
    if (!/^[a-zA-ZÀ-ÿ0-9\-_ ]+$/.test(name)) {
      setError("Use apenas letras, números, espaços, - ou _.");
      return;
    }

    // Exige pelo menos uma letra, para bloquear "123", "---", "___", etc.
    if (!/[a-zA-ZÀ-ÿ]/.test(name)) {
      setError("O nome deve conter pelo menos uma letra.");
      return;
    }

    // Se passou em tudo, limpa o erro e entra na sala.
    setError("");
    router.push(`/sala?username=${encodeURIComponent(name)}`);
  };

  // Função para renderizar o texto dos participantes dinamicamente.
  const renderParticipantsText = () => {
    if (participants.length === 0) return "A sala está vazia.";
    if (participants.length === 1) return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{participants[0]}</span> está na call.</>;
    if (participants.length === 2) return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{participants[0]}</span> e <span className="font-semibold text-zinc-900 dark:text-zinc-100">{participants[1]}</span> estão na call.</>;
    return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{participants[0]}</span>, <span className="font-semibold text-zinc-900 dark:text-zinc-100">{participants[1]}</span> e mais <span className="font-semibold text-zinc-900 dark:text-zinc-100">{participants.length - 2}</span> estão na call.</>;
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      <ThemeToggle />

      <main className="flex flex-1 flex-col items-center justify-center p-6">
        
        {/* Logotipo Central */}
        <div className="mb-12 flex flex-col items-center">
          <div className="h-12 w-12 rotate-45 rounded-sm bg-red-700/90 dark:bg-red-600"></div>
          <span className="mt-8 text-3xl font-medium tracking-tight">Chat</span>
        </div>

        {/* Cartão de Entrada */}
        <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 md:flex-row">
          
          {/* Lado Esquerdo - Status */}
          <div className="flex w-full items-center justify-center bg-zinc-200/50 p-10 dark:bg-zinc-900/50 md:w-1/2">
            <p className="text-center text-lg text-zinc-700 dark:text-zinc-300">
              {renderParticipantsText()}
            </p>
          </div>

          {/* Lado Direito - Formulário */}
          <div className="flex w-full flex-col justify-center bg-white p-10 dark:bg-zinc-900 md:w-1/2">
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="Nome de usuário"
                  value={username}
                  maxLength={20} // Bloqueia em 20 caracteres.
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(""); // Esconde o erro automaticamente quando o usuário volta a digitar.
                  }}
                  // Muda a cor da borda para vermelho caso exista um erro.
                  className={`w-full rounded-xl border bg-transparent px-4 py-3.5 text-base outline-none transition-all placeholder:text-zinc-400 focus:ring-1 ${
                    error 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-500' 
                      : 'border-zinc-300 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-600'
                  }`}
                  required
                />
                {error && (
                  <span className="ml-1 text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-zinc-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
              >
                Entrar
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}