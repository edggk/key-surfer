import { describe, expect, it } from "vitest";
import { generateFingerprint } from "./generateFingerprint";

// generate all premutations of 4 boolean arrays
function allPremutations(results: boolean[][] = [], combo: boolean[] = [], depth = 1): boolean[][] {
  if(depth === 5){
    results.push(combo);
    
    return results;
  }

  allPremutations(results, [...combo, true], depth + 1);
  allPremutations(results, [...combo, false], depth + 1);

  return results;
}

describe('generateFingerprint', () => {
  const allCombinations = allPremutations();

  it('it should generate unique id for each meta key combination', () => {
    const results = new Set<number|string>();

    allCombinations.forEach(combo => {
      results.add(generateFingerprint({
        altKey: combo[0],
        ctrlKey: combo[1],
        metaKey: combo[2],
        shiftKey: combo[3],
      }));
    });

    expect(allCombinations.length).toBe(results.size);
  })
});
