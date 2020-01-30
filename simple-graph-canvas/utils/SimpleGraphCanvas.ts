import Disposable from 'seng-disposable';
import { DisposableManager } from 'seng-disposable-manager';
import { DisposableEventListener } from 'seng-disposable-event-listener';
import debounce from 'lodash/debounce';

export type GraphValue = {
  day: number, // For now we don't print the day so its a number
  value: number,
}

interface ISimpleGraphCanvasOptions {
  line?: {
    weight: number,
    size: number,
    gap: number,
  },
  grid?: {
    active: boolean,
    rows: number,
    columns: number,
  }
  color?: Array<string>,
  safeMargin?: {
    y: number,
  }
}

export default class SimpleGraphCanvas extends Disposable {
  private static DPI: number = window.devicePixelRatio;

  private wrapper: HTMLElement;
  private values: Array<GraphValue>;
  private options: ISimpleGraphCanvasOptions = {
    line: {
      weight: 1,
      size: 4,
      gap: 3,
    },
    grid: {
      active: true,
      rows: 3,
      columns: 5,
    },
    color: ['#000000'],
    safeMargin: {
      y: 10,
    }
  };

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private disposables: DisposableManager = new DisposableManager();

  constructor(wrapper: HTMLElement, values: Array<GraphValue>, options?: ISimpleGraphCanvasOptions) {
    super();

    this.wrapper = wrapper;
    this.values = values;
    this.options = {...this.options, ...options};

    this.canvas = document.createElement('canvas');
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');

    this.handleResize();
    this.init();
    this.setEvents();
  }

  private init(): void {
    // Lets add canvas element to wrapper
    this.wrapper.appendChild(this.canvas);
    this.draw();
  }

  private draw(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if(this.options.grid!.active) {
      this.drawGrid();
    }

    this.drawLines();
  }

  private drawGrid(): void {
    this.context.save();
    this.context.beginPath();

    this.context.strokeStyle = this.setColor();
    this.context.rect(this.options.line!.weight, this.options.line!.weight, this.canvas.width - (this.options.line!.weight * 2), this.canvas.height - (this.options.line!.weight * 2));
    this.context.lineWidth = this.options.line!.weight;
    this.context.setLineDash([this.options.line!.size, this.options.line!.gap]);
    this.context.globalAlpha = 0.8;

    // Lets create the divisions based on the number of columns and rows
    for(let i = 0; i <= this.options.grid!.columns; i++) {
      this.context.moveTo((this.canvas.width/this.options.grid!.columns)*i, 0);
      this.context.lineTo((this.canvas.width/this.options.grid!.columns)*i, this.canvas.height);
    }

    for(let i = 0; i <= this.options.grid!.rows; i++) {
      this.context.moveTo(0, (this.canvas.height/this.options.grid!.rows)*i);
      this.context.lineTo(this.canvas.width, (this.canvas.height/this.options.grid!.rows)*i);
    }

    this.context.stroke();
    this.context.closePath();
    this.context.restore();
  }

  private drawLines(): void {
    // We need to convert the values into percentages based on the canvas height and the highest value

    // Get the biggest value
    const biggest = Math.max(...this.values.map(value => value.value));
    const percentages = this.values.reduce((arr, current) => {
      arr.push(current.value/biggest*(100-this.options.safeMargin!.y));
      return arr;
    }, <Array<number>>[]);

    const lineWidth = this.canvas.width/percentages.length;

    // Now that we have the percentages based on the biggest value we can start rendering to canvas
    this.context.save();
    this.context.lineWidth = this.options.line!.weight;

    let left = 0;
    let previous = this.canvas.height-(percentages[0]*this.canvas.height/100); // first percentage

    this.context.beginPath();
    this.context.strokeStyle = this.setColor();
    for(let i = 0; i<=percentages.length-1;i++) {
      this.context.moveTo(left, previous);
      left = left+lineWidth;
      previous = this.canvas.height-(percentages[i]*this.canvas.height/100);
      this.context.lineTo(left, previous);
    }
    this.context.stroke();
    this.context.closePath();
    this.context.restore();
  }

  private setColor(): any {
    const color = this.context.createLinearGradient(0,this.canvas.height, 0, 0);
    this.options.color!.forEach((c, index) => {
      let offset = 0;
      if(index >= 1) {
        offset = 1/(this.options.color!.length - 1) * index;
      }
      color.addColorStop(offset, c);
    });

    return color;
  }

  private setEvents(): void {
    this.disposables.add(
      new DisposableEventListener(window, 'resize', debounce(() => this.handleResize(true), 100))
    );
  }

  private handleResize(draw?: boolean): void {
    const { offsetWidth, offsetHeight } = this.wrapper;
    this.canvas.width = offsetWidth * SimpleGraphCanvas.DPI;
    this.canvas.height = offsetHeight * SimpleGraphCanvas.DPI;

    if(draw) {
      this.draw();
    }
  }

  public dispose(): void {
    if(this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.disposables.dispose();
    super.dispose();
  }
}
