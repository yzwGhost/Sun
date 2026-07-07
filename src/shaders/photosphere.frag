uniform float uTime;
uniform float uGranulationScale;
uniform float uOpacity;
uniform vec3 uBaseColor;
uniform vec3 uHighlightColor;
uniform vec3 uShadowColor;
uniform vec3 uRimColor;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec3 vSamplePosition;
varying float vConvection;
varying float vDisplacement;

const float TAU = 6.28318530718;

vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(
    permute(
      permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0)
    )
    + i.x + vec4(0.0, i1.x, i2.x, 1.0)
  );

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p);
    p *= 2.01;
    amplitude *= 0.5;
  }
  return value;
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 voronoi(vec2 uv) {
  vec2 cellIndex = floor(uv);
  vec2 cellUv = fract(uv);
  float nearest = 10.0;
  float secondNearest = 10.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash22(cellIndex + neighbor);
      vec2 delta = neighbor + point - cellUv;
      float distanceToPoint = dot(delta, delta);

      if (distanceToPoint < nearest) {
        secondNearest = nearest;
        nearest = distanceToPoint;
      } else if (distanceToPoint < secondNearest) {
        secondNearest = distanceToPoint;
      }
    }
  }

  return vec2(sqrt(nearest), sqrt(secondNearest) - sqrt(nearest));
}

float granuleLayer(vec2 uv, float scale, float rotationJitter) {
  float angle = fbm(vec3(uv * 0.075, rotationJitter + uTime * 0.015)) * TAU;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 stretched = rot * uv;
  stretched.x *= 1.55;

  vec2 cell = voronoi(stretched * scale);
  float center = 1.0 - smoothstep(0.08, 0.46, cell.x);
  float lane = 1.0 - smoothstep(0.018, 0.12, cell.y);
  return center * (1.0 - lane * 0.88);
}

float triplanarGranulation(vec3 p, vec3 n, float scale) {
  vec3 blend = pow(abs(normalize(n)), vec3(5.0));
  blend /= max(dot(blend, vec3(1.0)), 0.0001);

  float yz = granuleLayer(p.yz, scale, 3.7);
  float xz = granuleLayer(p.xz, scale, 8.1);
  float xy = granuleLayer(p.xy, scale, 14.2);

  return yz * blend.x + xz * blend.y + xy * blend.z;
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDirection = normalize(vViewDirection);

  float viewFacing = max(dot(normal, viewDirection), 0.0);
  float fresnel = pow(1.0 - viewFacing, 3.1);
  float limbDarkening = mix(0.52, 1.12, pow(viewFacing, 0.7));

  vec3 flowPosition = vSamplePosition * 1.9;
  float granulation = triplanarGranulation(flowPosition, normal, uGranulationScale);
  float subGranulation = triplanarGranulation(flowPosition * 1.8 + vec3(4.0, 11.0, 7.0), normal, uGranulationScale * 0.55);

  float plasma = fbm(flowPosition * 0.85 + vec3(0.0, uTime * 0.06, 0.0));
  float microConvection = fbm(flowPosition * 2.4 - vec3(uTime * 0.04, 0.0, 0.0));

  float granuleIntensity = mix(granulation, subGranulation, 0.24);
  float highlightMask = smoothstep(0.4, 0.93, granuleIntensity + vConvection * 0.24 + microConvection * 0.18);
  float shadowMask = smoothstep(0.1, 0.42, 1.0 - granuleIntensity + (1.0 - vConvection) * 0.12);

  vec3 baseColor = mix(uShadowColor, uBaseColor, granuleIntensity);
  vec3 heatedColor = mix(baseColor, uHighlightColor, highlightMask);
  vec3 convectiveColor = mix(heatedColor, uHighlightColor, max(plasma, 0.0) * 0.24);
  vec3 shadedColor = mix(convectiveColor, uShadowColor * 0.92, shadowMask * 0.18);

  float emissive = 1.25 + granuleIntensity * 1.4 + max(plasma, 0.0) * 0.55 + vDisplacement * 2.6;
  vec3 rimGlow = uRimColor * fresnel * 0.75;
  vec3 finalColor = shadedColor * emissive * limbDarkening + rimGlow;

  gl_FragColor = vec4(finalColor, uOpacity);
}
