import fs from "node:fs";
import path from "node:path";

import Image from "next/image";

import type { ImageZoneSpec } from "@/lib/image-zones";

/**
 * Emplacement d'image.
 *
 * Si le fichier attendu existe dans /public/images/, il est affiché. Sinon, un
 * cadre dessiné prend sa place et décrit le visuel à produire : la page reste
 * présentable, et ce qui manque se voit sans ouvrir le code.
 *
 * Le test d'existence se fait au rendu, côté serveur — déposer le fichier
 * suffit donc, sans toucher à une ligne de code.
 */
export function ImageZone({
  zone,
  className = "",
  priority = false,
}: {
  zone: ImageZoneSpec;
  className?: string;
  priority?: boolean;
}) {
  const relative = `/images/${zone.file}`;
  const exists = fs.existsSync(path.join(process.cwd(), "public", "images", zone.file));
  const ratio = `${zone.width} / ${zone.height}`;

  if (exists) {
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ aspectRatio: ratio }}>
        <Image
          src={relative}
          alt={zone.subject}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 600px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`cut-grid relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-dashed border-ink-300/70 bg-paper p-5 ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold tracking-wide text-white">
          Image {zone.id}
        </span>
        <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-500">
          {zone.width} × {zone.height} px
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold leading-snug text-ink">{zone.subject}</p>
        <p className="text-xs leading-relaxed text-ink-500">{zone.intent}</p>
        <p className="font-mono text-xs text-ink-300">public/images/{zone.file}</p>
      </div>
    </div>
  );
}
