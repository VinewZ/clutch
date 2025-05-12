import * as api from "@vinewz/clutch-api"
import { useState, useEffect } from "react";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
});


const client = createClient(api.ExtensionsService, transport);

export function useExtension(path: string) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const chunks: Uint8Array[] = [];
        for await (const res of client.getExtension({ extensionName: path })) {
          chunks.push(res.data);
        }
        // Decode chunks to a single string
        const decoder = new TextDecoder();
        let content = "";
        for (const c of chunks) {
          content += decoder.decode(c, { stream: true });
        }
        content += decoder.decode();  // flush
        if (!cancelled) setHtmlContent(content);
      } catch (err: any) {
        setError(err.message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [path]);

  return { htmlContent, error };
}

// export function useExtension(path: string) {
//   const [url, setUrl] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let cancelled = false;

//     async function load() {
//       try {
//         const chunks: Uint8Array[] = [];

//         for await (const res of client.getExtension({ extensionName: path })) {
//           chunks.push(res.data);
//         }

//         // Combine into one Blob  
//         const blob = new Blob(chunks);
//         // Create object URL for <iframe> or download  
//         const objectUrl = URL.createObjectURL(blob);
//         if (!cancelled) setUrl(`${objectUrl}`);
//       } catch (err: any) {
//         setError(err.message);
//       }
//     }

//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, [path]);

//   return { url, error };
// }
