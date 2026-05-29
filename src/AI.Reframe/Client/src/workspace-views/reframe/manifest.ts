export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "AI.Reframe Workspace View",
    alias: "AI.Reframe.WorkspaceView",
    type: "workspaceView",
    js: () => import("./reframe-workspace-view.element.js"),
    meta: {
      label: "Reframe",
      pathname: "reframe",
      icon: "icon-crop",
    },
    conditions: [
      // Only in the Media workspace…
      {
        alias: "Umb.Condition.WorkspaceAlias",
        match: "Umb.Workspace.Media",
      },
      // …and only for Image media (ADR-0001).
      {
        alias: "Umb.Condition.WorkspaceContentTypeAlias",
        match: "Image",
      },
    ],
  },
];
