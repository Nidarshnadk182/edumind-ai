function buildDistractors(
  correctKeyword: string,
  keywords: string[]
): string[] {
  const alternatives = keywords
    .filter(
      (keyword) =>
        keyword.toLowerCase() !==
        correctKeyword.toLowerCase()
    )
    .slice(0, 3)
    .map(
      (keyword) =>
        `${keyword} is unrelated to the main idea discussed in this section.`
    );

  const fallbackDistractors = [
    "The material does not discuss this relationship.",
    "This statement contradicts the supplied notes.",
    "This is not identified as a key point in the source.",
  ];

  while (alternatives.length < 3) {
    const fallback =
      fallbackDistractors[alternatives.length] ??
      "This option is not supported by the supplied study material.";

    alternatives.push(fallback);
  }

  return alternatives;
}
