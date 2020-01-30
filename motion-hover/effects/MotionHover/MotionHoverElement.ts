import Disposable from 'seng-disposable';
import * as THREE from 'three';
import { Power4, TweenLite } from 'gsap';
import { DisposableManager } from 'seng-disposable-manager';
import { DisposableEventListener } from 'seng-disposable-event-listener';
import debounce from 'lodash/debounce';

const baseVertexShader = require('./vertexShader.glsl');
const baseFragmentShader = require('./fragmentShader.glsl');

export interface IMotionHoverOptions {
  speed: number,
  strength: number,
}

type SourceItem = {
  url: string,
  type: string,
}

type MotionItem = {
  element: HTMLElement,
  source: SourceItem,
  index: number,
  texture?: any,
}

type MousePosition = {
  x: number,
  y: number,
}

class MotionHoverBase extends Disposable {
  private static DPI: number = window.devicePixelRatio;

  protected container: HTMLElement;
  protected elements: Array<HTMLElement>;
  protected loadedItems: Array<MotionItem> = [];
  protected currentItem!: MotionItem;
  private disposables: DisposableManager = new DisposableManager();
  protected isActive: boolean = false;
  protected isLoaded: boolean = false;
  protected mouse: MousePosition = {x: 0, y: 0};
  protected options: IMotionHoverOptions;

  // Three JS properties
  protected renderer!: THREE.WebGLRenderer;
  protected scene!: THREE.Scene;
  protected camera!: THREE.PerspectiveCamera;
  protected position!: THREE.Vector3;
  protected geometry!: THREE.PlaneBufferGeometry;
  protected material!: THREE.ShaderMaterial;
  protected uniforms!: { uAlpha: { value: number }; uTexture: { value: null }; uOffset: { value: THREE.Vector3 } };
  public scale!: THREE.Vector3;
  public plane!: THREE.Mesh;

  constructor(container: HTMLElement, elements: Array<HTMLElement>, options: IMotionHoverOptions) {
    super();

    this.container = container;
    this.elements = elements;
    this.options = options;

    this.setupThree();
    this.loadContent().then(() => {this.isLoaded = true});
    this.setEvents();
  }

  get viewport() {
    let width = this.container.clientWidth;
    let height = this.container.clientHeight;
    let aspectRatio = width / height;
    return {
      width,
      height,
      aspectRatio
    }
  }

  get items() {
    return this.elements.map((item, index) => ({
      element: item,
      source: {
        url: item.dataset.motionUrl ? item.dataset.motionUrl : '',
        type: item.dataset.motionType ? item.dataset.motionType : ''
      },
      index: index
    }))
  }

  get viewSize() {
    // https://gist.github.com/ayamflow/96a1f554c3f88eef2f9d0024fc42940f
    let distance = this.camera.position.z;
    let vFov = (this.camera.fov * Math.PI) / 180;
    let height = 2 * Math.tan(vFov / 2) * distance;
    let width = height * this.viewport.aspectRatio;
    return { width, height, vFov };
  }

