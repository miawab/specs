/**
 * Reads the virtual stand-in room (authored in the Scene under "Room") and turns it into
 * axis-aligned boxes the monitors collide with and rest on.
 *
 * Each stand-in piece is a unit cube mesh whose world scale is its size in cm, so nudging a
 * piece in the Scene panel moves the collision with it.
 */

export class Box3 {
  constructor(
    public name: string,
    public min: vec3,
    public max: vec3,
  ) {}

  static fromCenterSize(name: string, center: vec3, size: vec3): Box3 {
    const half = size.uniformScale(0.5)
    return new Box3(name, center.sub(half), center.add(half))
  }

  containsXZ(x: number, z: number): boolean {
    return x >= this.min.x && x <= this.max.x && z >= this.min.z && z <= this.max.z
  }
}

export interface Surface {
  name: string
  box: Box3
  top: number
}

export class RoomModel {
  readonly obstacles: Box3[] = []
  readonly surfaces: Surface[] = []
  shelf: Box3 | null = null
  desk: Box3 | null = null
  floorY = 0

  constructor(private roomRoot: SceneObject) {
    this.rebuild()
  }

  private static boxOf(obj: SceneObject): Box3 {
    const t = obj.getTransform()
    return Box3.fromCenterSize(obj.name, t.getWorldPosition(), t.getWorldScale())
  }

  private find(name: string): SceneObject | null {
    const search = (o: SceneObject): SceneObject | null => {
      if (o.name === name) return o
      for (let i = 0; i < o.getChildrenCount(); i++) {
        const found = search(o.getChild(i))
        if (found) return found
      }
      return null
    }
    return search(this.roomRoot)
  }

  rebuild(): void {
    this.obstacles.length = 0
    this.surfaces.length = 0

    const floor = this.find("Floor")
    const deskTop = this.find("Desk Top")
    const shelf = this.find("Shelf")
    const tableTop = this.find("Table Top")

    if (floor) {
      const b = RoomModel.boxOf(floor)
      this.floorY = b.max.y
      this.surfaces.push({name: "Floor", box: b, top: b.max.y})
    }
    if (deskTop) {
      const b = RoomModel.boxOf(deskTop)
      this.desk = b
      this.surfaces.push({name: "Desk", box: b, top: b.max.y})
      // The desk acts as a solid block for anything below its top (e.g. a monitor on the floor).
      this.obstacles.push(new Box3("Desk", new vec3(b.min.x, this.floorY, b.min.z), b.max))
    }
    if (tableTop) {
      const b = RoomModel.boxOf(tableTop)
      this.surfaces.push({name: "Table", box: b, top: b.max.y})
      this.obstacles.push(new Box3("Table", new vec3(b.min.x, this.floorY, b.min.z), b.max))
    }
    if (shelf) {
      this.shelf = RoomModel.boxOf(shelf)
      this.obstacles.push(this.shelf)
    }
    // Every wall ("Wall", "Wall Left", "Wall Right", "Wall Front") blocks monitors.
    const walls: SceneObject[] = []
    const collect = (o: SceneObject) => {
      if (o.name === "Wall" || o.name.indexOf("Wall ") === 0) walls.push(o)
      for (let i = 0; i < o.getChildrenCount(); i++) collect(o.getChild(i))
    }
    collect(this.roomRoot)
    for (const w of walls) this.obstacles.push(RoomModel.boxOf(w))
  }

  /** Highest surface under (x, z) whose top is at or below `maxY`. */
  supportBelow(x: number, z: number, maxY: number): Surface | null {
    let best: Surface | null = null
    for (const s of this.surfaces) {
      if (s.name !== "Floor" && !s.box.containsXZ(x, z)) continue
      if (s.top > maxY + 0.5) continue
      if (!best || s.top > best.top) best = s
    }
    return best
  }

  /** Clearance under the shelf, measured from a surface at height `surfaceY`. */
  shelfClearance(surfaceY: number): number {
    return this.shelf ? this.shelf.min.y - surfaceY : Infinity
  }
}
