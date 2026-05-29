const a = [
  {
    name: "AIReframe Entrypoint",
    alias: "AI.Reframe.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-CdWgnGuk.js")
  }
], e = [
  {
    name: "AIReframe Dashboard",
    alias: "AI.Reframe.Dashboard",
    type: "dashboard",
    js: () => import("./dashboard.element-BkTqGWMb.js"),
    meta: {
      label: "Example Dashboard",
      pathname: "example-dashboard"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Content"
      }
    ]
  }
], t = [
  ...a,
  ...e
];
export {
  t as manifests
};
//# sourceMappingURL=ai-reframe.js.map
