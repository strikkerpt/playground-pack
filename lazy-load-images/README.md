Lazy Load Images
=======

![Example](http://labs.sinesio.eu/gifs/ezgif-6-f1fa63a98738.gif)

What it does:

Using the intersection-observer it preloads images based on element viewport position. This way we don't load all assets on page entry.

How to use it:
```html
<img data-src="https://picsum.photos/300/300" data-load-img="true" />
```

```javascript
new LazyLoadImages(document.querySelectorAll('[data-load-img]'), {
  rootMargin: '200px 200px',
  threshold: 0.01,
  animationTime: 0.2,
});
```

- intersection-observer
- gsap ^2.1.3
