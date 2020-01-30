import 'intersection-observer';
import Disposable from 'seng-disposable';
import { TweenLite } from 'gsap';

class LazyLoadImages extends Disposable {
  private elements: NodeListOf<HTMLImageElement>;
  private observer: IntersectionObserver | null = null;
  private options: ILazyLoadImagesOptions = {
    rootMargin: '50px 0px',
    threshold: 0.01,
    animationTime: 0.2,
  };

  constructor(elements: NodeListOf<HTMLImageElement>, options: ILazyLoadImagesOptions) {
    super();

    this.elements = elements;

    if (!('IntersectionObserver' in window)) {
      Array.from(this.elements).forEach(image => this.preloadImage.bind(this, image));
    } else {
      this.options = Object.assign(this.options, options);

      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.options);

      Array.from(this.elements).forEach(elem => {
        this.observer!.observe(elem);
      });
    }
  }

  private handleIntersection(entries: Array<IntersectionObserverEntry>): void {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        this.observer!.unobserve(entry.target);
        this.preloadImage(entry.target);
      }
    });
  }

  private preloadImage(element: Element): void {
    // @ts-ignore
    if (element.dataset && element.dataset.src) {
      // @ts-ignore
      this.loadImage(element, element.dataset.src);
    }

    // @ts-ignore
    if (element.dataset && element.dataset.srcset) {
      // @ts-ignore
      this.loadImage(element, element.dataset.srcset, true);
    }
  }

  private loadImage(element: Element, src: string, isSrcSet: boolean = false): void {
    const loadImage = new Image();

    loadImage.onload = () => {
      // Lets add Event Dispatches for the element
      const event = new CustomEvent('isLoaded', {});
      element.dispatchEvent(event);
      // @ts-ignore
      TweenLite.fromTo(
        element,
        this.options.animationTime,
        {
          opacity: 0,
        },
        {
          onStart: () => {
            if (isSrcSet) {
              // @ts-ignore
              element.srcset = src;
            } else {
              // @ts-ignore
              element.src = src;
            }
          },
          opacity: 1,
        },
      );
    };

    loadImage.src = src;
  }

  public dispose() {
    Array.from(this.elements).forEach(elem => {
      this.observer!.unobserve(elem);
    });

    super.dispose();
  }
}

export default LazyLoadImages;

export interface ILazyLoadImagesOptions {
  rootMargin: string;
  threshold: number;
  animationTime?: number;
}
