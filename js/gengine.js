
class ImageLoader {
    static ImageDic = [];

    static async LoadJSImage(name, jsonData) {
        await this.LoadImage(name, jsonData.meta.image);
    }

    static async LoadImage(name, ImageName) {
        if (this.ImageDic[name] === undefined) {
            const img = new Image();
            img.src = "images/" + ImageName;  // asepriteのJSONをわりつける
            await img.decode();
            // await 以降はイメージが使えるので、ちゃんと情報も表示できる
            console.log(`loaded pic ! width: ${img.width}, height: ${img.height}`);
            this.ImageDic[name] = img;
        }
        return this.ImageDic[name];
    }
}

class Sprite {
    static Pivot = {
        "LEFT": 0x01,
        "CENTER": 0x02,
        "RIGHT": 0x04,
        "TOP": 0x10,
        "MIDDLE": 0x20,
        "BOTTOM": 0x40
    };

    TagNames = [];              // 複数のTagを初期設定可能
    currentFrameTagNum = 0;    // currentFrameTagnamesの現在のタグ番号
    currentFrameTagFrom = -1;   // frameTagのFrom
    currentFrameTagTo = -1;     // frameTagのTo
    currentFrame = -1;          // framesのフレーム番号
    xPos = -1000;
    yPos = -1000;
    vx = 0;
    vy = 0;
    parentSpriteManager;
    jsonData;
    spriteName = "";
    Image;

    childs = [];
    physics = [];
    followParent = true;   // 親についていくかどうか
    durationCount = 0;
    scale = 1.0;

    BasePos = Sprite.Pivot.CENTER | Sprite.Pivot.BOTTOM;

    appendChild(sprite) {
        this.childs.push(sprite)
    }

    addPhysic(fn) {
        this.physics.push(fn);
    }

    clearPhysics() {
        this.physics.splice(0);
        console.log("clearPhysics", this.physics.length);
    }

    isPhysic(fn) {
        for (var i = 0; i < this.physics.length; i++) {
            if (fn === this.physics[i]) {
                return true
            }
        }
        return false
    }

    ptInRect(px, py, x, y, w, h) {
        if (px >= x && px <= (x + w) && py >= y && py <= (y + h)) {
            return true;
        }
        else {
            return false;
        }
    }

    isTouched() {
        var f = this.jsonData.frames[this.currentFrame];

        if (this.ptInRect(this.parentSpriteManager.ClickedX, this.parentSpriteManager.ClickedY, this.xPos - f.frame.w / 2, this.yPos - f.frame.h, f.frame.w, f.frame.h)) {
            this.parentSpriteManager.ClickedX = -1000;
            this.parentSpriteManager.ClickedY = -1000;
            return true;
        } else {
            return false;
        }
    }

    setTagNames(TagNames) {
        if (this.jsonData != null) {
            this.TagNames = TagNames;
            console.log("setTagNames", TagNames);
            this.setTag(this.TagNames[0]);
        }
    }

    setTag(tagName) {
        console.log("setTag", tagName);
        if (tagName === undefined) {
            console.log("koko");
        }
        if (this.jsonData != null) {
            var tag = this.jsonData.meta.frameTags.filter(function (item) {
                if (item.name == tagName) {
                    return item;
                }
            })
            this.currentFrameTagFrom = tag[0].from;
            this.currentFrameTagTo = tag[0].to;
            this.currentFrame = this.currentFrameTagFrom;   // 初期値
        }
        this.durationCount = 0;
    }

    constructor(name, jsonData, TagNames, x = 0, y = 0, basePos = Sprite.Pivot.CENTER | Sprite.Pivot.BOTTOM, scale = 1.0) {
        this.spriteName = name;
        this.jsonData = jsonData;
        this.TagNames = TagNames;
        this.xPos = x;
        this.yPos = y;
        this.BasePos = basePos;
        this.scale = scale;
        if (TagNames != null) {
            this.setTag(TagNames[0]);
        }
        // スプライトのイメージは前もって読み込んでおく必要がある
        if (jsonData != null) {
            this.Image = ImageLoader.ImageDic[name];
        }
    }

