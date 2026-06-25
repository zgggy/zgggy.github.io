declare global {
  interface Window {
    __registerArticleFeature?: (spec: {
      slug?: string;
      setup: (api: any) => void;
    }) => void;
    __registerSiteFeature?: (factory: (api: any) => void) => void;
  }
}

export {};
