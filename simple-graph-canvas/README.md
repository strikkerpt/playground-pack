Simple Graph Canvas
=======

![Example](http://labs.sinesio.eu/gifs/graphs.png)

**What it does:**

This utility create a canvas element with a graph based on the data that you pass and the options (color, line types, grid, etc...)

**How to use it:**
```html
<div ref="first"></div>
<div ref="second"></div>
<div ref="third"></div>
<div ref="fourth"></div>
```
```javascript
const data = [
      { day: 1, value: 20 },
      { day: 2, value: 40 },
      { day: 3, value: 65.5 },
      { day: 4, value: 15 },
    ];
    new SimpleGraphCanvas(this.$refs.first, data, {color: ['black'], safeMargin: {y: 10}});
    new SimpleGraphCanvas(this.$refs.second, data, {color: ['red', 'blue'], safeMargin: {y: 10}});
    new SimpleGraphCanvas(this.$refs.third, data, {line: {size: 20, gap: 5, weight: 3}, grid: {active: true, columns: 2, rows: 2}, color: ['green', 'blue', 'purple'], safeMargin: {y: 40}});
    new SimpleGraphCanvas(this.$refs.fourth, data, {grid: {active: false}, color: ['orange'], safeMargin: {y: 0}});
```

**Requirements:**
- seng-disposable
- lodash
- seng-disposable-manager
- seng-disposable-event-listener
