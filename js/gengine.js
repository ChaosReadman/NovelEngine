BaseEnum = {
    "LEFT": 0x01,
    "CENTER": 0x02,
    "RIGHT": 0x04,
    "TOP": 0x10,
    "MIDDLE": 0x20,
    "BOTTOM": 0x40
};

class Sprite {
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
    image;
    static ImageDic = [];
    childs = [];
    physics = [];
    followParent = true;   // 親についていくかどうか
    durationCount = 0;

    BasePos = BaseEnum.CENTER | BaseEnum.BOTTOM;



    appendChild(sprite) {
        this.childs.push(sprite)
    }

    addPhysic(fn) {
        this.physics.push(fn);
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

    setTag(TagName) {
        console.log("setTag", TagName);
        if (TagName === undefined) {
            console.log("koko");
        }
        if (this.jsonData != null) {
            var tag = this.jsonData.meta.frameTags.filter(function (item) {
                if (item.name == TagName) {
                    return item;
                }
            })
            this.currentFrameTagFrom = tag[0].from;
            this.currentFrameTagTo = tag[0].to;
            this.currentFrame = this.currentFrameTagFrom;   // 初期値
        }
        this.durationCount = 0;
    }

    constructor(name, jsonData, TagNames, x = 0, y = 0, basePos = BaseEnum.CENTER | BaseEnum.BOTTOM) {
        this.spriteName = name;
        this.jsonData = jsonData;
        this.TagNames = TagNames;
        this.xPos = x;
        this.yPos = y;
        this.BasePos = basePos;
        if (TagNames != null) {
            this.setTag(TagNames[0]);
        }
    }

    static async build(name, jsonData, frameTagNames, x = 0, y = 0, basePos = BaseEnum.CENTER | BaseEnum.BOTTOM) {
        const sprite = new Sprite(name, jsonData, frameTagNames, x, y, basePos);
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

    // 16.67mmSec毎に呼ばれる
    draw(ctx, parent) {
        if (this.jsonData != null) {
            //        console.log("Sprite::draw");
            var f = this.jsonData.frames[this.currentFrame];
            // フレーム換算（asepriteは1/1000、ループは1/60(16.67mmSec)なので換算する）
            if (16.67 * this.durationCount > f.duration) {
                this.currentFrame++;
                // カレントフレームの最後まで来た場合
                if (this.currentFrame == this.currentFrameTagTo) {
                    if (this.currentFrameTagNum < this.TagNames.length - 1) {
                        // 次のタグへ進める
                        this.currentFrameTagNum++;
                    }
                    switch (this.TagNames[this.currentFrameTagNum]) {
                        case "REPEAT":
                            // 次のタグがなくREPEAT指定されていたら、カレントタグへ戻す
                            this.currentFrameTagNum--;  // "REPEAT"の前のタグへ戻す
                            this.currentFrame = this.currentFrameTagFrom;
                            break;
                        case "DIE":
                            // 次のタグがない場合削除
                            this.currentFrameTagNum--;  // "DIE"の前のタグへ戻す
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
                case BaseEnum.LEFT:
                    baseX = 0;
                    break;
                case BaseEnum.CENTER:
                    baseX = f.spriteSourceSize.x - f.sourceSize.w / 2;
                    break;
                case BaseEnum.RIGHT:
                    baseX = -f.sourceSize.w;
                    break;
            }

            switch (this.BasePos & 0x70) {
                case BaseEnum.TOP:
                    baseY = 0;
                    break;
                case BaseEnum.MIDDLE:
                    baseY = f.spriteSourceSize.y - f.sourceSize.h / 2;
                    break;
                case BaseEnum.BOTTOM:
                    baseY = f.spriteSourceSize.y - f.sourceSize.h;
                    break;
            }

            dispX = this.xPos + baseX;
            dispY = this.yPos + baseY;

            if (parent != null && followParent == true) {
                // 親がいて、親についていく場合、親の相対位置へ表示する
                dispX += parent.xPos;
                dispY += parent.yPos;
            }
            ctx.drawImage(this.image,
                f.frame.x,      // sx      (元画像の切り抜き始点X)
                f.frame.y,      // sy      (元画像の切り抜き始点Y)
                f.frame.w,      // sWidth  (元画像の切り抜きサイズ：幅)
                f.frame.h,      // sHeight (元画像の切り抜きサイズ：高)
                dispX,          // dx
                dispY,          // dy
                f.frame.w,      // 圧縮幅
                f.frame.h       // 圧縮高
            );

            // Debug:当たり判定を矩形でくくる（当たり判定も起点によって変わる）
            // ctx.beginPath();
            // ctx.rect(this.xPos - f.frame.w / 2, this.yPos - f.frame.h, f.frame.w, f.frame.h);
            // ctx.stroke();
            // ctx.fillStyle = "red";
            // ctx.fillRect(this.xPos - 1, this.yPos, 2, 2);
            // ctx.stroke();

            // 子供がいたら表示する
            for (var i = 0; i < this.childs.length; i++) {
                this.childs[i].draw(ctx, this);
            }
        }

        // 表示をしたのちに、次のフレームの位置を計算しておく
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

class SpriteManager {
    sprites = [];
    context = null;
    isRunning = false;
    ClickedX = -1000;
    ClickedY = -1000;
    prevTime;

    OnClick(e) {
        var rect = e.target.getBoundingClientRect();
        this.ClickedX = e.clientX - rect.left;
        this.ClickedY = e.clientY - rect.top;

        // this.context.beginPath();
        // this.context.arc(this.ClickedX, this.ClickedY, 32, 0, 2 * Math.PI);
        // this.context.stroke();
        console.log("clicked", this.ClickedX, this.ClickedY);
    }

    constructor(context) {
        console.log("constructor");
        this.context = context;
        console.log("canvas Size = (" + this.context.canvas.width + "," + this.context.canvas.height + ")");
        this.context.canvas.addEventListener('click', this.OnClick.bind(this), false);
    }

    loop(timeStamp) {
        if (this.prevTime === undefined) {
            this.prevTime = timeStamp;
        }
        const elapsed = timeStamp - this.prevTime;

        // 16.66mmSec(60(frame/s) = 1/60 * 1000 mmsec = 16.666mmSec)ごとのループにする
        if (elapsed >= 16.66) {
            var i = 0;
            do {
                if (this.sprites[i].draw(this.context, null) == false) {
                    this.sprites.splice(i, 1); // 消す
                } else {
                    i++;
                }
            } while (i < this.sprites.length);
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