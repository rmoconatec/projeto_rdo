import { db } from "@/db";
import {
  rdos,
  obras,
  maoDeObra,
  equipamentos,
  atividades,
  ocorrencias,
  comentarios,
  anexos,
  materiais,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx";
import sizeOf from "image-size";
import fs from "fs/promises";
import path from "path";
import {
  CLIMA,
  CONDICAO,
  STATUS_ATIVIDADE,
  TIPO_OCORRENCIA,
  formatDate,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

const side = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const borders = {
  top: side,
  bottom: side,
  left: side,
  right: side,
  insideHorizontal: side,
  insideVertical: side,
};

function cell(text: string | null | undefined, bold = false) {
  return new TableCell({
    borders,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({ children: [new TextRun({ text: String(text ?? ""), bold, size: 18 })] }),
    ],
  });
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, color: "9A3412" })],
  });
}

function infoRow(label: string, value?: string | null) {
  return new TableRow({ children: [cell(label, true), cell(value || "—")] });
}

function table(headers: string[], rows: (string | null)[][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

function imageTypeFromUrl(url: string): "jpg" | "png" | "gif" | "bmp" {
  const ext = path.extname(url).toLowerCase();
  if (ext === ".png") return "png";
  if (ext === ".gif") return "gif";
  if (ext === ".bmp") return "bmp";
  return "jpg";
}

async function photosCell(urls: string[]): Promise<TableCell> {
  const pars: Paragraph[] = [];
  for (const url of urls) {
    try {
      const filePath = path.join(process.cwd(), "public", url);
      const buffer = await fs.readFile(filePath);
      const { width, height } = sizeOf(buffer);
      const maxW = 120;
      const scale = Math.min(1, maxW / ((width as number) || 1));
      const w = Math.round(((width as number) || 1) * scale * 9525);
      const h = Math.round(((height as number) || 1) * scale * 9525);
      pars.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new ImageRun({
              type: imageTypeFromUrl(url),
              data: buffer,
              transformation: { width: w, height: h },
            }),
          ],
        })
      );
    } catch {
      // skip
    }
  }
  if (pars.length === 0) {
    pars.push(new Paragraph({ children: [new TextRun({ text: "—", size: 18 })] }));
  }
  return new TableCell({ borders, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: pars });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rdoId = Number(id);

  const [rdo] = await db.select().from(rdos).where(eq(rdos.id, rdoId));
  if (!rdo) {
    return new Response("RDO não encontrado", { status: 404 });
  }
  const [obra] = await db.select().from(obras).where(eq(obras.id, rdo.obraId));
  const [mo, eqp, at, oc, co, an, mt] = await Promise.all([
    db.select().from(maoDeObra).where(eq(maoDeObra.rdoId, rdoId)),
    db.select().from(equipamentos).where(eq(equipamentos.rdoId, rdoId)),
    db.select().from(atividades).where(eq(atividades.rdoId, rdoId)),
    db.select().from(ocorrencias).where(eq(ocorrencias.rdoId, rdoId)),
    db
      .select()
      .from(comentarios)
      .where(eq(comentarios.rdoId, rdoId))
      .orderBy(asc(comentarios.createdAt)),
    db.select().from(anexos).where(eq(anexos.rdoId, rdoId)),
    db.select().from(materiais).where(eq(materiais.rdoId, rdoId)),
  ]);

  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: "Relatório Diário de Obra (RDO)", color: "C2410C" }),
      ],
    })
  );
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_2, text: obra?.nome || "Obra" })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `RDO #${rdo.numero} — ${formatDate(rdo.data)}   |   Status: ${
            rdo.status === "finalizado" ? "Finalizado" : "Rascunho"
          }`,
          bold: true,
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders,
      rows: [
        infoRow("Cliente", obra?.cliente),
        infoRow("Responsável", obra?.responsavel),
        infoRow("Endereço", obra?.endereco),
        infoRow("Início", formatDate(obra?.dataInicio)),
      ],
    })
  );

  children.push(h2("Condições Climáticas"));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [cell("Período", true), cell("Clima", true), cell("Condição", true)],
        }),
        ...(["Manha", "Tarde", "Noite"] as const).map((p) => {
          const cl = CLIMA[String(rdo[`clima${p}` as keyof typeof rdo] ?? "")]?.label ?? "—";
          const co = CONDICAO[String(rdo[`condicao${p}` as keyof typeof rdo] ?? "")] ?? "—";
          return new TableRow({
            children: [cell(p === "Manha" ? "Manhã" : p), cell(cl), cell(co)],
          });
        }),
      ],
    })
  );

  const totalEfetivo = mo.reduce((s: number, r: { quantidade: number | null }) => s + (r.quantidade || 0), 0);
  children.push(h2(`Mão de Obra (total: ${totalEfetivo})`));
  if (mo.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Não informado.", italics: true })] }));
  } else {
    children.push(
      table(
        ["Função", "Quantidade"],
        mo.map((r) => [r.funcao, `${r.quantidade} ${r.quantidade === 1 ? "pessoa" : "pessoas"}`])
      )
    );
  }

  children.push(h2("Equipamentos"));
  if (eqp.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Não informado.", italics: true })] }));
  } else {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders,
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Equipamento", true), cell("Qtd.", true), cell("Situação", true), cell("Fotos", true)] }),
          ...await Promise.all(eqp.map(async (r) =>
            new TableRow({ children: [cell(r.nome), cell(String(r.quantidade)), cell(r.situacao ?? "—"), await photosCell(Array.isArray(r.fotos) ? r.fotos : [])] })
          )),
        ],
      })
    );
  }

  children.push(h2("Atividades Executadas"));
  if (at.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Não informado.", italics: true })] }));
  } else {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders,
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Atividade", true), cell("Un.", true), cell("Total", true), cell("Exec.", true), cell("%", true), cell("Status", true), cell("Fotos", true)] }),
          ...await Promise.all(at.map(async (r) => {
            const t = r.quantidadeTotal || 0;
            const e = r.quantidadeExecutada || 0;
            const pct = t > 0 ? Math.round((e / t) * 100) : 0;
            return new TableRow({
              children: [
                cell(r.descricao),
                cell(r.unidade),
                cell(String(t)),
                cell(String(e)),
                cell(`${pct}%`),
                cell(STATUS_ATIVIDADE[String(r.status ?? "")]?.label ?? r.status ?? "—"),
                await photosCell(Array.isArray(r.fotos) ? r.fotos : []),
              ],
            });
          })),
        ],
      })
    );
  }

  children.push(h2("Controle de Materiais"));
  if (mt.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Não informado.", italics: true })] }));
  } else {
    children.push(
      table(
        ["Material", "Un.", "Chegada", "Utilizada", "Saldo"],
        mt.map((r) => [
          (r.nome || "") + (r.observacao ? ` (${r.observacao})` : ""),
          r.unidade,
          String(r.qtdEntrada),
          String(r.qtdUtilizada),
          String((r.qtdEntrada || 0) - (r.qtdUtilizada || 0)),
        ])
      )
    );
  }

  children.push(h2("Ocorrências"));
  if (oc.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Nenhuma ocorrência.", italics: true })] }));
  } else {
    oc.forEach((r) =>
      children.push(
        new Paragraph({ text: `• [${TIPO_OCORRENCIA[r.tipo] ?? r.tipo}] ${r.descricao}` })
      )
    );
  }

  children.push(h2("Observações Gerais"));
  children.push(new Paragraph({ text: rdo.observacoes || "Nenhuma observação." }));

  if (an.length) {
    children.push(h2("Anexos e Documentos"));
    an.forEach((a) => children.push(new Paragraph({ text: `📎 ${a.nome}` })));
  }

  if (co.length) {
    children.push(h2("Comentários"));
    co.forEach((c) => children.push(new Paragraph({ text: `${c.autor}: ${c.texto}` })));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Gerado em ${new Date().toLocaleString("pt-BR")}`,
          size: 16,
          color: "888888",
        }),
      ],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  const raw = obra?.nome || "obra";
  const ascii = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\- ]/g, "_");
  const filenameAscii = `RDO_${rdo.numero}_${ascii}.docx`;
  const filenameUtf8 = encodeURIComponent(`RDO_${rdo.numero}_${raw}.docx`);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filenameAscii}"; filename*=UTF-8''${filenameUtf8}`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
