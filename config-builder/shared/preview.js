// Preview-mode inspection data.
//
// The wizard can be explored before any airport subscription is filled in.
// Instead of inventing nodes, the preview uses the region list derived from
// the Ratatoskr template so region policies and app routing can be prepared
// ahead of time. Nothing here is ever compiled into a real configuration:
// a real inspection replaces it before generation or download.
export function previewInspection(model) {
  return {
    providers: [],
    nodes: [],
    regions: model.regions.map((region) => ({
      id: region.id,
      label: region.label,
      flag: region.flag,
      name: region.name,
      icon: region.icon,
      count: 0,
    })),
    capabilities: { tcp: false },
  };
}

export function previewRegions(model) {
  return model.regions.map((region) => region.id);
}

// A subscription only reports regions it actually found nodes for, but the
// generated YAML writes every template region as a selectable option. Offer
// the complete template list in the UI too: a region with zero nodes can
// still be picked and becomes useful as soon as the subscription carries
// nodes for it. The live count is merged in purely for display.
export function selectableRegions(model, inspection) {
  const live = new Map((inspection?.regions || []).map((r) => [r.id, r]));
  const merge = (region) => {
    const found = live.get(region.id);
    return { ...region, ...(found || {}), count: found?.count || 0 };
  };
  return [
    ...model.regions.map(merge),
    merge({
      id: "OTHER",
      label: "其他地区",
      flag: "🌐",
      name: model.groups.other,
    }),
  ];
}