    // 16.67mmSec毎に呼ばれる
    draw(ctx, parent) {
        if (this.jsonData != null) {
            var f = this.jsonData.frames[this.currentFrame];
            // フレーム換算（asepriteは1/1000、ループは1/60(16.67mmSec)なので換算する）
            if (16.67 * this.durationCount >= f.duration) {
                if (this.currentFrame < this.jsonData.frames.length - 1) {
                    this.currentFrame++;
                }
                // カレントフレームの最後まで来た場合
                if (this.currentFrame == this.currentFrameTagTo) {
                    if (this.currentFrameTagNum < this.TagNames.length - 1) {
                        // 次のタグへ進める
                        this.currentFrameTagNum++;
                    }
                    console.log("TagName = " + this.TagNames[this.currentFrameTagNum]);
                    switch (this.TagNames[this.currentFrameTagNum]) {
                        case "REPEAT":
                            // 次のタグがなくREPEAT指定されていたら、カレントタグへ戻す
                            this.currentFrameTagNum--;  // "REPEAT"の前のタグへ戻す
                            this.currentFrame = this.currentFrameTagFrom;
                            break;
                        case "DIE":
                            // 次のタグがない場合削除
                            //                            this.currentFrameTagNum--;  // "DIE"の前のタグへ戻す
                            console.log("DIE");
                            return false;
                        default:
                            // 次のTagがあれば、そのタグをセット
                            this.setTag(this.TagNames[this.currentFrameTagNum])
                            break;
                    }
                }
                // あらためて現在のフレームをセット
                f = this.jsonData.frames[this.currentFrame];
                // フレームカウントを初期化
                this.durationCount = 0;
            }
            var dispX = -1;
            var dispY = -1;
            var baseX = -1;
            var baseY = -1;

            // スプライトの左右中央＋下端に表示する場合の計算←今後起点をどこにするかの対応も必要となる
            switch (this.BasePos & 0x07) {
                case Sprite.Pivot.LEFT:
                    baseX = 0;
                    break;
                case Sprite.Pivot.CENTER:
                    baseX = (f.spriteSourceSize.x - f.sourceSize.w / 2) * this.scale;
                    break;
                case Sprite.Pivot.RIGHT:
                    baseX = -f.sourceSize.w * this.scale;
                    break;
            }

            switch (this.BasePos & 0x70) {
                case Sprite.Pivot.TOP:
                    baseY = 0;
                    break;
                case Sprite.Pivot.MIDDLE:
                    baseY = (f.spriteSourceSize.y - f.sourceSize.h / 2) * this.scale;
                    break;
                case Sprite.Pivot.BOTTOM:
                    baseY = (f.spriteSourceSize.y - f.sourceSize.h) * this.scale;
                    break;
            }

            dispX = this.xPos + baseX;
            dispY = this.yPos + baseY;

            if (parent != null && followParent == true) {
                // 親がいて、親についていく場合、親の相対位置へ表示する
                dispX += parent.xPos;
                dispY += parent.yPos;
            }
            ctx.drawImage(this.Image,
                f.frame.x,      // sx      (元画像の切り抜き始点X)
                f.frame.y,      // sy      (元画像の切り抜き始点Y)
                f.frame.w,      // sWidth  (元画像の切り抜きサイズ：幅)
                f.frame.h,      // sHeight (元画像の切り抜きサイズ：高)
                dispX,          // dx
                dispY,          // dy
                f.frame.w * this.scale,      // 圧縮幅
                f.frame.h * this.scale       // 圧縮高
            );

            // Debug:当たり判定を矩形でくくる（当たり判定も起点によって変わる）
            // ctx.beginPath();
            // ctx.rect(this.xPos - f.frame.w / 2, this.yPos - f.frame.h, f.frame.w, f.frame.h);
            // ctx.stroke();
            // ctx.fillStyle = "red";
            // ctx.fillRect(this.xPos - 1, this.yPos, 2, 2);
            // ctx.stroke();

            // 子供がいたら表示する
            var i = 0;
            while (i < this.childs.length) {
                if (this.childs[i].draw(this.context, null) == false) {
                    this.childs.splice(i, 1); // 消す
                } else {
                    i++;
                }
            }
        }

        // 表示をしたのちに、次のフレームの位置を計算しておく
        // phisics側でも消せるようにするべきか？
        if (this.physics.length > 0) {
            var i = 0;
            do {
                this.physics[i](this);
                i++;
            } while (i < this.physics.length)
        }

        // フレームをインクリメントする
        this.durationCount++;
        // true：次のフレームも生存 false:次のフレームでは消える
        return true;
    }
}

class BG {
    Name = "";
    constructor(name) {
        this.Name = name;
    }

    draw(ctx) {
        var img = ImageLoader.ImageDic[this.Name];
        ctx.drawImage(img,
            0,              // sx      (元画像の切り抜き始点X)
            0,              // sy      (元画像の切り抜き始点Y)
            img.width,      // sWidth  (元画像の切り抜きサイズ：幅)
            img.height,     // sHeight (元画像の切り抜きサイズ：高)
            (ctx.canvas.width - img.width) / 2,          // dx
            (ctx.canvas.height - img.height) / 2,          // dy
            img.width,      // 圧縮幅
            img.height       // 圧縮高
        );
    }
}

