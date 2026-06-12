export interface HARHeader {
  name: string;
  value: string;
}

export interface HARQueryString {
  name: string;
  value: string;
}

export interface HARPostData {
  mimeType: string;
  text?: string;
  params?: Array<{
    name: string;
    value?: string;
    fileName?: string;
    contentType?: string;
  }>;
}

export interface HARRequest {
  method: string;
  url: string;
  httpVersion?: string;
  headers: HARHeader[];
  queryString: HARQueryString[];
  cookies?: Array<{ name: string; value: string }>;
  postData?: HARPostData;
  headersSize?: number;
  bodySize?: number;
}

export interface HARResponseContent {
  size?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

export interface HARResponse {
  status: number;
  statusText: string;
  httpVersion?: string;
  headers: HARHeader[];
  content?: HARResponseContent;
  redirectURL?: string;
}

export interface HARPageTimings {
  onContentLoad?: number;
  onLoad?: number;
}

export interface HAREntry {
  _id?: string; // added internally to unique identify entries
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HARRequest;
  response: HARResponse;
  cache?: Record<string, unknown>;
  timings?: {
    blocked?: number;
    dns?: number;
    connect?: number;
    send?: number;
    wait?: number;
    receive?: number;
    ssl?: number;
  };
}

export interface HARLog {
  version: string;
  creator: {
    name: string;
    version: string;
  };
  pages?: Array<{
    startedDateTime: string;
    id: string;
    title: string;
    pageTimings?: HARPageTimings;
  }>;
  entries: HAREntry[];
}

export interface HARRoot {
  log: HARLog;
}

// Postman Schema Types (simplified collection v2.1.0)
export interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
  description?: string;
  disabled?: boolean;
}

export interface PostmanQuery {
  key: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface PostmanBody {
  mode: "raw" | "urlencoded" | "formdata" | "file";
  raw?: string;
  urlencoded?: Array<{ key: string; value: string; description?: string; disabled?: boolean }>;
  formdata?: Array<{ key: string; value: string; type: string; disabled?: boolean }>;
  options?: {
    raw?: {
      language: string;
    };
  };
}

export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: PostmanQuery[];
  variable?: Array<Record<string, unknown>>;
}

export interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  body?: PostmanBody;
  url: PostmanUrl;
  description?: string;
}

export interface PostmanItem {
  name: string;
  request: PostmanRequest;
  response?: unknown[];
}

export interface PostmanFolder {
  name: string;
  item: Array<PostmanItem | PostmanFolder>;
  description?: string;
}

export interface PostmanCollectionInfo {
  _postman_id?: string;
  name: string;
  description?: string;
  schema: string;
}

export interface PostmanCollection {
  info: PostmanCollectionInfo;
  item: Array<PostmanItem | PostmanFolder>;
}
