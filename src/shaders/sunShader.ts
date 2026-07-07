export const sunVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const sunFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uHotColor;
  uniform vec3 uRimColor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDirection);

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);

    vec3 plasmaCoords = normal * 3.0;
    float primaryFlow = fbm(plasmaCoords + vec3(0.0, 0.0, uTime * 0.32));
    float secondaryFlow = fbm(plasmaCoords * 1.8 - vec3(uTime * 0.22, uTime * 0.15, 0.0));
    float turbulence = mix(primaryFlow, secondaryFlow, 0.55);

    float latBand = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 1.8);
    float cellPulse = sin((vUv.x + turbulence * 0.35) * 25.0 + uTime * 1.8) * 0.5 + 0.5;
    float heat = smoothstep(0.22, 0.92, turbulence + latBand * 0.35 + cellPulse * 0.2);

    vec3 bodyColor = mix(uBaseColor, uHotColor, heat);
    vec3 rimColor = uRimColor * fresnel * 2.8;

    float glow = 1.15 + heat * 1.8 + fresnel * 3.6;
    vec3 finalColor = bodyColor * glow + rimColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
