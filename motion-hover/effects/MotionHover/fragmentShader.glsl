uniform sampler2D uTexture;
uniform float uAlpha;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(uTexture,vUv).rgb;
  gl_FragColor = vec4(color,uAlpha);
}
