import { HAREntry, PostmanCollection, PostmanItem, PostmanFolder, PostmanHeader, PostmanQuery, PostmanBody, PostmanUrl } from "../types";

/**
 * Normalizes headers and filters out browser-specific pseudo-controls (e.g. HTTP2 headers like `:path`)
 */
function cleanHeaders(headers: { name: string; value: string }[]): PostmanHeader[] {
  return headers
    .filter(h => !h.name.startsWith(":") && !["cookie", "user-agent", "host"].includes(h.name.toLowerCase()))
    .map(h => ({
      key: h.name,
      value: h.value,
      type: "text",
      description: `Imported header: ${h.name}`
    }));
}

/**
 * Safe URL parsing helper
 */
function parseRequestUrl(urlStr: string): PostmanUrl {
  try {
    const parsed = new URL(urlStr);
    
    // Split host by dots
    const hostSegments = parsed.hostname.split(".");
    
    // Split path, filtering empty entries
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    
    // Build query params
    const queryParams: PostmanQuery[] = [];
    parsed.searchParams.forEach((value, name) => {
      queryParams.push({
        key: name,
        value: value,
        description: "Imported query parameter"
      });
    });

    return {
      raw: urlStr,
      protocol: parsed.protocol.replace(":", ""),
      host: hostSegments,
      path: pathSegments,
      query: queryParams.length ? queryParams : undefined
    };
  } catch {
    // Graceful fallback for relative/malformed URL
    return {
      raw: urlStr,
      protocol: "https",
      host: [urlStr],
      path: []
    };
  }
}

/**
 * Formats HAR request body (postData) to Postman body structure
 */
function parseRequestBody(postData?: { mimeType: string; text?: string; params?: any[] }): PostmanBody | undefined {
  if (!postData) return undefined;

  const mime = postData.mimeType.toLowerCase();
  
  if (mime.includes("application/json")) {
    return {
      mode: "raw",
      raw: postData.text || "",
      options: {
        raw: {
          language: "json"
        }
      }
    };
  } else if (mime.includes("application/x-www-form-urlencoded")) {
    if (postData.params && postData.params.length) {
      return {
        mode: "urlencoded",
        urlencoded: postData.params.map(p => ({
          key: p.name,
          value: p.value || "",
          description: "Form parameter"
        }))
      };
    } else if (postData.text) {
      // Parse query-like string in text
      const urlParams = new URLSearchParams(postData.text);
      const urlencodedArray: Array<{ key: string; value: string }> = [];
      urlParams.forEach((val, key) => {
        urlencodedArray.push({ key, value: val });
      });
      return {
        mode: "urlencoded",
        urlencoded: urlencodedArray
      };
    }
  } else if (mime.includes("multipart/form-data")) {
    if (postData.params && postData.params.length) {
      return {
        mode: "formdata",
        formdata: postData.params.map(p => ({
          key: p.name,
          value: p.value || "",
          type: "text"
        }))
      };
    }
  }

  // Fallback to raw text
  return {
    mode: "raw",
    raw: postData.text || "",
    options: {
      raw: {
        language: mime.includes("xml") ? "xml" : mime.includes("html") ? "html" : "text"
      }
    }
  };
}

/**
 * Formats a single HAR Entry into a Postman Item request
 */
export function convertEntryToPostmanItem(entry: HAREntry, index: number): PostmanItem {
  const req = entry.request;
  const parsedUrl = parseRequestUrl(req.url);
  
  // Create description from metadata
  const statusInfo = entry.response ? `\n\nResponse status: ${entry.response.status} ${entry.response.statusText}` : "";
  const description = `Imported from DevTools Network Capturer on ${new Date().toLocaleDateString()}.${statusInfo}`;

  // Get name for this item
  let urlPath = parsedUrl.path ? `/${parsedUrl.path.join("/")}` : "";
  if (!urlPath) {
    try {
      urlPath = new URL(req.url).pathname;
    } catch {
      urlPath = req.url;
    }
  }
  const name = `${req.method} ${urlPath}`;

  return {
    name: name,
    request: {
      method: req.method.toUpperCase(),
      header: cleanHeaders(req.headers),
      body: parseRequestBody(req.postData),
      url: parsedUrl,
      description: description
    },
    response: []
  };
}

/**
 * Group list of entries into folders and export as standard Postman Collection (v2.1.0)
 */
export function buildPostmanCollection(
  entries: HAREntry[],
  collectionName: string,
  groupingMode: "flat" | "domain" | "path" = "domain"
): PostmanCollection {
  const collectionId = `col-${Math.random().toString(36).substr(2, 9)}`;
  const collection: PostmanCollection = {
    info: {
      _postman_id: collectionId,
      name: collectionName || `DevTools Network Export [${new Date().toLocaleDateString()}]`,
      description: `Postman Collection created from browser network session logs using DevTools Network Capturer.\nExported: ${new Date().toISOString()}`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: []
  };

  const convertedItems = entries.map((entry, idx) => convertEntryToPostmanItem(entry, idx));

  if (groupingMode === "flat" || entries.length === 0) {
    collection.item = convertedItems;
    return collection;
  }

  if (groupingMode === "domain") {
    const domainBuckets: Record<string, PostmanItem[]> = {};
    
    entries.forEach((entry, idx) => {
      let hostname = "Other API Gateway";
      try {
        hostname = new URL(entry.request.url).hostname;
      } catch {
        // Fallback or leave default
      }
      if (!domainBuckets[hostname]) {
        domainBuckets[hostname] = [];
      }
      domainBuckets[hostname].push(convertedItems[idx]);
    });

    collection.item = Object.entries(domainBuckets).map(([domain, items]) => ({
      name: domain,
      item: items,
      description: `Folder group for requests to the API domain: ${domain}`
    }));

    return collection;
  }

  if (groupingMode === "path") {
    // Nested levels: Domain -> Main API Directory Folder (e.g. first folder segment `/api` or `/v1`)
    const tree: Record<string, Record<string, PostmanItem[]>> = {};

    entries.forEach((entry, idx) => {
      let hostname = "External APIs";
      let firstSegment = "root";
      try {
        const u = new URL(entry.request.url);
        hostname = u.hostname;
        const segs = u.pathname.split("/").filter(Boolean);
        if (segs.length > 0) {
          firstSegment = `/${segs[0]}`;
        }
      } catch {
        // Keep default
      }

      if (!tree[hostname]) {
        tree[hostname] = {};
      }
      if (!tree[hostname][firstSegment]) {
        tree[hostname][firstSegment] = [];
      }
      tree[hostname][firstSegment].push(convertedItems[idx]);
    });

    const items: PostmanFolder[] = [];
    Object.entries(tree).forEach(([domain, segments]) => {
      const segmentFolders: PostmanFolder[] = [];
      Object.entries(segments).forEach(([segment, reqs]) => {
        segmentFolders.push({
          name: segment,
          item: reqs,
          description: `Methods on ${segment}`
        });
      });

      items.push({
        name: domain,
        item: segmentFolders,
        description: `Sub-categorized routes for domain: ${domain}`
      });
    });

    collection.item = items;
    return collection;
  }

  return collection;
}
