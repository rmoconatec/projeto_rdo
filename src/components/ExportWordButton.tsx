"use client";

import { useState } from "react";

type SaveFileHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SaveFileHandle>;
};

export default function ExportWordButton({ rdoId }: { rdoId: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const url = `/api/rdos/${rdoId}/export-docx`;

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (loading) return;

    const suggestedName = `RDO_${rdoId}.docx`;
    const win = window as WindowWithSavePicker;

    setMessage(null);
    setLoading(true);

    try {
      // IMPORTANTE: o seletor precisa ser aberto imediatamente após o clique.
      // Se fizer fetch antes, o navegador pode bloquear a janela "Salvar como".
      if (typeof win.showSaveFilePicker === "function") {
        let handle: SaveFileHandle;
        try {
          handle = await win.showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: "Documento Word (.docx)",
                accept: {
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                },
              },
            ],
          });
        } catch (err) {
          // Usuário cancelou a janela de salvar.
          if ((err as { name?: string })?.name === "AbortError") {
            setMessage(null);
            return;
          }
          throw err;
        }

        setMessage("Gerando arquivo Word...");
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao gerar o relatório Word.");
        const blob = await res.blob();
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setMessage("Arquivo Word salvo com sucesso.");
        return;
      }

      // Fallback para navegadores sem showSaveFilePicker (Firefox/Safari):
      // dispara um download normal do arquivo .docx.
      setMessage("Seu navegador não abre 'Salvar como' via web. Iniciando download...");
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("ExportWordButton error:", err);
      setMessage("Erro ao exportar. Abrindo download direto...");
      window.setTimeout(() => {
        window.location.href = url;
      }, 150);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-block rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
      >
        {loading ? "Gerando Word..." : "📄 Exportar Word"}
      </button>
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </span>
  );
}
