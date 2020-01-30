Motion Hover
=======

![Example](http://labs.sinesio.eu/gifs/ezgif-6-a44b20cad1f0.gif)

**What it does:**

Wrapper based on the codrops Motion Hover tutorial, it creates a canvas that shows images or videos on element hover.
https://tympanus.net/codrops/2019/10/21/how-to-create-motion-hover-effects-with-image-distortions-using-three-js/

**How to use it:**
```html
<div :class="[$style.motionHover]">
  <div :class="$style.canvasWrapper"></div>
  <div :class="$style.top">
    <div data-motion-url="https://picsum.photos/300/300" data-motion-type="image">Image</div>
    <div data-motion-url="./static/image/sample.mp4" data-motion-type="video">Video</div>
  </div>
</div>
```
```javascript
const wrapper = document.querySelector(`.${this.$style.canvasWrapper}`);
const elements = document.querySelector(`.${this.$style.top}`).children;

new MotionHoverElement(wrapper, [...elements], {
  speed: 1,
  strength: 0.2,
});
```

**Requirements:**
- seng-disposable-event-listener
- seng-disposable-manager
- seng-disposable
- three
- gsap
- lodash
