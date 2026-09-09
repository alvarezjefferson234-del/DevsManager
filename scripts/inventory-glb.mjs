import { readFileSync } from 'node:fs';
import { Matrix4, Vector3, Quaternion, Box3 } from 'three';

// Read the actual glTF hierarchy and accessor bounds; no Blender coordinate assumptions.
export function inspectGlb(path) {
  const bytes = readFileSync(path);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`Invalid GLB: ${path}`);
  const jsonLength = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const bounds = new Box3();
  const names = [];
  function visit(index, parent) {
    const node = doc.nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation || [0, 0, 0]),
      new Quaternion().fromArray(node.rotation || [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale || [1, 1, 1]),
    );
    const world = parent.clone().multiply(local);
    if (node.mesh !== undefined) {
      names.push(node.name);
      for (const primitive of doc.meshes[node.mesh].primitives) {
        const accessor = doc.accessors[primitive.attributes.POSITION];
        bounds.union(new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max)).applyMatrix4(world));
      }
    }
    for (const child of node.children || []) visit(child, world);
  }
  for (const index of doc.scenes[doc.scene || 0].nodes) visit(index, new Matrix4());
  return {
    path, bytes: bytes.length, size: bounds.getSize(new Vector3()).toArray(), center: bounds.getCenter(new Vector3()).toArray(),
    meshes: doc.meshes.length, nodes: doc.nodes.length, images: doc.images?.length || 0,
    triangles: doc.meshes.reduce((n, mesh) => n + mesh.primitives.reduce((sum, p) => sum + doc.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0), 0),
    clips: (doc.animations || []).map(a => ({ name: a.name, channels: a.channels.length })),
    names: names.slice(0, 12), extensions: doc.extensionsUsed || [],
  };
}

if (process.argv[1]?.endsWith('inventory-glb.mjs')) {
  for (const path of process.argv.slice(2)) console.log(JSON.stringify(inspectGlb(path)));
}