class SpriteManager {
    sprites = [];
    BGs = [];   // BG用の画像データ
    cursor = [];    // カーソルアニメ用
    context = null;
    isRunning = false;
    ClickedX = -1000;
    ClickedY = -1000;
    prevTime;
    bClickPerticle = false;
    bDrawMouseCursor = false;

    PerticleNumber = 0;
    PerticleSpeed = 0;

    async enablePerticle(name, imageName, PerticleNumber, PerticleSpeed) {
        await ImageLoader.LoadImage("Perticle", "perticle.png");
        this.PerticleNumber = PerticleNumber;
        this.PerticleSpeed = PerticleSpeed;
        this.bClickPerticle = true;
    }

    async SetBG(name, imageName) {
        await ImageLoader.LoadImage(name, imageName);
        var bg = new BG(name);
        this.BGs.push(bg);
    }

    perticle(spr) {
        spr.xPos += spr.vx;
        spr.yPos += spr.vy;
    }

    drawPerticle() {
        if (this.bClickPerticle) {
            for (var i = 0; i < this.PerticleNumber; i++) {
                var scale = (5 + getRandomInt(5)) / 10.0;
                var sp = new Sprite("Perticle", jsPerticle, ["Idle", "DIE"], this.ClickedX, this.ClickedY, Sprite.Pivot.CENTER | Sprite.Pivot.MIDDLE, scale);
                sp.vx = (getRandomInt(this.PerticleSpeed * 2) - this.PerticleSpeed) / 10;
                sp.vy = (getRandomInt(this.PerticleSpeed * 2) - this.PerticleSpeed) / 10;
                sp.addPhysic(this.perticle);
                this.append(sp);
            }
        }
    }

    OnClick(e) {
        var rect = e.target.getBoundingClientRect();
        this.ClickedX = e.clientX - rect.left;
        this.ClickedY = e.clientY - rect.top;

        // this.context.beginPath();
        // this.context.arc(this.ClickedX, this.ClickedY, 32, 0, 2 * Math.PI);
        // this.context.stroke();
        console.log("clicked", this.ClickedX, this.ClickedY);
        this.drawPerticle();
    }

    async enableMouseCursor(name, imageName) {
        await ImageLoader.LoadImage(name, imageName);
        var c = new Sprite(name, jsMouseCursor, ["Idle", "REPEAT"], -1000, -1000, Sprite.Pivot.CENTER | Sprite.Pivot.MIDDLE);

        c.parentSpriteManager = this;
        this.cursor.push(c)
        this.bDrawMouseCursor = true;
    }

    OnMouseMove(e){
        var rect = e.target.getBoundingClientRect();
        this.cursor[0].xPos = e.clientX - rect.left;
        this.cursor[0].yPos = e.clientY - rect.top;
    }

    constructor(context) {
        console.log("constructor");
        this.context = context;
        console.log("canvas Size = (" + this.context.canvas.width + "," + this.context.canvas.height + ")");
        this.context.canvas.addEventListener('click', this.OnClick.bind(this), false);
        this.context.canvas.addEventListener("mousemove", this.OnMouseMove.bind(this));
    }

    loop(timeStamp) {
        if (this.prevTime === undefined) {
            this.prevTime = timeStamp;
        }
        const elapsed = timeStamp - this.prevTime;

        // 16.66mmSec(60(frame/s) = 1/60 * 1000 mmsec = 16.666mmSec)ごとのループにする
        if (elapsed >= 15) {
            // 試してみると16とか15で計算したほうがいいみたい？
            console.log("elapsed:" + elapsed);
            // 最初にBGを描画（画像をCanvas中央に表示するだけ）
            var i = 0;
            for (i = 0; i < this.BGs.length; i++) {
                this.BGs[i].draw(this.context);
            }

            i = 0;
            while (i < this.sprites.length) {
                if (this.sprites[i].draw(this.context, null) == false) {
                    this.sprites.splice(i, 1); // 消す
                } else {
                    i++;
                }
            }

            this.cursor[0].draw(this.context);

            this.prevTime = timeStamp;
        }
        if (this.isRunning) {
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    stop() {
        console.log("SpriteManager::stop");
        this.isRunning = false;
    }

    run() {
        // 二重に起動しない
        if (this.isRunning == false) {
            console.log("SpriteManager::run");
            this.isRunning = true;
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }

    append(sprite) {
        sprite.parentSpriteManager = this;
        this.sprites.push(sprite)
    }
}