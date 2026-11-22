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
