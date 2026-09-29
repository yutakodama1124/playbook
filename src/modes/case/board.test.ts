import { describe, it, expect } from "vitest";
import { gradeBoard } from "./board";
import { spec } from "./__fixtures__/case";

describe("gradeBoard (confirm in batches, like Obra Dinn)", () => {
  it("confirms nothing and reveals nothing when fewer than 2 new answers are right", () => {
    const r = gradeBoard(spec, { b1: "ETC", b2: 9, b3: "Chef Omar" }, []);
    expect(r.confirmed).toEqual([]);
    expect(r.message).toMatch(/at least 2/);
  });
  it("confirms all correct rows once 2+ are right", () => {
    expect(gradeBoard(spec, { b1: "ETC", b2: 4, b3: "Chef Omar" }, []).confirmed).toEqual(["b1", "b2"]);
  });
  it("lets the last remaining row confirm on its own", () => {
    expect(gradeBoard(spec, { b3: "Dana Reyes" }, ["b1", "b2"]).confirmed).toEqual(["b3"]);
  });
  it("ignores rows already confirmed and unknown rows", () => {
    expect(gradeBoard(spec, { b1: "ETC", zz: "x" }, ["b1"]).confirmed).toEqual([]);
  });
});
