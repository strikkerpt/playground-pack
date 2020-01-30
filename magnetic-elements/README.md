Magnetic Elements
=======

![Example](http://labs.sinesio.eu/gifs/ezgif-6-f23f31a74af9.gif)

What it does:

Makes elements magnetic to the cursor (elements must be inside a wrapper element)

How to use it:
```html
<div :class="[$style.magneticElement]">
  <div ref="text">Text</div>
</div>
<div :class="[$style.magneticElement]">
  <img src="https://picsum.photos/300/300" />
</div>
<div :class="[$style.magneticElement]">
  <video src="https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4" loop muted autoplay></video>
</div>
<div :class="[$style.magneticElement]">
  <div>Another text</div>
</div>
```
```javascript
new MagneticElements([...document.querySelectorAll(`.${this.$style.magneticElement}`)], {
  force: 0.01,
  minDistance: 1,
  magneticType: 'center',
});
```

**Requirements:**
- seng-disposable
- lerp
- gsap 2.1.3
