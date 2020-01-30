import Disposable from 'seng-disposable';
import { TweenLite } from 'gsap';
import lerp from 'lerp';

type MagneticPosition = {
  x: number,
  y: number,
}

export interface IMagneticOptions {
  force: number; // Between 0 and 1
  minDistance: number;
  magneticType?: 'center' | 'bounds';
  cursor?: HTMLElement;
}

interface IMagneticElement {
  element: HTMLElement,
  currentPosition: MagneticPosition,
}


export default class MagneticElements extends Disposable {
  private static IS_HOVER: string = 'is-hover';

  private rawElements: Array<HTMLElement>;
  private elements: Array<IMagneticElement>; // Elements that will be magnetic to the cursor
  private options: IMagneticOptions = {
    force: 0.30,
    minDistance: 20,
    magneticType: 'center'
  };
  private requestAnimation!: number;
  private currentMousePosition: {x: number, y: number} = {x: 0, y: 0};

  /**
   *
   * @param elements - Each item should be a wrapper of the element that you want to be magnetic
   * @param options
   */
  constructor(elements: Array<HTMLElement>, options: IMagneticOptions) {
    super();

    this.rawElements = elements;
    this.elements = this.setElements(elements);
    Object.assign(this.options, options);

    this.init();
  }

  private setElements(elements: Array<HTMLElement>): Array<IMagneticElement> {
    return elements.reduce((acc, curr) => {
      const obj = {
        element: curr,
        currentPosition: {
          x: 0,
          y: 0,
        }
      };
      acc.push(obj);
      return acc;
    }, [] as Array<IMagneticElement>);
  }

  private init(): void {
    document.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.update();
  }

  private handleMouseMove(e: any): void {
    this.currentMousePosition = {
      x: e.pageX,
      y: e.pageY,
    }
  }

  private update(): void {
    // For now lets just check if cursor is near element and change position of element to cursor;
    this.elements.forEach(element => {
      const bounds = element.element.getBoundingClientRect();

      const isHover = this.options.magneticType === 'center' ? this.isNearCenter(bounds) : this.isNearBounds(bounds);

      if(isHover) {
        // Lets animate the position
        element.currentPosition.x = lerp(element.currentPosition.x, (this.currentMousePosition.x - bounds.left) - bounds.width / 2, this.options.force);
        element.currentPosition.y = lerp(element.currentPosition.y, (this.currentMousePosition.y - bounds.top)  - bounds.height / 2, this.options.force);

        TweenLite.set(element.element.children[0], {
          x: element.currentPosition.x,
          y: element.currentPosition.y,
        });

      } else {
        if(element.currentPosition.x === 0 || element.currentPosition.y === 0) {
          TweenLite.set(element.element.children[0], {
            clearProps: 'all'
          });
        } else {
          // Lets clean everything
          element.currentPosition.x = lerp(element.currentPosition.x, 0, this.options.force);
          element.currentPosition.y = lerp(element.currentPosition.y, 0, this.options.force);

          TweenLite.set(element.element.children[0], {
            x: element.currentPosition.x,
            y: element.currentPosition.y,
          });
        }
      }
    });

    this.requestAnimation = requestAnimationFrame(this.update.bind(this));
  }

  private isNearCenter(bounds: any): boolean {
    const centerX = bounds.left + (bounds.width / 2);
    const centerY = bounds.top + (bounds.height / 2);

    const a = Math.abs(centerX - this.currentMousePosition.x);
    const b = Math.abs(centerY - this.currentMousePosition.y);
    const c = Math.sqrt(a * a + b * b);


    return  (c < (bounds.width / 2) + this.options.minDistance);
  }

  private isNearBounds(bounds: any): boolean {
    const top = bounds.top - this.options.minDistance;
    const right = bounds.left + bounds.width + this.options.minDistance;
    const bottom = bounds.top + bounds.height + this.options.minDistance;
    const left = bounds.left - this.options.minDistance;

    const x = this.currentMousePosition.x;
    const y = this.currentMousePosition.y;

    return x >= left && x <= right && y >= top && y <= bottom;
  }

  public dispose(): void {
    if (this.requestAnimation != null) {
      cancelAnimationFrame(this.requestAnimation);
    }

    this.dispose();
  }
}
