import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Conf } from '../core/conf';
import { Color } from "three/src/math/Color";
import { Util } from '../libs/util';
import { Mouse } from '../core/mouse';

export class Con extends Canvas {

  private _con: Object3D;
  private _textList:Array<string> = [];
  // private _oldC:number = -1
  private _col:Color = new Color(0xffffff);

  private _isLoadedImg:boolean = false
  private _loadedImgNum:number = 0
  private _imgSize:number = 128
  private _sample:Array<Array<any>> = []
  private _sampleY:number = 0

  constructor(opt: any) {
    super(opt);

    const h = Util.instance.randomInt(0, 360)
    this._col = new Color('hsl(' + h +', 100%, 50%)')

    this._con = new Object3D()
    this.mainScene.add(this._con)

    // 表示に使うテキスト入れておく
    this._textList = '0123456789'.split('')

    // 画像解析
    this._loadImg()

    this._resize()
  }


  private _loadImg(): void {

    const src = [
      Conf.instance.PATH_IMG + 'sample-0.png',
      Conf.instance.PATH_IMG + 'sample-1.png',
      Conf.instance.PATH_IMG + 'sample-2.png',
      Conf.instance.PATH_IMG + 'sample-3.png',
      Conf.instance.PATH_IMG + 'sample-4.png',
      Conf.instance.PATH_IMG + 'sample-4.png',
    ][this._loadedImgNum]

    if(src == undefined) {
      this._isLoadedImg = true
      return
    }

    const img = new Image();
    img.src = src

    img.onload = () => {
      const cvs:any = document.createElement('canvas');
      cvs.width = cvs.height = this._imgSize;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0);
      img.style.display = 'none';

      const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const key = ~~(i / 4)
        const iy = (this._loadedImgNum * this._imgSize) + ~~(key / cvs.width)
        const a = data[i + 3] // 0 ~ 255
        if(this._sample[iy] == undefined) this._sample[iy] = []
        this._sample[iy].push(a > 0 ? 1 : 0)
      }

      this._loadedImgNum++
      this._loadImg()
    };
  }


  protected _update(): void {
    super._update()
    this._con.position.y = Func.instance.screenOffsetY() * -1

    // const s = Math.abs(Scroller.instance.power.y * 1.5)
    const s = Util.instance.map(Mouse.instance.easeNormal.y, 0, 150, -1, 1)
    // console.log(s)
    // this._oldC = this._c
    //this._c = s

    //if(this._oldC == this._c) return
    this._c++
    this._sampleY++

    let text = ''
    const fontSize = Util.instance.map(s, 10, 35, 0, 150)

    // const bgColR = Util.instance.map(s, 0, 1, 0, 150)
    const bgCol = new Color(0, 0, 0)
    // const valTest = bgColR > 0.5 ? 1 : 0

    // 色 一定間隔で
    // if(~~(this._sampleY) % 5 == 0) {
    //   const h = Util.instance.randomInt(0, 360)
    //   this._col = new Color('hsl(' + h +', 100%, 50%)')
    // }
    const h = ~~(Util.instance.map(s, 0, 360, 0, 150))
    this._col = new Color('hsl(' + h +', 100%, 50%)')

    if(this._isLoadedImg) {
      const c2 = ~~(this._sampleY * 3)
      const useSample = this._sample[c2 % this._sample.length]
      if(useSample != undefined) {
        for(let i = 0; i < useSample.length; i++) {
          if(i % 2== 0) continue
          const key = i + (this._c * 1)
          const val = useSample[key % (useSample.length - 1)]
          if(val == 0) {
            text += ' '
          } else {
            const key = (this._c + i) % (this._textList.length - 1)
            text += this._textList[key]
          }
        }
      }
    }
    console.log('%c' + text, 'font-weight:bolder; color:#' + this._col.getHexString() + ';font-size:' + fontSize + 'px;background-color:#' + bgCol.getHexString() + ';')

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    const bgColor = 0x000000
    this.renderer.setClearColor(bgColor, 1)
    this.renderer.render(this.mainScene, this.camera)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    if(Conf.instance.IS_SP || Conf.instance.IS_TAB) {
      if(w == this.renderSize.width && this.renderSize.height * 2 > h) {
        return
      }
    }

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }
}