  private setupThree(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.renderer.setPixelRatio(MotionHoverElement.DPI);

    // Lets append the canvas element to the container
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.viewport.aspectRatio, 0.1, 100);
    this.camera.position.set(0,0,3);

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  private handleResize(): void {

  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private setEvents(): void {
    this.disposables.add(
      new DisposableEventListener(window, 'resize', debounce(this.handleResize.bind(this), 100)),
    );

    // Lets add event listeners for items
    this.loadedItems.forEach((item, index) => {
      this.disposables.add(
        new DisposableEventListener(item.element, 'mouseover', this._onMouseOver.bind(this, index))
      );

      this.disposables.add(
        new DisposableEventListener(item.element, 'mouseleave', this._onMouseLeave.bind(this))
      )
    });

    this.disposables.add(
      new DisposableEventListener(document.body, 'mousemove', this._onMouseMove.bind(this))
    );

  }

  private loadContent(): Promise<void> {
    const promises: Array<Promise<any>> = [];

    this.loadedItems = this.items;

    const THREETextureLoader = new THREE.TextureLoader();

    // Images will load, videos will create a element video with the source on the container
    this.loadedItems.forEach((item, index) => {
      switch(item.source.type) {
        case 'video':
          promises.push(this.loadVideo({url: item.source.url, index}));
          break;
        case 'image':
          promises.push(this.loadImage({loader: THREETextureLoader, url: item.source.url, index}));
          break;
      }
    });

    return new Promise((resolve) => {
      Promise.all(promises).then(promises => {
        promises.forEach((promise, index) => {
          this.loadedItems[index].texture = promise.texture;
        });

        resolve();
      })
    });
  }

  private loadImage({loader, url, index}: {loader: THREE.TextureLoader, url: string, index: number}): Promise<{texture: any, index: number}> {
    return new Promise((resolve, reject) => {
      if (!url) {
        return resolve({texture: null, index});
      }

      // Lets load the resource
      loader.load(url, (texture: any) => resolve({texture, index}), undefined, error => {console.error('Ops, something went wrong.', error); reject(error)});
    });
  };

  // TODO: texture should be a HTMLVideoElement
  private loadVideo({url, index}: {url: string, index: number}): Promise<{texture: any, index: number}> {
    return new Promise((resolve) => {
      if(!url) {
        return resolve({texture: null, index})
      }

      const video = document.createElement('video');
      video.setAttribute('src', url);
      video.loop = true;
      video.muted = true;
      video.setAttribute('style', 'position: absolute; opacity: 0;');

      this.container.appendChild(video);

      resolve({texture: video, index});
    });
  };

  private _onMouseOver(index: number): void {
    // @ts-ignore
    this.onMouseOver(index);
  }

  private _onMouseMove(event: Event): void {
    this.mouse.x = ((event as MouseEvent).clientX / this.viewport.width) * 2 - 1;
    this.mouse.y = -((event as MouseEvent).clientY / this.viewport.height) * 2 + 1;

    // @ts-ignore
    this.onMouseMove();
  }

  private _onMouseLeave() {
    this.isActive = false;
    // @ts-ignore
    this.onMouseLeave();
  }

  protected calculatePosition({value, in_min, in_max, out_min, out_max} : {value: number, in_min: number, in_max: number, out_min: number, out_max: number}): number {
    return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
  }

  public dispose(): void {
    this.disposables.dispose();

    super.dispose();
  };
}

export default class MotionHoverElement extends MotionHoverBase {
  constructor(container: HTMLElement, elements: Array<HTMLElement>, options: IMotionHoverOptions) {
    super(container, elements, options);

    this.init();
  }

  private init(): void {
    this.position = new THREE.Vector3(0,0,0);
    this.scale = new THREE.Vector3(1,1,1);
    this.geometry = new THREE.PlaneBufferGeometry(1,1,32,32);
    this.uniforms = {
      uTexture: {
        value: null,
      },
      uOffset: {
        value: new THREE.Vector3(0.0, 0.0),
      },
      uAlpha: {
        value: 0,
      }
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: baseVertexShader,
      fragmentShader: baseFragmentShader,
      transparent: true,
    });

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  private onTargetChange(index: number): void {
    // Check if its a image or a video
    this.currentItem = this.loadedItems[index];
    if(!this.currentItem.texture) return;
    let texture = null;
    let aspectRatio = 1;
    switch(this.currentItem.source.type) {
      case 'video':
        texture = new THREE.VideoTexture(this.currentItem.texture);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;

        this.currentItem.texture.play();
        aspectRatio = this.currentItem.texture.videoWidth / this.currentItem.texture.videoHeight;

        // For video lets try 16:9 aspect ratio
        break;
      case 'image':
        texture = this.currentItem.texture;
        aspectRatio = this.currentItem.texture.image.width / this.currentItem.texture.image.height;
        break;
    }

    this.uniforms.uTexture.value = texture;

    // We need to define aspect ratios
    this.scale = new THREE.Vector3(aspectRatio, 1,1);
    this.plane.scale.copy(this.scale);
  }

  private onPositionUpdate(): void {
    const offset = this.plane.position.clone().sub(this.position).multiplyScalar(-this.options.strength);
    this.uniforms.uOffset.value = offset;
  };

  private onMouseEnter() {
    if (!this.currentItem || !this.isActive) {
      this.isActive = true;
      TweenLite.to(this.uniforms.uAlpha, this.options.speed, {
        value: 1,
        ease: Power4.easeOut,
      })
    }
  }

  private onMouseOver(index: number): void {
    if(!this.isLoaded) return;
    this.onMouseEnter();
    if (this.currentItem && this.currentItem.index === index) return;
    this.onTargetChange(index);
  }

  private onMouseMove(): void {
    const x = this.calculatePosition({
      value: this.mouse.x,
      in_min: -1,
      in_max: 1,
      out_min: -this.viewSize.width / 2,
      out_max: this.viewSize.width / 2
    });
    const y = this.calculatePosition({
      value: this.mouse.y,
      in_min: -1,
      in_max: 1,
      out_min: -this.viewSize.height / 2,
      out_max: this.viewSize.height / 2
    });

    this.position = new THREE.Vector3(x, y, 0);
    TweenLite.to(this.plane.position, this.options.speed, {
      x: x,
      y: y,
      ease: Power4.easeOut,
      onUpdate: this.onPositionUpdate.bind(this)
    })
  }

  private onMouseLeave(): void {
    TweenLite.to(this.uniforms.uAlpha, 0.5, {
      value: 0,
      ease: Power4.easeOut,
    })
  }

}
