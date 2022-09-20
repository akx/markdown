import * as MathJax from "@nteract/mathjax";
import { Source } from "@nteract/presentational-components";
import React from "react";
import ReactMarkdown from "react-markdown";

import AttachmentTransformer, {
  Attachments,
} from "./attachment/attachment-transformer";
import type { ReactMarkdownOptions } from "react-markdown/lib/react-markdown";
import type { CodeProps } from "react-markdown/lib/ast-to-react";
import type { ReactMarkdownProps } from "react-markdown/lib/complex-types";
import remarkMath from "remark-math";

interface ReactMarkdownV4Props extends Omit<ReactMarkdownOptions, 'children'> {
  readonly source?: string
}

interface MarkDownRenderProps extends ReactMarkdownV4Props {
  attachments?: Attachments;
}

const math = ({ children }: ReactMarkdownProps) => (
  <MathJax.Node>{String(children)}</MathJax.Node>
);

const inlineMath = ({ children }: ReactMarkdownProps) => (
  <MathJax.Node inline>{String(children)}</MathJax.Node>
);

// Borrowed from https://github.com/remarkjs/react-markdown#use-custom-components-syntax-highlight
const code = ({ node, inline, className, children, ...props }: React.PropsWithChildren<CodeProps>) => {
  const match = /language-(\w+)/.exec(className || '')
  if (!inline && match) {
    return <Source language={match[1]}>{String(children)}</Source>
  }
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const MarkdownRender = (props: MarkDownRenderProps) => {
  const newProps: ReactMarkdownOptions = {
    // https://github.com/rexxars/react-markdown#options
    ...props,
    className: `markdown-body ${props.className ?? ""}`,
    components: {
      code,
      // inlineMath,
      // math,
      ...props.components,
    },
    remarkPlugins: [remarkMath],
    // astPlugins: [AttachmentTransformer(props.attachments)].concat(props.astPlugins ? props.astPlugins : []),
    children: props.source ?? "",
  };
  return <ReactMarkdown {...newProps} />;
};

export default MarkdownRender;
