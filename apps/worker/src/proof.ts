import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";
import type { ProofGenerationJob, ProofSnapshot } from "./jobs.js";

const width = 595.28, height = 841.89, margin = 48;
export const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

export function proofObjectKey(job: Pick<ProofGenerationJob, "tenantId" | "activityId" | "proofId" | "version">): string {
  if (![job.tenantId, job.activityId, job.proofId].every(value => /^[0-9a-z-]+$/i.test(value))) throw new Error("Proof identifiers contain unsafe characters");
  if (!Number.isInteger(job.version) || job.version < 1) throw new Error("Proof version must be a positive integer");
  return `tenants/${job.tenantId}/proofs/${job.activityId}/v${job.version}/${job.proofId}.pdf`;
}

const shownDate = (value?: string): string => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "Não informado";
const clipped = (value: string, max = 105): string => value.length <= max ? value : `${value.slice(0, max - 1)}…`;
function row(page: PDFPage, font: PDFFont, label: string, value: string, y: number): number {
  page.drawText(label.toUpperCase(), { x: margin, y, size: 7, font, color: rgb(.42, .47, .56) });
  page.drawText(clipped(value), { x: margin, y: y - 14, size: 10, font, color: rgb(.1, .14, .22) });
  return y - 37;
}
function validate(snapshot: ProofSnapshot): void {
  if (!snapshot.companyName || !snapshot.activityReference || !snapshot.address || !snapshot.driverName || !snapshot.completedAt) throw new Error("Proof snapshot is incomplete");
  if (Number.isNaN(new Date(snapshot.completedAt).getTime())) throw new Error("Proof completion date is invalid");
}

export async function buildProofPdf(job: ProofGenerationJob): Promise<Uint8Array> {
  validate(job.snapshot);
  const url = new URL(job.publicValidationUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Public validation URL must use HTTPS");
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const stableDate = new Date(job.snapshot.completedAt);
  pdf.setTitle(`Comprovante ${job.snapshot.activityReference}`); pdf.setAuthor("NAP Log");
  pdf.setCreator("NAP Log Worker"); pdf.setProducer("NAP Log Worker");
  pdf.setCreationDate(stableDate); pdf.setModificationDate(stableDate);
  const regular = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([width, height]);
  page.drawRectangle({ x: 0, y: height - 112, width, height: 112, color: rgb(.06, .11, .21) });
  page.drawText("NAP LOG", { x: margin, y: height - 51, size: 17, font: bold, color: rgb(.39, .58, 1) });
  page.drawText("COMPROVANTE DE OPERAÇÃO", { x: margin, y: height - 77, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Versão ${job.version}  •  ${job.snapshot.activityReference}`, { x: margin, y: height - 95, size: 8, font: regular, color: rgb(.72, .77, .86) });
  const qr = await QRCode.toBuffer(job.publicValidationUrl, { type: "png", errorCorrectionLevel: "M", margin: 1, width: 164 });
  page.drawImage(await pdf.embedPng(qr), { x: width - 148, y: height - 101, width: 82, height: 82 });
  let y = height - 146;
  y = row(page, bold, "Empresa", job.snapshot.companyDocument ? `${job.snapshot.companyName} · ${job.snapshot.companyDocument}` : job.snapshot.companyName, y);
  y = row(page, bold, "Atividade", job.snapshot.activityReference, y);
  if (job.snapshot.orderNumber) y = row(page, bold, "Pedido", job.snapshot.orderNumber, y);
  if (job.snapshot.invoiceNumber) y = row(page, bold, "Nota fiscal", job.snapshot.invoiceNumber, y);
  y = row(page, bold, "Endereço", job.snapshot.address, y);
  y = row(page, bold, "Motorista / veículo", `${job.snapshot.driverName} · ${job.snapshot.vehicleDescription}`, y);
  y = row(page, bold, "Chegada", shownDate(job.snapshot.arrivedAt), y);
  y = row(page, bold, "Conclusão", shownDate(job.snapshot.completedAt), y);
  if (job.snapshot.receiver) y = row(page, bold, "Recebedor (mascarado)", `${job.snapshot.receiver.nameMasked}${job.snapshot.receiver.documentMasked ? ` · ${job.snapshot.receiver.documentMasked}` : ""}`, y);
  page.drawText("TIMELINE RESUMIDA", { x: margin, y, size: 8, font: bold, color: rgb(.22, .36, .70) }); y -= 17;
  for (const event of job.snapshot.timeline.slice(0, 6)) { page.drawText(`${shownDate(event.at)}  ·  ${clipped(event.label, 70)}`, { x: margin, y, size: 8, font: regular, color: rgb(.2, .25, .34) }); y -= 13; }
  y -= 6; page.drawText("HASHES DE EVIDÊNCIA", { x: margin, y, size: 8, font: bold, color: rgb(.22, .36, .70) }); y -= 15;
  for (const hash of job.snapshot.evidenceHashes.slice(0, 8)) { page.drawText(clipped(hash, 80), { x: margin, y, size: 7, font: regular, color: rgb(.35, .4, .48) }); y -= 11; }
  page.drawText("Valide pelo QR Code. O QR não contém fotos nem dados pessoais.", { x: margin, y: 28, size: 7, font: regular, color: rgb(.45, .49, .56) });
  return pdf.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
}
