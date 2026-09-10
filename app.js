(() => {
  const MAX_ENCODED_LENGTH = 80 * 1024;

  const editorEl = document.getElementById("editor");
  const viewerEl = document.getElementById("viewer");
  const viewerActions = document.getElementById("viewer-actions");
  const svgInput = document.getElementById("svg-input");
  const shareBtn = document.getElementById("share");
  const copyBtn = document.getElementById("copy-link");
  const editorError = document.getElementById("editor-error");
  const viewerError = document.getElementById("viewer-error");
  const renderPane = document.getElementById("render-pane");
  const textPane = document.getElementById("text-pane");

  function showEditorError(message) {
    editorError.hidden = !message;
    editorError.textContent = message || "";
  }

  function showViewerError(message) {
    viewerError.hidden = !message;
    viewerError.textContent = message || "";
  }

  function toBase64Url(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64Url(value) {
    const padLength = (4 - (value.length % 4)) % 4;
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function encodeSvg(svg) {
    return toBase64Url(new TextEncoder().encode(svg));
  }

  function decodeSvg(payload) {
    return fromBase64Url(payload);
  }

  function payloadFromLocation() {
    return new URLSearchParams(location.search).get("s");
  }

  function shareUrl(encoded) {
    const url = new URL("./", location.href);
    url.searchParams.set("s", encoded);
    return url;
  }

  function sanitizeForDisplay(svg) {
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    const parserError = parsed.querySelector("parsererror");
    if (parserError) {
      throw new Error("Could not parse SVG markup.");
    }

    parsed.querySelectorAll("script").forEach((node) => node.remove());

    parsed.querySelectorAll("*").forEach((el) => {
      for (const attr of [...el.attributes]) {
        if (/^on/i.test(attr.name)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return parsed.documentElement;
  }

  function showEditor() {
    editorEl.hidden = false;
    viewerEl.hidden = true;
    viewerActions.hidden = true;
    svgInput.value = "";
    showEditorError("");
    svgInput.focus();
  }

  function showViewer(svg) {
    editorEl.hidden = true;
    viewerEl.hidden = false;
    viewerActions.hidden = false;
    textPane.textContent = svg;
    renderPane.replaceChildren();
    showViewerError("");

    try {
      const safeSvg = sanitizeForDisplay(svg);
      renderPane.appendChild(document.importNode(safeSvg, true));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not render SVG.";
      showViewerError(message);
      const fallback = document.createElement("p");
      fallback.className = "placeholder";
      fallback.textContent = "Nothing to render.";
      renderPane.appendChild(fallback);
    }
  }

  function createShareLink() {
    const svg = svgInput.value;
    if (!svg.trim()) {
      showEditorError("Paste some SVG markup first.");
      return;
    }

    const encoded = encodeSvg(svg);
    if (encoded.length > MAX_ENCODED_LENGTH) {
      showEditorError(
        "This SVG is too large to share in a URL (over ~80KB encoded). Try a smaller file."
      );
      return;
    }

    location.assign(shareUrl(encoded));
  }

  async function copyLink() {
    const href = location.href;
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      const scratch = document.createElement("textarea");
      scratch.value = href;
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand("copy");
      scratch.remove();
    }
    const previous = copyBtn.textContent;
    copyBtn.textContent = "Copied";
    window.setTimeout(() => {
      copyBtn.textContent = previous;
    }, 1400);
  }

  function boot() {
    const payload = payloadFromLocation();
    if (payload === null) {
      showEditor();
      return;
    }

    if (!payload) {
      showViewer("");
      showViewerError("This share link is missing its SVG payload.");
      return;
    }

    try {
      showViewer(decodeSvg(payload));
    } catch {
      showViewer("");
      showViewerError("This share link could not be decoded.");
    }
  }

  shareBtn.addEventListener("click", createShareLink);
  copyBtn.addEventListener("click", copyLink);
  svgInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      createShareLink();
    }
  });

  boot();
})();
