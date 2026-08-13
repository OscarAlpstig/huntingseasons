export function getMoonPhaseName(phase: number): string {
  const normalized = ((phase % 1) + 1) % 1;
  if (normalized < 0.03 || normalized >= 0.97) return 'Nymåne';
  if (normalized < 0.22) return 'Tilltagande skära';
  if (normalized < 0.28) return 'Första kvarteret';
  if (normalized < 0.47) return 'Tilltagande måne';
  if (normalized < 0.53) return 'Fullmåne';
  if (normalized < 0.72) return 'Avtagande måne';
  if (normalized < 0.78) return 'Sista kvarteret';
  return 'Avtagande skära';
}

export function getIlluminatedPath(phase: number, radius = 48): string {
  const normalized = ((phase % 1) + 1) % 1;
  const angle = Math.PI - 2 * Math.PI * normalized;
  const waxing = normalized <= 0.5;
  const points = 80;
  const boundary: string[] = [];
  const outer: string[] = [];

  for (let index = 0; index <= points; index += 1) {
    const y = -radius + (2 * radius * index) / points;
    const rowRadius = Math.sqrt(Math.max(0, radius * radius - y * y));
    const x = waxing ? -rowRadius * Math.cos(angle) : rowRadius * Math.cos(angle);
    boundary.push(`${50 + x},${50 + y}`);
  }
  for (let index = points; index >= 0; index -= 1) {
    const y = -radius + (2 * radius * index) / points;
    const rowRadius = Math.sqrt(Math.max(0, radius * radius - y * y));
    const x = waxing ? rowRadius : -rowRadius;
    outer.push(`${50 + x},${50 + y}`);
  }
  return `M ${boundary.join(' L ')} L ${outer.join(' L ')} Z`;
}
