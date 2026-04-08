// source.config.ts
import { defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
var { docs, meta } = defineDocs({
  dir: "../docs/content",
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true
    }
  },
  meta: {
    schema: metaSchema
  }
});
export {
  docs,
  meta
};
