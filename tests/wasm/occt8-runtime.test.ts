import { beforeAll, describe, expect, test } from 'vitest';
import { Brep, init } from '../../src/internal';

const quality = {
  linearDeflection: 0.1,
  angularDeflection: 0.1,
  tolerance: 0.001,
  edgeMinimalPoints: 2,
  edgeMinimalLength: 0.1,
};

describe('OCCT 8 runtime migration', () => {
  let brep: Brep;

  beforeAll(async () => {
    await init();
    brep = new Brep();
  });

  test('meshes planar and curved faces with finite unit normals', () => {
    for (const shape of [brep.Box(10), brep.Sphere(5)]) {
      const faces = shape.toMeshFaces(quality);
      expect(faces.length).toBeGreaterThan(0);

      for (const face of faces) {
        expect(face.vertices.length).toBeGreaterThan(0);
        expect(face.triangleIndices.length).toBeGreaterThan(0);
        expect(face.normals.length).toBe(face.vertices.length);

        for (let index = 0; index < face.normals.length; index += 3) {
          const magnitude = Math.hypot(
            face.normals[index],
            face.normals[index + 1],
            face.normals[index + 2],
          );
          expect(Number.isFinite(magnitude)).toBe(true);
          expect(magnitude).toBeCloseTo(1, 5);
        }
      }
    }
  });

  test('keeps shape identity stable across orientation', () => {
    const box = brep.Box(10);
    const [first, second] = box.faces().toArray();
    const firstIndex = first._shapeIndex(first._ocShape);
    const reversed = first._ocShape.Reversed();

    expect(first._shapeIndex(first._ocShape)).toBe(firstIndex);
    expect(first._shapeIndex(reversed)).toBe(firstIndex);
    expect(first._shapeIndex(second._ocShape)).not.toBe(firstIndex);
    expect(box.type()).toBe('Solid');
    expect(first.type()).toBe('Face');

    reversed.delete();
  });

  test('runs the migrated boundary operation without changing its public result', () => {
    expect(brep.Rect(10, 10).edges().boundary()).toBeNull();
  });
});
