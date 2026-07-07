uniform float uTime;
uniform float uOpacity;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec3 vObjectPosition;

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
    p *= 2.04;
    amplitude *= 0.5;
  }
  return value;
}

vec3 flowField(vec3 p) {
  return vec3(
    fbm(p + vec3(11.0, 7.0, 3.0)),
    fbm(p + vec3(5.0, 17.0, 29.0)),
    fbm(p + vec3(23.0, 13.0, 19.0))
  );
}

vec3 curlNoise(vec3 p) {
  const float e = 0.16;
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

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDirection);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.6);

  vec3 samplePos = vObjectPosition * 3.6;
  vec3 curl = curlNoise(samplePos + vec3(0.0, uTime * 0.1, 0.0));
  float upwell = fbm(samplePos + curl * 0.8 - vec3(0.0, uTime * 0.18, 0.0));
  float returnFlow = fbm(samplePos * 1.5 - curl * 1.1 + vec3(uTime * 0.12, 0.0, 0.0));

  float cells = smoothstep(0.15, 0.92, upwell * 0.62 + returnFlow * 0.38);
  vec3 color = mix(vec3(0.76, 0.35, 0.08), vec3(1.0, 0.72, 0.18), cells);
  vec3 emission = color * (1.2 + cells * 1.7) + vec3(1.0, 0.78, 0.34) * fresnel * 0.55;

  gl_FragColor = vec4(emission, uOpacity * (0.78 + fresnel * 0.22));
}
