
interface Point {
  x: number;
  y: number;
}

export interface PackedCircle extends Point {
  id: string;
  radius: number;
}

class CircleRegionAllocator {
  private width: number;
  private height: number;
  private circles: Map<string, PackedCircle>;
  private center: Point;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.circles = new Map();
    this.center = { x: width / 2, y: height / 2 };
  }

  /**
   * "Borrows" a region. Finds the closest valid spot to the center.
   * Returns the circle with coordinates, or null if no space found.
   */
  public allocate(radius: number): PackedCircle | null {
    // 1. Check if it fits purely based on area (optimization)
    // simplistic check, accurate check happens in loop
    
    // 2. Spiral Search Algorithm
    // We spiral out from the center until we find a spot that doesn't collide
    let angle = 0;
    let distance = 0;
    //const stepSize = 1; // smaller = tighter pack, slower perf
    const maxDistance = Math.max(this.width, this.height) / 1.2;

    // Candidate spot
    let x = this.center.x;
    let y = this.center.y;

    // Safety break to prevent infinite loops
    let iterations = 0;
    const MAX_ITERATIONS = 5000; 

    while (distance < maxDistance && iterations < MAX_ITERATIONS) {
      // Check bounds
      if (
        x - radius >= 0 &&
        x + radius <= this.width &&
        y - radius >= 0 &&
        y + radius <= this.height
      ) {
        // Check collision with ALL other circles
        // (For N > 1000, use a Quadtree or Spatial Hash here instead of Map iteration)
        let collision = false;
        for (const existing of this.circles.values()) {
          const dx = x - existing.x;
          const dy = y - existing.y;
          const rSum = radius + existing.radius;
          
          // Distance squared check (faster than Math.sqrt)
          if (dx * dx + dy * dy < rSum * rSum) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          // Found a spot!
          const id = Math.random().toString(36).substring(2, 9);
          const newCircle: PackedCircle = { id, x, y, radius };
          this.circles.set(id, newCircle);
          return newCircle;
        }
      }

      // Move along spiral
      // Archimedean spiral equation: r = a + b * angle
      // We adjust angle increment based on distance to keep linear speed constant
      const arcLength = 5 + (5 * angle) / (2 * Math.PI); // Distance between checks along the curve
      const dAngle = distance === 0 ? 1 : arcLength / distance;
      
      angle += dAngle;
      distance = 5 + (5 * angle) / (2 * Math.PI); // gap between spiral arms

      x = this.center.x + distance * Math.cos(angle);
      y = this.center.y + distance * Math.sin(angle);
      
      iterations++;
    }

    return null; // Could not fit
  }

  /**
   * "Returns" the region, freeing up space for future allocations.
   */
  public free(id: string): boolean {
    return this.circles.delete(id);
  }

  public getAll(): PackedCircle[] {
    return Array.from(this.circles.values());
  }

  public clear(): void {
    this.circles.clear();
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.center = { x: width / 2, y: height / 2 };
    // Note: This naive resize might leave circles out of bounds. 
    // In a real app, you might want to prune or re-pack them.
  }
}



export type Token = {
    token: string,
    x: number,
    y: number,
    size: number
}

export function allocate_tokens(tokens: string[], min_size = 80, max_size = 300, width = 1920 * 2, height = 1080 * 2): Token[] {
    let res = []

    let all = new CircleRegionAllocator(width, height)

    let damping = 0

    for (let token of tokens) {

        let size = min_size + Math.random() * (max_size - min_size) - damping

        if (size < min_size) {
          size = min_size
          damping += 10
        }

        let circle = all.allocate(size)

        if (circle === null) {
          damping += 10
        }

        if (circle !== null) {
            res.push({
                token,
                x: circle.x - 1920 / 2,
                y: circle.y - 1080 / 2,
                size
            })
        }
    }
    return res
}