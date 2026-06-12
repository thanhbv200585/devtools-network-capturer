# DevTools Network Capturer & Postman Collection Generator

A high-performance, developer-centric utility designed to intercept browser network requests, parse raw HTTP/HAR logs, and synthesize them into robust **Postman Collection v2.1** schemas. Styled with an elegant, high-contrast dark visual theme featuring deep charcoal, slate gray, and signature orange highlights.

---

## 🚀 Key Features

### 1. **Virtual Network Console Monitor**
- **Log Management**: Read, filter, and review parsed network rows with an easy-to-use checklist.
- **Advanced Filtering**: Live-search through request paths, request bodies, and Content-Type.
- **Multimodal Filters**: Instantly slice transactions by request methods (`GET`, `POST`, `PUT`, `DELETE` checkboxes) or assets (`XHR/Fetch`, `CSS`, `JS`, `Images`, etc.).
- **Drill-Down Metrics**: Dynamic count of successes, failures, aggregate domains, and payload sizes.

### 2. **Internal Request Sandbox**
- **CORS-Ready Sandbox**: Make custom client-side requests instantly to public endpoints directly within the workspace.
- **Quick Presets**: Select built-in API templates (JSONPlaceholder, REST Countries, etc.) to seed example configurations or test request capturing immediately.
- **Custom Header/Body Editor**: Rapidly construct payloads, custom authentication headers, and key-value details.

### 3. **DevTools Console Injector Snippet**
- **No Extensions Required**: A pristine, non-invasive vanilla JavaScript hook.
- **Universal Capture**: Copy and paste the script directly into the *Chrome/Firefox DevTools Console* of another browser tab or live staging app.
- **Easy Export**: Type `copyLogs()` in your browser console to automatically copy a formatted array of captures to your clipboard, ready to paste straight back here.

### 4. **Durable Postman Exporter (v2.1)**
- **Intelligent Parameterization**: Converts absolute query parameters, cookies, request headers, and complex body payloads into compliant Postman JSON nodes.
- **Grouping Architecture**: Organize requests dynamically before exporting:
  - **Flat**: Keep all logs as a flat sequence.
  - **Domain**: Group cleanly by web server hostnames.
  - **Path Segment**: Organize down into nested folders according to their API endpoints (e.g., `/api`, `/v1/oauth`).
- **One-Click Download**: Bundles your selected checklist items into a standard `.json` file that is ready to import into native Postman workspaces or Swagger setups.

### 5. **Request Detail Drawer**
- **Payload Inspection**: Decodes and prettifies JSON bodies, encoded form payloads, and general content.
- **Response Previews**: Read response headers, MIME types, and status texts side-by-side.
- **Dynamic Postman Node Preview**: Inspect the individual structured Postman JSON node structure for any given request before exporting.

---

## 🛠️ Usage Workflows

### Workflow A: Using the DevTools Console Injector
1. Open the target website or application you want to map.
2. Open DevTools (**F12**), select the **Console** tab, and enter the copied script from the **Console Injector** tab.
3. Perform user actions on the target page (making API calls, forms, searches, etc.) which the injector captures quietly in memory.
4. Run `copyLogs()` in your target console.
5. In this app, click **Paste HAR Logs**, paste the array, and watch live items populate the console table immediately!

### Workflow B: Dragging in HAR Files
1. Perform actions on a target website while recording your browser network tab.
2. Right-click on the requests and choose **Save all as HAR with Content**.
3. Drag-and-drop the resulting `.har` file directly into the **Virtual Network Console Monitor**.

---

## 💻 Tech Stack & Design Strategy

- **Core Engine**: Vite + React 18 with TypeScript.
- **Motion Dynamics**: Highly performant transitions powered by `motion` (`motion/react`).
- **Styling Method**: Utility-first Tailwind CSS.
- **Icons**: Clean and lightweight indicators from `lucide-react`.
- **Aesthetic Pairings**: Monospaced "JetBrains Mono" overlays juxtaposed against deep slate surfaces and high-intensity accents.

---

## ⚙️ Local Development & Deployment

### Installation
Ensure that node dependencies are installed prior to starting:
```bash
npm install
```

### Run the Dev Server
The development environment is pre-configured to bind specifically for local evaluation:
```bash
npm run dev
```

### Production Build
Compiles production-ready static outputs inside the `/dist` directory:
```bash
npm run build
```
