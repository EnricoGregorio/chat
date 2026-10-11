"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/footer";

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      // Navega para a sala passando o nome na URL
      router.push(`/sala?username=${encodeURIComponent(username)}`);
    }
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
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Fabricio</span> e <span className="font-semibold text-zinc-900 dark:text-zinc-100">Kalebe</span> estão na call.
            </p>
          </div>

          {/* Lado Direito - Formulário */}
          <div className="flex w-full flex-col justify-center bg-white p-10 dark:bg-zinc-900 md:w-1/2">
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3.5 text-base outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-zinc-900 px-4 py-3.5 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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