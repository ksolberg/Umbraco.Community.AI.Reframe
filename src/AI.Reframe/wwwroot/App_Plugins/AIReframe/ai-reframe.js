const e = [
  {
    name: "AIReframe Entrypoint",
    alias: "AI.Reframe.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-CdWgnGuk.js")
  }
], a = [
  {
    name: "AI.Reframe Workspace View",
    alias: "AI.Reframe.WorkspaceView",
    type: "workspaceView",
    js: () => import("./reframe-workspace-view.element-Bf5vtLK_.js"),
    meta: {
      label: "Reframe",
      pathname: "reframe",
      icon: "icon-crop"
    },
    conditions: [
      // Only in the Media workspace…
      {
        alias: "Umb.Condition.WorkspaceAlias",
        match: "Umb.Workspace.Media"
      },
      // …and only for Image media (ADR-0001).
      {
        alias: "Umb.Condition.WorkspaceContentTypeAlias",
        match: "Image"
      }
    ]
  }
], i = [
  ...e,
  ...a
];
export {
  i as manifests
};
//# sourceMappingURL=ai-reframe.js.map
