export type RoadType = "highway" | "national" | "prefectural" | "local";

const HIGHWAY_KEYWORDS = ["高速", "有料", "自動車道", "IC", "JCT"];
const NATIONAL_KEYWORDS = ["国道"];
const PREFECTURAL_KEYWORDS = ["県道", "都道", "府道", "道道"];

const ROAD_COLORS: Record<RoadType, string> = {
  highway: "#ec4899",
  national: "#eab308",
  prefectural: "#22c55e",
  local: "#4f46e5",
};

export function classifyRoadType(instruction: string): RoadType {
  if (HIGHWAY_KEYWORDS.some((kw) => instruction.includes(kw))) {
    return "highway";
  }
  if (NATIONAL_KEYWORDS.some((kw) => instruction.includes(kw))) {
    return "national";
  }
  if (PREFECTURAL_KEYWORDS.some((kw) => instruction.includes(kw))) {
    return "prefectural";
  }
  return "local";
}

export function getRoadColor(roadType: RoadType): string {
  return ROAD_COLORS[roadType];
}
