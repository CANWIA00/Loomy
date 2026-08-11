declare module "imagetracerjs" {
  interface ImageTracerOptions {
    pathomit?: number;
    numberofcolors?: number;
    colorquantcycles?: number;
    ltres?: number;
    qtres?: number;
    scale?: number;
    strokewidth?: number;
    [key: string]: any;
  }

  interface ImageDataLike {
    width: number;
    height: number;
    data: Uint8Array | number[];
  }

  class ImageTracer {
    versionnumber: string;
    imagedataToSVG(imgd: ImageDataLike, options?: ImageTracerOptions): string;
  }

  const instance: ImageTracer;
  export = instance;
}
