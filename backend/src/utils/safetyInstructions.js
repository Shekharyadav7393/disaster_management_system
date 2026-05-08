const floodInstructions = [
  "Move to higher ground immediately.",
  "Avoid rivers, drains, and flooded roads.",
  "Turn off electricity and gas if safe to do so.",
  "Carry essential documents and emergency supplies.",
];

const genericInstructions = [
  "Stay calm and follow official instructions.",
  "Keep emergency contacts accessible.",
  "Move to a safe location if advised.",
];

export const getSafetyInstructions = (type = "other") => {
  const normalized = String(type).toLowerCase();
  if (normalized === "flood") {
    return {
      instructions: floodInstructions,
      recommendedAction: floodInstructions[0],
    };
  }

  if (normalized === "earthquake") {
    const earthquakeInstructions = [
      "DROP, COVER, and HOLD ON.",
      "Stay away from glass, windows, outside doors and walls.",
      "Do not use elevators.",
      "If outside, move to an open area away from buildings and trees.",
    ];
    return {
      instructions: earthquakeInstructions,
      recommendedAction: earthquakeInstructions[0],
    };
  }

  return {
    instructions: genericInstructions,
    recommendedAction: genericInstructions[0],
  };
};
