export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Aynı script birden fazla kez istenirse race condition olmadan tek sefer yükler.
 * Script DOM'da varsa ama yüklenmediyse yüklenmesini bekler.
 */
const __scriptPromises = new Map<string, Promise<void>>();

export const loadScript = (src: string, opts?: { timeoutMs?: number }) => {
  const timeoutMs = opts?.timeoutMs ?? 20000;

  // Daha önce başlatıldıysa aynı promise'i döndür
  const existing = __scriptPromises.get(src);
  if (existing) return existing;

  const p = new Promise<void>((resolve, reject) => {
    // DOM'da aynı src varsa
    const found = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (found) {
      // Yüklenmişse resolve
      if (found.dataset.loaded === 'true') {
        resolve();
        return;
      }

      // Yüklenmemişse event'e bağlan
      const onLoad = () => {
        found.dataset.loaded = 'true';
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Script yüklenemedi: ${src}`));
      };

      const cleanup = () => {
        found.removeEventListener('load', onLoad);
        found.removeEventListener('error', onError);
        clearTimeout(timer);
      };

      found.addEventListener('load', onLoad);
      found.addEventListener('error', onError);

      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Script timeout (${timeoutMs}ms): ${src}`));
      }, timeoutMs);

      return;
    }

    // DOM'da yoksa yeni script ekle
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    const cleanup = () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      clearTimeout(timer);
    };

    const onLoad = () => {
      script.dataset.loaded = 'true';
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Script yüklenemedi: ${src}`));
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Script timeout (${timeoutMs}ms): ${src}`));
    }, timeoutMs);

    document.head.appendChild(script);
  });

  __scriptPromises.set(src, p);
  return p;
};

export const getFlattenedLocations = (nodes: any[], prefix = ''): any[] => {
  let options: any[] = [];
  nodes.forEach((node) => {
    const currentName = prefix ? `${prefix} > ${node.name}` : node.name;
    options.push({ id: node.id, name: currentName, type: node.type });
    if (node.children) {
      options.push(...getFlattenedLocations(node.children, currentName));
    }
  });
  return options;
};
