export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  export const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
  
  export const getFlattenedLocations = (nodes: any[], prefix = ''): any[] => {
    let options: any[] = [];
    nodes.forEach(node => {
      const currentName = prefix ? `${prefix} > ${node.name}` : node.name;
      options.push({ id: node.id, name: currentName, type: node.type });
      if (node.children) {
        options.push(...getFlattenedLocations(node.children, currentName));
      }
    });
    return options;
  };