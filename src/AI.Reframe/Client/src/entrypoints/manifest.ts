export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "AIReframe Entrypoint",
    alias: "AI.Reframe.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
