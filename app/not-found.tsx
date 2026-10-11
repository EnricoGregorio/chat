import Link from "next/link";
import Footer from "@/components/footer";

const getYear = new Date().getFullYear();

export default function NotFound() {
  return (
    // O min-h-screen e flex-col garantem que o rodapé fique sempre colado ao fundo da tela
    // dark:bg-zinc-950 e dark:text-zinc-100 para inverter as cores
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 font-sans">

      {/* Área Central */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">        
      
        {/* Logótipo em Losango */}
        <div className="mb-8 flex flex-col items-center">
          {/* O losango vermelho adapta ligeiramente a opacidade no modo escuro */}
          <div className="h-10 w-10 rotate-45 rounded-sm bg-red-700/80 dark:bg-red-600/90"></div>
          <span className="mt-6 text-2xl font-medium tracking-tight">Chat</span>
        </div>

        {/* Mensagem de Erro */}
       <h1 className="mb-2 text-3xl font-semibold">Página não encontrada</h1>
        <p className="mb-8 text-zinc-500 dark:text-zinc-400">
          A sala que você tentou acessar não existe ou está indisponível.
        </p>

        {/* Botão de Retorno (estilo escuro e arredondado) */}
        <Link
          href="/"
          className="rounded-xl bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Voltar para o início
        </Link>
      </main>

      {/* Rodapé fixo com Direitos de Autor */}
      <Footer />
    </div>
  );
}