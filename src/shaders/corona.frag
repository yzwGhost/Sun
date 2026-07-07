uniform float uTime;
uniform float uOpacity;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform vec3 uCameraLocal;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec3 vObjectPosition;

const int MARCH_STEPS = 28;

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
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

vec3 flowField(vec3 p) {
  return vec3(
    fbm(p + vec3(17.0, 3.0, 11.0)),
    fbm(p + vec3(5.0, 29.0, 13.0)),
    fbm(p + vec3(23.0, 19.0, 7.0))
  );
}

vec3 curlNoise(vec3 p) {
  const float e = 0.18;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 px0 = flowField(p - dx);
  vec3 px1 = flowField(p + dx);
  vec3 py0 = flowField(p - dy);
  vec3 py1 = flowField(p + dy);
  vec3 pz0 = flowField(p - dz);
  vec3 pz1 = flowField(p + dz);

  float x = (py1.z - py0.z) - (pz1.y - pz0.y);
  float y = (pz1.x - pz0.x) - (px1.z - px0.z);
  float z = (px1.y - px0.y) - (py1.x - py0.x);

  return normalize(vec3(x, y, z) / (2.0 * e) + 1e-5);
}

vec2 raySphere(vec3 rayOrigin, vec3 rayDir, float radius) {
  float b = dot(rayOrigin, rayDir);
  float c = dot(rayOrigin, rayOrigin) - radius * radius;
  float h = b * b - c;

  if (h < 0.0) {
    return vec2(-1.0);
  }

  float sqrtH = sqrt(h);
  return vec2(-b - sqrtH, -b + sqrtH);
}

float coronaDensity(vec3 p, vec3 rayDir) {
  float radius = length(p);
  float shell = smoothstep(uInnerRadius, uInnerRadius + 0.12, radius) *
    (1.0 - smoothstep(uOuterRadius - 0.28, uOuterRadius, radius));

  vec3 curl = curlNoise(p * 1.9 + vec3(0.0, uTime * 0.09, 0.0));

  float largeScale = fbm(p * 1.05 + curl * 0.35 - vec3(0.0, uTime * 0.03, 0.0));
  float mediumScale = fbm(p * 2.4 - curl * 0.8 + vec3(uTime * 0.05, 0.0, 0.0));
  float smallScale = fbm(p * 5.8 + curl * 1.1 - vec3(0.0, uTime * 0.14, uTime * 0.07));

  vec3 radial = normalize(p);
  float magneticArcs = pow(max(dot(curl, radial), 0.0), 1.6);
  float flowStreaks = pow(max(dot(curl, rayDir * -1.0), 0.0), 1.8);

  float density = largeScale * 0.52 + mediumScale * 0.32 + smallScale * 0.16;
  density = density * 0.5 + 0.5;
  density += magneticArcs * 0.42 + flowStreaks * 0.18;

  return shell * smoothstep(0.38, 1.16, density);
}

void main() {
  vec3 rayOrigin = uCameraLocal;
  vec3 rayDir = normalize(vObjectPosition - rayOrigin);

  vec2 outerHit = raySphere(rayOrigin, rayDir, uOuterRadius);
  if (outerHit.x < 0.0) {
    discard;
  }

  vec2 innerHit = raySphere(rayOrigin, rayDir, uInnerRadius);
  float startT = max(outerHit.x, 0.0);
  float endT = outerHit.y;

  if (innerHit.x > 0.0) {
    endT = innerHit.x;
  }

  float travel = endT - startT;
  if (travel <= 0.0) {
    discard;
  }

  float stepSize = travel / float(MARCH_STEPS);
  float transmittance = 1.0;
  vec3 accumColor = vec3(0.0);

  for (int i = 0; i < MARCH_STEPS; i++) {
    float t = startT + stepSize * (float(i) + 0.5);
    vec3 samplePos = rayOrigin + rayDir * t;
    float radius = length(samplePos);
    float edgeFactor = smoothstep(uInnerRadius, uOuterRadius, radius);

    float density = coronaDensity(samplePos, rayDir);
    float fresnel = pow(1.0 - max(dot(normalize(samplePos), normalize(rayOrigin - samplePos)), 0.0), 2.8);

    vec3 sampleColor = mix(uCoreColor, uEdgeColor, edgeFactor);
    sampleColor += uCoreColor * fresnel * 0.6;

    float alpha = density * 0.09;
    accumColor += sampleColor * alpha * transmittance;
    transmittance *= 1.0 - alpha;

    if (transmittance < 0.02) {
      break;
    }
  }

  float viewFacing = max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0);
  float limbGlow = pow(1.0 - viewFacing, 4.2);
  vec3 finalColor = accumColor + mix(uCoreColor, uEdgeColor, 0.35) * limbGlow * 1.25;
  float alpha = (1.0 - transmittance) * uOpacity + limbGlow * 0.08 * uOpacity;

  gl_FragColor = vec4(finalColor, alpha);
}
