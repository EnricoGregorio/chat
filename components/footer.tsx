export default function Footer() {
  const getYear = new Date().getFullYear();

  return (
    <footer className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
        <p className="font-bold">&copy; {getYear} Enrico Sobrinho Gregório. Todos os direitos reservados.</p>
      </footer>
  );
}
