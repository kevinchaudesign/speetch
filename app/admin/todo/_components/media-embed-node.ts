/**
 * MediaEmbed — node Tiptap custom qui rend <img>, <video> ou <audio>
 * selon l'attribut `kind`. Stockage HTML standard pour la portabilité :
 *   <img data-media-kind="image" src="…" alt="…" />
 *   <video data-media-kind="video" src="…" controls></video>
 *   <audio data-media-kind="audio" src="…" controls></audio>
 *
 * Tiptap garde le control de l'insertion (chain commands) et la
 * serialization HTML (toHTML / parseHTML).
 */

import { Node, mergeAttributes } from "@tiptap/core";

export type MediaKind = "image" | "video" | "audio";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mediaEmbed: {
      insertMediaEmbed: (opts: {
        src: string;
        kind: MediaKind;
        alt?: string;
        filename?: string;
      }) => ReturnType;
    };
  }
}

export const MediaEmbed = Node.create({
  name: "mediaEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      kind: { default: "image" as MediaKind },
      alt: { default: null },
      filename: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[data-media-kind]",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return {
            src: e.getAttribute("src"),
            kind: (e.getAttribute("data-media-kind") as MediaKind) ?? "image",
            alt: e.getAttribute("alt"),
            filename: e.getAttribute("data-filename"),
          };
        },
      },
      {
        tag: "video[data-media-kind]",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return {
            src: e.getAttribute("src"),
            kind: "video" as const,
            filename: e.getAttribute("data-filename"),
          };
        },
      },
      {
        tag: "audio[data-media-kind]",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return {
            src: e.getAttribute("src"),
            kind: "audio" as const,
            filename: e.getAttribute("data-filename"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const kind = (node.attrs.kind as MediaKind) ?? "image";
    const baseAttrs = mergeAttributes(HTMLAttributes, {
      "data-media-kind": kind,
      "data-filename": node.attrs.filename ?? undefined,
    });
    if (kind === "video") {
      return [
        "video",
        {
          ...baseAttrs,
          src: node.attrs.src,
          controls: "true",
          preload: "metadata",
          playsinline: "true",
        },
      ];
    }
    if (kind === "audio") {
      return [
        "audio",
        {
          ...baseAttrs,
          src: node.attrs.src,
          controls: "true",
          preload: "metadata",
        },
      ];
    }
    return [
      "img",
      {
        ...baseAttrs,
        src: node.attrs.src,
        alt: node.attrs.alt ?? node.attrs.filename ?? "",
        loading: "lazy",
        decoding: "async",
      },
    ];
  },

  addCommands() {
    return {
      insertMediaEmbed:
        ({ src, kind, alt, filename }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src, kind, alt: alt ?? null, filename: filename ?? null },
          });
        },
    };
  },
});
