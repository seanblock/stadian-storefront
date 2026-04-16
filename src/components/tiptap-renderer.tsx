export interface TiptapMark {
  type: "bold" | "italic" | "underline" | "strike" | "link";
  attrs?: { href?: string; target?: string };
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapDocument {
  type: "doc";
  content: TiptapNode[];
}

function renderMarks(text: string, marks?: TiptapMark[]) {
  if (!marks || marks.length === 0) return text;

  let element: React.ReactNode = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        element = <strong>{element}</strong>;
        break;
      case "italic":
        element = <em>{element}</em>;
        break;
      case "underline":
        element = <u>{element}</u>;
        break;
      case "strike":
        element = <s>{element}</s>;
        break;
      case "link":
        element = (
          <a
            href={mark.attrs?.href}
            target={mark.attrs?.target}
            rel={mark.attrs?.target === "_blank" ? "noopener noreferrer" : undefined}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {element}
          </a>
        );
        break;
    }
  }
  return element;
}

function renderNode(node: TiptapNode, index: number): React.ReactNode {
  switch (node.type) {
    case "text":
      return (
        <span key={index}>{renderMarks(node.text ?? "", node.marks)}</span>
      );

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const children = node.content?.map(renderNode);
      const styles: Record<number, string> = {
        1: "text-3xl font-bold",
        2: "text-2xl font-semibold mt-8",
        3: "text-xl font-semibold mt-6",
      };
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      return (
        <Tag key={index} className={styles[level]}>
          {children}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p key={index} className="text-muted-foreground leading-relaxed">
          {node.content?.map(renderNode)}
        </p>
      );

    case "bulletList":
      return (
        <ul
          key={index}
          className="list-disc space-y-1 pl-6 text-muted-foreground leading-relaxed"
        >
          {node.content?.map(renderNode)}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={index}
          className="list-decimal space-y-1 pl-6 text-muted-foreground leading-relaxed"
        >
          {node.content?.map(renderNode)}
        </ol>
      );

    case "listItem":
      return <li key={index}>{node.content?.map(renderNode)}</li>;

    case "hardBreak":
      return <br key={index} />;

    case "horizontalRule":
      return <hr key={index} className="my-6 border-border" />;

    default:
      return null;
  }
}

export function TiptapRenderer({ document }: { document: TiptapDocument }) {
  return (
    <div className="space-y-4">{document.content.map(renderNode)}</div>
  );
}
