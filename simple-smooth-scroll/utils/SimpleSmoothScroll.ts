import Disposable from 'seng-disposable';

export interface ISimpleSmoothScrollOptions {
  damping: number; // Applied damping to scroll from current position to new one. 1 is normal speed, 0.1 is slowest
}

class SimpleSmoothScroll extends Disposable {
  private wrapper: HTMLElement;
  private options: ISimpleSmoothScrollOptions;
  private scrollPosition: { current: number; target: number } = { current: 0, target: 0 };
  private requestAnimation!: number;

  constructor(wrapper: HTMLElement, options: ISimpleSmoothScrollOptions) {
    super();

    this.wrapper = wrapper;
    this.options = options;

    // Lets validate the values of the damping, for now it only triggers console warnings.
    if (this.options.damping <= 0 || this.options.damping > 1) {
      // tslint:disable-next-line:no-console
      console.warn(
        'The damping that you are using might cause visual issues, please select a value between 0.01 and 1',
      );
    }

    // Lets ensure the elements have the correct styling
    Object.assign(this.wrapper.style, { position: 'fixed', width: '100%', top: '0', left: '0' });
    [document.documentElement, document.body].forEach(
      element =>
        (element.style.cssText = '-webkit-overflow-scrolling: none; padding: 0; margin: 0;'),
    );

    this.update();
  }

  private getTargetScrollY(): number {
    return (
      (window.pageYOffset || document.documentElement.scrollTop) -
      (document.documentElement.clientTop || 0)
    );
  }

  private calculateLerp(): number {
    return (
      this.scrollPosition.current * (1 - this.options.damping) +
      this.scrollPosition.target * this.options.damping
    );
  }

  private update(): void {
    this.requestAnimation = window.requestAnimationFrame(this.update.bind(this));

    this.scrollPosition.target = this.getTargetScrollY();
    this.scrollPosition.current = this.calculateLerp();

    this.wrapper.style.transform = `translateY(-${this.scrollPosition.current}px)`;
    document.body.style.height = `${this.wrapper.scrollHeight}px`;
  }

  public dispose(): void {
    window.cancelAnimationFrame(this.requestAnimation);
    super.dispose();
  }
}

export default SimpleSmoothScroll;
