

class Sprite {
    currentFrameTagName;    // frameTagsは連続したフレームにタグを割り付ける
    currentFrameTagFrom;    // frameTagのFrom
    currentFrameTagTo       // frameTagのTo
    currentFrame;           // framesのフレーム番号
    crameCount;
    frameName;
    x;
    y;
    vx;
    vy;
    jsonData;
    spriteName;
    image;
    static ImageDic = [];
    childs = [];
    physics = [];
    followParent = false;

    appendChild(sprite) {
        this.childs.push(sprite)
    }

    addPhysic(fn) {
        this.physics.push(fn);
    }

    constructor(name, jsonData, frameTagName, x = 0, y = 0, vx = 0, vy = 0) {
        this.spriteName = name;
        this.jsonData = jsonData;
        this.currentFrameTagName = frameTagName;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;

        var tag = this.jsonData.meta.frameTags.filter(function (item) {
            if (item.name = frameTagName) {
                return item;
            }
        })
        this.currentFrameTagFrom = tag[0].from;
        this.currentFrameTagTo = tag[0].to;
        this.currentFrame = this.currentFrameTagFrom;   // 初期値

        this.frameCount = 0;
    }

    static async build(name, jsonData, frameTagName, x = 0, y = 0, vx = 0, vy = 0) {
        const sprite = new Sprite(name, jsonData, frameTagName, x, y, vx, vy);
        if (this.ImageDic[name] === undefined) {
            const img = new Image();
            img.src = "images/" + sprite.jsonData.meta.image;  // asepriteのJSONをわりつける
            await img.decode();
            // await 以降はイメージが使えるので、ちゃんと情報も表示できる
            console.log(`loaded pic ! width: ${img.width}, height: ${img.height}`);
            this.ImageDic[name] = img;
        }
        sprite.image = this.ImageDic[name];

        return sprite;
    }

    draw(ctx) {
        //        console.log("Sprite::draw");
        var f = this.jsonData.frames[this.currentFrame];
        // フレーム換算（asepriteは1/1000、しかしブラウザは1/60なので換算する）
        if (f.duration / 1000 * 60 < this.frameCount) {
            // 次のフレームへ
            if (this.currentFrame == this.currentFrameTagTo) {
                this.currentFrame = this.currentFrameTagFrom;
            } else {
                this.currentFrame += 1;
            }
            // あらためて現在のフレームをセット
            f = this.jsonData.frames[this.currentFrame];
            // フレームカウントを初期化
            this.frameCount = 0;
        }

        ctx.drawImage(this.image,
            f.frame.x,      // sx      (元画像の切り抜き始点X)
            f.frame.y,      // sy      (元画像の切り抜き始点Y)
            f.frame.w,      // sWidth  (元画像の切り抜きサイズ：幅)
            f.frame.h,      // sHeight (元画像の切り抜きサイズ：高)
            this.x,         // dx
            this.y,         // dy
            f.frame.w,      // 圧縮幅
            f.frame.h       // 圧縮高
        );
        // 表示をしたのちに、次のフレームの位置を計算しておく
        var i = 0;
        do {
            this.physics[i](this);
            i++;
        } while (i < this.physics.length)


        // フレームをインクリメントする
        this.frameCount += 1;
        // true：次のフレームも生存 false:次のフレームでは消える
        return true;
    }
}

class Primitive {
    primitives = [];
    context = null;
    isRunning = false;
    loopCount = 0;

    constructor(context) {
        console.log("constructor");
        this.context = context;
    }

    loop() {
        this.context.fillStyle = "blue";
        this.context.fillRect(0, 0, 600, 600);
        this.loopCount++;

        var i = 0;
        do {
            if (this.primitives[i].draw(this.context) != true) {
                this.primitives.slice(i, 1); // 消す
            } else {
                i++;
            }
        } while (i < this.primitives.length);

        if (this.isRunning) {
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    stop() {
        console.log("Primitive::stop");
        this.isRunning = false;
    }

    run() {
        // 二重に起動しない
        if (this.isRunning == false) {
            var self = this;
            console.log("Primitive::run");
            this.isRunning = true;
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    append(prim) {
        this.primitives.push(prim)
    }
}